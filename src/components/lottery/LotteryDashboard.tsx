"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ExternalLink, Gift, Lock, RefreshCcw, Shield, Ticket, Trophy, Wallet, X } from "lucide-react";
import { getAddress, isAddress, type Address, type Hash } from "viem";
import {
  CONTRACT_ADDRESS, CONTRACT_LINK, POLYGON_CHAIN_ID,
  ROUND_STATUS_KEYS, RoundStatus, VRF_COORDINATOR_LINK, ZERO_ADDRESS, addressLink, transactionLink,
} from "@/config/contract";
import { useWalletContext } from "@/components/providers/WalletProvider";
import ProofExplorer from "@/components/experience/ProofExplorer";
import RoundFinalizationReveal from "@/components/experience/RoundFinalizationReveal";
import RoundLifecycle from "@/components/experience/RoundLifecycle";
import SecurityCenter from "@/components/experience/SecurityCenter";
import SerenRoundCore from "@/components/experience/SerenRoundCore";
import PoolProgressIndicator, { type PoolProgressStatus } from "@/components/lottery/PoolProgressIndicator";
import {
  createWalletPublicClient, readLotteryState, readRoundResults, readWinningRoundsPage,
  type LotteryState, type PlayerRoundWin, type RoundResult,
} from "@/lib/contractReads";
import { loadContractHistory, type ActivityEntry } from "@/lib/contractHistory";
import { canLoadContractData } from "@/lib/dataGate";
import { normalizeContractError, type AppError } from "@/lib/contractErrors";
import { executeTicketPurchase, prepareTicketPurchase, validatePurchaseIntent, type PreparedPurchase, type TransactionProgress } from "@/lib/purchaseFlow";
import { executeBatchClaim, executeClaimPrize } from "@/lib/claimFlow";
import { formatCount, formatPol, formatTimestamp, formatUnixTimestamp, shortenAddress, shortenHash } from "@/lib/format";
import { calculateTicketShareBasisPoints, resolveRoundCoreState } from "@/lib/roundExperience";
import { ceremonyContent } from "@/i18n/ceremonyContent";
import { localeToDashboardLanguage, type Locale } from "@/i18n/locales";
import { experienceContent } from "@/i18n/experienceContent";
import { translations } from "@/i18n/translations";

type TxState = { status: "idle" | TransactionProgress | "reverted" | "rejected" | "rpc_error"; hash?: Hash; error?: AppError };
const PAGE_SIZE = 5;
const QUICK_QUANTITIES = [1, 5, 10, 25, 50, 100];

function Stat({ label, value, locked, accent }: { label: string; value: string; locked?: boolean; accent?: boolean }) {
  return <div className={`draw-stat ${locked ? "is-locked" : ""}`}><span>{label}</span><strong className={accent ? "stat-accent" : ""}>{locked ? "—" : value}</strong></div>;
}

export default function LotteryDashboard({ locale, afterRound, beforeAccount, afterAccount, beforeTransparency, afterDashboard }: { locale: Locale; afterRound?: ReactNode; beforeAccount?: ReactNode; afterAccount?: ReactNode; beforeTransparency?: ReactNode; afterDashboard?: ReactNode }) {
  const wallet = useWalletContext();
  const t = translations[localeToDashboardLanguage[locale]];
  const experience = experienceContent[locale];
  const ceremony = ceremonyContent[locale];
  const [state, setState] = useState<LotteryState>();
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [historyError, setHistoryError] = useState(false);
  const [readError, setReadError] = useState<AppError>();
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [credits, setCredits] = useState(0);
  const [referrer, setReferrer] = useState("");
  const [prepared, setPrepared] = useState<PreparedPurchase>();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [tx, setTx] = useState<TxState>({ status: "idle" });
  const [winningOffset, setWinningOffset] = useState(0);
  const [winningRounds, setWinningRounds] = useState<PlayerRoundWin[]>([]);
  const [resultsRound, setResultsRound] = useState(0n);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [resultsError, setResultsError] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const purchaseCardRef = useRef<HTMLElement>(null);
  const [purchaseVisible, setPurchaseVisible] = useState(true);
  const [footerVisible, setFooterVisible] = useState(false);

  const dataAllowed = canLoadContractData({ hasExplicitConnection: wallet.explicitConnection, chainId: wallet.chainId });
  const pending = ["preparing", "quoting", "awaiting_signature", "submitted", "confirming"].includes(tx.status);

  const clearQuote = useCallback(() => { setPrepared(undefined); setConfirmOpen(false); }, []);
  useEffect(clearQuote, [wallet.account, wallet.chainId, quantity, credits, referrer, clearQuote]);

  const refreshData = useCallback(async (forceHistory = false, signal?: AbortSignal) => {
    if (!dataAllowed || !wallet.provider || !wallet.account) return;
    setLoading(true); setReadError(undefined); setHistoryError(false);
    try {
      const client = createWalletPublicClient(wallet.provider);
      const next = await readLotteryState(wallet.provider, wallet.account);
      if (signal?.aborted) return;
      setState(next);
      setCredits((value) => Math.min(value, Number(next.referralCredits > 100n ? 100n : next.referralCredits)));
      const page = await readWinningRoundsPage(client, wallet.account, winningOffset, PAGE_SIZE);
      if (!signal?.aborted) setWinningRounds(page);
      const desiredResults = resultsRound > 0n ? resultsRound : next.roundId;
      if (desiredResults > 0n && (next.round.status === RoundStatus.FINALIZED || resultsRound > 0n)) {
        try { const rows = await readRoundResults(client, desiredResults); if (!signal?.aborted) { setRoundResults(rows); setResultsError(false); setResultsRound(desiredResults); } } catch { if (!signal?.aborted) { setRoundResults([]); setResultsError(true); } }
      }
      try { const history = await loadContractHistory(wallet.provider, forceHistory, signal); if (!signal?.aborted) setActivity(history.activity); }
      catch (error) { if ((error as Error).name !== "AbortError" && !signal?.aborted) { setActivity([]); setHistoryError(true); } }
    } catch (error) {
      if (!signal?.aborted) { setState(undefined); setActivity([]); setWinningRounds([]); setReadError({ key: "readFailed", technical: error instanceof Error ? error.message : "" }); }
    } finally { if (!signal?.aborted) setLoading(false); }
  }, [dataAllowed, wallet.provider, wallet.account, winningOffset, resultsRound]);

  useEffect(() => {
    const controller = new AbortController();
    if (dataAllowed) void refreshData(false, controller.signal);
    else { setState(undefined); setActivity([]); setWinningRounds([]); setReadError(undefined); setHistoryError(false); }
    return () => controller.abort();
  }, [dataAllowed, refreshData]);

  useEffect(() => {
    if (!confirmOpen) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const modal = modalRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = modal?.querySelectorAll<HTMLElement>("button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex='-1'])");
    focusable?.[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setConfirmOpen(false);
        return;
      }
      if (event.key !== "Tab" || !focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus();
    };
  }, [confirmOpen]);

  useEffect(() => {
    const target = purchaseCardRef.current;
    if (!target || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setPurchaseVisible(entry.isIntersecting), { threshold: .18 });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const footer = document.querySelector(".premium-footer");
    if (!footer || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setFooterVisible(entry.isIntersecting), { threshold: .05 });
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  const maxQuantity = state?.maxTicketsPerPurchase ?? 100;
  const quickQuantities = QUICK_QUANTITIES.filter((value) => value <= maxQuantity);
  const clampQuantity = (value: number) => setQuantity(Math.max(1, Math.min(maxQuantity, Number.isFinite(value) ? Math.trunc(value) : 1)));
  const maxCredits = state ? Number((state.referralCredits < BigInt(quantity) ? state.referralCredits : BigInt(quantity))) : 0;
  const effectiveReferrer = referrer && isAddress(referrer) ? getAddress(referrer) : undefined;
  const referrerEditable = Boolean(state && !state.hasEverPurchased && state.referrer === ZERO_ADDRESS);
  const intentError = state ? validatePurchaseIntent({ quantity, creditsToUse: credits, proposedReferrer: effectiveReferrer }, state.referralCredits, state.maxTicketsPerPurchase) : "quantity";
  const referrerError = referrer && (!isAddress(referrer) || referrer.toLowerCase() === wallet.account?.toLowerCase());
  const statusKey = state ? ROUND_STATUS_KEYS[state.round.status] : "none";
  const poolStatus: PoolProgressStatus = wallet.connecting ? "connecting" : !wallet.account ? "disconnected" : !wallet.isPolygon ? "wrong-network" : readError ? (readError.technical?.toLowerCase().includes("rpc") ? "rpc-error" : "contract-error") : loading && !state ? "loading" : !state ? "loading" : state.roundId === 0n || state.round.status === RoundStatus.NONE ? "round-unavailable" : "loaded";
  const coreState = resolveRoundCoreState({ connecting: wallet.connecting, connected: Boolean(wallet.account), polygon: wallet.isPolygon, loading: loading && !state, rpcError: Boolean(readError), roundStatus: state?.round.status });
  const ticketShareBasisPoints = calculateTicketShareBasisPoints(state?.userTickets ?? 0n, state?.round.totalTickets ?? 0n);
  const ticketSharePercent = `${ticketShareBasisPoints / 100n}.${(ticketShareBasisPoints % 100n).toString().padStart(2, "0")}`;
  const userPurchases = activity.filter((entry) => entry.eventName === "TicketPurchased" && entry.account?.toLowerCase() === wallet.account?.toLowerCase());
  const purchasedEntry = tx.hash ? activity.find((entry) => entry.transactionHash.toLowerCase() === tx.hash?.toLowerCase() && entry.eventName === "TicketPurchased") : undefined;

  const ensureWalletContext = useCallback(async () => {
    if (!wallet.provider || !wallet.account) throw new Error("No accounts");
    const [chainHex, accounts] = await Promise.all([
      wallet.provider.request<string>({ method: "eth_chainId" }),
      wallet.provider.request<string[]>({ method: "eth_accounts" }),
    ]);
    if (Number.parseInt(chainHex, 16) !== POLYGON_CHAIN_ID) throw new Error("Wrong network");
    if (!accounts[0] || accounts[0].toLowerCase() !== wallet.account.toLowerCase()) throw new Error("Account changed");
  }, [wallet.provider, wallet.account]);

  const preparePurchase = async () => {
    if (!wallet.provider || !wallet.account || !state || intentError || referrerError || pending) return;
    setTx({ status: "quoting" });
    try {
      await ensureWalletContext();
      const next = await prepareTicketPurchase({ client: createWalletPublicClient(wallet.provider), account: wallet.account, intent: { quantity, creditsToUse: credits, proposedReferrer: effectiveReferrer } });
      if (!next.quote.canPurchase || next.quote.status !== 0) throw new Error(`PurchaseQuoteStatus:${next.quote.status}`);
      setPrepared(next); setConfirmOpen(true); setTx({ status: "idle" });
    } catch (error) { setTx({ status: "rpc_error", error: normalizeContractError(error) }); }
  };

  const buyTickets = async () => {
    if (!wallet.provider || !wallet.walletClient || !wallet.account || !prepared || pending) return;
    setConfirmOpen(false);
    try {
      const result = await executeTicketPurchase({ client: createWalletPublicClient(wallet.provider), walletClient: wallet.walletClient, account: wallet.account, prepared, ensureContext: ensureWalletContext, onProgress: (status, hash) => setTx({ status, hash }) });
      setTx({ status: "success", hash: result.hash }); clearQuote(); await refreshData(true);
    } catch (error) {
      const normalized = normalizeContractError(error);
      setTx({ status: normalized.key === "userRejected" ? "rejected" : normalized.key === "transactionFailed" ? "reverted" : "rpc_error", error: normalized, hash: (error as { hash?: Hash })?.hash });
    }
  };

  const claimRound = async (roundId: bigint) => {
    if (!wallet.provider || !wallet.walletClient || !wallet.account || pending) return;
    try {
      const result = await executeClaimPrize({ client: createWalletPublicClient(wallet.provider), walletClient: wallet.walletClient, account: wallet.account, roundId, ensureContext: ensureWalletContext, onProgress: (status, hash) => setTx({ status, hash }) });
      setTx({ status: "success", hash: result.hash }); await refreshData(true);
    } catch (error) { const normalized = normalizeContractError(error); setTx({ status: normalized.key === "userRejected" ? "rejected" : "rpc_error", error: normalized }); }
  };

  const claimVisible = async () => {
    if (!wallet.provider || !wallet.walletClient || !wallet.account || pending) return;
    const ids = winningRounds.filter((row) => row.unclaimedPrize > 0n).map((row) => row.roundId).slice(0, 50);
    if (!ids.length) return;
    try {
      const result = await executeBatchClaim({ client: createWalletPublicClient(wallet.provider), walletClient: wallet.walletClient, account: wallet.account, roundIds: ids, ensureContext: ensureWalletContext, onProgress: (status, hash) => setTx({ status, hash }) });
      setTx({ status: "success", hash: result.hash }); await refreshData(true);
    } catch (error) { const normalized = normalizeContractError(error); setTx({ status: normalized.key === "userRejected" ? "rejected" : "rpc_error", error: normalized }); }
  };

  const loadResults = async () => {
    if (!wallet.provider || resultsRound < 1n) return;
    setResultsError(false);
    try { setRoundResults(await readRoundResults(createWalletPublicClient(wallet.provider), resultsRound)); } catch { setRoundResults([]); setResultsError(true); }
  };

  const pasteReferrer = async () => { try { setReferrer(await navigator.clipboard.readText()); } catch { /* permission denied */ } };
  const txText = tx.status === "idle" ? "" : t.tx[tx.status];

  return <div className="lottery-dashboard">
    <SerenRoundCore state={state} coreState={coreState} content={ceremony.core} purchasePulseKey={tx.status === "success" ? tx.hash : undefined} />
    <section id="lottery" className="content-grid">
      <article className="panel current-draw">
        <div className="panel-title"><span className={`status-dot ${dataAllowed ? "is-live" : ""}`}/><div><h2>{t.round.title}</h2><p>{dataAllowed ? t.round.live : t.round.locked}</p></div>{dataAllowed && <button type="button" className="icon-button refresh-button" onClick={() => refreshData(true)} disabled={loading} aria-label={t.common.refresh}><RefreshCcw/></button>}</div>
        <div className="draw-stats"><Stat label={t.round.round} value={formatCount(state?.roundId)} locked={!dataAllowed} accent/><Stat label={t.round.ticketPrice} value={formatPol(state?.round.ticketPrice)} locked={!dataAllowed}/><Stat label={t.round.grossPool} value={formatPol(state?.round.grossPool)} locked={!dataAllowed}/><Stat label={t.round.tickets} value={formatCount(state?.round.totalTickets)} locked={!dataAllowed}/></div>
        {state && <div className="round-status-band"><Shield/><div><strong>{t.roundStatuses[statusKey]}</strong>{state.purchasesPaused && <p className="inline-warning">{t.round.paused}</p>}</div></div>}
        <PoolProgressIndicator status={poolStatus} currentPool={state?.round.grossPool} targetPool={state?.round.targetPool} roundId={state?.roundId} roundStatus={state ? t.roundStatuses[statusKey] : undefined} ticketPrice={state?.round.ticketPrice} ticketsSold={state?.round.totalTickets} lastUpdatedBlock={state?.lastUpdatedBlock} lastUpdatedTimestamp={state?.lastUpdatedTimestamp} content={experience.pool} labels={{ round: t.round.round, status: t.round.status, ticketPrice: t.round.ticketPrice, tickets: t.round.tickets }} />
        {state && <dl className="round-details"><div><dt>{t.round.ticketRevenue}</dt><dd>{formatPol(state.round.ticketRevenue)}</dd></div><div><dt>{t.round.rolloverPool}</dt><dd>{formatPol(state.round.rolloverPool)}</dd></div><div><dt>{t.round.started}</dt><dd>{formatUnixTimestamp(state.round.startedAt)}</dd></div><div><dt>{t.round.requested}</dt><dd>{formatUnixTimestamp(state.round.requestedAt)}</dd></div><div><dt>{t.round.randomness}</dt><dd>{formatUnixTimestamp(state.round.randomnessAcceptedAt)}</dd></div><div><dt>{t.round.finalized}</dt><dd>{formatUnixTimestamp(state.round.finalizedAt)}</dd></div>{state.round.requestId > 0n && <div><dt>{t.round.requestId}</dt><dd className="mono-value">{state.round.requestId.toString()}</dd></div>}</dl>}
        {readError && <p className="inline-error">{t.errors[readError.key]}</p>}
      </article>

      <aside id="purchase" ref={purchaseCardRef} className="panel purchase-card">
        <div className="panel-title"><Ticket size={20}/><div><h2>{t.purchase.title}</h2><p>{t.purchase.description}</p></div></div>
        {!wallet.account ? <button className="primary-button wide" type="button" onClick={() => window.dispatchEvent(new Event("seren:open-wallet"))}>{t.wallet.connect}</button> : !wallet.isPolygon ? <button className="primary-button wide" type="button" onClick={wallet.switchToPolygon}>{t.wallet.switch}</button> : <>
          <label className="field-label" htmlFor="ticket-quantity">{t.purchase.quantity}</label>
          <div className="quantity-control">
            <button type="button" disabled={quantity <= 1} onClick={() => clampQuantity(quantity - 1)} aria-label={`${t.purchase.quantity} −`}>−</button>
            <input id="ticket-quantity" type="number" inputMode="numeric" enterKeyHint="done" min="1" max={maxQuantity} value={quantity} onChange={(event) => clampQuantity(Number(event.target.value))}/>
            <button type="button" disabled={quantity >= maxQuantity} onClick={() => clampQuantity(quantity + 1)} aria-label={`${t.purchase.quantity} +`}>+</button>
          </div>
          <div className="quick-choices" role="group" aria-label={t.purchase.quantity}>{quickQuantities.map((value) => <button type="button" className={quantity === value ? "active" : ""} aria-pressed={quantity === value} key={value} onClick={() => clampQuantity(value)}>{value}</button>)}</div>
          <label className="field-label" htmlFor="credits">{t.purchase.credits}</label><input id="credits" className="text-input" type="number" inputMode="numeric" enterKeyHint="done" min="0" max={maxCredits} value={credits} onChange={(event) => setCredits(Math.max(0, Math.min(maxCredits, Math.trunc(Number(event.target.value) || 0))))}/><small>{t.account.creditHelp} {t.account.credits}: {formatCount(state?.referralCredits)}</small>
          {referrerEditable ? <><label className="field-label" htmlFor="referrer">{t.purchase.referrer}</label><div className="input-action"><input id="referrer" className="text-input" type="text" inputMode="text" enterKeyHint="done" autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false} aria-invalid={Boolean(referrerError)} aria-describedby="referrer-help" value={referrer} onChange={(event) => setReferrer(event.target.value.trim())} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} placeholder="0x…"/><button type="button" onClick={pasteReferrer}>{t.purchase.paste}</button></div><small id="referrer-help">{t.purchase.referrerHint}</small>{referrerError && <p className="inline-error">{t.purchase.invalidReferrer}</p>}</> : state && <div className="referrer-fixed"><span>{t.account.referrer}</span><strong>{state.referrer === ZERO_ADDRESS ? t.account.noReferrer : shortenAddress(state.referrer)}</strong><small>{t.purchase.referrerLocked}</small></div>}
          <div className="purchase-summary"><div><span>{t.purchase.fullPrice}</span><strong>{quantity - credits}</strong></div><div><span>{t.purchase.discounted}</span><strong>{credits}</strong></div><div><span>{t.purchase.total}</span><strong>{prepared ? formatPol(prepared.quote.requiredPayment) : t.common.dash}</strong></div></div>
          {intentError === "quantity" && <p className="inline-error">{t.purchase.invalidQuantity}</p>}{intentError === "credits" && <p className="inline-error">{t.purchase.invalidCredits}</p>}
          <button className="buy-button wide" type="button" disabled={!state || state.round.status !== RoundStatus.OPEN || state.purchasesPaused || Boolean(intentError) || Boolean(referrerError) || pending} onClick={preparePurchase}>{tx.status === "quoting" ? t.purchase.prepare : t.purchase.buy}</button>
          <p className="purchase-note">{t.purchase.gas}</p>
        </>}
      </aside>
    </section>

    <RoundLifecycle status={state?.round.status} content={ceremony.lifecycle} />

    <p className="security-banner"><Shield aria-hidden="true" />{experience.securityWarning}</p>

    {afterRound}

    {tx.status !== "idle" && <section className={`panel tx-banner tx-${tx.status}`} aria-live="polite"><strong>{txText}</strong>{tx.error && <span>{t.errors[tx.error.key]}</span>}{purchasedEntry?.firstTicketId !== undefined && <span>{t.results.ticketId}: {purchasedEntry.firstTicketId.toString()}{purchasedEntry.lastTicketId !== undefined && purchasedEntry.lastTicketId !== purchasedEntry.firstTicketId ? `–${purchasedEntry.lastTicketId.toString()}` : ""}</span>}{tx.hash && <Link href={transactionLink(tx.hash)} target="_blank" rel="noopener noreferrer">{t.tx.view}<ExternalLink size={14}/></Link>}{tx.error?.technical && <details><summary>{t.tx.technical}</summary><code>{tx.error.technical}</code></details>}</section>}

    {beforeAccount}
    <section id="account" className="panel account-panel">
      <div className="panel-title"><Wallet size={20}/><div><h2>{t.account.title}</h2><p>{wallet.account ? wallet.account : t.wallet.liveData}</p></div></div>
      {!dataAllowed || !state ? <div className="locked-panel"><Lock/><p>{wallet.account && !wallet.isPolygon ? t.wallet.wrongNetwork : t.round.locked}</p></div> : <><div className="account-stats"><Stat label={t.account.balance} value={formatPol(state.userBalance)}/><Stat label={t.account.tickets} value={formatCount(state.userTickets)}/><Stat label={t.account.credits} value={formatCount(state.referralCredits)}/><Stat label={t.account.claimable} value={formatPol(state.totalClaimable)} accent/></div><div className="account-meta"><span>{ceremony.participation.currentRound}: <strong><bdi>#{state.roundId.toString()}</bdi></strong></span><span>{t.account.referrer}: <strong>{state.referrer === ZERO_ADDRESS ? t.account.noReferrer : shortenAddress(state.referrer)}</strong></span><span>{t.account.winningRounds}: <strong>{formatCount(state.winningRoundCount)}</strong></span></div><p className="participation-share">{state.round.totalTickets > 0n ? ceremony.participation.share.replace("{percent}", ticketSharePercent) : ceremony.participation.shareUnavailable}</p>{userPurchases.length > 0 && <div className="user-purchase-proof">{userPurchases.map((entry) => <a href={entry.explorerUrl} target="_blank" rel="noopener noreferrer" key={entry.id}><span>{t.eventLabels.TicketPurchased}</span><strong>{t.results.ticketId}: <bdi>{entry.firstTicketId?.toString() ?? "—"}{entry.lastTicketId !== undefined && entry.lastTicketId !== entry.firstTicketId ? `–${entry.lastTicketId.toString()}` : ""}</bdi></strong><ExternalLink aria-hidden="true" /></a>)}</div>}<div className="winning-list">{winningRounds.length === 0 ? <p className="empty-state">{t.account.empty}</p> : winningRounds.map((row) => <article key={row.roundId.toString()} className="winning-card"><div><strong>{t.round.round} #{row.roundId.toString()}</strong><span>{t.account.places}: {row.placesWon}</span></div><div><span>{t.account.totalWon}: {formatPol(row.totalPrize)}</span><span>{t.account.unclaimed}: {formatPol(row.unclaimedPrize)}</span></div><button type="button" className="primary-button" disabled={row.unclaimedPrize === 0n || pending} onClick={() => claimRound(row.roundId)}>{row.unclaimedPrize > 0n ? t.account.claim : t.account.claimed}</button></article>)}</div><div className="pagination"><button type="button" className="outline-button" disabled={winningOffset === 0 || pending} onClick={() => setWinningOffset(Math.max(0, winningOffset - PAGE_SIZE))}>{t.account.previous}</button><button type="button" className="primary-button" disabled={!winningRounds.some((row) => row.unclaimedPrize > 0n) || pending} onClick={claimVisible}>{t.account.claimAll}</button><button type="button" className="outline-button" disabled={winningRounds.length < PAGE_SIZE || pending} onClick={() => setWinningOffset(winningOffset + PAGE_SIZE)}>{t.account.next}</button></div></>}
    </section>

    {afterAccount}

    {state?.round.status === RoundStatus.FINALIZED && roundResults.length > 0 && <RoundFinalizationReveal results={roundResults} roundId={resultsRound || state.roundId} account={wallet.account} content={ceremony.reveal} onClaim={claimRound} claimPending={pending} />}

    <section id="winners" className="panel results-panel"><div className="table-title"><div><Trophy size={20}/><h2>{t.results.title}</h2></div><p>{t.results.subtitle}</p></div><div className="winner-explainer"><p>{experience.winners.uniqueTickets}</p><p>{experience.winners.repeatedWallet}</p><div><a href={CONTRACT_LINK} target="_blank" rel="noopener noreferrer">{experience.winners.rules}<ExternalLink size={13}/></a><a href={CONTRACT_LINK} target="_blank" rel="noopener noreferrer">{experience.winners.onchain}<ExternalLink size={13}/></a></div></div><div className="results-control"><label htmlFor="results-round">{t.results.selectRound}</label><input id="results-round" className="text-input" type="number" min="1" value={resultsRound > 0n ? resultsRound.toString() : ""} onChange={(event) => setResultsRound(BigInt(Math.max(0, Math.trunc(Number(event.target.value) || 0))))}/><button type="button" className="outline-button" disabled={!dataAllowed || resultsRound < 1n} onClick={loadResults}>{t.results.load}</button></div>{(resultsError || roundResults.length === 0) && <p className="empty-state">{t.results.empty}</p>}<div className="results-grid">{roundResults.map((row) => <article className={`result-card place-${row.place}`} key={row.place}><strong>#{row.place}</strong><div><Link href={addressLink(row.winner)} target="_blank" rel="noopener noreferrer" title={row.winner}>{shortenAddress(row.winner)}<ExternalLink size={12}/></Link><span>{t.results.ticketId}: <bdi>{row.ticketId.toString()}</bdi></span></div><div><b>{formatPol(row.prize)}</b><span>{row.claimed ? t.results.claimed : t.results.unclaimed}</span></div></article>)}</div></section>

    <section id="history" className="panel table-panel"><div className="table-title"><div><Gift size={20}/><h2>{t.activity.title}</h2></div><button type="button" className="outline-button" disabled={!dataAllowed || loading} onClick={() => refreshData(true)}>{t.common.refresh}</button></div><p className="table-subtitle">{t.activity.subtitle}</p>{!dataAllowed ? <p className="empty-state">{t.activity.locked}</p> : historyError ? <p className="empty-state">{t.activity.unavailable}</p> : activity.length === 0 ? <p className="empty-state">{t.activity.empty}</p> : <div className="activity-list">{activity.map((entry) => <Link href={entry.explorerUrl} target="_blank" rel="noopener noreferrer" className="activity-row" key={entry.id}><strong>{t.eventLabels[entry.eventName]}</strong><span>{entry.roundId !== undefined ? `${t.activity.round} ${entry.roundId}` : entry.account ? shortenAddress(entry.account) : t.common.dash}</span><span>{entry.quantity !== undefined ? `×${entry.quantity}` : entry.amount !== undefined ? formatPol(entry.amount) : entry.ticketId !== undefined ? `#${entry.ticketId}` : t.common.dash}</span><span>{experience.activity.block} <bdi>{entry.blockNumber.toString()}</bdi></span><span>{formatTimestamp(entry.timestamp)}</span><span title={`${experience.activity.transaction}: ${entry.transactionHash}`}>{shortenHash(entry.transactionHash)}</span></Link>)}</div>}</section>

    <ProofExplorer activity={activity} roundId={state?.roundId} content={ceremony.proof} activityLabels={experience.activity} />
    <SecurityCenter state={state} content={ceremony.security} />

    {beforeTransparency}
    <section className="panel transparency-panel"><div className="panel-title"><Shield size={20}/><div><h2>{t.transparency.title}</h2><p>{t.wallet.liveData}</p></div></div><div className="transparency-grid"><a href={CONTRACT_LINK} target="_blank" rel="noopener noreferrer"><span>{t.transparency.contract}</span><strong>{shortenAddress(CONTRACT_ADDRESS)}</strong></a><a href={state ? addressLink(state.vrfCoordinator) : VRF_COORDINATOR_LINK} target="_blank" rel="noopener noreferrer"><span>{t.transparency.coordinator}</span><strong>{shortenAddress(state?.vrfCoordinator)}</strong></a><div><span>{t.transparency.locked}</span><strong>{state ? (state.vrfOwnershipLocked ? "✓" : "✕") : "—"}</strong></div><div><span>{t.transparency.ownerLock}</span><strong>{shortenAddress(state?.vrfOwnershipLock)}</strong></div><div><span>{t.transparency.requestId}</span><strong className="mono-value">{state?.round.requestId ? state.round.requestId.toString() : "—"}</strong></div><div><span>{t.transparency.vrf}</span><strong>{state ? `${state.round.vrfRequestConfirmations} · ${state.round.vrfCallbackGasLimit}` : "—"}</strong></div></div></section>

    {afterDashboard}

    {state && state.round.status === RoundStatus.OPEN && !state.purchasesPaused && !purchaseVisible && !footerVisible && <div className="mobile-buy-bar"><span>{formatPol(state.round.ticketPrice)}</span><button type="button" onClick={() => document.getElementById("purchase")?.scrollIntoView({ behavior: "smooth", block: "center" })}>{experience.mobile.buy}</button></div>}

    {confirmOpen && prepared && <div className="modal-backdrop purchase-dialog-backdrop" role="dialog" aria-modal="true" aria-labelledby="confirm-title" onMouseDown={(event) => { if (event.target === event.currentTarget) setConfirmOpen(false); }}>
      <div className="modal purchase-dialog" ref={modalRef}>
        <button type="button" className="icon-button modal-close" onClick={() => setConfirmOpen(false)} aria-label={t.purchase.cancel}><X aria-hidden="true"/></button>
        <header className="purchase-dialog__header"><Ticket aria-hidden="true"/><div><h2 id="confirm-title">{t.purchase.confirmTitle}</h2><p>{t.purchase.confirmBody}</p></div></header>
        <div className="purchase-dialog__body">
          <dl className="confirm-list">
            <div><dt>{t.round.round}</dt><dd>{prepared.roundId.toString()}</dd></div>
            <div><dt>{t.purchase.quantity}</dt><dd>{prepared.quantity}</dd></div>
            <div><dt>{t.purchase.discounted}</dt><dd>{prepared.creditsToUse}</dd></div>
            <div><dt>{t.purchase.referrer}</dt><dd>{shortenAddress(prepared.proposedReferrer)}</dd></div>
            <div><dt>{t.purchase.contract}</dt><dd>{shortenAddress(CONTRACT_ADDRESS)}</dd></div>
          </dl>
          <p className="inline-warning">{t.purchase.risk} {t.purchase.gas}</p>
        </div>
        <footer className="purchase-dialog__footer">
          <div className="purchase-dialog__total"><span>{t.purchase.total}</span><strong>{formatPol(prepared.quote.requiredPayment)}</strong></div>
          <div className="modal-actions"><button type="button" className="outline-button" onClick={() => setConfirmOpen(false)}>{t.purchase.cancel}</button><button type="button" className="primary-button" disabled={pending} onClick={buyTickets}>{t.purchase.continue}</button></div>
        </footer>
      </div>
    </div>}
  </div>;
}

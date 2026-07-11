"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowUp,
  Copy,
  ExternalLink,
  Gift,
  Lock,
  Menu,
  RefreshCcw,
  Send,
  Shield,
  Sparkles,
  Ticket,
  Trophy,
  Users,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import type { Hash } from "viem";
import {
  CONTRACT_ADDRESS,
  CONTRACT_LINK,
  POLYGON_EXPLORER,
} from "@/config/contract";
import { useLanguage } from "@/hooks/useLanguage";
import { useWallet } from "@/hooks/useWallet";
import { createWalletPublicClient, readLotteryState, simulateTicketPurchase, type LotteryState } from "@/lib/contractReads";
import { loadContractHistory, type ActivityEntry, type WinnerEntry } from "@/lib/contractHistory";
import { canLoadContractData } from "@/lib/dataGate";
import { normalizeContractError, type AppError } from "@/lib/contractErrors";
import { executeTicketPurchase } from "@/lib/purchaseFlow";
import { getSessionPrediction } from "@/lib/prediction";
import { formatCount, formatPol, formatTimestamp, shortenAddress, shortenHash } from "@/lib/format";
import { languageLabels, languages, type Language } from "@/i18n/translations";

type TxState =
  | { status: "idle" }
  | { status: "simulating" }
  | { status: "awaitingWallet" }
  | { status: "pending"; hash?: Hash }
  | { status: "success"; hash?: Hash }
  | { status: "failed"; error: AppError; hash?: Hash };

type SimulationState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "ready" }
  | { status: "failed"; error: AppError }
  | { status: "insufficientFunds" };

const additionalFaq: Record<Language, [string, string][]> = {
  en: [["Why is this lottery more transparent than a traditional one?", "The round state, purchases and winner events are recorded by the Polygon smart contract and can be checked independently."], ["Can I still lose my entry?", "Yes. A ticket is a chance, not a promise of profit. Only participate with POL you can afford to lose; the low entry price does not remove risk."]],
  ru: [["Почему эта лотерея прозрачнее обычной?", "Состояние раунда, покупки и события выбора победителя записываются смарт-контрактом Polygon и доступны для независимой проверки."], ["Можно ли потерять стоимость участия?", "Да. Билет даёт шанс, а не обещание дохода. Участвуйте только на POL, которые готовы потерять: низкая цена входа не отменяет риск."]],
  es: [["¿Por qué es más transparente que una lotería tradicional?", "El estado, las compras y los ganadores quedan registrados en el contrato de Polygon y pueden verificarse."], ["¿Puedo perder el coste de entrada?", "Sí. El boleto es una oportunidad, no una promesa de beneficio. Participa solo con POL que puedas perder."]],
  "zh-CN": [["为什么它比传统彩票更透明？", "轮次状态、购票和赢家事件由 Polygon 智能合约记录，可独立核验。"], ["我会损失参与费用吗？", "会。彩票只提供机会，不承诺收益。即使门槛较低，也请只使用能够承受损失的 POL。"]],
  hi: [["यह पारंपरिक लॉटरी से अधिक पारदर्शी क्यों है?", "राउंड, खरीद और विजेता events Polygon smart contract में दर्ज होते हैं और स्वतंत्र रूप से जाँचे जा सकते हैं।"], ["क्या entry की रकम खो सकती है?", "हाँ। टिकट एक मौका है, लाभ का वादा नहीं। केवल उतना POL लगाएँ जिसे आप खो सकते हैं।"]],
  ar: [["لماذا هي أكثر شفافية من اليانصيب التقليدي؟", "تُسجَّل حالة الجولة والمشتريات وأحداث الفائز في عقد Polygon ويمكن التحقق منها بشكل مستقل."], ["هل يمكن أن أخسر تكلفة المشاركة؟", "نعم. التذكرة فرصة وليست وعداً بالربح. شارك فقط بمبلغ POL يمكنك تحمل خسارته."]],
  fr: [["Pourquoi cette loterie est-elle plus transparente ?", "L'état du round, les achats et les événements gagnants sont inscrits dans le contrat Polygon et vérifiables."], ["Puis-je perdre le prix du ticket ?", "Oui. Un ticket est une chance, pas une promesse de gain. Ne jouez que le POL que vous pouvez perdre."]],
  pt: [["Por que é mais transparente que uma loteria tradicional?", "Rodada, compras e eventos de vencedores ficam registrados no contrato Polygon e podem ser verificados."], ["Posso perder o valor da entrada?", "Sim. O bilhete é uma chance, não promessa de lucro. Participe apenas com POL que possa perder."]],
};

const marketingCopy: Record<Language, string> = {
  en: "Traditional lotteries can feel opaque: participants must trust an organizer. Here the rules and results are verifiable on-chain. The entry costs about small everyday change, creating a chance at a much larger prize—but every ticket can still be lost.",
  ru: "Обычные лотереи часто кажутся непрозрачными: участнику приходится доверять организатору. Здесь правила и результаты можно проверить в блокчейне. Стоимость участия сравнима со сдачей от кофе и даёт шанс на крупный выигрыш — но каждый билет всё равно может оказаться проигрышным.",
  es: "Las loterías tradicionales pueden ser opacas; aquí las reglas y resultados se verifican on-chain. Una entrada cuesta como el cambio de un café y da acceso a un premio mayor, pero cada boleto puede perderse.",
  "zh-CN": "传统彩票可能不透明；这里的规则和结果可在链上核验。参与成本约等于一杯咖啡的零钱，却有机会赢得更大奖励，但每张票仍可能落空。",
  hi: "पारंपरिक lotteries अस्पष्ट हो सकती हैं; यहाँ rules और results on-chain जाँचे जा सकते हैं। Entry coffee के बचे हुए पैसों जितनी कम हो सकती है, फिर भी हर ticket हार सकता है।",
  ar: "قد تكون اليانصيبات التقليدية غير شفافة؛ هنا يمكن التحقق من القواعد والنتائج على السلسلة. تكلفة المشاركة منخفضة كفكة قهوة وتمنح فرصة لجائزة أكبر، لكن كل تذكرة قد تخسر.",
  fr: "Les loteries classiques peuvent sembler opaques ; ici, règles et résultats sont vérifiables on-chain. La mise ressemble à la monnaie d'un café et ouvre une chance de gros lot, mais chaque ticket peut être perdu.",
  pt: "Loterias tradicionais podem parecer opacas; aqui, regras e resultados são verificáveis on-chain. A entrada custa como o troco de um café e dá chance a um prêmio maior, mas todo bilhete pode perder.",
};

const roundGoalLabel: Record<Language, string> = {
  en: "Current round goal",
  ru: "Цель текущего раунда",
  es: "Meta de la ronda actual",
  "zh-CN": "本轮目标",
  hi: "मौजूदा राउंड का लक्ष्य",
  ar: "هدف الجولة الحالية",
  fr: "Objectif du round actuel",
  pt: "Meta da rodada atual",
};

const ROUND_POOL_GOAL = 1_000_000n * 10n ** 18n;

function Brand({ footer = false }: { footer?: boolean }) {
  return (
    <Link href="#home" className={`brand-logo ${footer ? "footer-brand" : ""}`} aria-label="Seren Lottery Chain">
      <Image className="brand-mark" src="/assets/logo.png" alt="" width={54} height={54} />
      <span className="brand-wordmark"><span>Seren</span><span>Lottery</span></span>
    </Link>
  );
}

function Stat({
  label,
  value,
  helper,
  locked,
  accent,
}: {
  label: string;
  value: string;
  helper?: string;
  locked?: boolean;
  accent?: boolean;
}) {
  return (
    <div className={`draw-stat ${locked ? "is-locked" : ""}`}>
      <span>{label}</span>
      <strong className={accent ? "stat-accent" : ""}>{locked ? "—" : value}</strong>
      {helper && <small>{helper}</small>}
    </div>
  );
}

function walletConnectConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID);
}

export default function SerenApp() {
  const wallet = useWallet();
  const { language, setLanguage, t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [lotteryState, setLotteryState] = useState<LotteryState>();
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [winners, setWinners] = useState<WinnerEntry[]>([]);
  const [historyError, setHistoryError] = useState(false);
  const [readError, setReadError] = useState<AppError>();
  const [refreshing, setRefreshing] = useState(false);
  const [simulation, setSimulation] = useState<SimulationState>({ status: "idle" });
  const [txState, setTxState] = useState<TxState>({ status: "idle" });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [predictionOpen, setPredictionOpen] = useState(false);
  const [predictionText, setPredictionText] = useState("");
  const [predictionUsed, setPredictionUsed] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const dataAllowed = canLoadContractData({
    hasExplicitConnection: wallet.explicitConnection,
    chainId: wallet.chainId,
  });

  const navLinks = useMemo(
    () =>
      [
        [t.nav.home, "#home"],
        [t.nav.buy, "#buy"],
        [t.nav.activity, "#history"],
        [t.nav.how, "#how"],
        [t.nav.faq, "#faq"],
      ] as const,
    [t],
  );

  useEffect(() => {
    setPredictionUsed(window.sessionStorage.getItem("seren.prediction.revealed") === "1");

    let frame = 0;
    const updateScroll = () => {
      frame = 0;
      const y = window.scrollY;
      const progress = Math.min(y / Math.max(window.innerHeight, 1), 1);
      document.documentElement.style.setProperty("--scroll-progress", progress.toFixed(3));
      document.documentElement.style.setProperty("--scroll-y", `${y}px`);
      setIsScrolled(y > 120);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(updateScroll);
    };
    updateScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const closeMenu = () => setMobileOpen(false);
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && closeMenu();
    window.addEventListener("pointerdown", closeMenu);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("pointerdown", closeMenu);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileOpen]);

  const refreshData = useCallback(
    async (forceHistory = false) => {
      if (!dataAllowed || !wallet.provider || !wallet.account) return;
      setRefreshing(true);
      setReadError(undefined);
      setHistoryError(false);
      setSimulation({ status: "checking" });

      try {
        const state = await readLotteryState(wallet.provider, wallet.account);
        setLotteryState(state);

        const client = createWalletPublicClient(wallet.provider);
        const balance = await client.getBalance({ address: wallet.account });
        if (balance <= state.ticketPrice) {
          setSimulation({ status: "insufficientFunds" });
        } else if (!state.canPurchase) {
          setSimulation({ status: "idle" });
        } else {
          try {
            await simulateTicketPurchase({
              client,
              walletClient: wallet.walletClient!,
              account: wallet.account,
              value: state.ticketPrice,
            });
            setSimulation({ status: "ready" });
          } catch (error) {
            setSimulation({ status: "failed", error: normalizeContractError(error) });
          }
        }

        try {
          const history = await loadContractHistory(wallet.provider, forceHistory);
          setActivity(history.activity);
          setWinners(history.winners);
        } catch {
          setActivity([]);
          setWinners([]);
          setHistoryError(true);
        }
      } catch (error) {
        setLotteryState(undefined);
        setActivity([]);
        setWinners([]);
        setReadError({ key: "readFailed", technical: error instanceof Error ? error.message : "" });
        setSimulation({ status: "idle" });
      } finally {
        setRefreshing(false);
      }
    },
    [dataAllowed, wallet.account, wallet.provider, wallet.walletClient],
  );

  useEffect(() => {
    if (dataAllowed) {
      void refreshData();
    } else {
      setLotteryState(undefined);
      setActivity([]);
      setWinners([]);
      setHistoryError(false);
      setReadError(undefined);
      setSimulation({ status: "idle" });
    }
  }, [dataAllowed, refreshData]);

  const txHash =
    txState.status === "pending" || txState.status === "success" || txState.status === "failed"
      ? txState.hash
      : undefined;

  const txMessage =
    txState.status === "simulating"
      ? t.purchase.simulating
      : txState.status === "awaitingWallet"
        ? t.purchase.awaitingWallet
        : txState.status === "pending"
          ? t.purchase.pending
          : txState.status === "success"
            ? t.purchase.success
            : txState.status === "failed"
              ? t.errors[txState.error.key]
              : "";

  const purchaseDisabled =
    !dataAllowed ||
    !lotteryState ||
    !lotteryState.canPurchase ||
    simulation.status !== "ready" ||
    txState.status === "simulating" ||
    txState.status === "awaitingWallet" ||
    txState.status === "pending";

  const purchaseReason = !wallet.account
    ? t.purchase.connectFirst
    : !wallet.isPolygon
      ? t.purchase.wrongNetwork
      : readError
        ? t.errors[readError.key]
        : !lotteryState
          ? t.purchase.readFirst
          : lotteryState.priceMismatch
            ? t.purchase.priceMismatch
            : lotteryState.purchaseUnavailableReason === "closed"
              ? t.purchase.closed
              : lotteryState.purchaseUnavailableReason === "emergency"
                ? t.purchase.emergency
                : lotteryState.purchaseUnavailableReason === "config_invalid"
                  ? t.purchase.unavailableConfig
                  : simulation.status === "insufficientFunds"
                    ? t.purchase.insufficientFunds
                    : simulation.status === "failed"
                      ? t.errors[simulation.error.key]
                      : simulation.status === "checking"
                        ? t.purchase.simulating
                        : simulation.status === "ready"
                          ? t.purchase.ready
                          : "";

  const openWallet = () => setWalletOpen((open) => !open);

  const connectWallet = () => {
    if (wallet.account) {
      openWallet();
      return;
    }
    setWalletOpen(true);
    void wallet.connectPreferred();
  };

  const revealPrediction = () => {
    if (predictionUsed) return;
    const id = getSessionPrediction();
    setPredictionText(t.lucky.predictions[id]);
    window.sessionStorage.setItem("seren.prediction.revealed", "1");
    setPredictionUsed(true);
    setPredictionOpen(true);
  };

  const buyTicket = async () => {
    if (!wallet.provider || !wallet.walletClient || !wallet.account || !lotteryState) {
      setWalletOpen(true);
      return;
    }

    setConfirmOpen(false);
    setTxState({ status: "simulating" });
    try {
      const client = createWalletPublicClient(wallet.provider);
      const result = await executeTicketPurchase({
        client,
        walletClient: wallet.walletClient,
        account: wallet.account,
        value: lotteryState.ticketPrice,
        onProgress: (progress, hash) => {
          if (progress === "simulating") setTxState({ status: "simulating" });
          if (progress === "awaitingWallet") setTxState({ status: "awaitingWallet" });
          if (progress === "pending") setTxState({ status: "pending", hash });
        },
      });

      if (result.receipt.status !== "success") {
        setTxState({ status: "failed", error: { key: "transactionFailed" }, hash: result.hash });
        return;
      }

      setTxState({ status: "success", hash: result.hash });
      await refreshData(true);
    } catch (error) {
      setTxState({ status: "failed", error: normalizeContractError(error) });
    }
  };

  const locked = !dataAllowed;
  const ticketPrice = lotteryState?.ticketPrice;
  const buyLabel = ticketPrice
    ? t.purchase.buyWithPrice.replace("{price}", formatPol(ticketPrice))
    : t.purchase.buy;
  const poolProgress = lotteryState?.prizePool
    ? Math.min(100, Number((lotteryState.prizePool * 10000n) / ROUND_POOL_GOAL) / 100)
    : 0;

  return (
    <main id="home" className="seren-page">
      <div className="coin-field" aria-hidden="true">
        {Array.from({ length: 7 }, (_, index) => <span className={`pol-coin coin-${index + 1}`} key={index}>POL</span>)}
      </div>
      <header className={`site-header ${isScrolled ? "is-compact" : ""}`}>
        <Brand />

        <nav className="desktop-nav" aria-label="Primary navigation">
          {navLinks.map(([label, href], index) => (
            <Link className={index === 0 ? "active" : ""} href={href} key={href}>
              {label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          <select
            className="language-select"
            value={language}
            onChange={(event) => setLanguage(event.target.value as Language)}
            aria-label="Language"
          >
            {languages.map((item) => (
              <option value={item} key={item}>
                {languageLabels[item]}
              </option>
            ))}
          </select>
          <button type="button" className="outline-button wallet-button" onClick={connectWallet}>
            {wallet.account ? shortenAddress(wallet.account) : wallet.connecting ? t.wallet.connecting : t.wallet.connect}
          </button>
          <button
            type="button"
            className="icon-button menu-button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? t.wallet.close : t.wallet.menu}
          >
            {mobileOpen ? <X /> : <Menu />}
          </button>
        </div>

        {walletOpen && (
          <div className="wallet-popover">
            {wallet.account ? (
              <>
                <strong>{t.wallet.connected}</strong>
                <p>{wallet.account}</p>
                <button type="button" onClick={wallet.copyAddress}>
                  <Copy size={16} /> {wallet.copied ? t.wallet.copied : t.wallet.copy}
                </button>
                {!wallet.isPolygon && (
                  <button type="button" onClick={wallet.switchToPolygon}>
                    <Shield size={16} /> {t.wallet.switch}
                  </button>
                )}
                <button type="button" onClick={wallet.disconnect}>
                  <X size={16} /> {t.wallet.disconnect}
                </button>
              </>
            ) : (
              <>
                <strong>{t.wallet.selectProvider}</strong>
                {wallet.providers.map((provider) => (
                  <button type="button" key={provider.id} onClick={() => wallet.connectWithProvider(provider)}>
                    <Wallet size={16} /> {provider.name || t.wallet.browserWallet}
                  </button>
                ))}
                {walletConnectConfigured() && (
                  <button type="button" onClick={wallet.connectWalletConnect}>
                    <Wallet size={16} /> {t.wallet.walletConnect}
                  </button>
                )}
                {!walletConnectConfigured() && <p>{t.wallet.walletConnectUnavailable}</p>}
                {wallet.providers.length === 0 && <p>{t.wallet.unavailable}</p>}
              </>
            )}
            {wallet.error && <p className="inline-error">{t.errors[wallet.error.key]}</p>}
          </div>
        )}
      </header>

      <div className={`scroll-tools ${isScrolled ? "is-visible" : ""}`}>
        <button type="button" className="scroll-tool" onPointerDown={(event) => event.stopPropagation()} onClick={() => setMobileOpen((open) => !open)} aria-label={mobileOpen ? t.wallet.close : t.wallet.menu}>
          {mobileOpen ? <X /> : <Menu />}
        </button>
        <button type="button" className="scroll-tool" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label={t.nav.home}>
          <ArrowUp />
        </button>
      </div>

      {mobileOpen && (
        <div className="menu-backdrop">
        <nav className={`mobile-nav ${isScrolled ? "is-floating" : ""}`} aria-label="Mobile navigation" onPointerDown={(event) => event.stopPropagation()}>
          {navLinks.map(([label, href]) => (
            <Link href={href} key={href} onClick={() => setMobileOpen(false)}>
              {label}
            </Link>
          ))}
          <label className="mobile-language">
            <span>{t.misc.language}</span>
            <select value={language} onChange={(event) => setLanguage(event.target.value as Language)} aria-label={t.misc.language}>
              {languages.map((item) => <option value={item} key={item}>{languageLabels[item]}</option>)}
            </select>
          </label>
        </nav>
        </div>
      )}

      <section className="hero-banner" aria-label="Seren Lottery Chain">
        <Image src="/assets/Banner.png" alt="Seren Lottery Chain on Polygon" fill priority sizes="100vw" />
        <h1 className="sr-only">{t.hero.heading}</h1>
      </section>

      <section id="buy" className="content-grid">
        <article className="panel current-draw">
          <div className="panel-title">
            <span className={`status-dot ${dataAllowed ? "is-live" : ""}`} />
            <div>
              <h2>{t.dashboard.title}</h2>
              <p>{dataAllowed ? t.dashboard.subtitleConnected : t.dashboard.subtitleLocked}</p>
            </div>
            {dataAllowed && (
              <button type="button" className="icon-button refresh-button" onClick={() => refreshData(true)} disabled={refreshing} aria-label={t.dashboard.refresh}>
                <RefreshCcw />
              </button>
            )}
          </div>

          <div className="draw-stats">
            <Stat label={t.dashboard.currentRound} value={formatCount(lotteryState?.round)} locked={locked} accent />
            <Stat label={t.dashboard.prizePool} value={formatPol(lotteryState?.prizePool)} locked={locked} />
            <Stat label={t.dashboard.ticketsInDraw} value={formatCount(lotteryState?.ticketsCount)} locked={locked} />
            <Stat label={t.dashboard.ticketPrice} value={formatPol(lotteryState?.ticketPrice)} locked={locked} />
          </div>

          <div className={`pool-progress ${locked ? "is-locked" : ""}`}>
            <div className="pool-progress-label">
              <span>{t.dashboard.poolProgress}</span>
              <strong>{locked ? "—" : `${poolProgress.toLocaleString(undefined, { maximumFractionDigits: 2 })}%`}</strong>
            </div>
            <div className="pool-progress-track" role="progressbar" aria-label={t.dashboard.poolProgress} aria-valuemin={0} aria-valuemax={100} aria-valuenow={locked ? 0 : poolProgress}>
              <span style={{ width: `${locked ? 0 : poolProgress}%` }} />
            </div>
            <div className="pool-progress-scale">
              <span>{locked ? "—" : formatPol(lotteryState?.prizePool)}</span>
              <span className="round-goal">
                <span>{roundGoalLabel[language]}</span>
                <strong>1 000 000 <em>POL</em></strong>
              </span>
            </div>
          </div>

          <div className="verified-state-band">
            <span className="round-icon">{dataAllowed ? <Shield /> : <Lock />}</span>
            <div>
              <strong>{dataAllowed ? (lotteryState?.open ? t.dashboard.open : t.dashboard.closed) : t.dashboard.subtitleLocked}</strong>
              <p>
                {dataAllowed
                  ? `${t.dashboard.yourTickets}: ${formatCount(lotteryState?.userTickets)} · ${t.dashboard.emergency}: ${lotteryState?.emergencyActive ? t.dashboard.emergency : t.dashboard.normal}`
                  : wallet.account && !wallet.isPolygon ? t.wallet.wrongNetwork : t.sections.transparencyItems[0]}
              </p>
            </div>
            <Link className="outline-button" href="#how">{t.nav.how}</Link>
          </div>
          {readError && <p className="inline-error">{t.errors[readError.key]}</p>}
        </article>

        <aside className="panel wallet-card">
          <div className="panel-title">
            <Wallet size={18} />
            <div>
              <h2>{wallet.account ? t.wallet.connected : t.wallet.connect}</h2>
              <p>{wallet.account ? shortenAddress(wallet.account) : t.purchase.connectFirst}</p>
            </div>
            <span className={`green-dot ${wallet.account ? "is-connected" : ""}`} />
          </div>

          <button type="button" className="outline-button wide" onClick={connectWallet}>
            {wallet.account ? shortenAddress(wallet.account) : t.wallet.connect}
          </button>

          {wallet.account && !wallet.isPolygon && (
            <button type="button" className="primary-button wide" onClick={wallet.switchToPolygon}>
              <Shield size={16} /> {t.wallet.switch}
            </button>
          )}

          <div className="wallet-copy">
            <span>{t.purchase.title}</span>
            <strong>{ticketPrice ? formatPol(ticketPrice) : t.misc.unavailableDash}</strong>
            <p>{t.purchase.gas}</p>
          </div>

          <button type="button" className="buy-button wide" disabled={purchaseDisabled} onClick={() => setConfirmOpen(true)}>
            {buyLabel}
          </button>

          <button type="button" className="lucky-button wide" onClick={revealPrediction} disabled={predictionUsed}>
            <Sparkles size={17} /> {predictionUsed ? t.lucky.label : t.hero.lucky}
          </button>

          <p className="my-tickets">{t.purchase.userTickets}: {formatCount(lotteryState?.userTickets)}</p>
          {purchaseReason && <p className={simulation.status === "ready" ? "tx-message" : "inline-error"}>{purchaseReason}</p>}
          {txMessage && <p className={txState.status === "failed" ? "inline-error" : "tx-message"}>{txMessage}</p>}
          {txHash && (
            <Link className="tx-link" href={`${POLYGON_EXPLORER}/tx/${txHash}`} target="_blank">
              {t.purchase.viewTx}: {shortenHash(txHash)} <ExternalLink size={14} />
            </Link>
          )}
        </aside>
      </section>

      <section id="history" className="tables-grid">
        <article className="panel table-panel">
          <div className="table-title">
            <div>
              <Users size={18} />
              <h2>{t.activity.title}</h2>
            </div>
            <Link href={CONTRACT_LINK} target="_blank">{t.misc.explorer}</Link>
          </div>
          <p className="table-subtitle">{t.activity.subtitle}</p>
          <div className="purchase-list history-scroll">
            <div className="table-head">
              <span>{t.activity.buyer}</span>
              <span>{t.activity.round}</span>
              <span>{t.activity.price}</span>
              <span>{t.activity.time}</span>
              <span>{t.activity.tx}</span>
            </div>
            {!dataAllowed && <p className="empty-state">{t.activity.locked}</p>}
            {dataAllowed && historyError && <p className="empty-state">{t.activity.unavailable}</p>}
            {dataAllowed && !historyError && activity.length === 0 && <p className="empty-state">{t.activity.empty}</p>}
            {dataAllowed && !historyError && activity.map((item) => (
              <Link className="purchase-row" key={item.id} href={item.explorerUrl} target="_blank">
                <span>{shortenAddress(item.buyer)}</span>
                <span>{formatCount(item.round)}</span>
                <span>{item.price === undefined ? t.misc.unavailableDash : formatPol(item.price)}</span>
                <span>{formatTimestamp(item.timestamp)}</span>
                <span>{shortenHash(item.transactionHash)}</span>
              </Link>
            ))}
          </div>
        </article>

        <article className="panel table-panel">
          <div className="table-title">
            <div>
              <Trophy size={18} />
              <h2>{t.winners.title}</h2>
            </div>
            <Link href={CONTRACT_LINK} target="_blank">{t.misc.explorer}</Link>
          </div>
          <p className="table-subtitle">{t.winners.subtitle}</p>
          <div className="winner-list history-scroll">
            <div className="table-head">
              <span>{t.winners.round}</span>
              <span>{t.winners.winner}</span>
              <span>{t.winners.prize}</span>
              <span>{t.winners.time}</span>
              <span>{t.winners.tx}</span>
            </div>
            {!dataAllowed && <p className="empty-state">{t.winners.locked}</p>}
            {dataAllowed && historyError && <p className="empty-state">{t.winners.unavailable}</p>}
            {dataAllowed && !historyError && winners.length === 0 && <p className="empty-state">{t.winners.empty}</p>}
            {dataAllowed && !historyError && winners.map((item) => (
              <Link className="winner-row" key={item.id} href={item.explorerUrl} target="_blank">
                <span>{formatCount(item.round)}</span>
                <span>{shortenAddress(item.winner)}</span>
                <span>{formatPol(item.prize)}</span>
                <span>{formatTimestamp(item.timestamp)}</span>
                <span>{shortenHash(item.transactionHash)}</span>
              </Link>
            ))}
          </div>
        </article>
      </section>

      <section id="how" className="benefits panel">
        <div className="benefit-card">
          <span className="large-icon"><Shield /></span>
          <div><strong>{t.sections.transparencyTitle}</strong><p>{t.sections.transparencyItems[1]}</p></div>
        </div>
        <div className="benefit-card">
          <span className="large-icon"><Lock /></span>
          <div><strong>{t.footer.contract}</strong><p>{t.sections.transparencyItems[3]}</p></div>
        </div>
        <div className="benefit-card">
          <span className="large-icon"><Zap /></span>
          <div><strong>Polygon Mainnet</strong><p>{t.sections.howSteps[0]}</p></div>
        </div>
        <div className="benefit-card">
          <span className="large-icon"><Gift /></span>
          <div><strong>{t.purchase.title}</strong><p>{t.purchase.oneTicket} {t.purchase.gas}</p></div>
        </div>
      </section>

      <section className="project-story panel">
        <div className="section-kicker">SEREN LOTTERY CHAIN</div>
        <h2>{t.sections.projectTitle}</h2>
        {t.sections.projectBody.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        <p>{marketingCopy[language]}</p>
      </section>

      <section className="risk-strip panel">
        <strong>{t.sections.riskTitle}</strong>
        <p>{t.sections.risk}</p>
      </section>

      <section className="play-guide">
        <div className="play-guide-heading">
          <h2>{t.sections.playTitle}</h2>
        </div>
        <div className="play-steps">
          {t.sections.playSteps.map((step, index) => (
            <article className="play-step panel" key={step.title}>
              <span className="step-number">0{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
        <Link className="project-more panel" href="/project">
          <span><strong>{t.sections.projectMore}</strong><small>{t.sections.projectMoreBody}</small></span>
          <ExternalLink />
        </Link>
      </section>

      <section id="faq" className="faq-strip">
        {[...t.sections.faq, ...additionalFaq[language]].map(([question, answer]) => (
          <details key={question}>
            <summary>{question}</summary>
            <p>{answer}</p>
          </details>
        ))}
      </section>

      <footer className="site-footer">
        <div>
          <Brand footer />
          <p>{t.footer.tagline}</p>
        </div>
        <div>
          <h3>{t.footer.links}</h3>
          <Link href="#buy">{t.nav.buy}</Link>
          <Link href="#history">{t.nav.activity}</Link>
          <Link href="#how">{t.nav.how}</Link>
          <Link href="#faq">{t.nav.faq}</Link>
        </div>
        <div>
          <h3>{t.footer.information}</h3>
          <Link href={CONTRACT_LINK} target="_blank">{t.footer.contract}</Link>
          <Link href={CONTRACT_LINK} target="_blank">{t.footer.polygon}</Link>
          <Link href={`${POLYGON_EXPLORER}/address/${CONTRACT_ADDRESS}`} target="_blank">{shortenAddress(CONTRACT_ADDRESS)}</Link>
        </div>
        <small>{t.footer.rights}</small>
      </footer>

      {confirmOpen && lotteryState && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
          <div className="modal prediction-modal">
            <button type="button" className="icon-button modal-close" onClick={() => setConfirmOpen(false)} aria-label={t.purchase.cancel}>
              <X />
            </button>
            <Ticket size={32} />
            <h2 id="confirm-title">{t.purchase.confirmTitle}</h2>
            <p>{t.purchase.confirmBody}</p>
            <dl className="confirm-list">
              <div><dt>{t.purchase.price}</dt><dd>{formatPol(lotteryState.ticketPrice)}</dd></div>
              <div><dt>{t.purchase.contract}</dt><dd>{shortenAddress(CONTRACT_ADDRESS)}</dd></div>
            </dl>
            <p className="inline-warning">{t.purchase.risk} {t.purchase.gas}</p>
            <div className="modal-actions">
              <button type="button" className="outline-button" onClick={() => setConfirmOpen(false)}>{t.purchase.cancel}</button>
              <button type="button" className="primary-button" onClick={buyTicket}>{t.purchase.continue}</button>
            </div>
          </div>
        </div>
      )}

      {predictionOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="prediction-title">
          <div className="modal">
            <button type="button" className="icon-button modal-close" onClick={() => setPredictionOpen(false)} aria-label={t.lucky.close}>
              <X />
            </button>
            <Sparkles size={32} />
            <h2 id="prediction-title">{t.lucky.title}</h2>
            <p className="prediction-message">{predictionText}</p>
            <small>{t.lucky.label}</small>
          </div>
        </div>
      )}
    </main>
  );
}

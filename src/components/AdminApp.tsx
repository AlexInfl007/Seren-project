"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { parseEther, type Hash } from "viem";
import { CONTRACT_ABI, CONTRACT_ADDRESS, RoundStatus, transactionLink } from "@/config/contract";
import { useWallet } from "@/hooks/useWallet";
import { createWalletPublicClient, readLotteryState, type LotteryState } from "@/lib/contractReads";
import { normalizeContractError, type AppError } from "@/lib/contractErrors";
import { formatPol } from "@/lib/format";

export default function AdminApp() {
  const wallet = useWallet();
  const [state, setState] = useState<LotteryState>();
  const [ticketPrice, setTicketPrice] = useState("30");
  const [targetPool, setTargetPool] = useState("30000");
  const [newTarget, setNewTarget] = useState("");
  const [busy, setBusy] = useState(false);
  const [hash, setHash] = useState<Hash>();
  const [error, setError] = useState<AppError>();

  const refresh = useCallback(async () => {
    if (!wallet.provider || !wallet.account || !wallet.isPolygon) { setState(undefined); return; }
    try { setState(await readLotteryState(wallet.provider, wallet.account)); setError(undefined); }
    catch (cause) { setError(normalizeContractError(cause)); }
  }, [wallet.provider, wallet.account, wallet.isPolygon]);
  useEffect(() => { void refresh(); }, [refresh]);

  const ensureContext = async () => {
    if (!wallet.provider || !wallet.account || !wallet.walletClient || !wallet.isPolygon) throw new Error("Wrong network");
    const accounts = await wallet.provider.request<string[]>({ method: "eth_accounts" });
    if (accounts[0]?.toLowerCase() !== wallet.account.toLowerCase()) throw new Error("Account changed");
    return { client: createWalletPublicClient(wallet.provider), walletClient: wallet.walletClient, account: wallet.account };
  };

  const submit = async (action: "start" | "target" | "pause" | "draw" | "finalize") => {
    if (!state?.isAdmin || busy || !window.confirm(`Confirm admin action: ${action}. The contract simulation will run before the wallet opens.`)) return;
    setBusy(true); setError(undefined); setHash(undefined);
    try {
      const { client, walletClient, account } = await ensureContext();
      const simulation = action === "start"
        ? await client.simulateContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, account, functionName: "startRound", args: [parseEther(ticketPrice), parseEther(targetPool)] })
        : action === "target"
          ? await client.simulateContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, account, functionName: "updateTargetPool", args: [parseEther(newTarget)] })
          : action === "pause"
            ? await client.simulateContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, account, functionName: "setPurchasesPaused", args: [!state.purchasesPaused] })
            : action === "draw"
              ? await client.simulateContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, account, functionName: "requestDraw" })
              : await client.simulateContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, account, functionName: "finalizeRound", args: [state.roundId] });
      await ensureContext();
      const txHash = await walletClient.writeContract(simulation.request as never);
      setHash(txHash);
      const receipt = await client.waitForTransactionReceipt({ hash: txHash, confirmations: 1 });
      if (receipt.status !== "success") throw new Error("Transaction reverted");
      await refresh();
    } catch (cause) { setError(normalizeContractError(cause)); }
    finally { setBusy(false); }
  };

return <main className="admin-page"><div className="panel admin-shell"><div className="admin-heading"><div><p>Seren Lottery Chain</p><h1>Admin console</h1></div><Link href="/" className="outline-button">Back to public site</Link></div>{!wallet.account ? <button type="button" className="primary-button" onClick={() => wallet.connectWithProvider(wallet.providers[0])}>Connect wallet</button> : !wallet.isPolygon ? <button type="button" className="primary-button" onClick={wallet.switchToPolygon}>Switch to Polygon</button> : !state ? <p>Loading on-chain authorization…</p> : !state.isAdmin ? <div className="locked-panel"><p>This connected address is not an on-chain administrator. No controls are available.</p></div> : <><div className="admin-state"><span>Round <strong>#{state.roundId.toString()}</strong></span><span>Status <strong>{RoundStatus[state.round.status]}</strong></span><span>Tickets <strong>{state.round.totalTickets.toString()}</strong></span><span>Target <strong>{formatPol(state.round.targetPool)}</strong></span></div><section className="admin-grid"><article><h2>Start round</h2><label>Ticket price (POL)<input value={ticketPrice} onChange={(event) => setTicketPrice(event.target.value)}/></label><label>Target pool (POL)<input value={targetPool} onChange={(event) => setTargetPool(event.target.value)}/></label><button disabled={busy || ![RoundStatus.NONE, RoundStatus.FINALIZED].includes(state.round.status)} onClick={() => submit("start")}>Simulate and start</button></article><article><h2>Target and pause</h2><label>New target (POL)<input value={newTarget} onChange={(event) => setNewTarget(event.target.value)}/></label><button disabled={busy || !newTarget} onClick={() => submit("target")}>Simulate target update</button><button disabled={busy} onClick={() => submit("pause")}>{state.purchasesPaused ? "Resume" : "Pause"} purchases</button></article><article><h2>Draw lifecycle</h2><button disabled={busy || state.round.status !== RoundStatus.OPEN || state.round.totalTickets < 10n} onClick={() => submit("draw")}>Simulate and request draw</button><button disabled={busy || state.round.status !== RoundStatus.RANDOMNESS_READY} onClick={() => submit("finalize")}>Simulate and finalize</button><p>No randomness retry or ownership controls are exposed.</p></article></section></>}{busy && <p className="inline-warning">Waiting for simulation, wallet, and Polygon confirmation…</p>}{hash && <a href={transactionLink(hash)} target="_blank" rel="noopener noreferrer">View transaction</a>}{error && <p className="inline-error">{error.key}: {error.technical}</p>}</div></main>;
}

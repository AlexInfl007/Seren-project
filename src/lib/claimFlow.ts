import type { Address, Hash, PublicClient, WalletClient } from "viem";
import { simulateBatchClaim, simulateClaimPrize } from "@/lib/contractReads";
import type { TransactionProgress } from "@/lib/purchaseFlow";

export async function executeClaimPrize(params: {
  client: PublicClient;
  walletClient: WalletClient;
  account: Address;
  roundId: bigint;
  ensureContext: () => void | Promise<void>;
  onProgress?: (progress: TransactionProgress, hash?: Hash) => void;
}) {
  params.onProgress?.("preparing");
  await params.ensureContext();
  const { win, simulation } = await simulateClaimPrize(params.client, params.account, params.roundId);
  await params.ensureContext();
  params.onProgress?.("awaiting_signature");
  const hash = await params.walletClient.writeContract(simulation.request);
  params.onProgress?.("submitted", hash);
  params.onProgress?.("confirming", hash);
  const receipt = await params.client.waitForTransactionReceipt({ hash, confirmations: 1 });
  if (receipt.status !== "success") throw Object.assign(new Error("TransactionReverted"), { hash });
  params.onProgress?.("success", hash);
  return { hash, receipt, win };
}

export async function executeBatchClaim(params: {
  client: PublicClient;
  walletClient: WalletClient;
  account: Address;
  roundIds: bigint[];
  ensureContext: () => void | Promise<void>;
  onProgress?: (progress: TransactionProgress, hash?: Hash) => void;
}) {
  params.onProgress?.("preparing");
  await params.ensureContext();
  const simulation = await simulateBatchClaim(params.client, params.account, params.roundIds);
  await params.ensureContext();
  params.onProgress?.("awaiting_signature");
  const hash = await params.walletClient.writeContract(simulation.request);
  params.onProgress?.("submitted", hash);
  params.onProgress?.("confirming", hash);
  const receipt = await params.client.waitForTransactionReceipt({ hash, confirmations: 1 });
  if (receipt.status !== "success") throw Object.assign(new Error("TransactionReverted"), { hash });
  params.onProgress?.("success", hash);
  return { hash, receipt };
}

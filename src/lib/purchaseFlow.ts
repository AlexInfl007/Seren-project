import type { Address, Hash, PublicClient, WalletClient } from "viem";
import { PurchaseQuoteStatus } from "@/config/contract";
import { preparePurchaseQuote, simulateTicketPurchase, type PurchaseQuote } from "@/lib/contractReads";

export type TransactionProgress =
  | "preparing"
  | "quoting"
  | "awaiting_signature"
  | "submitted"
  | "confirming"
  | "success";

export type PurchaseIntent = {
  quantity: number;
  creditsToUse: number;
  proposedReferrer?: Address;
};

export type PreparedPurchase = PurchaseIntent & {
  roundId: bigint;
  deadline: bigint;
  quote: PurchaseQuote;
};

export function validatePurchaseIntent(intent: PurchaseIntent, availableCredits: bigint, maximum = 100) {
  if (!Number.isInteger(intent.quantity) || intent.quantity < 1 || intent.quantity > maximum) return "quantity" as const;
  if (!Number.isInteger(intent.creditsToUse) || intent.creditsToUse < 0 || intent.creditsToUse > intent.quantity) return "credits" as const;
  if (BigInt(intent.creditsToUse) > availableCredits) return "credits" as const;
  return undefined;
}

export async function prepareTicketPurchase(params: {
  client: PublicClient;
  account: Address;
  intent: PurchaseIntent;
}): Promise<PreparedPurchase> {
  const prepared = await preparePurchaseQuote({
    client: params.client,
    buyer: params.account,
    ...params.intent,
  });
  return { ...params.intent, ...prepared };
}

export async function executeTicketPurchase(params: {
  client: PublicClient;
  walletClient: WalletClient;
  account: Address;
  prepared: PreparedPurchase;
  ensureContext: () => void | Promise<void>;
  onProgress?: (progress: TransactionProgress, hash?: Hash) => void;
}) {
  params.onProgress?.("preparing");
  await params.ensureContext();
  params.onProgress?.("quoting");

  const fresh = await preparePurchaseQuote({
    client: params.client,
    buyer: params.account,
    quantity: params.prepared.quantity,
    creditsToUse: params.prepared.creditsToUse,
    proposedReferrer: params.prepared.proposedReferrer,
  });
  if (fresh.roundId !== params.prepared.roundId) throw new Error("WrongRound");
  if (!fresh.quote.canPurchase || fresh.quote.status !== PurchaseQuoteStatus.OK) {
    throw new Error(`PurchaseQuoteStatus:${fresh.quote.status}`);
  }

  const simulation = await simulateTicketPurchase({
    client: params.client,
    account: params.account,
    roundId: fresh.roundId,
    quantity: params.prepared.quantity,
    proposedReferrer: params.prepared.proposedReferrer,
    creditsToUse: params.prepared.creditsToUse,
    deadline: fresh.deadline,
    value: fresh.quote.requiredPayment,
  });

  await params.ensureContext();
  params.onProgress?.("awaiting_signature");
  const hash = await params.walletClient.writeContract(simulation.request);
  params.onProgress?.("submitted", hash);
  params.onProgress?.("confirming", hash);
  const receipt = await params.client.waitForTransactionReceipt({ hash, confirmations: 1 });
  if (receipt.status !== "success") throw Object.assign(new Error("TransactionReverted"), { hash });
  params.onProgress?.("success", hash);
  return { hash, receipt, quote: fresh.quote };
}

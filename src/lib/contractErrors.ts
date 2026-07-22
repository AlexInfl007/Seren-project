import { decodeErrorResult, type Hex } from "viem";
import { CONTRACT_ABI, PURCHASE_QUOTE_STATUS_KEYS } from "@/config/contract";

export type ErrorKey =
  | "walletUnavailable" | "userRejected" | "wrongNetwork" | "noAccounts" | "providerFailure"
  | "readFailed" | "simulationFailed" | "insufficientFunds" | "transactionFailed" | "historyUnavailable"
  | "wrongRound" | "incorrectPayment" | "deadlineExpired" | "roundNotOpen" | "purchasesPaused"
  | "purchaseLimitExceeded" | "insufficientReferralCredits" | "selfReferral" | "referrerNotParticipant"
  | "referrerCannotBeChanged" | "noPrize" | "notEnoughTickets" | "invalidQuantity" | "tooManyRounds";

export type AppError = { key: ErrorKey; technical?: string };

const customErrorKeys: Record<string, ErrorKey> = {
  WrongRound: "wrongRound", IncorrectPayment: "incorrectPayment", DeadlineExpired: "deadlineExpired",
  RoundNotOpen: "roundNotOpen", PurchasesArePaused: "purchasesPaused", PurchaseLimitExceeded: "purchaseLimitExceeded",
  InsufficientReferralCredits: "insufficientReferralCredits", SelfReferral: "selfReferral",
  ReferrerHasNeverParticipated: "referrerNotParticipant", ReferrerCannotBeChanged: "referrerCannotBeChanged",
  NoPrize: "noPrize", NotEnoughTickets: "notEnoughTickets", InvalidQuantity: "invalidQuantity",
  TooManyRoundsInBatch: "tooManyRounds",
};

function findHexData(error: unknown): Hex | undefined {
  if (!error || typeof error !== "object") return undefined;
  const record = error as Record<string, unknown>;
  if (typeof record.data === "string" && /^0x[0-9a-f]+$/i.test(record.data)) return record.data as Hex;
  return findHexData(record.cause);
}

export function normalizeContractError(error: unknown): AppError {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  const data = findHexData(error);
  if (data) {
    try {
      const decoded = decodeErrorResult({ abi: CONTRACT_ABI, data });
      const key = customErrorKeys[decoded.errorName];
      if (key) return { key, technical: message };
    } catch { /* retain the provider message */ }
  }
  for (const [name, key] of Object.entries(customErrorKeys)) if (message.includes(name)) return { key, technical: message };
  const quoteMatch = message.match(/PurchaseQuoteStatus:(\d+)/);
  if (quoteMatch) {
    const quoteKey = PURCHASE_QUOTE_STATUS_KEYS[Number(quoteMatch[1]) as keyof typeof PURCHASE_QUOTE_STATUS_KEYS];
    const mapping: Partial<Record<string, ErrorKey>> = {
      wrongRound: "wrongRound", roundNotOpen: "roundNotOpen", purchasesPaused: "purchasesPaused",
      quantityLimitExceeded: "purchaseLimitExceeded", insufficientCredits: "insufficientReferralCredits",
      selfReferral: "selfReferral", referrerNotParticipant: "referrerNotParticipant", referrerAlreadyFixed: "referrerCannotBeChanged",
    };
    return { key: mapping[quoteKey] ?? "simulationFailed", technical: message };
  }
  const lower = message.toLowerCase();
  if (lower.includes("user rejected") || lower.includes("rejected the request")) return { key: "userRejected", technical: message };
  if (lower.includes("insufficient funds") || lower.includes("exceeds the balance")) return { key: "insufficientFunds", technical: message };
  if (lower.includes("rpc_rate_limit") || lower.includes("eth_getlogs") || lower.includes("rate limit")) return { key: "historyUnavailable", technical: message };
  if (lower.includes("revert") || lower.includes("simulation")) return { key: "simulationFailed", technical: message };
  return { key: "providerFailure", technical: message };
}

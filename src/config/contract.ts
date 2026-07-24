import { getAddress, zeroAddress } from "viem";
import { CONTRACT_ABI } from "@/config/contractAbi";

export { CONTRACT_ABI };

export const POLYGON_CHAIN_ID = 137;
export const POLYGON_CHAIN_ID_HEX = "0x89";
export const POLYGON_EXPLORER = "https://polygonscan.com";
export const CONTRACT_ADDRESS = getAddress("0x0C59B1c64925425AB307Cc19A92AD176E0709360");
export const DEPLOYMENT_BLOCK = 90588221n;
export const DEPLOYMENT_TRANSACTION = "0xfd212926d1cc1923b0f5f747a6c3771a109cc3b6f29572d28eb63f390636f373" as const;
export const DEPLOYMENT_FACTORY = getAddress("0xbA2BA42a192Ee539C37B71ADbb6f33AF32eC92ba");
export const VRF_OWNERSHIP_LOCK = getAddress("0x2Fb94fb1ed3dc22B3Fd27Cc13C19Ef1f947A1c20");
export const VRF_COORDINATOR = getAddress("0xec0Ed46f36576541C75739E915ADbCb3DE24bD77");
export const ZERO_ADDRESS = zeroAddress;
export const PURCHASE_DEADLINE_SECONDS = 10n * 60n;
export const WINNER_COUNT = 10;
export const MAX_TICKETS_PER_PURCHASE = 100;
export const MAX_ROUNDS_PER_BATCH_CLAIM = 50;

export enum RoundStatus {
  NONE = 0,
  OPEN = 1,
  RANDOMNESS_REQUESTED = 2,
  RANDOMNESS_READY = 3,
  FINALIZED = 4,
}

export const ROUND_STATUS_KEYS = {
  [RoundStatus.NONE]: "none",
  [RoundStatus.OPEN]: "open",
  [RoundStatus.RANDOMNESS_REQUESTED]: "randomnessRequested",
  [RoundStatus.RANDOMNESS_READY]: "randomnessReady",
  [RoundStatus.FINALIZED]: "finalized",
} as const;

export enum PurchaseQuoteStatus {
  OK = 0,
  NO_ACTIVE_ROUND = 1,
  WRONG_ROUND = 2,
  ROUND_NOT_OPEN = 3,
  PURCHASES_PAUSED = 4,
  EXPIRED = 5,
  ZERO_QUANTITY = 6,
  QUANTITY_LIMIT_EXCEEDED = 7,
  TOO_MANY_CREDITS_REQUESTED = 8,
  INSUFFICIENT_CREDITS = 9,
  SELF_REFERRAL = 10,
  REFERRER_NOT_PARTICIPANT = 11,
  REFERRER_ALREADY_FIXED = 12,
}

export const PURCHASE_QUOTE_STATUS_KEYS = {
  [PurchaseQuoteStatus.OK]: "ok",
  [PurchaseQuoteStatus.NO_ACTIVE_ROUND]: "noActiveRound",
  [PurchaseQuoteStatus.WRONG_ROUND]: "wrongRound",
  [PurchaseQuoteStatus.ROUND_NOT_OPEN]: "roundNotOpen",
  [PurchaseQuoteStatus.PURCHASES_PAUSED]: "purchasesPaused",
  [PurchaseQuoteStatus.EXPIRED]: "expired",
  [PurchaseQuoteStatus.ZERO_QUANTITY]: "zeroQuantity",
  [PurchaseQuoteStatus.QUANTITY_LIMIT_EXCEEDED]: "quantityLimitExceeded",
  [PurchaseQuoteStatus.TOO_MANY_CREDITS_REQUESTED]: "tooManyCredits",
  [PurchaseQuoteStatus.INSUFFICIENT_CREDITS]: "insufficientCredits",
  [PurchaseQuoteStatus.SELF_REFERRAL]: "selfReferral",
  [PurchaseQuoteStatus.REFERRER_NOT_PARTICIPANT]: "referrerNotParticipant",
  [PurchaseQuoteStatus.REFERRER_ALREADY_FIXED]: "referrerAlreadyFixed",
} as const;

export type RoundStatusKey = (typeof ROUND_STATUS_KEYS)[keyof typeof ROUND_STATUS_KEYS];
export type PurchaseQuoteStatusKey = (typeof PURCHASE_QUOTE_STATUS_KEYS)[keyof typeof PURCHASE_QUOTE_STATUS_KEYS];

export const HISTORY_SCAN_CONFIG = {
  deploymentBlock: DEPLOYMENT_BLOCK,
  initialBlockSpan: 50_000n,
  minBlockSpan: 500n,
  activityLimit: 20,
  sessionKey: `seren.history.v2.${CONTRACT_ADDRESS.toLowerCase()}`,
} as const;

export const CONTRACT_LINK = `${POLYGON_EXPLORER}/address/${CONTRACT_ADDRESS}#code`;
export const VRF_COORDINATOR_LINK = `${POLYGON_EXPLORER}/address/${VRF_COORDINATOR}`;
export const transactionLink = (hash: string) => `${POLYGON_EXPLORER}/tx/${hash}`;
export const addressLink = (address: string) => `${POLYGON_EXPLORER}/address/${address}`;

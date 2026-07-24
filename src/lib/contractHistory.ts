import { createPublicClient, custom, type Address, type Hex, type Log, type PublicClient } from "viem";
import { polygon } from "viem/chains";
import { CONTRACT_ABI, CONTRACT_ADDRESS, HISTORY_SCAN_CONFIG, transactionLink } from "@/config/contract";
import type { Eip1193Provider } from "@/lib/eip1193";

export const ACTIVITY_EVENTS = [
  "RoundStarted", "TicketPurchased", "VrfRequestSent", "RandomnessAccepted", "WinnerSelected",
  "RoundFinalized", "PrizeClaimed", "BatchPrizesClaimed", "ReferralRegistered",
  "ReferralCreditGranted", "ReferralCreditsUsed", "TargetPoolUpdated", "PurchasesPauseChanged",
] as const;
export type ActivityEventName = (typeof ACTIVITY_EVENTS)[number];

export type ActivityEntry = {
  id: string;
  eventName: ActivityEventName;
  transactionHash: Hex;
  blockNumber: bigint;
  timestamp?: number;
  roundId?: bigint;
  account?: Address;
  quantity?: bigint;
  amount?: bigint;
  place?: number;
  ticketId?: bigint;
  firstTicketId?: bigint;
  lastTicketId?: bigint;
  explorerUrl: string;
};

type CachedHistory = { latestBlock: string; activity: ActivityEntry[] };
type DecodedLog = Log & { eventName?: string; args?: Record<string, unknown> };
const RPC_RETRY_LIMIT = 2;
const RPC_RETRY_DELAY_MS = 180;
const TIMESTAMP_CONCURRENCY = 4;

export function createHistoryClient(provider: Eip1193Provider): PublicClient {
  return createPublicClient({ chain: polygon, transport: custom(provider) }) as unknown as PublicClient;
}

function toBigInt(value: unknown): bigint | undefined {
  return typeof value === "bigint" ? value : undefined;
}

export function decodedLogToActivity(log: DecodedLog): ActivityEntry | undefined {
  if (!log.eventName || !ACTIVITY_EVENTS.includes(log.eventName as ActivityEventName) || !log.transactionHash || !log.blockNumber) return undefined;
  const args = log.args ?? {};
  const account = (args.buyer ?? args.winner ?? args.player ?? args.referrer ?? args.recipient) as Address | undefined;
  return {
    id: `${log.transactionHash}-${log.logIndex}`,
    eventName: log.eventName as ActivityEventName,
    transactionHash: log.transactionHash,
    blockNumber: log.blockNumber,
    roundId: toBigInt(args.roundId),
    account,
    quantity: toBigInt(args.quantity) ?? toBigInt(args.creditsUsed),
    amount: toBigInt(args.paid) ?? toBigInt(args.prize) ?? toBigInt(args.amount) ?? toBigInt(args.netPrizePool),
    place: typeof args.place === "number" ? args.place : undefined,
    ticketId: toBigInt(args.ticketId),
    firstTicketId: toBigInt(args.firstTicketId),
    lastTicketId: toBigInt(args.lastTicketId),
    explorerUrl: transactionLink(log.transactionHash),
  };
}

function storage() {
  if (typeof window === "undefined") return undefined;
  try { return window.sessionStorage; } catch { return undefined; }
}

function readCache(): CachedHistory | undefined {
  const raw = storage()?.getItem(HISTORY_SCAN_CONFIG.sessionKey);
  if (!raw) return undefined;
  try {
    return JSON.parse(raw, (_key, value) => typeof value === "string" && /^\d+n$/.test(value) ? BigInt(value.slice(0, -1)) : value) as CachedHistory;
  } catch {
    storage()?.removeItem(HISTORY_SCAN_CONFIG.sessionKey);
    return undefined;
  }
}

function writeCache(value: CachedHistory) {
  storage()?.setItem(HISTORY_SCAN_CONFIG.sessionKey, JSON.stringify(value, (_key, item) => typeof item === "bigint" ? `${item}n` : item));
}

function isRangeLimited(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return message.includes("block range")
    || message.includes("range too large")
    || message.includes("too many blocks")
    || message.includes("more than") && message.includes("results");
}

async function retryRpc<T>(operation: () => Promise<T>, signal?: AbortSignal) {
  let failure: unknown;
  for (let attempt = 0; attempt <= RPC_RETRY_LIMIT; attempt += 1) {
    if (signal?.aborted) throw new DOMException("History request cancelled", "AbortError");
    try {
      return await operation();
    } catch (error) {
      failure = error;
      if (attempt === RPC_RETRY_LIMIT) break;
      await new Promise((resolve) => setTimeout(resolve, RPC_RETRY_DELAY_MS * (attempt + 1)));
    }
  }
  throw failure;
}

export async function attachTimestamps(client: PublicClient, activity: ActivityEntry[], signal?: AbortSignal) {
  const blocks = [...new Set(activity.map((entry) => entry.blockNumber.toString()))];
  const timestamps = new Map<string, number>();
  for (let index = 0; index < blocks.length; index += TIMESTAMP_CONCURRENCY) {
    const batch = blocks.slice(index, index + TIMESTAMP_CONCURRENCY);
    await Promise.all(batch.map(async (value) => {
      try {
        const block = await retryRpc(() => client.getBlock({ blockNumber: BigInt(value) }), signal);
        timestamps.set(value, Number(block.timestamp) * 1000);
      } catch (error) {
        if ((error as Error).name === "AbortError") throw error;
        // Timestamps are optional metadata; verified events must survive desktop RPC throttling.
      }
    }));
  }
  return activity.map((entry) => ({ ...entry, timestamp: timestamps.get(entry.blockNumber.toString()) }));
}

export async function loadContractHistoryFromClient(client: PublicClient, force = false, signal?: AbortSignal) {
  const cached = readCache();

  try {
    const latestBlock = await retryRpc(() => client.getBlockNumber(), signal);
    if (!force && cached?.latestBlock === latestBlock.toString()) return cached;
    let toBlock = latestBlock;
    let span = HISTORY_SCAN_CONFIG.initialBlockSpan;
    let transientRetries = 0;
    const activity: ActivityEntry[] = [];
    while (toBlock >= HISTORY_SCAN_CONFIG.deploymentBlock && activity.length < HISTORY_SCAN_CONFIG.activityLimit) {
      if (signal?.aborted) throw new DOMException("History request cancelled", "AbortError");
      const fromBlock = toBlock - span > HISTORY_SCAN_CONFIG.deploymentBlock ? toBlock - span : HISTORY_SCAN_CONFIG.deploymentBlock;
      try {
        const logs = await client.getContractEvents({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, fromBlock, toBlock });
        activity.push(...logs.slice().reverse().map((log) => decodedLogToActivity(log as DecodedLog)).filter((entry): entry is ActivityEntry => Boolean(entry)));
        transientRetries = 0;
        if (fromBlock === HISTORY_SCAN_CONFIG.deploymentBlock) break;
        toBlock = fromBlock - 1n;
      } catch (error) {
        if (signal?.aborted) throw error;
        if (activity.length > 0) break;
        if (!isRangeLimited(error) && transientRetries < RPC_RETRY_LIMIT) {
          transientRetries += 1;
          await new Promise((resolve) => setTimeout(resolve, RPC_RETRY_DELAY_MS * transientRetries));
          continue;
        }
        transientRetries = 0;
        span /= 2n;
        if (span < HISTORY_SCAN_CONFIG.minBlockSpan) throw new Error("RPC_RATE_LIMIT", { cause: error });
      }
    }

    const result = {
      latestBlock: latestBlock.toString(),
      activity: await attachTimestamps(client, activity.slice(0, HISTORY_SCAN_CONFIG.activityLimit), signal),
    };
    if (result.activity.length === 0 && cached?.activity.length) return cached;
    writeCache(result);
    return result;
  } catch (error) {
    if ((error as Error).name !== "AbortError" && cached?.activity.length) return cached;
    throw error;
  }
}

export async function loadContractHistory(provider: Eip1193Provider, force = false, signal?: AbortSignal) {
  return loadContractHistoryFromClient(createHistoryClient(provider), force, signal);
}

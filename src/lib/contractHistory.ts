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
  explorerUrl: string;
};

type CachedHistory = { latestBlock: string; activity: ActivityEntry[] };
type DecodedLog = Log & { eventName?: string; args?: Record<string, unknown> };

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

async function attachTimestamps(client: PublicClient, activity: ActivityEntry[]) {
  const blocks = [...new Set(activity.map((entry) => entry.blockNumber.toString()))];
  const timestamps = new Map<string, number>();
  await Promise.all(blocks.slice(0, 20).map(async (value) => {
    const block = await client.getBlock({ blockNumber: BigInt(value) });
    timestamps.set(value, Number(block.timestamp) * 1000);
  }));
  return activity.map((entry) => ({ ...entry, timestamp: timestamps.get(entry.blockNumber.toString()) }));
}

export async function loadContractHistory(provider: Eip1193Provider, force = false, signal?: AbortSignal) {
  const client = createHistoryClient(provider);
  const latestBlock = await client.getBlockNumber();
  const cached = force ? undefined : readCache();
  if (cached?.latestBlock === latestBlock.toString()) return cached;

  let toBlock = latestBlock;
  let span = HISTORY_SCAN_CONFIG.initialBlockSpan;
  const activity: ActivityEntry[] = [];
  while (toBlock >= HISTORY_SCAN_CONFIG.deploymentBlock && activity.length < HISTORY_SCAN_CONFIG.activityLimit) {
    if (signal?.aborted) throw new DOMException("History request cancelled", "AbortError");
    const fromBlock = toBlock - span > HISTORY_SCAN_CONFIG.deploymentBlock ? toBlock - span : HISTORY_SCAN_CONFIG.deploymentBlock;
    try {
      const logs = await client.getContractEvents({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, fromBlock, toBlock });
      activity.push(...logs.slice().reverse().map((log) => decodedLogToActivity(log as DecodedLog)).filter((entry): entry is ActivityEntry => Boolean(entry)));
      if (fromBlock === HISTORY_SCAN_CONFIG.deploymentBlock) break;
      toBlock = fromBlock - 1n;
    } catch (error) {
      if (signal?.aborted) throw error;
      span /= 2n;
      if (span < HISTORY_SCAN_CONFIG.minBlockSpan) throw new Error("RPC_RATE_LIMIT", { cause: error });
    }
  }

  const result = { latestBlock: latestBlock.toString(), activity: await attachTimestamps(client, activity.slice(0, HISTORY_SCAN_CONFIG.activityLimit)) };
  writeCache(result);
  return result;
}

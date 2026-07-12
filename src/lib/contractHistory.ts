import {
  createPublicClient,
  custom,
  formatEther,
  type Address,
  type Hex,
  type Log,
  type PublicClient,
} from "viem";
import {
  CONTRACT_ABI,
  CONTRACT_ADDRESS,
  HISTORY_SCAN_CONFIG,
  POLYGON_EXPLORER,
  POLYGON_CHAIN,
} from "@/config/contract";
import type { Eip1193Provider } from "@/lib/eip1193";

export type ActivityEntry = {
  id: string;
  buyer: Address;
  round: bigint;
  price?: bigint;
  transactionHash: Hex;
  blockNumber: bigint;
  timestamp?: number;
  explorerUrl: string;
};

export type WinnerEntry = {
  id: string;
  winner: Address;
  round: bigint;
  prize?: bigint;
  transactionHash: Hex;
  blockNumber: bigint;
  timestamp?: number;
  explorerUrl: string;
};

export function mergeActivityEntries(primary: ActivityEntry[], fallback: ActivityEntry[]) {
  const byTransaction = new Map<string, ActivityEntry>();
  [...primary, ...fallback].forEach((entry) => {
    const key = entry.transactionHash.toLowerCase();
    if (!byTransaction.has(key)) byTransaction.set(key, entry);
  });
  return [...byTransaction.values()]
    .sort((a, b) => (a.blockNumber > b.blockNumber ? -1 : a.blockNumber < b.blockNumber ? 1 : 0))
    .slice(0, HISTORY_SCAN_CONFIG.purchaseLimit);
}

type CachedHistory = {
  latestBlock: string;
  activity: ActivityEntry[];
  winners: WinnerEntry[];
};

type HistoryApiResponse = {
  latestBlock: string;
  activity: Array<Omit<ActivityEntry, "round" | "price" | "blockNumber"> & { round: string; price?: string; blockNumber: string }>;
  winners: Array<Omit<WinnerEntry, "round" | "prize" | "blockNumber"> & { round: string; prize?: string; blockNumber: string }>;
};

export function createHistoryClient(provider: Eip1193Provider): PublicClient {
  return createPublicClient({
    chain: POLYGON_CHAIN,
    transport: custom(provider),
  }) as unknown as PublicClient;
}

export function ticketLogToActivity(log: Log & { args?: Record<string, unknown> }): ActivityEntry {
  const args = log.args || {};
  const buyer = (args.buyer || args.player || args.account) as Address;
  const round = BigInt((args.round || args.roundId || 0n) as bigint);
  const price = args.price || args.value || args.amount;

  return {
    id: `${log.transactionHash}-${log.logIndex}`,
    buyer,
    round,
    price: typeof price === "bigint" ? price : undefined,
    transactionHash: log.transactionHash!,
    blockNumber: log.blockNumber!,
    explorerUrl: `${POLYGON_EXPLORER}/tx/${log.transactionHash}`,
  };
}

export function winnerLogToEntry(log: Log & { args?: Record<string, unknown> }): WinnerEntry {
  const args = log.args || {};
  const winner = (args.winner || args.player || args.account) as Address;
  const round = BigInt((args.round || args.roundId || 0n) as bigint);
  const prize = args.prize || args.amount || args.value;

  return {
    id: `${log.transactionHash}-${log.logIndex}`,
    winner,
    round,
    prize: typeof prize === "bigint" ? prize : undefined,
    transactionHash: log.transactionHash!,
    blockNumber: log.blockNumber!,
    explorerUrl: `${POLYGON_EXPLORER}/tx/${log.transactionHash}`,
  };
}

function safeSessionStorage(): Storage | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return window.sessionStorage;
  } catch {
    return undefined;
  }
}

function readCachedHistory(): CachedHistory | undefined {
  const storage = safeSessionStorage();
  if (!storage) return undefined;
  const value = storage.getItem(HISTORY_SCAN_CONFIG.sessionKey);
  if (!value) return undefined;
  try {
    return JSON.parse(value, (_key, item) => {
      if (typeof item === "string" && /^\d+n$/.test(item)) return BigInt(item.slice(0, -1));
      return item;
    }) as CachedHistory;
  } catch {
    storage.removeItem(HISTORY_SCAN_CONFIG.sessionKey);
    return undefined;
  }
}

function writeCachedHistory(cache: CachedHistory) {
  const storage = safeSessionStorage();
  if (!storage) return;
  storage.setItem(
    HISTORY_SCAN_CONFIG.sessionKey,
    JSON.stringify(cache, (_key, value) =>
      typeof value === "bigint" ? `${value.toString()}n` : value,
    ),
  );
}

async function addTimestamps<T extends { blockNumber: bigint; timestamp?: number }>(
  client: PublicClient,
  rows: T[],
): Promise<T[]> {
  const uniqueBlocks = [...new Set(rows.map((row) => row.blockNumber.toString()))];
  const timestamps = new Map<string, number>();

  await Promise.all(
    uniqueBlocks.slice(0, 14).map(async (block) => {
      try {
        const result = await client.getBlock({ blockNumber: BigInt(block) });
        timestamps.set(block, Number(result.timestamp) * 1000);
      } catch {
        // A timestamp is optional; never discard verified events when an RPC rate-limits block metadata.
      }
    }),
  );

  return rows.map((row) => ({
    ...row,
    timestamp: timestamps.get(row.blockNumber.toString()),
  }));
}

async function scanEvent<T>({
  client,
  eventName,
  limit,
  mapper,
}: {
  client: PublicClient;
  eventName: "TicketBought" | "WinnerPicked";
  limit: number;
  mapper: (log: Log & { args?: Record<string, unknown> }) => T;
}): Promise<T[]> {
  const latest = await client.getBlockNumber();
  let toBlock = latest;
  let blockSpan = HISTORY_SCAN_CONFIG.initialBlockSpan;
  const collected: T[] = [];
  let transientRetries = 0;

  while (
    toBlock >= HISTORY_SCAN_CONFIG.deploymentBlock &&
    collected.length < limit &&
    blockSpan >= HISTORY_SCAN_CONFIG.minBlockSpan
  ) {
    const fromBlock =
      toBlock - blockSpan > HISTORY_SCAN_CONFIG.deploymentBlock
        ? toBlock - blockSpan
        : HISTORY_SCAN_CONFIG.deploymentBlock;

    try {
      const logs = await client.getContractEvents({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        eventName,
        fromBlock,
        toBlock,
      });

      collected.push(
        ...logs
          .filter((log) => log.transactionHash && log.blockNumber)
          .reverse()
          .map((log) => mapper(log as Log & { args?: Record<string, unknown> })),
      );
      transientRetries = 0;

      if (fromBlock === HISTORY_SCAN_CONFIG.deploymentBlock) break;
      toBlock = fromBlock - 1n;
    } catch (error) {
      if (collected.length > 0) break;
      const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
      const rangeLimited = message.includes("range") || message.includes("blocks are not supported") || message.includes("block range too large");
      if (!rangeLimited && transientRetries < 3) {
        transientRetries += 1;
        await new Promise((resolve) => setTimeout(resolve, transientRetries * 500));
        continue;
      }
      if (!rangeLimited) throw error;
      transientRetries = 0;
      blockSpan = blockSpan / 2n;
      if (blockSpan < HISTORY_SCAN_CONFIG.minBlockSpan) throw error;
    }
  }

  return collected.slice(0, limit);
}

export async function loadHistoryFromClient(client: PublicClient) {
  const [latestBlock, currentRound] = await Promise.all([
    client.getBlockNumber(),
    client.readContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: "round" }) as Promise<bigint>,
  ]);
  const [activityRaw, winnersRaw] = await Promise.all([
    scanEvent({ client, eventName: "TicketBought", limit: HISTORY_SCAN_CONFIG.purchaseLimit, mapper: ticketLogToActivity }),
    currentRound > 1n
      ? scanEvent({ client, eventName: "WinnerPicked", limit: HISTORY_SCAN_CONFIG.winnerLimit, mapper: winnerLogToEntry })
      : Promise.resolve([]),
  ]);
  const [activity, winners] = await Promise.all([
    addTimestamps(client, activityRaw),
    addTimestamps(client, winnersRaw),
  ]);
  return { latestBlock: latestBlock.toString(), activity, winners };
}

async function loadHistoryFromSiteApi(): Promise<CachedHistory> {
  const response = await fetch("/api/history", { cache: "no-store" });
  if (!response.ok) throw new Error(`History API returned ${response.status}`);
  const data = await response.json() as HistoryApiResponse;
  return {
    latestBlock: data.latestBlock,
    activity: data.activity.map((entry) => ({
      ...entry,
      round: BigInt(entry.round),
      price: entry.price === undefined ? undefined : BigInt(entry.price),
      blockNumber: BigInt(entry.blockNumber),
    })),
    winners: data.winners.map((entry) => ({
      ...entry,
      round: BigInt(entry.round),
      prize: entry.prize === undefined ? undefined : BigInt(entry.prize),
      blockNumber: BigInt(entry.blockNumber),
    })),
  };
}

export async function loadContractHistory(provider: Eip1193Provider, force = false) {
  const cached = !force ? readCachedHistory() : undefined;
  try {
    const publicHistory = await loadHistoryFromSiteApi();
    if (cached?.latestBlock === publicHistory.latestBlock) return cached;
    writeCachedHistory(publicHistory);
    return publicHistory;
  } catch {
    // Local development and temporary API failures retain a wallet-RPC fallback.
  }

  const result = await loadHistoryFromClient(createHistoryClient(provider));
  writeCachedHistory(result);
  return result;
}

export function formatLogAmount(value?: bigint) {
  if (value === undefined) return undefined;
  return `${Number(formatEther(value)).toLocaleString("en-US", {
    maximumFractionDigits: 4,
  })} POL`;
}

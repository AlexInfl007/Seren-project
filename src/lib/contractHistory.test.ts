import { parseEther } from "viem";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ACTIVITY_EVENTS,
  attachTimestamps,
  decodedLogToActivity,
  loadContractHistoryFromClient,
  type ActivityEntry,
} from "@/lib/contractHistory";
import { DEPLOYMENT_BLOCK, HISTORY_SCAN_CONFIG } from "@/config/contract";

const baseLog = { transactionHash: "0x123400000000000000000000000000000000000000000000000000000000abcd", blockNumber: DEPLOYMENT_BLOCK, logIndex: 2 } as const;

afterEach(() => {
  window.sessionStorage.clear();
});

describe("new-contract event decoding", () => {
  it("maps TicketPurchased without local price calculations", () => {
    const row = decodedLogToActivity({ ...baseLog, eventName: "TicketPurchased", args: { buyer: "0x0C59B1c64925425AB307Cc19A92AD176E0709360", roundId: 5n, quantity: 10n, paid: parseEther("270"), firstTicketId: 41n, lastTicketId: 50n } } as never)!;
    expect(row.eventName).toBe("TicketPurchased");
    expect(row.roundId).toBe(5n);
    expect(row.quantity).toBe(10n);
    expect(row.amount).toBe(parseEther("270"));
    expect(row.firstTicketId).toBe(41n);
    expect(row.lastTicketId).toBe(50n);
  });

  it("supports winner and referral events and starts at the deployment block", () => {
    expect(ACTIVITY_EVENTS).toContain("WinnerSelected");
    expect(ACTIVITY_EVENTS).toContain("ReferralCreditGranted");
    expect(HISTORY_SCAN_CONFIG.deploymentBlock).toBe(DEPLOYMENT_BLOCK);
    expect(HISTORY_SCAN_CONFIG.sessionKey).toContain("seren.history.v2");
  });

  it("keeps verified activity when desktop RPC timestamp requests are throttled", async () => {
    let active = 0;
    let maxActive = 0;
    const attempts = new Map<string, number>();
    const rows = Array.from({ length: 6 }, (_, index): ActivityEntry => ({
      id: `activity-${index}`,
      eventName: "TicketPurchased",
      transactionHash: baseLog.transactionHash,
      blockNumber: DEPLOYMENT_BLOCK + BigInt(index),
      explorerUrl: `https://polygonscan.com/tx/${baseLog.transactionHash}`,
    }));
    const client = {
      getBlock: vi.fn(async ({ blockNumber }: { blockNumber: bigint }) => {
        const key = blockNumber.toString();
        const attempt = (attempts.get(key) ?? 0) + 1;
        attempts.set(key, attempt);
        active += 1;
        maxActive = Math.max(maxActive, active);
        await new Promise((resolve) => setTimeout(resolve, 1));
        active -= 1;
        if (blockNumber === DEPLOYMENT_BLOCK + 1n && attempt === 1) throw new Error("rate limited");
        if (blockNumber === DEPLOYMENT_BLOCK + 2n) throw new Error("rate limited");
        return { timestamp: 1_800_000_000n + blockNumber };
      }),
    };

    const result = await attachTimestamps(client as never, rows);

    expect(result).toHaveLength(rows.length);
    expect(result[1].timestamp).toBeTypeOf("number");
    expect(result[2].timestamp).toBeUndefined();
    expect(attempts.get((DEPLOYMENT_BLOCK + 1n).toString())).toBe(2);
    expect(attempts.get((DEPLOYMENT_BLOCK + 2n).toString())).toBe(3);
    expect(maxActive).toBeLessThanOrEqual(4);
  });

  it("preserves a non-empty cache when a forced desktop refresh hits an RPC range limit", async () => {
    const activityLog = {
      ...baseLog,
      eventName: "TicketPurchased",
      args: {
        buyer: "0x0C59B1c64925425AB307Cc19A92AD176E0709360",
        roundId: 5n,
        quantity: 1n,
        paid: parseEther("3"),
      },
    };
    const workingClient = {
      getBlockNumber: vi.fn(async () => DEPLOYMENT_BLOCK + 100n),
      getContractEvents: vi.fn(async () => [activityLog]),
      getBlock: vi.fn(async () => ({ timestamp: 1_800_000_000n })),
    };
    const cached = await loadContractHistoryFromClient(workingClient as never, true);
    expect(cached.activity).toHaveLength(1);

    const limitedClient = {
      getBlockNumber: vi.fn(async () => DEPLOYMENT_BLOCK + 101n),
      getContractEvents: vi.fn(async () => { throw new Error("block range too large"); }),
    };
    const fallback = await loadContractHistoryFromClient(limitedClient as never, true);

    expect(fallback.activity).toEqual(cached.activity);
  });
});

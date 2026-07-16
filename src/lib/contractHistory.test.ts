import { parseEther } from "viem";
import { describe, expect, it } from "vitest";
import { getVerifiedFallbackHistory, loadHistoryFromClient, mergeActivityEntries, ticketLogToActivity, winnerLogToEntry } from "@/lib/contractHistory";

const baseLog = {
  transactionHash: "0x123400000000000000000000000000000000000000000000000000000000abcd",
  blockNumber: 10n,
  logIndex: 2,
};

describe("event view-model conversion", () => {
  it("maps ticket events into activity rows", () => {
    const row = ticketLogToActivity({
      ...baseLog,
      args: {
        buyer: "0xf90169AD413429af4AE0a3B8962648d4a3289011",
        round: 5n,
        price: parseEther("30"),
      },
    } as never);

    expect(row.buyer).toBe("0xf90169AD413429af4AE0a3B8962648d4a3289011");
    expect(row.round).toBe(5n);
    expect(row.price).toBe(parseEther("30"));
    expect(row.explorerUrl).toContain("/tx/");
  });

  it("uses the fixed contract price when TicketBought does not include a price", () => {
    const row = ticketLogToActivity({
      ...baseLog,
      args: {
        buyer: "0xf90169AD413429af4AE0a3B8962648d4a3289011",
        round: 5n,
      },
    } as never);

    expect(row.price).toBe(parseEther("30"));
  });

  it("maps winner events into winner rows", () => {
    const row = winnerLogToEntry({
      ...baseLog,
      args: {
        winner: "0xf90169AD413429af4AE0a3B8962648d4a3289011",
        round: 6n,
        prize: parseEther("90"),
      },
    } as never);

    expect(row.winner).toBe("0xf90169AD413429af4AE0a3B8962648d4a3289011");
    expect(row.round).toBe(6n);
    expect(row.prize).toBe(parseEther("90"));
  });

  it("keeps a confirmed purchase when the provider history is delayed", () => {
    const optimistic = ticketLogToActivity({
      ...baseLog,
      args: { buyer: "0xf90169AD413429af4AE0a3B8962648d4a3289011", round: 7n },
    } as never);
    expect(mergeActivityEntries([], [optimistic])).toEqual([optimistic]);
    expect(mergeActivityEntries([optimistic], [optimistic])).toHaveLength(1);
  });

  it("repairs cached purchase rows that were saved without a price", () => {
    const legacy = ticketLogToActivity({
      ...baseLog,
      args: { buyer: "0xf90169AD413429af4AE0a3B8962648d4a3289011", round: 7n },
    } as never);
    legacy.price = undefined;

    expect(mergeActivityEntries([legacy], [])[0].price).toBe(parseEther("30"));
  });

  it("always has the verified on-chain purchase as a public fallback", () => {
    const history = getVerifiedFallbackHistory();
    expect(history.activity).toHaveLength(1);
    expect(history.activity[0].transactionHash).toBe(
      "0xbd1013189ff2098dab92aeb6cfef46fea5df720f86cc015a6ebf7c29f91c07ca",
    );
    expect(history.activity[0].price).toBe(parseEther("30"));
  });

  it("stops scanning after the newest window containing a purchase", async () => {
    let eventRequests = 0;
    const client = {
      getBlockNumber: async () => 90_130_000n,
      readContract: async () => 1n,
      getContractEvents: async () => {
        eventRequests += 1;
        return [{ ...baseLog, blockNumber: 90_129_000n, args: { buyer: "0xf90169AD413429af4AE0a3B8962648d4a3289011", round: 1n } }];
      },
      getBlock: async () => ({ timestamp: 1_783_886_284n }),
    };

    const history = await loadHistoryFromClient(client as never);

    expect(eventRequests).toBe(1);
    expect(history.activity[0].blockNumber).toBe(90_129_000n);
  });
});

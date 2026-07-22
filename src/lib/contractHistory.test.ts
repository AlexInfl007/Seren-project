import { parseEther } from "viem";
import { describe, expect, it } from "vitest";
import { ACTIVITY_EVENTS, decodedLogToActivity } from "@/lib/contractHistory";
import { DEPLOYMENT_BLOCK, HISTORY_SCAN_CONFIG } from "@/config/contract";

const baseLog = { transactionHash: "0x123400000000000000000000000000000000000000000000000000000000abcd", blockNumber: DEPLOYMENT_BLOCK, logIndex: 2 };

describe("new-contract event decoding", () => {
  it("maps TicketPurchased without local price calculations", () => {
    const row = decodedLogToActivity({ ...baseLog, eventName: "TicketPurchased", args: { buyer: "0x0C59B1c64925425AB307Cc19A92AD176E0709360", roundId: 5n, quantity: 10n, paid: parseEther("270") } } as never)!;
    expect(row.eventName).toBe("TicketPurchased");
    expect(row.roundId).toBe(5n);
    expect(row.quantity).toBe(10n);
    expect(row.amount).toBe(parseEther("270"));
  });

  it("supports winner and referral events and starts at the deployment block", () => {
    expect(ACTIVITY_EVENTS).toContain("WinnerSelected");
    expect(ACTIVITY_EVENTS).toContain("ReferralCreditGranted");
    expect(HISTORY_SCAN_CONFIG.deploymentBlock).toBe(DEPLOYMENT_BLOCK);
    expect(HISTORY_SCAN_CONFIG.sessionKey).toContain("seren.history.v2");
  });
});

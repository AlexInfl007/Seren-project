import { describe, expect, it } from "vitest";
import { hasContractFunction, validatePurchaseMethod } from "@/lib/contractAdapter";

describe("final contract adapter", () => {
  it("uses the payable five-argument buyTickets function", () => {
    expect(validatePurchaseMethod()).toEqual({ ok: true, method: "buyTickets" });
    expect(hasContractFunction("buyTickets", 5)).toBe(true);
    expect(hasContractFunction("quotePurchase", 6)).toBe(true);
  });

  it("contains claim, result, referral, and admin lifecycle functions", () => {
    for (const [name, inputs] of [["claimPrize", 1], ["claimPrizes", 2], ["getRoundResults", 1], ["getPlayerRoundWin", 2], ["requestDraw", 0], ["finalizeRound", 1]] as const) {
      expect(hasContractFunction(name, inputs), name).toBe(true);
    }
    expect(hasContractFunction("retryRandomness" + "Request")).toBe(false);
  });
});

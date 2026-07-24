import { describe, expect, it } from "vitest";
import { CONTRACT_ABI, CONTRACT_ADDRESS, DEPLOYMENT_BLOCK, MAX_ROUNDS_PER_BATCH_CLAIM, POLYGON_CHAIN_ID, PurchaseQuoteStatus, ROUND_STATUS_KEYS, RoundStatus, WINNER_COUNT } from "@/config/contract";
import { languages, translations } from "@/i18n/translations";

describe("final Polygon deployment configuration", () => {
  it("pins the new address, chain, and exact deployment block", () => {
    expect(CONTRACT_ADDRESS).toBe("0x0C59B1c64925425AB307Cc19A92AD176E0709360");
    expect(POLYGON_CHAIN_ID).toBe(137);
    expect(DEPLOYMENT_BLOCK).toBe(90588221n);
    expect(WINNER_COUNT).toBe(10);
    expect(MAX_ROUNDS_PER_BATCH_CLAIM).toBe(50);
  });

  it("contains the complete supplied ABI surface", () => {
    expect(CONTRACT_ABI.length).toBe(150);
    const names = CONTRACT_ABI.map((item) => "name" in item ? item.name : undefined);
    for (const name of ["currentRoundId", "getCurrentRound", "buyTickets", "quotePurchase", "getRoundResults", "claimPrize", "claimPrizes", "ReferralRegistered"]) expect(names).toContain(name);
    for (const oldName of ["Ticket" + "Bought", "Winner" + "Requested", "Winner" + "Picked", "Round" + "Reset", "TICKET" + "_PRICE", "emergency" + "Active"]) expect(names).not.toContain(oldName);
  });

  it("maps every round and quote status and exposes all eight locales", () => {
    expect(ROUND_STATUS_KEYS[RoundStatus.RANDOMNESS_READY]).toBe("randomnessReady");
    expect(PurchaseQuoteStatus.REFERRER_ALREADY_FIXED).toBe(12);
    expect(languages).toHaveLength(8);
    for (const language of languages) {
      expect(Object.keys(translations[language].roundStatuses)).toHaveLength(5);
      expect(Object.keys(translations[language].quoteStatuses)).toHaveLength(13);
    }
  });
});

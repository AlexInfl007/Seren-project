import { describe, expect, it, vi } from "vitest";
import {
  PREDICTION_COMBINATION_COUNT,
  createDailyPrediction,
  createRandomPrediction,
  utcDateKey,
} from "@/lib/prediction";

describe("Seren Oracle selection", () => {
  it("uses crypto-style randomness without a wallet", () => {
    const random = vi.fn((array: Uint32Array) => {
      array.set([13, 7, 123]);
      return array;
    });
    expect(createRandomPrediction(new Date("2026-07-23T12:00:00Z"), random)).toEqual({
      messageIndex: 3,
      symbolIndex: 2,
      luckyNumber: 25,
      dateKey: "2026-07-23",
    });
    expect(random).toHaveBeenCalledOnce();
  });

  it("returns the same local result for the same wallet and UTC date", async () => {
    const first = await createDailyPrediction("0x0000000000000000000000000000000000000001", new Date("2026-07-23T01:00:00Z"));
    const second = await createDailyPrediction("0x0000000000000000000000000000000000000001", new Date("2026-07-23T22:00:00Z"));
    expect(second).toEqual(first);
  });

  it("changes the deterministic seed on another UTC date", async () => {
    const first = await createDailyPrediction("0x0000000000000000000000000000000000000001", new Date("2026-07-23T23:59:59Z"));
    const next = await createDailyPrediction("0x0000000000000000000000000000000000000001", new Date("2026-07-24T00:00:00Z"));
    expect(next).not.toEqual(first);
    expect(utcDateKey(new Date("2026-07-24T00:00:00Z"))).toBe("2026-07-24");
  });

  it("supports at least fifty localized message and symbol combinations", () => {
    expect(PREDICTION_COMBINATION_COUNT).toBeGreaterThanOrEqual(50);
  });
});

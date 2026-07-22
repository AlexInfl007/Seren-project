import { describe, expect, it } from "vitest";
import { calculatePoolProgress } from "@/lib/poolProgress";

describe("pool progress", () => {
  it("calculates progress with bigint precision", () => {
    expect(calculatePoolProgress(12_480n, 1_000_000n)).toEqual({
      basisPoints: 124n,
      percent: 1.24,
      remainingAmount: 987_520n,
      exceededAmount: 0n,
    });
  });

  it("returns zero progress when the target is zero", () => {
    expect(calculatePoolProgress(100n, 0n)).toEqual({
      basisPoints: 0n,
      percent: 0,
      remainingAmount: 0n,
      exceededAmount: 100n,
    });
  });

  it("caps visual progress when the current pool exceeds the target", () => {
    expect(calculatePoolProgress(125n, 100n)).toEqual({
      basisPoints: 10_000n,
      percent: 100,
      remainingAmount: 0n,
      exceededAmount: 25n,
    });
  });
});

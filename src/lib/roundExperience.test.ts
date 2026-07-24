import { describe, expect, it } from "vitest";
import { RoundStatus } from "@/config/contract";
import { calculateTicketShareBasisPoints, resolveRoundCoreState, roundLifecycleStep } from "@/lib/roundExperience";

describe("round experience state", () => {
  it.each([
    [RoundStatus.NONE, "none"],
    [RoundStatus.OPEN, "open"],
    [RoundStatus.RANDOMNESS_REQUESTED, "randomnessRequested"],
    [RoundStatus.RANDOMNESS_READY, "randomnessReady"],
    [RoundStatus.FINALIZED, "finalized"],
  ] as const)("maps contract status %s to %s", (roundStatus, expected) => {
    expect(resolveRoundCoreState({ connecting: false, connected: true, polygon: true, loading: false, rpcError: false, roundStatus })).toBe(expected);
  });

  it("prioritizes wallet and RPC states without inventing a round state", () => {
    expect(resolveRoundCoreState({ connecting: false, connected: false, polygon: false, loading: false, rpcError: false })).toBe("disconnected");
    expect(resolveRoundCoreState({ connecting: false, connected: true, polygon: false, loading: false, rpcError: false })).toBe("wrongNetwork");
    expect(resolveRoundCoreState({ connecting: false, connected: true, polygon: true, loading: false, rpcError: true })).toBe("rpcError");
  });

  it("maps lifecycle steps and calculates a precise bigint share", () => {
    expect(roundLifecycleStep(RoundStatus.RANDOMNESS_REQUESTED)).toBe(2);
    expect(roundLifecycleStep(RoundStatus.FINALIZED)).toBe(4);
    expect(calculateTicketShareBasisPoints(1n, 3n)).toBe(3333n);
    expect(calculateTicketShareBasisPoints(0n, 0n)).toBe(0n);
  });
});

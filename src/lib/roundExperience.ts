import { RoundStatus } from "@/config/contract";

export type RoundCoreState =
  | "disconnected"
  | "connecting"
  | "wrongNetwork"
  | "loading"
  | "rpcError"
  | "none"
  | "open"
  | "randomnessRequested"
  | "randomnessReady"
  | "finalized";

export function resolveRoundCoreState(input: {
  connecting: boolean;
  connected: boolean;
  polygon: boolean;
  loading: boolean;
  rpcError: boolean;
  roundStatus?: RoundStatus;
}): RoundCoreState {
  if (input.connecting) return "connecting";
  if (!input.connected) return "disconnected";
  if (!input.polygon) return "wrongNetwork";
  if (input.rpcError) return "rpcError";
  if (input.loading || input.roundStatus === undefined) return "loading";
  const states: Record<RoundStatus, RoundCoreState> = {
    [RoundStatus.NONE]: "none",
    [RoundStatus.OPEN]: "open",
    [RoundStatus.RANDOMNESS_REQUESTED]: "randomnessRequested",
    [RoundStatus.RANDOMNESS_READY]: "randomnessReady",
    [RoundStatus.FINALIZED]: "finalized",
  };
  return states[input.roundStatus];
}

export function roundLifecycleStep(status?: RoundStatus): number {
  if (status === RoundStatus.OPEN) return 0;
  if (status === RoundStatus.RANDOMNESS_REQUESTED) return 2;
  if (status === RoundStatus.RANDOMNESS_READY) return 3;
  if (status === RoundStatus.FINALIZED) return 4;
  return -1;
}

export function calculateTicketShareBasisPoints(userTickets: bigint, totalTickets: bigint): bigint {
  if (userTickets <= 0n || totalTickets <= 0n) return 0n;
  const value = (userTickets * 10_000n) / totalTickets;
  return value > 10_000n ? 10_000n : value;
}

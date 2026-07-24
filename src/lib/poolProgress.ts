export type PoolProgress = {
  basisPoints: bigint;
  percent: number;
  remainingAmount: bigint;
  exceededAmount: bigint;
};

export function calculatePoolProgress(currentPool: bigint, targetPool: bigint): PoolProgress {
  if (targetPool <= 0n) {
    return { basisPoints: 0n, percent: 0, remainingAmount: 0n, exceededAmount: currentPool > 0n ? currentPool : 0n };
  }

  const rawBasisPoints = currentPool > 0n ? (currentPool * 10_000n) / targetPool : 0n;
  const basisPoints = rawBasisPoints > 10_000n ? 10_000n : rawBasisPoints;
  return {
    basisPoints,
    percent: Number(basisPoints) / 100,
    remainingAmount: currentPool < targetPool ? targetPool - currentPool : 0n,
    exceededAmount: currentPool > targetPool ? currentPool - targetPool : 0n,
  };
}

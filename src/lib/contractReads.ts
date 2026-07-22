import {
  createPublicClient,
  custom,
  type Address,
  type Hex,
  type PublicClient,
} from "viem";
import { polygon } from "viem/chains";
import {
  CONTRACT_ABI,
  CONTRACT_ADDRESS,
  MAX_ROUNDS_PER_BATCH_CLAIM,
  MAX_TICKETS_PER_PURCHASE,
  PURCHASE_DEADLINE_SECONDS,
  PurchaseQuoteStatus,
  RoundStatus,
  ZERO_ADDRESS,
} from "@/config/contract";
import type { Eip1193Provider } from "@/lib/eip1193";

export type RoundSnapshot = {
  ticketPrice: bigint;
  targetPool: bigint;
  ticketRevenue: bigint;
  rolloverPool: bigint;
  grossPool: bigint;
  totalTickets: bigint;
  requestId: bigint;
  acceptedRequestId: bigint;
  startedAt: bigint;
  requestedAt: bigint;
  randomnessAcceptedAt: bigint;
  finalizedAt: bigint;
  vrfCallbackGasLimit: number;
  vrfSubscriptionId: bigint;
  vrfKeyHash: Hex;
  vrfRequestConfirmations: number;
  vrfNativePayment: boolean;
  status: RoundStatus;
};

export type PurchaseQuote = {
  canPurchase: boolean;
  status: PurchaseQuoteStatus;
  requiredPayment: bigint;
  ticketPrice: bigint;
  discountedTicketPrice: bigint;
  availableCredits: bigint;
  resultingTicketCount: bigint;
};

export type PlayerRoundWin = {
  roundId: bigint;
  totalPrize: bigint;
  unclaimedPrize: bigint;
  placesWon: number;
  claimed: boolean;
};

export type RoundResult = {
  place: number;
  winner: Address;
  prize: bigint;
  ticketId: bigint;
  claimed: boolean;
};

export type LotteryState = {
  roundId: bigint;
  round: RoundSnapshot;
  prizePool: bigint;
  globalTicketPrice: bigint;
  globalTargetPool: bigint;
  ticketsCount: bigint;
  purchasesPaused: boolean;
  maxTicketsPerPurchase: number;
  maxRoundsPerBatchClaim: number;
  userBalance: bigint;
  userTickets: bigint;
  referralCredits: bigint;
  referrer: Address;
  hasEverPurchased: boolean;
  totalClaimable: bigint;
  winningRoundCount: bigint;
  isAdmin: boolean;
  vrfCoordinator: Address;
  vrfOwnershipLocked: boolean;
  vrfOwnershipLock: Address;
  deploymentFactory: Address;
};

type RoundWire = Omit<RoundSnapshot, "status"> & { status: number };
type QuoteWire = Omit<PurchaseQuote, "status"> & { status: number };

export function createWalletPublicClient(provider: Eip1193Provider): PublicClient {
  return createPublicClient({ chain: polygon, transport: custom(provider) }) as unknown as PublicClient;
}

export async function readLotteryState(provider: Eip1193Provider, account: Address): Promise<LotteryState> {
  const client = createWalletPublicClient(provider);
  const roundId = await client.readContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: "currentRoundId" }) as bigint;
  const [
    roundRaw,
    prizePool,
    globalTicketPrice,
    globalTargetPool,
    ticketsCount,
    purchasesPaused,
    userTickets,
    referralCredits,
    referrer,
    hasEverPurchased,
    totalClaimable,
    winningRoundCount,
    maxTickets,
    maxBatch,
    isAdmin,
    vrfCoordinator,
    ownershipLocked,
    ownershipLock,
    deploymentFactory,
    userBalance,
  ] = await Promise.all([
    client.readContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: "getCurrentRound" }),
    client.readContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: "prizePool" }),
    client.readContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: "ticketPrice" }),
    client.readContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: "targetPool" }),
    client.readContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: "ticketsCount" }),
    client.readContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: "purchasesPaused" }),
    client.readContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: "ticketsOf", args: [roundId, account] }),
    client.readContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: "referralCredits", args: [account] }),
    client.readContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: "referrerOf", args: [account] }),
    client.readContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: "hasEverPurchased", args: [account] }),
    client.readContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: "totalClaimable", args: [account] }),
    client.readContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: "winningRoundCount", args: [account] }),
    client.readContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: "MAX_TICKETS_PER_PURCHASE" }),
    client.readContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: "MAX_ROUNDS_PER_BATCH_CLAIM" }),
    client.readContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: "isAdmin", args: [account] }),
    client.readContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: "s_vrfCoordinator" }),
    client.readContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: "vrfOwnershipLocked" }),
    client.readContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: "vrfOwnershipLock" }),
    client.readContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: "deploymentFactory" }),
    client.getBalance({ address: account }),
  ]);

  const roundWire = roundRaw as unknown as RoundWire;
  return {
    roundId,
    round: { ...roundWire, status: Number(roundWire.status) as RoundStatus },
    prizePool: prizePool as bigint,
    globalTicketPrice: globalTicketPrice as bigint,
    globalTargetPool: globalTargetPool as bigint,
    ticketsCount: ticketsCount as bigint,
    purchasesPaused: purchasesPaused as boolean,
    maxTicketsPerPurchase: Number(maxTickets || MAX_TICKETS_PER_PURCHASE),
    maxRoundsPerBatchClaim: Number(maxBatch || MAX_ROUNDS_PER_BATCH_CLAIM),
    userBalance,
    userTickets: userTickets as bigint,
    referralCredits: referralCredits as bigint,
    referrer: referrer as Address,
    hasEverPurchased: hasEverPurchased as boolean,
    totalClaimable: totalClaimable as bigint,
    winningRoundCount: winningRoundCount as bigint,
    isAdmin: isAdmin as boolean,
    vrfCoordinator: vrfCoordinator as Address,
    vrfOwnershipLocked: ownershipLocked as boolean,
    vrfOwnershipLock: ownershipLock as Address,
    deploymentFactory: deploymentFactory as Address,
  };
}

export async function preparePurchaseQuote(params: {
  client: PublicClient;
  buyer: Address;
  quantity: number;
  creditsToUse: number;
  proposedReferrer?: Address;
  expectedRoundId?: bigint;
}): Promise<{ roundId: bigint; deadline: bigint; quote: PurchaseQuote }> {
  const roundId = params.expectedRoundId ?? (await params.client.readContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "currentRoundId",
  }) as bigint);
  const block = await params.client.getBlock({ blockTag: "latest" });
  const deadline = block.timestamp + PURCHASE_DEADLINE_SECONDS;
  const quoteRaw = await params.client.readContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "quotePurchase",
    args: [params.buyer, roundId, params.quantity, params.creditsToUse, params.proposedReferrer ?? ZERO_ADDRESS, deadline],
  }) as unknown as QuoteWire;
  return {
    roundId,
    deadline,
    quote: { ...quoteRaw, status: Number(quoteRaw.status) as PurchaseQuoteStatus },
  };
}

export async function simulateTicketPurchase(params: {
  client: PublicClient;
  account: Address;
  roundId: bigint;
  quantity: number;
  proposedReferrer?: Address;
  creditsToUse: number;
  deadline: bigint;
  value: bigint;
}) {
  return params.client.simulateContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    account: params.account,
    functionName: "buyTickets",
    args: [params.roundId, params.quantity, params.proposedReferrer ?? ZERO_ADDRESS, params.creditsToUse, params.deadline],
    value: params.value,
  });
}

export async function readWinningRoundsPage(client: PublicClient, account: Address, offset: number, limit: number) {
  const ids = await client.readContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getWinningRounds",
    args: [account, BigInt(offset), BigInt(limit)],
  }) as readonly bigint[];
  return Promise.all(ids.map(async (roundId) => {
    const result = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "getPlayerRoundWin",
      args: [roundId, account],
    }) as unknown as Omit<PlayerRoundWin, "roundId">;
    return { roundId, ...result };
  }));
}

export async function readRoundResults(client: PublicClient, roundId: bigint): Promise<RoundResult[]> {
  const result = await client.readContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getRoundResults",
    args: [roundId],
  }) as unknown as readonly [readonly Address[], readonly bigint[], readonly bigint[], readonly boolean[]];
  const [winners, prizes, ticketIds, claimed] = result;
  return winners.map((winner, index) => ({ place: index + 1, winner, prize: prizes[index], ticketId: ticketIds[index], claimed: claimed[index] }));
}

export async function simulateClaimPrize(client: PublicClient, account: Address, roundId: bigint) {
  const win = await client.readContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getPlayerRoundWin",
    args: [roundId, account],
  }) as unknown as Omit<PlayerRoundWin, "roundId">;
  if (win.unclaimedPrize <= 0n) throw new Error("NoPrize");
  const simulation = await client.simulateContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    account,
    functionName: "claimPrize",
    args: [roundId],
  });
  return { win: { roundId, ...win }, simulation };
}

export async function simulateBatchClaim(client: PublicClient, account: Address, roundIds: bigint[]) {
  if (roundIds.length < 1 || roundIds.length > MAX_ROUNDS_PER_BATCH_CLAIM) throw new Error("TooManyRoundsInBatch");
  return client.simulateContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    account,
    functionName: "claimPrizes",
    args: [roundIds, account],
  });
}

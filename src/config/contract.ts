import { defineChain, getAddress, parseAbi, parseEther, type Abi } from "viem";

export const POLYGON_CHAIN_ID = 137;
export const POLYGON_CHAIN_ID_HEX = "0x89";
export const POLYGON_EXPLORER = "https://polygonscan.com";
export const POLYGON_CHAIN = defineChain({
  id: POLYGON_CHAIN_ID,
  name: "Polygon",
  nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
  rpcUrls: { default: { http: ["https://polygon.api.onfinality.io/public"] } },
  blockExplorers: { default: { name: "PolygonScan", url: POLYGON_EXPLORER } },
});
export const CONTRACT_ADDRESS = getAddress(
  "0xf90169AD413429af4AE0a3B8962648d4a3289011",
);
export const DEPLOYMENT_BLOCK = 76819613n;
export const EXPECTED_TICKET_PRICE = parseEther("30");

export type PurchaseFunctionName = "buyTicket";
export type PriceFunctionName = "ticketPrice" | "TICKET_PRICE";

export const PURCHASE_FUNCTIONS = ["buyTicket"] as const;
export const CANONICAL_PRICE_METHOD: PriceFunctionName = "ticketPrice";

export const configuredPurchaseFunction = (
  "buyTicket"
) as PurchaseFunctionName;

export const CONTRACT_ABI = parseAbi([
  "function prizePool() view returns (uint256)",
  "function round() view returns (uint256)",
  "function ticketsCount() view returns (uint256)",
  "function ticketsOf(address player) view returns (uint256)",
  "function ticketPrice() view returns (uint256)",
  "function TICKET_PRICE() view returns (uint256)",
  "function open() view returns (bool)",
  "function maxTicketsPerRound() view returns (uint256)",
  "function maxTicketsPerAddress() view returns (uint256)",
  "function emergencyActive() view returns (bool)",
  "function buyTicket() payable",
  "event TicketBought(address indexed buyer, uint256 indexed round)",
  "event WinnerPicked(address indexed winner, uint256 prize, uint256 indexed round)",
  "event WinnerRequested(uint256 indexed requestId, uint256 indexed round)",
  "event RoundReset(uint256 indexed newRound)",
]) satisfies Abi;

export const HISTORY_SCAN_CONFIG = {
  deploymentBlock: DEPLOYMENT_BLOCK,
  initialBlockSpan: 9_000n,
  minBlockSpan: 500n,
  purchaseLimit: 8,
  winnerLimit: 6,
  sessionKey: "seren.history.v1",
};

export const CONTRACT_LINK = `${POLYGON_EXPLORER}/address/${CONTRACT_ADDRESS}`;

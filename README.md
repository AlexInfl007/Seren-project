# Seren Lottery Chain

Production frontend for the verified Seren Lottery Chain contract on Polygon Mainnet. The UI never invents live blockchain data: lottery state and event history appear only after an explicit wallet connection and are read through that wallet's EIP-1193 provider.

- Production repository: `AlexInfl007/Seren-project`
- Visual reference only: `AlexInfl007/serenlotterychain`
- Contract: [`0xf90169AD413429af4AE0a3B8962648d4a3289011`](https://polygonscan.com/address/0xf90169AD413429af4AE0a3B8962648d4a3289011#code)
- Network: Polygon Mainnet (`137` / `0x89`)

## Stack

Next.js 15 App Router, React 18, strict TypeScript, viem, EIP-6963 injected-wallet discovery, optional WalletConnect, Vitest, Testing Library, and ESLint.

## Setup

```bash
git clone https://github.com/AlexInfl007/Seren-project.git
cd Seren-project
npm install
copy .env.example .env.local
npm run dev
```

Checks:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | No | Enables WalletConnect; injected wallets work without it. |
| `NEXT_PUBLIC_SITE_URL` | Production | Canonical origin used by metadata, robots, and sitemap. |

Both values are public client configuration, never secrets. No private key, mnemonic, explorer API key, or public fallback RPC is used.

## Verified contract boundary

The ABI was checked against the PolygonScan verified source and ABI on 10 July 2026. The address is a direct verified contract, not a proxy. The application deliberately ships only the ABI fragments it calls or decodes.

Confirmed purchase path:

- `buyTicket()` is `payable` and accepts no arguments.
- `TICKET_PRICE()` and `ticketPrice()` are present; the verified source defines `TICKET_PRICE = 30 ether` and `ticketPrice()` returns it.
- The exact live value is read again before simulation and used as transaction `value`.
- One `buyTicket()` call appends one ticket. Multiple tickets require separate user-confirmed transactions.
- The app simulates the ABI-encoded call, asks for explicit confirmation, submits through the connected wallet, waits for a receipt, and refreshes state.

Implemented reads: `prizePool`, `round`, `ticketsCount`, `ticketsOf(address)`, `ticketPrice`, `TICKET_PRICE`, `open`, `emergencyActive`, `maxTicketsPerRound`, and `maxTicketsPerAddress`.

Implemented events: `TicketBought`, `WinnerRequested`, `WinnerPicked`, and `RoundReset`. History scanning starts at block `76819613`, uses bounded adaptive ranges, and fails visibly when a wallet RPC restricts `eth_getLogs`.

## Wallet-only architecture

There are no server-side chain reads, explorer API reads, background polling, or bundled RPC endpoints. Until a user explicitly connects a wallet on chain 137, the UI shows locked or unavailable states instead of sample metrics. Network switching uses `wallet_switchEthereumChain`; if a wallet does not know Polygon, the user must configure it in the wallet.

Wallet listeners are cleaned up. Account or chain changes clear live state, pending presentation, and session history. Contract address, chain ID, ABI, and scan settings are centralized in `src/config/contract.ts`.

## Verified facts vs published project claims

Verified from PolygonScan source/ABI: verified non-proxy contract, 30 POL constant ticket price, one ticket per `buyTicket()` call, 10% fee constant (`FEE_BPS = 1000`, denominator 10,000), VRF coordinator call and related events, current configurable ticket-limit getters, and winner/payout event shapes.

Not presented as live facts without wallet reads: current pool, round, sold tickets, per-user tickets, open/emergency status, current owner-adjustable limits, winners, activity, or balances. A 1,000,000 POL target is a published project claim but is not encoded as a target constant in the verified contract and is therefore not displayed as an on-chain fact or progress denominator.

## Languages and accessibility

English, Russian, Spanish, Simplified Chinese, Hindi, Arabic, French, and Portuguese are included. The interface supports keyboard navigation, visible focus states, semantic controls, reduced motion, responsive layouts, and RTL presentation for Arabic.

## Security assumptions

- No automatic transactions, raw `eth_sendTransaction`, fallback purchase method, or arbitrary calldata.
- Chain ID, contract address, verified ABI fragment, live price, simulation, revert, pending state, and receipt are checked.
- Duplicate submission is disabled while a transaction is active.
- Security headers include clickjacking, MIME-sniffing, referrer, permissions, and opener protections while retaining wallet popup compatibility.
- Frontend validation supplements rather than replaces contract enforcement.
- Participation can result in loss and may be restricted by local law; the site provides no financial or legal advice.

## Vercel deployment

Import `AlexInfl007/Seren-project`, use the default Next.js settings, set `NEXT_PUBLIC_SITE_URL` to the final HTTPS origin, and optionally set a WalletConnect Cloud project ID whose allowlist contains that origin. Deploy only after all four checks above pass.

## Known limitations

Wallet RPCs can reject large log queries or omit archive access, so event history may be unavailable even when direct reads work. WalletConnect is disabled when no project ID is configured. The UI does not claim that a draw starts at a fixed time or pool target because the verified contract exposes no countdown or target-pool trigger.

See [`IMPLEMENTATION_REPORT.md`](./IMPLEMENTATION_REPORT.md) for the audit and delivery record.

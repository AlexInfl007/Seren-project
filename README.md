# Seren Lottery Chain frontend

Production frontend for the verified Seren Lottery Chain contract on Polygon Mainnet. The application uses Next.js 15, React 18, strict TypeScript, viem, EIP-6963 wallet discovery, optional WalletConnect, Vitest, and ESLint.

## Mainnet deployment

- Network: Polygon Mainnet (`chainId 137`, hex `0x89`)
- Lottery contract: [`0x0C59B1c64925425AB307Cc19A92AD176E0709360`](https://polygonscan.com/address/0x0C59B1c64925425AB307Cc19A92AD176E0709360#code)
- Deployment block: `90588221`
- Deployment transaction: [`0xfd212926d1cc1923b0f5f747a6c3771a109cc3b6f29572d28eb63f390636f373`](https://polygonscan.com/tx/0xfd212926d1cc1923b0f5f747a6c3771a109cc3b6f29572d28eb63f390636f373)
- Chainlink VRF v2.5 coordinator: [`0xec0Ed46f36576541C75739E915ADbCb3DE24bD77`](https://polygonscan.com/address/0xec0Ed46f36576541C75739E915ADbCb3DE24bD77)

The complete supplied `SerenLotteryChainFinal` ABI is stored as a typed constant in `src/config/contractAbi.ts`. Addresses, chain metadata, enum mappings, links, limits, and history scan settings are centralized in `src/config/contract.ts`.

## User flows

### Purchase

The public UI uses `buyTickets(expectedRoundId, quantity, proposedReferrer, creditsToUse, deadline)` for every purchase, including one ticket. Quantity is constrained to 1–100.

1. Confirm the connected account and Polygon Mainnet.
2. Read `currentRoundId()` and the latest Polygon block timestamp.
3. Create a ten-minute deadline.
4. Call `quotePurchase(...)` and require status `OK`.
5. Show the round, quantity, referral discount, exact payment, referrer, and contract in a confirmation dialog.
6. Immediately re-read the round and quote.
7. Simulate the exact transaction.
8. Send `msg.value = quote.requiredPayment` through the connected wallet.
9. Wait for a successful receipt before showing success and refreshing data.

Changing the account, network, quantity, credits, or referrer invalidates the prepared quote. A pending transaction disables duplicate submission.

### Referrals

An optional referrer is shown only before the player's first purchase and before a referrer is fixed. Addresses are validated with viem, self-referral is rejected, and the contract quote validates prior participation. One referral credit discounts one ticket to half the current contract price. Credits are never shown as earned before transaction confirmation.

### Results and claims

Finalized results are read with `getRoundResults(roundId)` and display all 10 places, exact prize amounts, winning ticket IDs, winner addresses, claimed state, and PolygonScan links. The player dashboard uses `winningRoundCount`, paginated `getWinningRounds`, `getPlayerRoundWin`, and `totalClaimable`.

Single-round claims use `claimPrize(roundId)`. Visible multi-round claims use `claimPrizes(roundIds, connectedAccount)` and enforce the 50-round batch limit. Every claim is simulated, confirmed by the user, and considered successful only after a successful receipt.

### Round and transparency reads

The current round uses `currentRoundId`, `getCurrentRound`, `ticketPrice`, `targetPool`, `prizePool`, `ticketsCount`, `purchasesPaused`, and `ticketsOf(roundId, player)`. The UI preserves bigint values through formatting. The target pool is explicitly presented as an informational progress goal, never as an automatic draw trigger.

Transparency reads include the coordinator, permanent ownership lock state/address, request ID, VRF request/acceptance times, and the round's VRF configuration snapshot.

### Admin route

`/admin` renders controls only when `isAdmin(connectedAccount)` returns true on-chain. It supports simulated and separately confirmed calls for `startRound`, `updateTargetPool`, `setPurchasesPaused`, zero-argument `requestDraw`, and `finalizeRound`. Ownership, coordinator, recovery, fee-withdrawal, VRF reconfiguration, and admin-transfer controls are intentionally absent.

## Event history

History scans begin at block `90588221`, use bounded adaptive chunks, support cancellation and manual refresh, and cache under a contract-specific `seren.history.v2` session key. Events decoded from the complete ABI are:

`RoundStarted`, `TicketPurchased`, `VrfRequestSent`, `RandomnessAccepted`, `WinnerSelected`, `RoundFinalized`, `PrizeClaimed`, `BatchPrizesClaimed`, `ReferralRegistered`, `ReferralCreditGranted`, `ReferralCreditsUsed`, `TargetPoolUpdated`, and `PurchasesPauseChanged`.

Direct view functions remain the primary source for round and winner data.

## Wallet-only RPC model

All blockchain reads, simulations, writes, receipts, and logs use the connected EIP-1193 wallet provider. The project has no public fallback RPC, server-side blockchain reads, PolygonScan API key, background RPC, private key, seed phrase, or automatic transaction mechanism. Development and tests must never perform a mainnet write; write tests use mocks.

## Local development and verification

```bash
npm install
npm run dev
npm run typecheck
npm run lint
npm run test
npm run build
```

Use an injected wallet or configure WalletConnect, connect to Polygon Mainnet, and test reads against the verified contract. Test write UX with mocks or a controlled non-mainnet environment; do not submit development transactions to the deployed contract.

## Environment variables

Copy `.env.example` to `.env.local`:

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Only these public frontend variables are supported. Do not add RPC secrets or private keys.

## Vercel

Import the repository into Vercel, set `NEXT_PUBLIC_SITE_URL` to the canonical HTTPS URL, optionally set `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`, and use the standard Next.js build command. Preview deployments should be checked on desktop and mobile before promotion. Production deployment is a manual project-owner action.

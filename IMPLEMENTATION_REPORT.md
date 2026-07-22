# Final mainnet contract integration report

> The premium UI, marketing, localization and SEO layer is documented in `UI_MARKETING_SEO_REPORT.md`. This report remains the contract-integration source of truth.

## Migration source of truth

The frontend now targets the verified Polygon Mainnet lottery at `0x0C59B1c64925425AB307Cc19A92AD176E0709360`, deployed in block `90588221` by transaction `0xfd212926d1cc1923b0f5f747a6c3771a109cc3b6f29572d28eb63f390636f373`. The supplied 150-entry ABI is preserved in full as a viem-compatible typed constant.

## Problems found during the audit

The previous integration was built around a different one-ticket contract model. It had a different deployment address and block, a handwritten partial ABI, a zero-argument single-ticket purchase, legacy round/availability getters, two legacy ticket-limit getters, four obsolete activity events, locally inferred ticket-price safety checks, and copy that described one winner and one transaction per ticket. The dashboard did not support quotes, referral credits, multi-ticket purchases, 10 result places, paginated winning rounds, claims, VRF lifecycle statuses, or on-chain admin authorization.

## Implemented architecture

- Centralized checksummed deployment metadata, enum mappings, limits, explorer links, and bounded history settings.
- Complete ABI integration without invented signatures.
- Wallet-only Polygon reads with locked disconnected and wrong-network states.
- Round status mapper for `NONE`, `OPEN`, `RANDOMNESS_REQUESTED`, `RANDOMNESS_READY`, and `FINALIZED`.
- Bigint-safe round values, informational target progress, timestamps, request ID, and VRF snapshot.
- Purchase selector for 1–100 tickets, quick quantities, referral credits, optional first-purchase referrer, exact quote, repeated quote, simulation, wallet write, receipt validation, and stale-context rejection.
- Personal account with POL balance, active-round tickets, referral state, total claimable, paginated winning rounds, places won, total/unclaimed prize, single claim, and capped batch claim.
- Exact 10-place results from `getRoundResults`, including duplicate winner addresses when one wallet owns multiple winning tickets.
- Adaptive, cancellable new-event history beginning at the final deployment block and cached under a contract-specific v2 key.
- Public transparency section with verified contract and VRF information.
- On-chain-gated `/admin` route with only the approved lifecycle operations.
- Updated English, Russian, Spanish, Simplified Chinese, Hindi, Arabic (RTL), French, and Portuguese UI copy.
- Responsive controls, visible focus, reduced-motion support, loading/empty/error states, and no fabricated disconnected data.

## Safety properties

The exact transaction payment comes only from the most recent `quotePurchase.requiredPayment`. Writes are never sent after a failed simulation, duplicate submission is disabled while pending, account/network context is re-read before writes, claims default to the connected account, receipt success is mandatory, and decoded custom errors are mapped to user-facing messages with optional technical details.

No private key, seed phrase, fallback RPC, server-side chain read, PolygonScan API key, raw transaction construction, automatic transaction, unrestricted public admin control, ownership operation, coordinator operation, recovery operation, fee withdrawal, or mainnet write test was added.

## Verification

Run the required commands and the source audits before merging:

```bash
npm install
npm run typecheck
npm run lint
npm run test
npm run build
```

Also run repository-wide safety searches for the retired deployment address, obsolete event names, removed retry controls, and removed legacy getter names; all searches must return no matches in production code or documentation.

Browser verification must cover desktop and mobile, disconnected and wrong-network states, wallet selection, layout overflow, console/hydration errors, and disabled writes without a valid quote/simulation.

## Known constraints

The wallet's RPC controls log availability and rate limits. WalletConnect is present only when its public project ID is configured. No Chainlink subscription balance is queried. A production deployment is intentionally not automatic and requires project-owner approval.

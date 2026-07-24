# Frontend integration rules

- Use viem for contract reads, simulations, writes, receipts, and event decoding.
- Treat `src/config/contractAbi.ts` as the complete contract ABI source of truth; do not invent signatures.
- Use only the configured final Polygon Mainnet lottery address for public lottery interactions.
- Never perform a Polygon Mainnet write during development or tests; mock all write flows.
- Keep wallet-only RPC reads and do not add private keys, fallback RPC endpoints, or server-side blockchain reads.
- Before completion run `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.
- Keep public marketing copy server-rendered on all eight locale routes (`en`, `ru`, `es`, `zh`, `hi`, `ar`, `fr`, `pt`) and preserve Arabic RTL behavior.
- Preview and development environments must remain `noindex`; canonical and hreflang URLs must use `NEXT_PUBLIC_SITE_URL` only in production.
- Do not deploy to production without explicit project-owner approval.

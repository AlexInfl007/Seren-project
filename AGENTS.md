# Frontend integration rules

- Use viem for contract reads, simulations, writes, receipts, and event decoding.
- Treat `src/config/contractAbi.ts` as the complete contract ABI source of truth; do not invent signatures.
- Use only the configured final Polygon Mainnet lottery address for public lottery interactions.
- Never perform a Polygon Mainnet write during development or tests; mock all write flows.
- Keep wallet-only RPC reads and do not add private keys, fallback RPC endpoints, or server-side blockchain reads.
- Before completion run `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.

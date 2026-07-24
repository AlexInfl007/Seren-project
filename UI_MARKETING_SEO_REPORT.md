# UI, marketing and SEO implementation report

## Baseline audit

The original Vercel Preview and local application were inspected with browser automation at 1920×1080, 1440×900, 1280×800, 1024×768, 768×1024, 430×932, 390×844 and 360×800. Baseline captures are stored in `artifacts/ui-audit/before-preview/` and `artifacts/ui-audit/before-local/`.

The Preview was functional and had no measured horizontal document overflow, but it presented a technical dashboard rather than an international product. The dominant first viewport was an unframed banner; the only H1 was visually hidden; wallet placeholders appeared before the product explanation; typography used Arial; navigation, Web3 actions, marketing and footer lived in one client component; FAQ contained four entries; language selection relied on localStorage instead of indexable locale URLs; Arabic did not control root HTML direction; and metadata exposed one generic route. Preview robots allowed indexing.

## Visual and UX changes

- Added a centralized dark-purple and warm-gold design system with consistent borders, glow, radii, spacing, type scale and a 1240px container.
- Reframed the existing `Banner.png` as a responsive hero background. The source banner and logo content were not modified.
- Added a visible localized H1, concise value proposition, clear primary/secondary CTAs and a risk statement.
- Added a sticky, compact header with responsive navigation, locale routing, wallet popover, outside-click/Escape closing and mobile scroll lock.
- Standardized current-round and purchase cards into a 2:1 desktop grid with equal height and one-column mobile layout.
- Improved disconnected, wrong-network, empty, error, pending and disabled states without inventing blockchain values.
- Reworked results and activity into responsive mobile cards; long addresses and hashes wrap or truncate safely.
- Added an accessible purchase dialog with Escape, focus trap and focus return.
- Added visible focus, 44px minimum controls and `prefers-reduced-motion` support.

## Architecture

The former `src/components/SerenApp.tsx` was removed. Responsibilities are divided into:

- `src/components/layout/`: brand, container, section, header and footer.
- `src/components/marketing/`: hero, trust bar, process, prizes, referral, account explanation, transparency, FAQ and final CTA.
- `src/components/lottery/LotteryDashboard.tsx`: interactive lottery state and presentation.
- `src/components/providers/WalletProvider.tsx`: one shared EIP-6963/WalletConnect session.
- `src/i18n/siteContent.ts`: complete marketing content for every locale.
- `src/lib/seo.ts`: canonical origin and language alternate helpers.

Contract business logic remains in the existing hooks and `src/lib`. The ABI, address, chain ID, quote/simulation safety checks, purchase/claim methods, event history and wallet-only RPC model were not replaced or duplicated.

## Marketing structure

The page order is: Header → Hero → Trust bar → Current round and purchase → How it works → Ten-position prize structure → Referral program → Personal area and wallet dashboard → Winners and recent activity → Contract/Chainlink transparency → 13-question FAQ → Final CTA → Footer.

Copy avoids profit promises. It explains that the target pool is informational, reaching it does not automatically start a draw, fees apply to ticket revenue, Chainlink VRF v2.5 supplies randomness and a winner must claim a prize.

## Localization

Locale routes are `/en`, `/ru`, `/es`, `/zh`, `/hi`, `/ar`, `/fr` and `/pt`; `/` redirects permanently to `/en`. Every route has a complete marketing object rather than a runtime English fallback. Language switching changes the route. Arabic sets `lang="ar"` and `dir="rtl"` on the root HTML element and changes layout direction without mirroring the supplied banner.

## SEO

- Per-locale server-rendered title and description.
- Production-only canonical URLs, all locale hreflang links and `x-default`.
- Per-locale Open Graph and Twitter large-card metadata.
- Generated 1200×630 `public/og-card.png` social artwork.
- JSON-LD `WebSite`, `WebApplication` and localized `FAQPage` graph.
- Sitemap entries for all eight locales with alternates.
- Preview/Development `robots.txt` disallows crawling; Production allows it.
- Preview omits canonical links, preventing a random deployment URL from becoming canonical.
- `/admin` is explicitly `noindex`.

`NEXT_PUBLIC_SITE_URL` must be the canonical HTTPS production origin.

## Accessibility and performance

Semantic page landmarks, native details/summary FAQ controls, labeled inputs, keyboard-operable controls, a transaction `aria-live` region and focus-managed dialog are used. The hero artwork is decorative because its message exists as visible text.

Marketing copy is server-rendered and available without a wallet. `next/image` handles the LCP banner; `next/font` self-hosts Manrope and Cormorant Garamond; WalletConnect remains dynamically imported; no public RPC, background polling or client marketing fetch was added. Stable card structure produced measured CLS 0.

## Web3 regression scope

Preserved and rechecked:

- Polygon Mainnet chain ID 137.
- Contract `0x0C59B1c64925425AB307Cc19A92AD176E0709360` and supplied ABI.
- EIP-6963 injected wallets and optional WalletConnect.
- Wallet-only RPC gating and no public fallback RPC.
- Exact `quotePurchase`, re-quote, `simulateContract`, `buyTickets` and receipt flow.
- First-purchase referrer rules and contract-managed credits.
- Single and batch prize claims.
- Ten-place results, winner IDs, claim state, activity and VRF transparency.
- Admin on-chain authorization and existing write confirmations.

No Polygon Mainnet write, ticket purchase, draw request, finalization or fee withdrawal was performed. Automated write checks use mocks only.

## Automated checks

Final clean results:

- `npm install`: dependencies up to date.
- `npm run typecheck`: passed.
- `npm run lint`: passed with no warnings.
- `npm run test`: 9 files and 28 tests passed.
- `npm run build`: passed in Production SEO mode; all eight locale pages were statically generated.

Added coverage includes complete locale content, 13 FAQ entries per locale, one visible H1, primary CTA, final contract link, Arabic RTL, header menu/Escape behavior, a mocked connected wrong-network wallet, sitemap alternates, Preview noindex and Production robots behavior.

## Lighthouse

Preview-mode production build baseline:

| Category | Score |
|---|---:|
| Performance | 90 |
| Accessibility | 96 |
| Best Practices | 100 |
| SEO | 58 |

Core metrics: FCP 1.2s, LCP 3.1s, TBT 210ms, CLS 0, Speed Index 1.3s. Preview SEO is intentionally reduced by `noindex` and robots disallow. The one accessibility failure was footer copyright contrast and has been corrected. The final Production-mode measurement is appended after its environment-specific build. Raw reports are under `artifacts/lighthouse/`.

Final Production-mode build:

| Category | Score |
|---|---:|
| Performance | 95 |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 100 |

Final metrics: FCP 1.6s, LCP 2.6s, TBT 150ms, CLS 0, Speed Index 1.6s. `htmlLimitedBots` keeps generated locale metadata in the document head for crawlers and link unfurlers. Raw final report: `artifacts/lighthouse/production-seo-en-final.json`.

## Browser screenshots

English after-captures:

- `artifacts/ui-audit/after/en/1920x1080.png`
- `artifacts/ui-audit/after/en/1440x900.png`
- `artifacts/ui-audit/after/en/1280x800.png`
- `artifacts/ui-audit/after/en/1024x768.png`
- `artifacts/ui-audit/after/en/768x1024.png`
- `artifacts/ui-audit/after/en/430x932.png`
- `artifacts/ui-audit/after/en/390x844.png`
- `artifacts/ui-audit/after/en/360x800.png`

Locale verification:

- `artifacts/ui-audit/after/locales/ru-1440x900.png`
- `artifacts/ui-audit/after/locales/ru-390x844.png`
- `artifacts/ui-audit/after/locales/ar-390x844.png`

Measurements confirmed no horizontal overflow at every requested viewport, one visible H1, 13 FAQ entries and no new console errors after a production reload.

## Known limitations

- A real injected-wallet signature, WalletConnect QR handshake and Mainnet write were intentionally not performed. Disconnected and locale states were browser-tested; connected, wrong-network and write states use provider/contract mocks.
- Live round/history availability depends on the connected wallet provider’s Polygon RPC limits by design.
- `Banner.png` contains its own lettering, which may remain visible behind localized copy after responsive cropping.
- The production domain was not supplied. `NEXT_PUBLIC_SITE_URL` is mandatory before promotion.

## Vercel variables

Required in Production:

```env
NEXT_PUBLIC_SITE_URL=https://your-canonical-domain.example
```

Optional, but required to expose WalletConnect:

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

Do not add private keys, seed phrases or secret RPC endpoints. Vercel supplies `VERCEL_ENV`.

## Preview verification

1. Confirm `/` redirects to `/en`.
2. Open every locale; confirm Arabic is RTL.
3. Inspect page source for visible marketing copy and 13 FAQ questions.
4. Confirm Preview emits `noindex` and `/robots.txt` disallows `/`.
5. Check 1440×900, 1024×768, 390×844 and 360×800 for overflow and header/menu behavior.
6. Open and close navigation and wallet popover with pointer, keyboard and Escape.
7. Connect a test wallet without submitting a transaction; verify wrong-network switching and live Polygon reads.
8. Use mocks only for purchase, rejection, pending, reverted, success and claim write states.
9. Confirm every explorer link points to the final Polygon contract.
10. Promote only after setting the canonical domain and receiving project-owner approval.

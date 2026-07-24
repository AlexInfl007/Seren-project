# Отчёт по Seren Lottery Chain

Дата итоговой проверки: 24 июля 2026 года.

## 1. Краткое описание результата

Публичная часть сайта перестроена вокруг текущего on-chain раунда: после hero и панели доверия пользователь сразу видит SerenRoundCore, данные раунда, покупку, lifecycle, личное участие, финальные результаты, активность, Proof Explorer и Security Center. Интерфейс использует спокойную визуальную метафору блокчейн-церемонии, а не казино. Данные контракта не подменяются примерами: без wallet provider показываются честные disconnected/empty-состояния.

## 2. Архитектурный обзор

- Next.js App Router сохраняет server-rendered marketing-контент на маршрутах `en`, `ru`, `es`, `zh`, `hi`, `ar`, `fr`, `pt`.
- `LotteryDashboard` остаётся клиентским координатором wallet-only данных и безопасных транзакционных потоков.
- Все contract reads, simulation, writes, receipts и event decoding выполняются через `viem`.
- `src/config/contractAbi.ts` остаётся единственным источником ABI.
- Публичные lottery-вызовы используют Polygon Mainnet 137 и контракт `0x0C59B1c64925425AB307Cc19A92AD176E0709360`.
- Визуальные состояния вынесены в чистые функции `roundExperience.ts`; локализованный новый контент — в `ceremonyContent.ts`.

## 3. Созданные компоненты

- `SerenRoundCore` — центральный визуальный объект, синхронизированный с состоянием раунда.
- `RoundLifecycle` — пять этапов раунда с contract-derived статусами.
- `RoundFinalizationReveal` — доступное раскрытие десяти on-chain позиций.
- `ProofExplorer` — восемь доказательных стадий на основе реальных событий.
- `SecurityCenter` — сеть, контракт, VRF, аудит, admin model и предупреждения.
- Добавлены unit/component-тесты для lifecycle, reveal, proof, локализации и state/share-логики.

## 4. Изменённые файлы

Основные изменения:

- `src/app/[locale]/page.tsx`
- `src/app/premium.css`
- `src/components/lottery/LotteryDashboard.tsx`
- `src/components/lottery/PoolProgressIndicator.tsx`
- `src/components/marketing/HeroSection.tsx`
- `src/components/marketing/TrustBar.tsx`
- `src/components/experience/SerenOracle.tsx`
- `src/components/AdminApp.tsx`
- `src/i18n/siteContent.ts`
- `src/i18n/experienceContent.ts`
- `src/lib/contractReads.ts`
- `public/og-card.png`

Созданы файлы `SerenRoundCore`, `RoundLifecycle`, `RoundFinalizationReveal`, `ProofExplorer`, `SecurityCenter`, `ceremonyContent`, `roundExperience` и связанные тесты.

## 5. Mock/demo-механизмы

Новые mock/demo blockchain-данные не добавлялись. Pool, цена, количество билетов, результаты, claims, события, request ID и timestamps показываются только после успешного wallet RPC чтения. Fake live feed, hardcoded pool, sample transactions, sample winners и sample addresses отсутствуют. Тестовые моки ограничены тестовой средой и не входят в production UI.

## 6. Источники данных блоков

- SerenRoundCore: `LotteryState`, полученный через wallet provider, плюс текущий network/wallet status.
- Current round и PoolProgressIndicator: контрактные round snapshot/read methods; последний блок и timestamp берутся из latest Polygon block.
- Purchase: `quotePurchase` → `simulateContract` → `writeContract` → receipt → обновление reads.
- Lifecycle: round existence, paused/open status, VRF request/fulfillment/finalization и наличие результатов.
- Personal participation: ticket ownership/counts, referral state, credits, claimable results и подтверждённые `TicketPurchased` events.
- Winners/reveal: финальные результаты контракта в исходном порядке позиций.
- Activity и Proof Explorer: декодированные ABI-события с deployment block; evidence-ссылка создаётся только при наличии реальной транзакции.
- Security Center: фиксированные проверяемые параметры интеграции и честное отсутствие заявления о независимом аудите.
- Oracle: только локальные Web Crypto данные; контракт, RPC, подпись и транзакция не используются.

## 7. Contract states и визуальные состояния

- `DISCONNECTED` — ядро просит подключить кошелёк, реальные суммы скрыты.
- `LOADING` — идёт wallet RPC синхронизация.
- `WRONG_NETWORK` — предлагается Polygon Mainnet.
- `RPC_ERROR` — данные не заменяются приблизительными значениями.
- `NONE` — активный раунд отсутствует.
- `OPEN` — продажи доступны; интенсивность ядра связана с bigint pool progress.
- `REQUESTED` — продажи закрыты, VRF request зафиксирован.
- `READY` — randomness принята, ожидается финализация.
- `FINALIZED` — доступны результаты и соответствующие claim-действия.

## 8. SerenRoundCore

Ядро построено CSS-формами, орбитами и glow-слоями без тяжёлого WebGL. Текст, status, round ID, ticket count, pool и progress появляются только из реального state. Интенсивность рассчитывается из bigint basis points, capped для визуализации; превышение цели показывается отдельно. Успешный receipt запускает короткий декоративный pulse, но не изменяет данные.

## 9. FloatingPolCoins

Декоративные POL-монеты работают через один passive scroll listener и один `requestAnimationFrame`, не обновляют React state на скролле и имеют cleanup. Они скрыты от accessibility tree, облегчаются на слабых устройствах и отключают движение при `prefers-reduced-motion`.

## 10. Seren Oracle

Oracle создаёт развлекательное предсказание локально: без адреса — через `crypto.getRandomValues`, с адресом — детерминированно по нормализованному адресу и UTC-дате через SHA-256. Доступны 50 сочетаний на каждой локали, Web Share/copy, focus trap, Escape, возврат фокуса и внутренний мобильный scroll. Oracle не вызывает wallet, RPC, подпись или транзакцию.

## 11. Финализация

Reveal рендерится только при `FINALIZED` и наличии настоящих результатов. DOM сохраняет позиции 1–10 для screen reader, а CSS-последовательность визуально раскрывает 10–2 и затем первое место. Кнопка пропуска сразу открывает все позиции. Claim показывается только владельцу соответствующего невыведенного приза и использует ранее существовавший безопасный claim flow.

## 12. Proof Explorer

Восемь стадий сопоставлены с ABI-событиями: покупка, закрытие/request, VRF request, callback, финализация, winning ticket ID, начисление и claim. Для найденного события выводятся block/tx evidence и PolygonScan-ссылка; без события отображается «ожидает подтверждения», а не выдуманный hash.

## 13. Сохранённые функции

Сохранены wallet connect/disconnect/switch network, точный `quotePurchase`, referral validation/locking, credits, simulation, write, receipt ожидание, post-receipt refresh, ticket ownership, winners, одиночный и batch claim, activity decoding, admin area, language switching, canonical/hreflang и preview/development noindex.

ABI, contract address, Chainlink VRF правила и контрактная механика не изменялись. Записей в Polygon Mainnet во время разработки и проверки не выполнялось.

## 14. Lint

`npm run lint` — успешно, ошибок и предупреждений нет.

## 15. Typecheck

`npm run typecheck` — успешно.

## 16. Tests

`npm run test` — успешно: 19 test files, 54 tests.

Покрыты bigint calculations, состояния ядра/lifecycle, reveal/skip/claim visibility, Proof Explorer evidence, Oracle determinism/accessibility, локализация, motion cleanup и отсутствие демонстрационных blockchain-значений.

## 17. Build

Production build с `VERCEL_ENV=production` и `NEXT_PUBLIC_SITE_URL=https://serenlotterychain.com` — успешно. Сгенерированы 15 страниц; все восемь locale-маршрутов созданы как SSG. Production deployment не выполнялся.

## 18. Проверенные разрешения

В браузере проверены ширины 320, 360, 375, 390, 430, 768, 1024, 1440 и 1920 px. Горизонтального переполнения документа нет. На узких экранах lifecycle прокручивается внутри своего контейнера; modal Oracle остаётся в viewport с внутренним scroll. Видимые интерактивные цели имеют минимум 44×44 px.

## 19. Проверенные состояния кошелька

В реальном локальном браузере проверены disconnected, empty activity, empty winners, Oracle, language routes и RTL. Connected, wrong network, loading, RPC error, no/open/requested/ready/finalized, rejected/pending/success purchase и claim ветки проверены компонентными/unit-тестами и кодовыми инвариантами без mainnet write. Реальная Polygon Mainnet транзакция намеренно не выполнялась.

## 20. Известные ограничения

- Без подключённого wallet provider приложение намеренно не показывает live contract values.
- Полный end-to-end write тест требует контролируемой тестовой сети или явного разрешения владельца; mainnet write запрещён для разработки.
- `npm install` сообщает о трёх high-severity уязвимостях в dependency tree. `audit fix --force` не применялся, чтобы не вносить несовместимые обновления.
- Security Center честно сообщает, что независимый аудит не заявлен.

## 21. Environment variables

- `NEXT_PUBLIC_SITE_URL` — production origin для canonical и hreflang.
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` — public WalletConnect project ID, если WalletConnect включён.
- `VERCEL_ENV` — используется для production/preview metadata policy.

Private key, seed phrase, fallback RPC URL и server-side blockchain credentials не требуются и не должны добавляться.

## 22. Локальный запуск

```powershell
npm install
npm run dev
```

Проверки:

```powershell
npm run typecheck
npm run lint
npm run test
$env:VERCEL_ENV='production'
$env:NEXT_PUBLIC_SITE_URL='https://serenlotterychain.com'
npm run build
```

## 23. Рекомендации следующего этапа

1. Провести отдельный владелец-одобренный E2E прогон подключённого кошелька в безопасной тестовой среде с моками write-операций.
2. Разобрать три dependency alerts и обновлять зависимости отдельным PR с regression-проверками.
3. После юридической/контрактной проверки текстов провести production smoke test и только затем запрашивать явное разрешение на deployment.
4. Добавить независимый аудит контракта; после публикации отчёта Security Center сможет ссылаться на проверяемый артефакт.

## Браузерная проверка

Все восемь локалей загрузили hero, SerenRoundCore, Proof Explorer и Security Center; арабская страница имеет `dir="rtl"`. Проверены Oracle CTA, focus, Escape, mobile modal, responsive hero/core и отсутствие console errors, warnings, hydration issues, failed assets и CORS-ошибок от новых ресурсов.

Новая social/OG-карта создана встроенным генератором изображений и сохранена в `public/og-card.png` (1200×630). В ней нет цен, winners или других выдуманных on-chain данных.

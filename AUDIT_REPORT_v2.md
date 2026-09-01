# GreyAuction — Source of Truth (Audit + Roadmap + Pending Work)

> **Version:** consolidate (combined audit + performance review + improvement suggestions)
> **Branch:** `master` (feature/authjs-migration fully merged; branch deleted) · **Commits:** 115+ · **Release:** v1.0.0 · **Backend tests:** 252/252 unit + 5/5 E2E + 8/8 integration (Jest) · **Frontend tests:** 77/77 (Vitest) · **Frontend build:** green · **Lint:** eslint 0 errors (gate green) · **npm audit:** 0 (backend) / 0 (frontend) · **NestJS:** 11.2.3 · **App live:** :3000 (frontend) · :3001 (API/Swagger /api/docs, non-prod)
> **Security hardening (2026-08-30):** see section 12 — the external production-readiness audit's critical auth/money findings were remediated (fcd6cff, 56d52cf).
> **How to use this file:** it is the single source of truth. Work items are tracked as `[ ]` (pending), `[x]` (done), `[!]` (blocked). Update statuses here as work proceeds.


---

## SESSION HANDOFF — START HERE (2026-09-01, workstream 2026-09-01)

**State:** master, pushed. This workstream delivered the U-list follow-ups that were
key-free: Phase E2 admin FX editor, the chatbot upgrade, LHCI in CI, the a11y sweep
fixes, the lint-debt cleanup, and the production keys/access shopping list
(docs/KEYS_AND_ACCESS.md — user has supplied domain greyauction.com, Coolify at
coolify.gozmar.com, and Cloudflare R2 account grey-auction; the doc is now a detailed
acquisition runbook — per-provider click-paths, exact env var names, webhook URLs,
DNS records; see §14 for the priority order).

### Done this workstream (commits on master)

- Phase E2 — admin exchange-rates editor page (list, inline edit via PATCH, refresh
  from feed via POST /exchange-rates/refresh, en/fr/nl i18n, Vitest) — 4d6df2c.
- Chatbot upgrade — i18n, responsive (no 360px overflow), dialog a11y, not-configured
  state, tests; chatbot_assistant enabled in seed — 4e83425.
- Lighthouse/LHCI wired into CI (.github/workflows/ci.yml new lighthouse job; config
  repointed to static /en/about-us + /en/faq; README) — 6f097e0.
- docs/KEYS_AND_ACCESS.md — full U2–U6 keys/access shopping list — 2260e7d.
- a11y sweep — axe /en homepage violation fixed (aria-labels on auction-card
  wishlist/share buttons); axe 12/12 + responsive 25/25 green — a91e989.
- Lint-debt cleanup — 219 errors/80 warnings → 0 (frontend lint gate green again;
  incl. typed server-data boundary in lib/server/data.ts) — 1da44f3.
- Backend re-verified: 252/252 unit, 5/5 E2E, 8/8 money-path integration (itest DB
  re-provisioned), build green.

### Verification baseline (this workstream, 2026-09-01)

| Check | Result |
|---|---|
| frontend Vitest | **77/77** (67 + 6 FX + 4 chatbot) |
| frontend tsc --noEmit | clean |
| frontend prod build | green |
| frontend eslint --max-warnings=0 | green after lint cleanup |
| axe (Playwright) | 12/12 routes, 0 violations |
| responsive no-overflow | 25/25 |
| backend unit/service | 252/252 |
| backend HTTP E2E | 5/5 |
| backend money-path integration | 8/8 |
| live smoke | /api/health 200 · /api/products 200 · /en /fr /nl 200 |

### Next up (unchanged — needs user input)

- U2 secrets, U3 DNS records for greyauction.com, U4 R2 key pair, U5 business
  rules, U6 Coolify access/token — the full detailed acquisition runbook
  (click-paths, exact values, env var names, webhook URLs, DNS table) is
  docs/KEYS_AND_ACCESS.md; start from its §14 priority order.
- Optional: U7 Nest 12 once @nestjs/throttler supports it; web-push VAPID (we can
  generate); Lighthouse budget run will now execute automatically in CI.

### Command cheat sheet (from docs/OPERATIONS.md) — unchanged

---

## SESSION HANDOFF — previous (2026-08-31, end of day)

**State when this file was written:** everything below is committed and pushed;
working tree clean; only branch is `master` (stale fully-merged
`feature/authjs-migration` deleted; history preserved via merge 1dcded3 / tag v1.0.0).

### Verification baseline (all green, verified today)

| Check | Result |
|---|---|
| backend npm audit | **0 vulnerabilities** |
| frontend npm audit | **0 vulnerabilities** (next-auth 5.0.0-beta.32) |
| backend tsc --noEmit | clean |
| frontend tsc --noEmit | clean |
| backend unit/service tests | 252/252 (38 suites) |
| backend HTTP-layer E2E | 5/5 |
| backend money-path integration | 8/8 (Postgres greyauction_itest) |
| frontend Vitest | 67/67 · prod build green |
| backend nest build (CLI 11) | green |
| live boot smoke | /api/health 200 · /api/products 200 · /api/docs-json 182 paths/82 schemas |
| storage smoke (vs live MinIO) | 24/24 |
| NestJS version | 11.2.3 line (config 4, jwt 11, passport 11, swagger 11.4.7, typeorm 11, throttler 6.5, schedule 6.1.3) |

### Completed in this workstream (commits on master)

- Phases A–G of the remediation plan (transactions/ledger, baseline migration,
  auth, orders, live FX cron, observability, CI) — §13, commits ef7ce0b…b9801b8.
- Storage & media pipeline: MinIO/S3 driver abstraction, sharp WebP optimization,
  variant cleanup on delete, silent Cloudflare-R2 switch (env-only) — §14, f64e948.
- Money-path integration suite + storage DI wiring fix + DB_SYNCHRONIZE opt-out —
  §15, 7b26c70.
- Dependency hygiene (frontend 0 vulns) — §16, eae0c0e.
- API contract enrichment: 19 typed response DTOs + generated frontend/lib/api-types.ts —
  §17, f381c14.
- Ops docs (docs/OPERATIONS.md) + compose env_file fix — §18, cae6e12.
- **U1 NestJS 10 → 11** (0 vulnerabilities, all suites green) — §19, 4a1a461.

### Next up (needs user input — the U-list)

- [ ] **U2 secrets**: Brevo API key, Termii/Twilio, Paystack/Flutterwave/OPay keys,
  Google OAuth Client ID, fluentax CBN FX key (Phase E live feed).
- [ ] **U3 production domain**: for CORS_ORIGIN / NEXTAUTH_URL / FRONTEND_URL /
  S3_PUBLIC_HOST / cookie config.
- [ ] **U4 Cloudflare R2 account**: access key/secret/bucket — then flip the
  storage env vars per docs/OPERATIONS.md (silent switch, no code change).
- [ ] **U5 business rules**: fee % / VAT / settlement assumptions for tests
  (current tests use seeded defaults).
- [ ] **U6 Coolify VPS access**: deploy docker-compose.coolify.yml (postgres +
  minio + backend + frontend); run migrations; backups/Sentry.
- [ ] **U7 (optional)**: Nest 12 bump once @nestjs/throttler publishes a
  v12-compatible release (peer range currently caps at ^11) — see §19.
- [ ] Frontend admin rate editor for exchange rates (Phase E2, deprioritized).

### Command cheat sheet (from docs/OPERATIONS.md)

```
cd backend
npm test                                   # unit/service
npm run test:e2e                           # HTTP-layer E2E
$env:DB_DATABASE="greyauction_itest"; npx ts-node scripts/itest-db-setup.ts   # provision (idempotent)
$env:DB_DATABASE="greyauction_itest"; $env:DB_SYNCHRONIZE="false"; $env:NODE_ENV="test"; npm run itest
npm run build
npx ts-node scripts/storage-smoke.ts       # needs MinIO (see OPERATIONS.md)
cd frontend
npm test                                   # Vitest
npm run generate:api                       # needs backend on :3001
npm run build
```

## 0. What's Pending (updated 2026-08-28)

**Blocked on keys / access (unchanged):**
- [!] Payment gateway live capture + webhook HMAC (needs FLUTTERWAVE/PAYSTACK keys).
- [!] Live AI execution (needs LLM provider keys).
- [!] Production deploy + migrations-only DB + backups + Sentry (needs Coolify/host access).
- [!] Redis-backed static-config cache.

**Done this round (ready-to-do phase):**
- [x] Notification triggers (outbid/won/room-start) - already wired & verified (no change needed).
- [x] L2 multi-currency - USD/GHS/EUR rate display + header switcher (9138b1b, 9e36ac5).
- [x] L6 WCAG - axe 12 routes 0 violations + responsive no-overflow matrix 25 checks (231b442).
- [x] Lighthouse budget run - 100/100/100/100 on /en/about-us (prod build).
- [x] Git finalize - merged feature/authjs-migration into master, tagged v1.0.0, pushed.

**Security remediation (2026-08-30, from the external production-readiness audit):**
- [x] Fixed: JWT secret fail-fast · OTP (crypto-RNG, persisted columns, no prod leak) · reset-token no-leak · role limited to bidder/seller · bid rejects closed/ended lots · invoice endpoints guarded + ownership · AdminRolesGuard fail-closed · global exception filter · frontend mock fallback dev-only. (fcd6cff, 56d52cf)
- [placeholder] Google OAuth verification (endpoint disabled until google-auth-library is wired) · full baseline migration (use DB_SYNCHRONIZE=true once) · live FX feed · transactions/ledger for wallet + payments + settlement (escrow is done).

**Latest round (hardcode cleanup + structural):**
- [x] Removed hardcoded demo lot data — bid modal/title/lot/date/address/specs/description derive from the real auction (0b58ba1).
- [x] Escrow hold/dispute/release/refund wrapped in transactions with pessimistic locks (d2a473d).
- [x] Phased remediation plan A–G documented (section 13, e8fd0c2).

**Remaining (phased in section 13 — nothing key-free left to code this round):**
- Optional: open a retroactive PR if review is wanted (direct fast-forward merge already done).
- Optional: live exchange-rate feed (set EXCHANGE_RATE_API_URL) or daily admin refresh.
- Optional: wire Lighthouse/LHCI into CI (budget + scripts in loadtest/).

**Done (L-phases):** L1 PWA · L3 seller analytics · L4 trust & safety · L5 shipping+escrow · L7 k6+Lighthouse budget · L8 advisors+direct-sales · L9 CSV bulk - details in section 4.

---

## 1. What Is Done (verified)

| Area | Status | Evidence |
|---|---|---|
| Authentication — Auth.js v5 (Clerk removed) | DONE | JWT credentials provider, role middleware, all dashboards verified |
| Phase 2 — real data everywhere | DONE | public /faqs /banners, slugs, admin reports, seller shop; homepage/FAQ/auctions/dashboards live data |
| Phase 3 — workflows | DONE | password reset, seller wizard, form validation, console.log cleanup, branded links |
| Phase 4 — i18n + UX | DONE | fr/nl full parity (204/204/204), loading skeletons, runtime fixes |
| Phase 5 — auction engine | DONE | proxy auto-bid, anti-sniping, room lifecycle cron, invite approvals, CSV bulk upload |
| Wallet backend | DONE | entities, deposit/withdraw/PIN (bcrypt), UI wired with fallback |
| Payments | PARTIAL (blocked) | mock mode works; webhook hardened + guarded; real capture needs gateway keys |
| LLM provider registry (8 providers) | DONE | DeepSeek/Qwen/Wan/OpenRouter/Gemini/OpenAI/Anthropic/Poolside endpoint-verified, protocol-aware health, 5-min monitor, fallback chains, seeded 17 models |
| Performance | IMPROVED | 9 new DB indexes, query caps, SQL aggregate summary, parallel health sweep |
| Brevo email + newsletter subscription | DONE | transactional email via Brevo API/SMTP, double opt-in subscriptions (c71f82b, b0bf1ae) |
| PWA base (L1) | DONE | manifest, service worker (offline + static cache + push seam), offline page, install banner (94493cf) |
| Trust & safety (L4) | DONE | condition reports, KYC badges, disputes + feedback loop (e3b6c6c, b079518) |
| Shipping + escrow (L5) | DONE | addresses, key-free rate calc, shipments, escrow state machine (5135b24, a9c6a92) |
| Load testing + perf budget (L7) | DONE | k6 scenarios + Lighthouse 90+ budget + lhci config (7e243fc) |
| Advisors + direct sales (L8) | DONE | advisor directory + buy-now section (5b4eb54, 6f18126) |

**Verification:** 206/206 backend Jest · 67/67 frontend Vitest · backend build + frontend `next build` green · axe 12/12 + responsive 25/25 · Lighthouse 100/100/100/100 (static page) · working tree clean · merged to master + v1.0.0 tag pushed.

---

## 2. WORK NOW — COMPLETE (all N-items delivered in earlier rounds)

| # | Item | Impact | Notes |
|---|---|---|---|
| N1 | AI in the seller create-listing form (description generator + title optimizer via /ai/execute) | High | **[x] DONE** (e0c28fb) - buttons on auction-details step, graceful AI-not-configured state |
| N2 | Bidder notifications - outbid / won / ending-soon via Socket.IO + notifications table | High | **[x] DONE** (e0c28fb) - triggers wired in bid.service / room-lifecycle / invoice-settlement + notification bell |
| N3 | Live auction watch page - in-room bid panel using the auto-bid/anti-sniping engine | High | **[x] DONE** (e0c28fb) - socket stream + bid panel + auto-bid + countdown + sticky mobile bar |
| N4 | Pagination UI for admin tables (backend caps 50-200) | Medium | **[x] DONE** (e0c28fb) - DataTable pagination wired, responsive controls |
| N5 | Hoist `auth()` in `lib/server/data.ts` (one session read per request) | Low | **[x] DONE** (e0c28fb) - React cache() per-request token |
| N6 | Dashboard loading/error states polish + wallet empty-state copy | Medium | **[x] DONE** (e0c28fb) |
| N7 | Add `npm run seed:demo` + `seed:ai:providers` npm scripts | Low | **[x] DONE** (e0c28fb) - all three scripts idempotent |
| N8 | CI: run frontend build (already broke before; now green) + backend tests on PR | Medium | **[x] DONE** (e0c28fb) - lint + build + test are now a real gate |

---

## 3. WORK AFTER BLOCKERS RESOLVED

### Blockers and the work they unlock

| Blocker | Unlocks | Blocked item(s) |
|---|---|---|
| **Payment gateway keys** (FLUTTERWAVE_SECRET_KEY / PAYSTACK_SECRET_KEY) | Real payment capture + webhook verification | B1 Activate gateway; B2 deposit↔gateway linking (idempotent references); B3 buyer card/CV bank flows |
| **LLM provider API keys** (OpenAI/DeepSeek/Gemini/Anthropic/OpenRouter/Qwen/Poolside) | Live AI execution | B1 Wire AI features into UX (chatbot, descriptions, smart search); B2 per-feature fallback chains verified live |
| ~~GitHub credentials~~ (resolved) | Publish the work | ~~push~~ · ~~merge to master + tag~~ (done: v1.0.0) — PR optional |
| **Production host/Coolify access** + env secrets | Deploy | B1 docker-compose single stack; B2 migrations-only DB (`migrationsRun: true`, `synchronize: false`); B3 backups; B4 Sentry/logging |
| **Redis (or similar)** | Real caching | B1 Cache static config (categories/banners/FAQs) with invalidation |

### After-blocker work items (detail)

- `[!]` B-PAY-1: real gateway capture + webhook HMAC verification per provider (implemented seam; needs keys).
- `[!]` B-PAY-2: deposit reference idempotency (unique reference guard) before production.
- `[!]` B-AI-1: live verification of every provider chat execution + fallback switch-over with configured keys.
- `[x]` B-GIT-1: pushed feature/authjs-migration, merged to `master` (1dcded3), tagged v1.0.0. (PR optional - direct fast-forward merge done.)
- `[!]` B-DEPLOY-1: Coolify deploy with env secrets; run migrations; verify CSP/robots for the real domain.
- `[!]` B-DEPLOY-2: automated DB backups + Sentry/instrumentation.
- `[!]` B-CACHE-1: Redis-backed cache for static config + session-scale readiness.

---

## 4. WORK LATER (strategic / growth / polish)

| # | Item | Why | When |
|---|---|---|---|
| L1 | PWA + push notifications | Mobile retention | ✅ Base done — manifest, SW (offline + static cache), offline page, install banner; push seam ready for VAPID keys (94493cf) |
| L2 | Multi-currency (USD/GHS) + rate display | Growth lever | ✅ Done — key-free exchange-rate module + currency switcher (9138b1b, 9e36ac5) |
| L3 | Seller analytics dashboard (charts from /sellers/statistics/me) | Seller value | ✅ Done (1463f25) |
| L4 | Trust & safety: condition reports, KYC badges, dispute/feedback loop | Conversion | ✅ Done — backend domain + frontend UI (e3b6c6c, b079518) |
| L5 | Shipping/delivery integration + escrow | Enterprise buyers | ✅ Seams done — addresses, key-free rate calc, shipments, escrow state machine (5135b24, a9c6a92) |
| L6 | Full WCAG 2.1 audit + responsive test matrix | Compliance | ✅ Automated done — axe 12 routes 0 violations + responsive matrix 25 checks (231b442); manual SR pass optional |
| L7 | Load testing (k6) + Lighthouse budget (90+) | Scale assurance | ✅ Config done — k6 scenarios + Lighthouse 90+ budget & lhci config (7e243fc); run via loadtest/ |
| L8 | Marketplace advisor map + direct-sales section | Parity with Troostwijk | ✅ Done — advisor directory (lat/lng ready for map) + buy-now section (5b4eb54, 6f18126) |
| L9 | Bulk CSV import enhancements (image URLs, multicategory, price tiers) | Seller productivity | ✅ Done (3245c4e) |

---
## 5. Performance & Efficiency Audit (results)

### Done (commit 6a27d85)
- 9 new DB indexes on hot columns: products(sellerId, status+endTime, category); bids(productId, bidderId, productId+createdAt); invoices(payment_reference); ai_usage_logs(createdAt, featureKey+createdAt, providerName).
- Capped unbounded queries (take 100): user bids, room bids, seller listings, seller rooms, invites, content pages (50).
- Invoice summary aggregates in SQL (no full-table load).
- Provider health sweep parallelized (4 at a time).

### Remaining (see NOW + AFTER BLOCKERS)
- Static-config caching → Redis after blocker. Local TTL cache optional.
- Lighthouse/LHCI in CI: recorded 100/100/100/100 on /en/about-us (prod build); wire into CI when a browser toolchain is available there.

---

## 6. Historical Issue Log (all fixed — kept for reference)

| # | Issue | Status | Fix |
|---|---|---|---|
| 1 | Clerk hard-wired, no keys (app could not boot) | FIXED | Auth.js v5 migration (26a58af) |
| 2 | Registration/OTP flows were UI-only | FIXED | JWT sign-in after register (26a58af/9b1b0b5) |
| 3 | Backend prod entry `dist/main` vs `dist/src/main` | FIXED | package.json + Dockerfile |
| 4 | Mock fallbacks masked 404s in dashboards | FIXED | real routes + auth token (08fa5be) |
| 5 | Password-reset link wrong route | FIXED | backend link + page token (d9cf9c3) |
| 6 | Seller wizard 401 + bad payload | FIXED | auth-gated valid payload (9b1b0b5) |
| 7 | Form validation gutted | FIXED | restored schemas (9b1b0b5) |
| 8 | i18n fr/nl only 53 keys | FIXED | 204-key parity (293efc7) |
| 9 | Frontend build broken (type errors) | FIXED | 26 pre-existing errors fixed; build green |
| 10 | Auto-bid/anti-snipe missing | FIXED | engine (a0646f9) |
| 11 | Room lifecycle manual | FIXED | cron (a0646f9) |
| 12 | Invite request-mode no approval | FIXED | approval flow (8330420) |
| 13 | Payment webhook: full scan + mock auto-verify | FIXED | targeted lookup + guard (1c3d9db) |
| 14 | Broken links /terms /checkout/confirmation | FIXED | routes created (1c3d9db) |
| 15 | Wallet backend absent | FIXED | wallet backend + UI (1c3d9db) |
| 16 | Missing LLM providers (Wan, Poolside) + non-protocol health checks | FIXED | registry + protocol-aware health (893cf19) |
| 17 | Hot queries unscaled | FIXED | indexes + caps (6a27d85) |

---

## 7. Value-Add Feature Ideas (prioritized)

1. **AI in seller flow + chatbot** — backend ready (see N1).
2. **Bidder notifications** — real-time + email (see N2).
3. **Live auction watch page** (see N3).
4. **Trust & safety** — condition reports, KYC badges (L4).
5. **PWA + push** (L1).
6. **Multi-currency** (L2).
7. **Seller analytics** (L3).
8. **Payment completion flow** in buyer dashboard — post-keys (B-PAY-1/3).

---
## 8. Quick Reference

**Run (dev):**
1. `docker start greyauction-postgres`
2. `cd backend && npm run build && npm run start:prod` (or `start:dev`)
3. `cd frontend && npm run dev`
4. Open http://localhost:3000/en · Swagger http://localhost:3001/api/docs

**Demo accounts:** admin@greyauction.com / Admin@12345 · demo@seller.com / Seller@12345 · demo@buyer.com / Buyer@12345
**Key scripts (backend):** `seed:admins:dev`, `seed:demo` (ts-node), `seed-ai-providers.ts` (ts-node), `migration:run:dev`, `test`, `lint`, `build`.
**Frontend scripts:** `npm run dev`, `npm run build`, `npm run test` (Vitest), `npm run test:a11y` (Playwright axe), `test:lighthouse`, `test:load:browse`, `test:load:bidding`.

**Verify:** backend `npm test` → 206 · frontend `npx tsc --noEmit && npm test` → 67 · e2e axe 12 + responsive 25 · Lighthouse 100/100/100/100 (static page).

**Env files:** `backend/.env`, `frontend/.env.local` — payment/LLM keys go here when available. `backend/.env.example` documents every env var (DB, JWT, Brevo, Termii/Twilio SMS, payment keys, webhook URL).

---
## 9. Execution Log (rounds)

- **Round 1:** Phase 2 complete (08fa5be). Phase 3 start: password-reset (d9cf9c3).
- **Round 2:** Phase 3 complete (wizard 9b1b0b5, cleanup 2b6f0fd, links f179842).
- **Round 3:** Phase 4 core (i18n 293efc7, loading 3f0a68e, charAt fix 3500a2e).
- **Round 4:** Phase 5 engine (a0646f9: auto-bid, anti-snipe, room cron).
- **Round 5:** Invite approvals + CSV bulk (8330420).
- **Round 6:** P2 cleanups (d95f809).
- **Round 7:** Wallet backend + webhook hardening + broken links + a11y (1c3d9db).
- **Round 8:** LLM provider registry + health/monitoring + fallback (893cf19).
- **Round 9:** Performance — indexes, caps, aggregate, parallel sweep (6a27d85).
- **Round 11:** Brevo transactional email + newsletter subscription (double opt-in) — c71f82b (backend), b0bf1ae (frontend).
- **Round 12:** L-phase completion — L1 PWA (94493cf), L7 k6+Lighthouse budget (7e243fc), L4 trust & safety (e3b6c6c, b079518), L5 shipping+escrow (5135b24, a9c6a92), L8 advisors+direct-sales (5b4eb54, 6f18126), docs (8b5143f). Pushed to origin.
- **Round 13:** L2 multi-currency — backend exchange-rates (9138b1b) + frontend provider/switcher (9e36ac5); 206/206 backend, 67/67 frontend.
- **Round 14:** L6 a11y + responsive — axe 12 routes 0 violations + responsive matrix 25 checks (231b442).
- **Round 15:** Lighthouse budget run recorded (1dcded3) — 100/100/100/100 on /en/about-us.
- **Round 16:** Git finalize + release — merged to master, tagged v1.0.0, pushed; docs synced (86ae520, b163d96).

## 10. WORK NOW — Detailed Plan & Sequence

**Ordering principle:** foundations first (scripts/CI/data layer), then the responsive/UX baseline (cross-cutting, so features are built on it), then features by dependency + value, then polish. Each item has acceptance criteria; every feature includes its UI/UX + responsive sub-tasks. `S`=foundation, `U`=UI/UX+responsive, `F`=feature, `P`=polish.

### Wave 0 — Foundations (fast, unblocks everything)

| ID | Task | Effort | Acceptance |
|---|---|---|---|
| S1 (N7) | Add npm scripts: `seed:demo`, `seed:ai:providers`, `seed:ai:features` | 0.25d | `npm run seed:demo` and `npm run seed:ai:providers` run green, idempotent |
| S2 (N8) | CI: gate on frontend build + backend test; keep lint as warning | 0.5d | Local `npm run build` + `npm test` pass; CI yml updated; both jobs fail on errors |
| S3 (N5) | Hoist `auth()` session read in `lib/server/data.ts` with React `cache()` | 0.25d | One session fetch per page render; no cross-request leakage; smoke passes |

### Wave 1 — UI/UX + Responsive Baseline (cross-cutting)

| ID | Task | Effort | Acceptance |
|---|---|---|---|
| U1 | Responsive audit matrix 360/390/768/1024/1440 + fix horizontal scroll on core pages | 1d | No horizontal scroll at 360px on home/auctions/detail/FAQ/checkout and all dashboards |
| U2 | Mobile nav & touch: hamburger flow, 44px+ touch targets, sheet/drawer spacing, `100dvh` fix | 1d | Touch targets pass at 44px; drawer opens/closes without layout shift |
| U3 | Table hardening: `overflow-x-auto` + sticky header + mobile card fallback for admin auctions/bids/payments, seller listings, buyer payments | 1.5d | Tables usable on 360px (card view on mobile, no data loss) |
| U4 (N6) | Consistent loading/empty/error states across dashboards + wallet empty-state copy | 1d | Every dashboard has Skeleton, EmptyState, and an error hint |
| U5 | Form UX: validation messages, focus-visible rings, keyboard nav (seller wizard + checkout) | 1d | Keyboard-only flow works; errors announced; focus visible |
| U6 | Accessibility spot-pass on new/nav components (aria-labels, headings, contrast) | 0.5d | axe-core pass on home + one dashboard |

### Wave 2 — Features (dependency order)

| ID | Task | Effort | UI/UX + Responsive | Acceptance |
|---|---|---|---|---|
| F1 (N4) | Admin table pagination (wire DataTable PaginationState + server fetch per page for auctions/bids/sellers/payments) | 1d | Pagination controls responsive; page size selector; mobile-friendly | 1000+ rows page correctly; no full reload; URL sync for page |
| F2 (N1) | AI in seller create-listing: “Generate description” + “Optimize title” buttons → `POST /api/ai/execute` (feature `auction_description_generator`, `title_optimizer`) | 1.5d | Side panel/embedded card on the review step; skeleton while generating; graceful “AI not configured” toast; layout stacks on mobile | Generator fills description/title with detected model + latency shown; failure state never blocks manual entry |
| F3 (N2) | Notifications: backend (entity, endpoints unread/list/mark-read, triggers for outbid/won/invite-approved/room-start) + frontend bell in header (desktop + mobile drawer) | 2.5d | Badge with unread count; dropdown on desktop, sheet on mobile; animations subtle; empty state | Trigger → row created → badge count updates (2 sessions verify) → mark-read persists |
| F4 (N3) | Live auction watch page: socket.io join, live bid stream, in-room bid panel + auto-bid toggle + live countdown | 2.5d | 2-col → stacked at <768px; sticky bid bar on mobile; high-contrast live status | Two browsers: bid in A appears in B <1s; auto-bid ceiling shown; countdown syncs |

### Wave 3 — Polish & verify

| ID | Task | Effort | Acceptance |
|---|---|---|---|
| P1 | Full test + build + smoke after each feature; axe pass on changed screens | 0.5d/feature | 95+ tests pass, build green, no console errors |
| P2 | Update this report: flip `[ ]`→`[x]`, record commit refs | 0.25d | Source of truth current every wave end |

### Suggested order & why
1. **S1 → S2 → S3** (0.5–1d): everything after is faster and verifiable.
2. **U1 → U3 → U4** first, then **U2/U5/U6** — the responsive baseline prevents rework in F1–F4.
3. **F1** (table pagination) before **F3/F4** — pagination improves the admin surfaces used to verify notifications and rooms.
4. **F2** (AI) is independent — can be done anytime after Wave 1; it is the fastest visible win.
5. **F3** then **F4** — notifications make the live watch page testable across two sessions.
6. **P1/P2** at each feature boundary.

**Total estimate: ~11–13 working days for the full “Work Now” set** (0.5–1d Wave 0 · ~5.5d Wave 1 · ~7.5d Wave 2 · included in each feature P1/P2).

**Round 10 (Work Now completion, e0c28fb):** all N1-N8 done via 4 parallel sub-agents (disjoint file ownership) + coordinator integration. Verified: backend 103/103 tests; frontend build green; all changed screens render 200; notifications API live. Follow-ups (placeholders): (1) `[!]` notification trigger wiring (outbid/won/room-start) - placeholder in notification.service.ts; (2) `[!]` AI execution live once LLM keys are added; (3) `[ ]` automated axe pass deferred to L6 WCAG audit (manual spot pass done).

---

## 11. Continue Development — Handoff (final state, v1.0.0)

### Where things live

**Backend** (NestJS, backend/src/) — 30 modules, registered in app.module.ts:
- Identity: auth (JWT + guards), admin (role guard), seller (KYC/statistics).
- Trading: products (incl. direct-sale + auctionType filter), bids (proxy auto-bid + anti-snipe engine), rooms (live bidding + lifecycle cron), categories, banners, faqs, tickets.
- Money: payments (provider seam: paystack/flutterwave/interswitch/opay), invoices (settlement cron), wallet, fees, escrow, exchange-rates.
- Trust & fulfillment (added this cycle): trust (condition reports, KYC badges, disputes+feedback), shipping (addresses, rate calc, shipments), escrow, advisors.
- Comms: notification (outbid/won/room triggers), common/email (Brevo), common/sms (Termii/Twilio), subscription (newsletter double opt-in).
- AI: ai (LLM registry + orchestrator + 5-min health monitor), agents, common/ai.
- Config/DB: config/database.config.ts, database/ (seeds), common (storage, throttler).

**Frontend** (Next.js 16 App Router, frontend/):
- Routes: app/[locale]/ route groups — (website) public, (domain) buyer/seller/admin dashboards, (seller) onboarding, (auth) auth pages.
- Shared UI: shared/components/ — common (primitives: button, card, datatable, dialog...), trust, shipping, escrow, advisors, direct_sales, currency, ai, pwa.
- Data: lib/server/data.ts (server fetches with per-request auth token), redux (client state), i18n + messages (en/fr/nl).
- New public pages this cycle: /advisors, /direct-sales, /subscribe (+/subscribe/confirm), /[locale]/offline.
- PWA: app/manifest.ts, public/sw.js, shared/components/common/pwa.
- Tests: Vitest (shared/**/__tests__), Playwright e2e (a11y.spec.ts, responsive.spec.ts).

**Ops/perf:** loadtest/ (k6 scenarios + Lighthouse budgets + README), root Dockerfiles, .github/workflows/ci.yml.

### Run it (dev)
1. docker start greyauction-postgres
2. cd backend && npm run build && npm run start:prod (or start:dev)
3. cd frontend && npm run dev
4. http://localhost:3000/en · API http://localhost:3001/api · Swagger http://localhost:3001/api/docs

### Verify it
- Backend: cd backend && npm run build && npm test (206).
- Frontend: cd frontend && npx tsc --noEmit && npm test (67) && npm run build.
- E2E (both servers running): cd frontend && npm run test:a11y (12 axe) + npx playwright test e2e/responsive.spec.ts (25).
- Load/perf: see loadtest/README.md (k6 + Lighthouse budget + recorded result).

### What's next (in order)
1. **Blocked on keys/access** (do when available) — see section 3:
   Payment gateway live capture (B-PAY-1/2) · live AI execution (B-AI-1) · production deploy + backups + Sentry (B-DEPLOY-1/2) · Redis cache (B-CACHE-1).
2. **Optional / polish (no keys):** wire Lighthouse into CI (scripts ready) · set EXCHANGE_RATE_API_URL for live FX · manual WCAG screen-reader pass (L6) · web-push once VAPID keys are generated (L1 follow-up).

### Known caveats
- Exchange rates are seeded static defaults (NGN/USD/GHS/EUR); refresh via admin PATCH /exchange-rates/:code or set EXCHANGE_RATE_API_URL.
- Dev uses TypeORM synchronize:true; switch to migrations-only before production (B-DEPLOY-1).
- Lighthouse simulated metrics on the homepage are unreliable (persistent WS/chatbot/carousel connections); measure a static page with --throttling-method=provided.
- Push notification support is a stub until VAPID keys are added (SW listens for push; seaming in place).

---

## 12. Production-Readiness Remediation (external WordBuddy audit, 2026-08-30)

A third-party static audit flagged 16 critical / 18 high / 17 medium / 7 low findings.
Spot-verification confirmed the critical/high ones were real. The key-free fixes below
were applied and verified (backend build + 206/206 Jest · frontend tsc + 67/67 Vitest).

### Fixed (commits fcd6cff, 56d52cf)
| ID | Finding | Fix |
|---|---|---|
| S4 | JWT_SECRET silently fell back to "dev-secret" | Fail-fast: throw on boot if JWT_SECRET unset in production (auth.module + jwt.strategy) |
| S3/R8 | OTP leaked in response, Math.random, and never persisted | crypto.randomInt + otpCode/otpExpiry columns on User + no OTP in prod response (dev echo only) |
| S2 | Forgot-password returned the reset token | Return uniform success; token goes in the email only; no account enumeration |
| S12 | register accepted client role (admin escalation) | RegisterDto role limited to bidder/seller; service never assigns admin |
| R1 | Bids accepted on closed/sold/ended lots | placeBid rejects non-ACTIVE or past-endTime lots |
| S8 | Invoice list/detail/pay/pdf unauthenticated | JwtAuthGuard + ownership (party-or-admin); pay/create/settle-now admin-only |
| — | AdminRolesGuard failed open | Guard now throws when @AdminRoles is missing; class-level roles added to admin + admin-reports controllers |
| M1 | No global exception filter | AllExceptionsFilter + request-id envelope, no raw DB/stack leak |
| F16 | Frontend fabricated lots on API failure | Mock fallback gated to dev only; prod renders honest empty state |
| C1 (mitigation) | Prod boots with no schema | DB_SYNCHRONIZE=true one-time bootstrap override documented |
| F7 | Bid modal hardcoded \"Audi RSQ8\" | Removed — title/lot/date/address/specs/description derive from the real auction (0b58ba1) |
| — | Escrow check-then-write | hold/dispute/release/refund wrapped in transactions with pessimistic locks (d2a473d) |

### Placeholders (stub/flag in place — real implementation still needed)
| ID | What | Placeholder | To finish |
|---|---|---|---|
| S1 | Google OAuth unverified | loginWithGoogle now throws "not enabled" | Wire google-auth-library ID-token verify + GOOGLE_CLIENT_ID |
| C1 | Full baseline migration | DB_SYNCHRONIZE bootstrap flag | Generate a complete migration for all 38 entities (typeorm schema dump) and switch off synchronize |
| L2 | Live FX | EXCHANGE_RATE_API_URL hook + admin PATCH | Point to a real feed or run a daily refresh cron |
| — | Money-path transactions | escrow now transactional | Wrap wallet deposit/withdraw, payment capture, settlement in transactions + append-only ledger |
| B-PAY | Real payment capture | Mock deposit / markPaid | Wire Paystack/Flutterwave capture + webhook (key-blocked) |
| A1/A3 | Checkout/payment | Payments init 400s without keys | Create a real order + success only on confirmed payment (key-blocked) |

### Still blocked on keys / access (unchanged)
- Payment gateway keys · LLM provider keys · production host (Coolify) · Redis.

---

## 13. Remediation Plan & Phases (key-free work remaining)

Ordered so each phase builds on the last. Only key-free items are listed;
key/access-blocked work (real payment capture, live AI, deploy, Redis) is in §3.

### Phase A — Money-path transactions & ledger (data integrity)
- A1 Wallet deposit/withdraw → wrap in a DB transaction; write an append-only
  `wallet_transactions` row on every balance change (audit trail).
- A2 Invoice settlement cron → transaction (issue invoice + mark lot SOLD atomically).
- A3 Invoice markPaid + payment-capture seam → transaction.
- A4 Escrow: move the payout (wallet credit on release) inside the escrow transaction.
- Depends on: nothing. Verifies with: backend Jest + a concurrency test.

### Phase B — Database schema baseline (C1)
- B1 Generate a complete baseline migration for all 38 entities (schema-dump script).
- B2 Reconcile/replace the 2 drifted migrations (CreateCoreTables/CreateSellerTables).
- B3 Verify a fresh DB boots with `migration:run` and `synchronize` OFF.
- Depends on: nothing. This is the main remaining deploy blocker.

### Phase C — Auth completeness (S1 + OTP hardening)
- C1 Google OAuth: verify the ID token server-side (google-auth-library) with
  GOOGLE_CLIENT_ID, then re-enable `loginWithGoogle`.
- C2 Rate-limit send-otp / verify-otp (ThrottlerGuard) to stop OTP brute-force.
- Depends on: nothing. C1 needs GOOGLE_CLIENT_ID only at runtime, not to code.

### Phase D — Real order / checkout path (A1/A3)
- D1 Order entity + POST /orders that persists an order from a paid invoice.
- D2 Gate the checkout success page on a real persisted order (no success-without-order).
- D3 Payment webhook → mark order paid (seam; live gateway is key-blocked).
- Depends on: Phase A (transactions) for order/ledger atomicity.

### Phase E — Live exchange rates (L2)
- E1 Daily cron refreshing rates from EXCHANGE_RATE_API_URL (refresh() exists).
- E2 Admin UI to edit rates (frontend).
- Depends on: nothing.

### Phase F — Observability & hygiene (medium/low findings)
- F1 Propagate the request id from the exception filter through normal logs.
- F2 Dead-dependency / Clerk-remnant cleanup + config drift (JWT_EXPIRATION, CORS).
- F3 N+1 / unbounded-query audit from the external report.
- Depends on: nothing.

### Phase G — Tests & CI
- G1 Tests for the new transactions, guards, and order path.
- G2 Wire Lighthouse/LHCI + k6 into CI.
- Depends on: Phases A–D.


---

## 14. Storage & Media Pipeline (P1) — Live MinIO smoke test

**Status: [x] DONE** — verified 2026-08-31 against a live MinIO instance
(throwaway container on :9010, bucket greyauction-test, public-read).

**Smoke test: 24/24 checks passed** (script: backend/scripts/storage-smoke.ts):

| Check group | Result |
|---|---|
| Image upload → WebP re-encode (image/webp) + 800x600 metadata | PASS |
| 3 responsive variants (thumb/medium/large) stored + publicly fetchable | PASS |
| Public HTTP fetch of original + variants (200, image/webp) | PASS |
| Document (PDF) stored verbatim, no variants | PASS |
| Delete removes original **and all variants** (verified 404) | PASS |
| Delete document | PASS |
| keyFromUrl round-trips (path-style + deep keys) | PASS |
| Local disk driver round-trip (upload/variants/delete) | PASS |

**Bugs found & fixed (P1):**
- [x] **P1-1 Orphaned variants on delete** — deleteFile removed only one object;
  image -thumb/-medium/-large.webp variants leaked forever. Fixed: delete now
  removes the original plus every variant (idempotent — S3 no-op / local ENOENT).
- [x] **P1-2 Fragile key derivation** — deleteFile rebuilt keys with a
  "last two path segments" heuristic that broke on keys with >2 segments and on
  full S3 URLs. Fixed: drivers now own keyFromUrl() (each knows its URL shape).

**New tests:** storage.module.spec.ts (driver selection: local default, S3
when configured, safe fallback when creds missing) — 252 backend tests + 5 E2E
green, tsc --noEmit clean.

**Note (non-issue):** deleteFile attempts variant keys for documents too —
intentional idempotent no-ops (S3 DeleteObject succeeds on absent keys).
---

## 15. Money-Path Integration Suite (P2)

**Status: [x] DONE** — 8/8 integration tests against real Postgres
greyauction_itest (provisioned by backend/scripts/itest-db-setup.ts,
migrations-only schema: Baseline + AddOrders applied cleanly on a fresh DB).

| Flow step | Result |
|---|---|
| Register + login seller & buyer (HTTP) | PASS |
| Create listing → approve → ACTIVE | PASS |
| Buyer places winning bid (HTTP) | PASS |
| End auction → settlement issues invoice + marks SOLD | PASS |
| Payment init (offline, unconfigured provider) | PASS |
| HMAC-signed Paystack webhook → invoice paid + order created atomically | PASS |
| Webhook replay → idempotent (no duplicate order) | PASS |
| Wallet deposit ledger + duplicate reference idempotency | PASS |

**Bugs found & fixed (P2):**
- [x] **P2-1 StorageService DI wiring broke app boot** — CommonModule imported
  StorageModule.forRoot() (DynamicModule) but re-exported the bare module
  class, so SellerModule could not resolve StorageService. Nest also rejects
  re-exporting a provider class from an imported module in this setup.
  Fixed: StorageModule is static again with a useFactory STORAGE_DRIVER
  provider (env-read at DI time), S3 client is lazy, and modules import
  StorageModule directly. Verified: real dev app boots, GET /api/health 200.
- [x] **P2-2 DB_SYNCHRONIZE=false could not disable synchronize in dev/test**
  (synchronize: bootstrapSync || !isProduction). Fixed: explicit opt-out so
  integration tests run migrations-only (strict schema).

**Run:**
```
cd backend
$env:DB_DATABASE="greyauction_itest"; npx ts-node scripts/itest-db-setup.ts
$env:DB_DATABASE="greyauction_itest"; $env:DB_SYNCHRONIZE="false"; $env:NODE_ENV="test"; npx jest --config jest-integration.json --forceExit
```

**Totals:** 252 unit + 8 integration + 5 E2E tests green; tsc clean.
---

## 16. Dependency Hygiene (P3)

**Status: [x] DONE** — non-breaking fixes applied, all suites green.

| Package | Before | After | Notes |
|---|---|---|---|
| backend (transitive, lock-only) | 31 vulns (3 low, 18 mod, 10 high) | 29 vulns (3 low, 18 mod, 8 high) | npm audit fix (no majors); 24 transitive bumps; 252/252 tests + tsc green |
| frontend next-auth | 2 critical (@auth/core via 5.0.0-beta.30) | 0 vulns | bumped to 5.0.0-beta.32 (same beta line); 67/67 vitest + tsc + prod build green |

**Update (U1, 2026-08-31):** NestJS upgraded 10 → 11 across the whole family
(common/core/platform-express/websockets/config/jwt/passport/swagger/typeorm
+ CLI/schematics/testing). Backend now reports **0 vulnerabilities**. See §19.
---

## 17. API Contract Enrichment (P4)

**Status: [x] DONE** — typed response contracts generated for the frontend.

- Added 19 response/envelope DTOs (@ApiProperty-typed) for auth, products,
  bids, invoices, orders, wallet, exchange rates.
- Annotated the main controllers with @ApiResponse({ type }) so the OpenAPI
  JSON (/api/docs-json) exposes real response schemas.
- Generated frontend/lib/api-types.ts (221KB) from the live spec via
  `npm run generate:api` (openapi-typescript 7.13).
- Verified: all 19 schemas present in docs-json; frontend tsc clean with
  the generated file.

**Bugs found & fixed (P4):**
- [x] **P4-1 Stale backend process held port 3001 (EADDRINUSE)** — a leftover
  dev server from a previous boot test was still listening, so Swagger
  served stale schemas. Killed and re-booted; note added for future runs
  (always verify the docs-json you generate against matches HEAD).
---

## 18. Operations Documentation (P5)

**Status: [x] DONE** — docs/OPERATIONS.md created; every referenced
command/path/env var verified against the live repo.

- Covers: storage architecture + driver env matrix, silent R2 switch,
  storage smoke test, full testing matrix (unit/E2E/integration/contract/
  load), Coolify deploy steps, health & observability.
- Verification pass: docker compose config exits 0; all 6 referenced paths
  exist; all 9 referenced npm scripts exist; env var names match code.

**Bugs found & fixed (P5):**
- [x] **P5-1 docker-compose.coolify.yml referenced a root .env that does not
  exist** — compose validation failed (env file not found). Fixed: env_file
  points to ./backend/.env with required: false (Coolify users manage env
  in the UI). Docs updated to copy backend/.env.example → backend/.env.
---

## 19. NestJS Major Upgrade 10 → 11 (U1)

**Status: [x] DONE** — upgraded, tested, 0 vulnerabilities.

| Check | Result |
|---|---|
| npm audit | **0 vulnerabilities** (was 29: 3 low, 18 moderate, 8 high) |
| tsc --noEmit | clean (1 fix: JWT expiresIn now ms.StringValue-typed in @nestjs/jwt 11) |
| Unit + service suite | 252/252 (38 suites) |
| HTTP-layer E2E | 5/5 |
| Money-path integration | 8/8 (fresh migrations-only DB) |
| nest build (CLI 11) | green |
| Live boot smoke | /api/health 200 · /api/exchange-rates 200 · /api/products 200 · /api/docs-json 182 paths / 82 schemas · 404 handling OK |

**Versions:** @nestjs/* 11.2.3 (config 4.0.4, jwt 11.0.2, passport 11.0.5,
swagger 11.4.7, typeorm 11.0.3, throttler 6.5.0 unchanged, schedule 6.1.3
unchanged); CLI 11.0.24, schematics 11.1.0, testing 11.2.3.

**Known limitation (documented, not a bug):** Nest **12** is the current
latest, but @nestjs/throttler 6.5.0 (latest release) caps its peer range at
Nest ^11 — no v12-compatible throttler exists yet. Nest 11 already clears
every audit finding, so staying on 11 is the correct choice until throttler
publishes a v12-compatible release (then a straightforward 11→12 bump).
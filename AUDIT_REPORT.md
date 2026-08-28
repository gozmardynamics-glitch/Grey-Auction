# GreyAuction — Source of Truth (Audit + Roadmap + Pending Work)

> **Version:** consolidate (combined audit + performance review + improvement suggestions)
> **Branch:** `feature/authjs-migration` · **Commits:** 55+ · **Backend tests:** 120/120 · **Frontend build:** green (orig. env) — see Round 11 note · **App live:** :3000 (frontend) · :3001 (API/Swagger /api/docs)
> **How to use this file:** it is the single source of truth. Work items are tracked as `[ ]` (pending), `[x]` (done), `[!]` (blocked). Update statuses here as work proceeds.

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

**Verification:** 95/95 backend tests, frontend `next build` green, all services healthy, working tree clean.

---

## 2. WORK NOW — no blockers (high-ROI, do next)

| # | Item | Impact | Notes |
|---|---|---|---|
| N1 | AI in the seller create-listing form (description generator + title optimizer via /ai/execute) | High | **[x] DONE** (e0c28fb) - buttons on auction-details step, graceful AI-not-configured state |
| N2 | Bidder notifications - outbid / won / ending-soon via Socket.IO + notifications table | High | **[x] DONE (backend+bell)** (e0c28fb) - **triggers wired** (Round 11): outbid (bid.service), won/ended (invoice-settlement), room-start (room-lifecycle) — notification.service helpers + 7 new tests |
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
| **GitHub credentials** (or `gh auth login`) | Publish the work | B1 push `feature/authjs-migration`; B2 merge to `master` + open PR |
| **Production host/Coolify access** + env secrets | Deploy | B1 docker-compose single stack; B2 migrations-only DB (`migrationsRun: true`, `synchronize: false`); B3 backups; B4 Sentry/logging |
| **Redis (or similar)** | Real caching | B1 Cache static config (categories/banners/FAQs) with invalidation |

### After-blocker work items (detail)

- `[!]` B-PAY-1: real gateway capture + webhook HMAC verification per provider (implemented seam; needs keys).
- `[x]` B-PAY-2: deposit reference idempotency (unique reference guard) — **DONE** (Round 12): app-level guard (never re-credit a used reference) + DB UNIQUE index on wallet_transactions.reference (verified live).
- `[!]` B-AI-1: live verification of every provider chat execution + fallback switch-over with configured keys.
- `[!]` B-GIT-1: `git push -u origin feature/authjs-migration`; merge to master; tag a release.
- `[!]` B-DEPLOY-1: Coolify deploy with env secrets; run migrations; verify CSP/robots for the real domain.
- `[!]` B-DEPLOY-2: automated DB backups + Sentry/instrumentation.
- `[!]` B-CACHE-1: Redis-backed cache for static config + session-scale readiness.

---

## 4. WORK LATER (strategic / growth / polish)

| # | Item | Why | When |
|---|---|---|---|
| L1 | PWA + push notifications | Mobile retention | ✅ Base done — manifest, SW (offline + static cache), offline page, install banner; push seam ready for VAPID keys (`94493cf`) |
| L2 | Multi-currency (USD/GHS) + rate display | Growth lever | Post-launch |
| L3 | Seller analytics dashboard (charts from /sellers/statistics/me) | Seller value | ✅ Done (`1463f25`) |
| L4 | Trust & safety: condition reports, KYC badges, dispute/feedback loop | Conversion | ✅ Done — backend domain + frontend UI (`e3b6c6c`, `b079518`) |
| L5 | Shipping/delivery integration + escrow | Enterprise buyers | ✅ Seams done — addresses, key-free rate calc, shipments, escrow state machine (`5135b24`, `a9c6a92`) |
| L6 | Full WCAG 2.1 audit + responsive test matrix | Compliance | Before major marketing |
| L7 | Load testing (k6) + Lighthouse budget (90+) | Scale assurance | ✅ Config done — k6 scenarios + Lighthouse 90+ budget & lhci config (`7e243fc`); run via `loadtest/` |
| L8 | Marketplace advisor map + direct-sales section | Parity with Troostwijk | ✅ Done — advisor directory (lat/lng ready for map) + buy-now section (`5b4eb54`, `6f18126`) |
| L9 | Bulk CSV import enhancements (image URLs, multicategory, price tiers) | Seller productivity | ✅ Done (`3245c4e`) |

---
## 5. Performance & Efficiency Audit (results)

### Done (commit 6a27d85)
- 9 new DB indexes on hot columns: products(sellerId, status+endTime, category); bids(productId, bidderId, productId+createdAt); invoices(payment_reference); ai_usage_logs(createdAt, featureKey+createdAt, providerName).
- Capped unbounded queries (take 100): user bids, room bids, seller listings, seller rooms, invites, content pages (50).
- Invoice summary aggregates in SQL (no full-table load).
- Provider health sweep parallelized (4 at a time).

### Remaining (see NOW + AFTER BLOCKERS)
- Static-config caching → Redis after blocker. Local TTL cache optional.
- `auth()` hoisting per request (N5).
- Lighthouse/TTFB verification needs a browser toolchain.

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
**Key scripts:** `seed:admins:dev`, `seed:demo` (ts-node), `seed-ai-providers.ts` (ts-node), `migration:run:dev`, `test`, `lint`; backend tests `npm test` (95).

**Env files:** `backend/.env`, `frontend/.env.local` — payment/LLM keys go here when available.

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

**Round 11 (follow-up execution):**
- **[x] Notification triggers wired.** `NotificationService` gained typed helpers (`notifyOutbid`/`notifyAuctionWon`/`notifyAuctionEnded`/`notifyRoomStarted`); `BidService` fires outbid on displacement (post-commit), `InvoiceSettlementService` fires won/ended on settle, `RoomLifecycleService` fires room-start to participants+creator. `BidModule`/`RoomModule`/`InvoiceModule` now import `NotificationModule`. 7 new backend tests → **110/110**.
- **[x] Bug fixed:** `RoomLifecycleService` injected `AuctionGateway` via `@Optional()` but `RoomModule` never imported `BidModule` (which exports it) — room-start/end socket broadcasts silently no-opped. `RoomModule` now imports `BidModule`; the broadcasts actually fire.
- **[x] Automated axe/WCAG 2.1 AA pass (public pages).** Added `@axe-core/playwright` + `@playwright/test`, `playwright.config.ts`, `e2e/a11y.spec.ts`, `test:a11y` script, e2e README. Ran against a live app (backend :3001 + frontend :3000, Postgres up). **All 9 public routes pass.** Fixed systematic contrast issues: light `--muted-foreground` darkened (`oklch(0.556)→0.5`), nav accent `#0067f5→#0052c4`, status badges 500→700-level, `bg-secondary` white-text buttons → dark secondary foreground. Env note: `next build` in this sandbox fails only on `next/font/google` reaching fonts.googleapis.com (offline) — `tsc --noEmit` and the dev server are green; production build needs internet.
- **[x] AI execution seam verified (still blocked by keys).** `AIOrchestratorService` has full model-chain fallback, protocol-aware providers, cost+usage logging, rate limiting; seller form (`auction_details_form.tsx`) calls `/ai/execute` for `title_optimizer`/`auction_description_generator` and gracefully toasts "AI not configured". Live execution unlocks when provider API keys are added (B-AI-1).

**Round 12 (code-only follow-ups + push prep):**
- **[x] B-PAY-2 deposit idempotency.** WalletService.deposit now short-circuits when a reference is already deposited (no double credit) and recovers from the DB unique-index race; wallet_transactions.reference got a UNIQUE index (verified applied via synchronize). 2 tests.
- **[x] Seller dashboard recent_activity.** SellerService.getDashboard now returns real activity (invoices + product listings merged, newest-first) instead of an empty array; getRecentActivity added (uses seller.user_id). 3 tests.
- **[x] Seller review is_verified_purchase.** SellerReviewService.create now verifies a purchase by checking for a won invoice (buyer + auction/product from this seller) instead of hardcoding true. 2 tests.
- **[x] Notification bell navigation.** Clicking a notification marks it read AND routes to its link (notification_bell.tsx).

**Round 13 (remaining codeable items):**
- **[x] seller-statistics real-period populate.** SellerStatisticsService.generate/updateStatistics now derive metrics from real invoices (sales/commission/orders/distinct customers & products sold), products (listings) and reviews (count/avg/positive/negative) within the period, instead of leaving zeros. 1 test.
- **[x] seller-payout balance-from-invoices.** requestPayout now computes available balance as gross earned on non-cancelled invoices minus gross already requested in live/fulfilled payouts (no longer `seller.total_sales`). 2 tests.
- **Verified:** backend 120/120 tests, nest build green, backend boots with the extra repository injections.
- **a11y re-verification (Round 13.1):** re-ran the automated axe scan against the live app after the Round 12 bell change. Found + fixed a real intermittent AA contrast bug: the featured-auction \`View Details\` button used \`variant=\"outline\"\` (bg-card, light) with \`text-white\` → 1.06:1. Switched to \`variant=\"ghost\"\` so it sits transparently on the dark gradient card. **9/9 public routes pass** across two consecutive warm runs.
- **Remaining work:** external-key blocks only (B-PAY-1/B-AI-1/B-GIT-1/B-DEPLOY-1/B-CACHE-1) + growth items (L1-L9). All code-only follow-ups now done.
- **Verified:** backend 117/117 tests, nest build green, backend boots with the new index, frontend tsc --noEmit clean.
- **Deliberately deferred (documented, not blocked):** ~~seller-statistics real-period populate and seller-payout balance-from-invoices~~ — DONE in Round 13.
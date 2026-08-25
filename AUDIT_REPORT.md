# GreyAuction - Comprehensive Audit & Setup Report (v2)

> **Date:** 2026-08-25  |  **Scope:** Grey-Auction monorepo (NestJS backend + Next.js 16 frontend)
> **Method:** automated deep code audit + live runtime verification
> **v2 changes:** authentication re-architected onto **Auth.js (NextAuth v5)**; work broken into a phased roadmap.

## 1. Executive Summary

**What this is.** A Nigerian-focused auction marketplace ("GreyAuction") built with a **NestJS**
REST/WebSocket API (19 modules, ~158 endpoints) and a **Next.js 16** storefront plus three
dashboards (admin / buyer / seller). It also carries an **AI LLM Registry** (15 provider presets,
health checks, 15 feature configs) and an **agent MCP** subsystem.

**Good news.** The foundation is strong: backend modules, schema (27 tables), Swagger docs, an
invoice/PDF/settlement engine, a payment-gateway stub (Flutterwave/Paystack/mock), SMTP/SMS
scaffolding, and a large reusable component library all exist.

**Bad news.** The app could **not boot at all** out of the box: the frontend was hard-wired to
**Clerk** with **no API keys in the repo** (ClerkProvider + clerkMiddleware throw without keys). Much
of the UI renders **mock data** because it calls API endpoints that **do not exist** (silent
fallbacks), and several real workflows were non-functional end-to-end (registration, onboarding).

### What I did (setup)
- Extracted the project, installed all dependencies (network retries needed - host DNS is flaky).
- Provisioned a dedicated PostgreSQL 16 (pgvector) container on port **5433**.
- Created .env files for both apps; started and verified the backend on **:3001**.
- **Replaced Clerk with Auth.js (NextAuth v5)** - credentials provider, JWT session, middleware guards. Fully self-contained, works offline (Phase 1 done and verified).
- Seeded a full demo dataset (admins, buyer, seller, 8 categories, 8 products + 23 bids, 3 banners, 6 FAQs, fee config, 15 AI feature configs).
- Started the frontend on **:3000** and opened it in your browser.
- Fixed concrete bugs (middleware /api passthrough, auction-card image fallback, backend prod entry path, product model fields).

### Where it runs now
| Component | URL | Status |
|-----------|-----|--------|
| Frontend (Next.js) | http://localhost:3000/en | running |
| Backend API | http://localhost:3001/api | running |
| Swagger docs | http://localhost:3001/api/docs | running |
| PostgreSQL (Docker) | localhost:5433 | running |

### Demo accounts (Auth.js credentials login)
| Role | Email | Password | Dashboard |
|------|-------|----------|-----------|
| Super Admin | admin@greyauction.com | Admin@12345 | /admin/dashboard |
| Seller | demo@seller.com | Seller@12345 | /seller/dashboard |
| Buyer | demo@buyer.com | Buyer@12345 | /buyer/dashboard |

## 2. What Is Already Done (Working)

**Backend (NestJS, 19 modules, ~158 endpoints)**
- Auth: JWT login/register, OTP send/verify, password reset, Google OAuth stub
- Admin: admins CRUD, buyer list/suspend/activate, AI registry, agents, banners, FAQs
- Seller (34 endpoints): registration, KYC documents, payouts, reviews, statistics, org types
- Products/auctions: create/list/featured/approve/reject, reserve price, status machine
- Bids: place/list with a Socket.IO WebSocket gateway (real-time bid broadcast)
- Rooms: private invite rooms, participants, deposit flag
- Invites: generate/validate/respond/use, exclusive + request modes, email/SMS
- Categories, Banners, FAQs, Tickets, Settings, Content pages (privacy/terms), Audit
- Fees config (commission/VAT/charges with breakdown calc), Invoices (PDF via pdfkit, email, cron settlement, stats), Payments (Flutterwave/Paystack/mock)
- AI: LLM providers/models/features/usage, health-checked orchestrator, 15 provider presets
- Agents: MCP server, tools, workflows, metrics, analytics

**Frontend (Next.js 16, 40+ pages, 3 dashboards)**
- (website): home, auctions listing + detail, blog, career, about-us, FAQ, contact, cart, checkout, wishlist, room
- (auth): login, buyer/seller/org register, forgot/reset password, OTP steps
- (admin): dashboard, admins, buyers, sellers, bids, auctions, banners, categories, FAQs, tickets, payments, AI providers/models, agents, settings
- (buyer)/(seller): dashboards, wallet (deposit/withdraw/PIN), messages, chats, notifications, purchases/sales, settings
- Shared component library (90+ Radix/Tailwind components), Redux + RTK Query, i18n (en/fr/nl), next-intl

**Authentication - Auth.js (NextAuth v5)** [Phase 1 - DONE]
- Credentials provider that calls the backend /auth/login (bcrypt-verified) and returns the backend JWT.
- JWT session strategy; role + backend accessToken carried in the session cookie.
- app/api/auth/[...nextauth]/route.ts exposes GET/POST; middleware (proxy.ts) protects routes by role (admin/seller/buyer) using token decode with salt.
- Client flows: login / register / organization register / logout all use next-auth signIn / signOut / useSession; Redux bridged via auth-sync.
- next-auth/react SessionProvider wraps the app; types/next-auth.d.ts augments Session/JWT.
- Verified: all three dashboards render behind correct roles; anonymous and cross-role access redirect to login.

**Infra**: GitHub Actions CI (lint > build > test), root Dockerfiles, .env.example, migrations + seeds, Swagger
## 3. What I Had to Do to Get It Running

1. **Clerk -> Auth.js (NextAuth v5) migration** (the biggest blocker). Removed Clerk from proxy.ts, providers.tsx, auth-sync.tsx, login / buyer-register / seller-register / organization-register pages, and logout-dialog.tsx. Added auth.ts (credentials provider -> backend /auth/login, JWT session, role + accessToken), auth.config.ts (edge-safe middleware config), app/api/auth/[...nextauth]/route.ts, SessionProvider, and role-based middleware in proxy.ts (JWT decode with cookie-name salt). Also updated types/next-auth.d.ts and .env.local (AUTH_SECRET, AUTH_URL).
2. **Database**: started greyauction-postgres (pgvector:pg16) on port 5433; set backend/.env.
3. **Seeds**: ran the admin seed + a new seed-demo.ts (demo buyer/seller, categories, products, bids, banners, FAQs, fee config) + AI feature configs (15 rows).
4. **Env**: backend/.env and frontend/.env.local (API URL, AUTH_SECRET, AUTH_URL).
5. **Bug fixes**: middleware /api passthrough, auction-card image fallback, product model optional fields, backend start:prod + Dockerfile entry path (dist/src/main), middleware async callback + salt-based JWT decode.

## 4. Issues, Bugs, Gaps & Broken Links (as of v2)

### Red - Critical (alpha-blocking; fixed or needs a decision)
| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 1 | Frontend could not boot: hard-wired to Clerk with no keys (ClerkProvider + middleware throw) | Critical | Fixed via Auth.js migration |
| 2 | Registration end-to-end was broken: Clerk users were unrelated to backend users; OTP steps were UI-only | Critical | Fixed (Auth.js credentials sign-in after register) |
| 3 | Backend prod entry point wrong: npm run start:prod and Dockerfile.backend run node dist/main, but build outputs dist/src/main | Critical | Fixed |
| 4 | Lockfile mismatch / network flakiness broke installs | Critical | Worked around |
| 5 | Auth.js beta + Next 16 gotcha: middleware does not surface custom JWT claims (role) on req.auth.user; initial role check caused a redirect loop | Critical | Fixed - decode the JWT directly with cookie-name salt in middleware |

### Orange - High: real data never shows (mock fallbacks mask 404s) [Phase 2]

frontend/lib/server/data.ts (and the admin/seller islands) call endpoints that do not exist on the backend, so apiFetch returns null and the UI silently falls back to hardcoded mock data:

| Frontend call | Backend route | Result |
|---------------|---------------|--------|
| /products/{slug} (detail pages) | only /products/:id (UUID) | 404 then mock |
| /auctions/related, /auctions?category= | no /auctions controller | 404 then mock |
| /testimonials, /cart, /orders, /wishlist | none | 404 then mock |
| /admin/auctions, /admin/bids, /admin/sellers, /admin/payments | none | 404 then mock |
| /admin/banners (list), /admin/faqs (list) | only PATCH/DELETE exist | 404 then mock |
| /faqs (public list), /categories (list) | only :slug routes | 404 then mock |
| /seller/listings, /seller/payments, /seller/sales, /seller/conversations | none | 404 then mock |

**Impact:** admin/buyer/seller dashboards and several public sections look complete but run on mock
data (e.g. homepage banners, FAQs and categories are not the real seeded rows). The backend data
exists and is reachable at the correct routes; the frontend simply points at wrong/legacy routes.

**Recommendation:** point data.ts and the island API files at the real routes (/products, /categories,
/banners, /faqs, /rooms, /tickets, /invoices, /sellers/*) and add the missing list/report endpoints
(GET /admin/banners, GET /admin/faqs, GET /categories, GET /faqs, admin auctions/bids/sellers/payments).

### Orange - High: broken / incomplete workflows [Phase 3]
- **Password-reset link is broken.** The backend builds FRONTEND_URL/reset-password?token=..., but the real page is at /auth/login/forgot_password/reset_password. There is no /reset-password route.
- **Seller onboarding (Become-a-Seller wizard) fails silently.** It POSTs to /sellers/register (requires a JWT) without a token and with a payload that does not match RegisterSellerDto; errors are swallowed.
- **product.findBySlug is just findById** - no real slug column, so slug detail URLs cannot resolve a product.
- **Dead API definitions:** auth.api.ts defines getProfile (GET), completeProfile (PATCH), verifyIdentity, resendOtp - none match the backend (POST /auth/profile etc.) and none are used anywhere.
- **Auto-bid / proxy bidding** not implemented (DB flag exists); no anti-sniping extension; no bid increment table. [Phase 5]
- **Room lifecycle** (scheduled -> live -> closed) is manual; deposit/payment and in-room bid placement not wired. [Phase 5]
- **Invite request mode** lacks the seller-approval (join -> approve) flow. [Phase 5]
- **Bulk lot upload (CSV)** - backend not built. [Phase 5]
- **Payments** run in mock mode (no gateway keys) - intended, but real capture needs keys. [Phase 5]

### Yellow - Medium: content, i18n, UX, quality [Phase 4]
- **i18n is only ~26% translated.** en = 204 keys / 12 sections; fr = 53, nl = 53 keys / 4 sections. Switching to fr/nl leaves most of the UI in English.
- **Form validation gutted.** (auth)/components/schema.ts has every schema commented out and replaced with "all optional" versions.
- **Footer vs mobile-menu brand links are inconsistent placeholders.** Footer points to generic facebook.com / twitter.com / instagram.com / linkedin.com; mobile-menu uses greyauctions-specific URLs.
- **Blog feed routes 404** (/feed.xml, /feed.json, /v1/articles, /v1/categories).
- **Empty Image src warning** - empty string passed to a Next Image.
- **39 console.log** statements in production components.
- **Sitemap/robots hardcode greyauction.com** (not env-driven).
- **Mock constants** in wallet.tsx; few loading/empty/error states; mobile/responsive audit not done.

### Green - Low: tech debt / cleanup [Phase 6]
- Unused next-auth types were re-purposed (now used); @clerk/nextjs dep remains in package.json (uninstall).
- CSP allows unsafe-inline + unsafe-eval (tighten in prod).
- synchronize: true in dev (must be migrations-only in prod).
- Backend has 5 TODO markers (seller stats/payout/review verification).
- Only 4 backend spec files + 5 frontend component tests; no E2E or API integration tests.
## 5. Gap vs. Industry Benchmark (Troostwijk-style)

Still missing / partial:
- Deep category hierarchy (8 flat categories; no parent-child model / mega-menu)
- Lot count per auction, location + flag on cards, multi-image thumbnail stacks
- Lot specification table, condition report, collection/viewing info, legal info, CO2 badge, bidder anonymity, prev/next lot nav, image counter
- Direct-sales (fixed-price) section, marketplace advisor map, seller statistics charts
- Multi-currency + daily exchange rates (NGN only); shipping/delivery; buyer protection / escrow / disputes
- PWA + WCAG 2.1 AA accessibility statement; more locales (de/es/ar)
- E2E (Playwright) + load testing; structured logging/Sentry; DB backup schedule

## 6. Phased Roadmap (work broken into phases)

### Phase 1 - Authentication re-platform (DONE, verified)
- Replace Clerk with Auth.js (NextAuth v5): credentials provider, JWT session, role-based middleware, SessionProvider, signIn/signOut/useSession wiring, Redux bridge.
- Deliverables: auth.ts, auth.config.ts, app/api/auth/[...nextauth]/route.ts, proxy.ts rewrite, providers/auth-sync/login/register/org/logout updates, types, env.
- Verified: admin / seller / buyer login + dashboards; anonymous and cross-role redirects.

### Phase 2 - Make the data real (highest ROI, ~2-3 days)
1. Fix API contracts in lib/server/data.ts + admin/seller islands to point at real routes (/products, /categories, /banners, /faqs, /rooms, /tickets, /invoices, /sellers/*).
2. Add missing backend endpoints: GET /admin/banners, GET /admin/faqs, GET /categories (list), GET /faqs (public), admin auctions/bids/sellers/payments reports.
3. Remove mock fallbacks once endpoints resolve; keep graceful empty states.
4. Expose slug, location (city/country/countryCode), lotCount, watchersCount, rating on Product + map in the auction card/detail model.
- Acceptance: homepage banners/FAQs/categories and all three dashboards show live seeded data; no mock in critical paths.

### Phase 3 - Fix broken workflows (~2-3 days)
1. Password-reset link: point backend email to /auth/login/forgot_password/reset_password (or add /reset-password route).
2. Seller wizard: run post-login, attach Bearer token, build a valid RegisterSellerDto payload, surface validation errors; wire success -> seller dashboard.
3. Restore form validation (uncomment/rewrite (auth)/components/schema.ts with real rules).
4. Align or remove dead RTK auth endpoints (getProfile GET, completeProfile PATCH, verifyIdentity, resendOtp).
5. Fix blog feed 404s (implement /feed.xml, /feed.json or remove the requesting components).
6. Fix empty Image src warnings; unify footer/mobile-menu social links; console.log cleanup.

### Phase 4 - i18n, content & UX polish (~2-3 days)
1. Complete fr/nl translations (204 keys each - currently 53).
2. Add loading/empty/error states, skeletons, toast coverage; wallet mock constants -> real endpoints.
3. Env-driven sitemap/robots; SEO metadata (Auction/Product schema, canonicals, breadcrumbs).
4. Responsive + accessibility pass (WCAG AA), PWA manifest + offline shell.

### Phase 5 - Complete the auction engine (~1-2 weeks)
1. Bidding: auto-bid/proxy bidding (max-bid + step table over WebSocket), anti-sniping extension, bidder anonymity, bid history timestamps.
2. Rooms: automated status cron (scheduled -> live -> closed), deposit collection, in-room bid UI.
3. Invites: seller approval for request mode; QR + Telegram share; notifications.
4. Payments: Flutterwave/Paystack keys, webhook success -> invoice paid, buyer-premium breakdown UI (fee config exists).
5. Bulk lot upload (CSV) + product moderation queue UX.

### Phase 6 - Production hardening & ship (~1 week)
1. Deployment: docker-compose single stack, use dist/src/main, Coolify webhook auto-deploy, .env secret management.
2. Integrity: migrationsRun true + synchronize false, prod migrations, S3 backups, structured logging + Sentry, per-endpoint rate limits, tighten CSP.
3. Tests: E2E (Playwright) smoke (home -> listing -> detail -> bid -> checkout), API integration (supertest), load (k6).
4. Remove @clerk/nextjs from package.json; dep cleanup; license/security scan.

### Phase 7 - Differentiate (ongoing)
1. Wire AI registry into UX: description generator, image captioning/tagging, smart search (pgvector), chatbot, pricing/bid prediction (endpoints exist).
2. Multi-currency + exchange rates, shipping/delivery, escrow, disputes, affiliate/loyalty.
3. More locales (de/es/ar); marketplace advisor map; direct-sales section.

**Recommended order:** Phase 2 -> Phase 3 -> Phase 4 -> Phase 5 -> Phase 6 -> Phase 7.
The cheapest, highest-impact win is **Phase 2**, which turns every dashboard from "looks real" to actually real.

## 7. Quick Reference

**Start order (dev):**
1. docker start greyauction-postgres
2. cd backend && npm run start:dev (or npm run build && npm run start:prod)
3. cd frontend && npm run dev
4. Open http://localhost:3000/en (Swagger at http://localhost:3001/api/docs)

**Env files:** backend/.env, frontend/.env.local (created by this setup).
**Key scripts:** seed:admins:dev, seed:demo (via ts-node), migration:run:dev, test, lint.

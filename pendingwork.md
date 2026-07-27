# GreyAuction Platform — Pending Work & Implementation Roadmap

> **Living document — single source of truth for project tracking.**  
> Last updated: 2026-07-27T16:15 | Status: **DEPLOYED** (Coolify + VPS)  
> GitHub: `github.com/gozmardynamics-glitch/Grey-Auction` | Env: `https://coolify.gozmar.com`

---

## Legend

| Icon | Meaning |
|------|---------|
| ✅ | Completed |
| 🔴 | Not started — critical |
| 🟡 | Not started — important |
| ⚪ | Not started — nice-to-have |
| 🔵 | In progress |
| ⚠️ | Blocked / known issue |

---

## 1. Completed Milestones

### 1.1 Foundation (Commits: `7a11b54` → `9cabf71`)
| # | Item | Status |
|---|------|--------|
| 1 | NestJS backend — 13 modules (auth, products, bids, rooms, categories, banners, FAQs, tickets, settings, content, seller, admin) | ✅ |
| 2 | JWT auth + Google OAuth + password reset + OTP verification | ✅ |
| 3 | WebSocket gateway (Socket.IO) for real-time bidding | ✅ |
| 4 | Seller system — 40+ REST endpoints, KYC, payouts, reviews, statistics | ✅ |
| 5 | Next.js 16 frontend — 40+ pages across (website), (domain), (seller) route groups | ✅ |
| 6 | i18n — 170+ English translation keys (en, fr, nl locales) | ✅ |
| 7 | Auth.js v5 + Redux bridge — dual-layer session management | ✅ |
| 8 | Admin panel — 14 pages (users, auctions, banners, bids, categories, FAQs, settings, etc.) | ✅ |
| 9 | File upload storage service (local disk + SHA256) | ✅ |
| 10 | Email service (Nodemailer prod / console dev) for OTP, welcome, reset, verification | ✅ |
| 11 | 5-column card grid at xl+ breakpoint + 40% timer font reduction | ✅ |
| 12 | 12 brand logos replaced with colored circle initials | ✅ |
| 13 | Content Security Policy (CSP) via next.config.ts headers | ✅ |
| 14 | /blog, /career, /about-us public pages | ✅ |
| 15 | DB migrations — 10 core tables, 6 enums, 5 FKs (seller tables separate) | ✅ |
| 16 | 72 automated tests (40 backend Jest + 32 frontend Vitest) | ✅ |
| 17 | Dockerfiles for backend + frontend | ✅ |
| 18 | Coolify deployment — PostgreSQL healthy, backend + frontend live on VPS | ✅ |
| 19 | Admin content editors (privacy-policy, terms-and-conditions) | ✅ |
| 20 | Category/sub-category navigation wired | ✅ |

---

## 2. Gap Analysis — GreyAuction vs Troostwijk Auctions

### 2.1 Category & Discovery

| # | Feature | Troostwijk | GreyAuction | Gap | Priority |
|---|---------|-----------|-------------|-----|----------|
| G1 | Deep category hierarchy (50+ categories, 5 levels deep) | ✅ | 9 flat categories | Categories stored as flat list; no parent-child nesting, no breadcrumb navigation | 🔴 HIGH |
| G2 | Sub-categories per parent category | ✅ | Basic strings array | Sub-categories stored as `simple-array` on entity but no dedicated sub-category model or UI | 🔴 HIGH |
| G3 | Auction bidding status filtering (OPEN, CLOSED, UPCOMING, PLANNED) | ✅ | Basic only | No status filter on auction listing page; no "new auctions" or "closing soon" tabs | 🔴 HIGH |
| G4 | Lot count per auction (e.g., "209 lots in this auction") | ✅ | ❌ | Product entity has no lot-count group; no auction-grouping concept | 🟡 MEDIUM |
| G5 | Advanced sorting (PRICE_DESC, START_DATE, END_DATE, POPULARITY) | ✅ | Basic only | Sort dropdown exists but limited options | 🟡 MEDIUM |
| G6 | Category image + description on category landing pages | ✅ | ❌ | Category entity has imageUrl/description fields but no dedicated landing UI | 🟡 MEDIUM |

### 2.2 Auction Experience

| # | Feature | Troostwijk | GreyAuction | Gap | Priority |
|---|---------|-----------|-------------|-----|----------|
| G7 | Image galleries per lot (multi-image with carousel viewer) | ✅ | Single image | Product entity has `images` JSONB array but UI only shows first image; no gallery viewer | 🔴 HIGH |
| G8 | Live countdown timer with seconds (real-time sync) | ✅ | Days/hrs/mins only | Countdown component exists but doesn't show seconds or sync via WebSocket | 🔴 HIGH |
| G9 | Auto-bid / proxy bidding (set max, auto-increment) | ✅ | Stub in backend | Bid entity has `isAutoBid` flag but no auto-bid logic or UI | 🔴 HIGH |
| G10 | Trending lots with bid count + watcher count | ✅ | Basic carousel | Trending component exists but shows generic mock data, not real-time watcher counts | 🟡 MEDIUM |
| G11 | Reserve price display + "reserve not met" indicator | ✅ | Backend only | `hasReservePrice` and `reservePrice` on entity but not shown in UI | 🟡 MEDIUM |
| G12 | Bid increment table (auto-calculated next bid) | ✅ | ❌ | No bid increment logic; users enter arbitrary amounts | ⚪ LOW |
| G13 | Anonymous bidding / bidder ID masking | ✅ | ❌ | Bidder names exposed; no privacy option | ⚪ LOW |
| G14 | "Closure imminent" / extended bidding (anti-sniping) | ✅ | ❌ | Auction ends at fixed time; no extension on last-minute bids | ⚪ LOW |

### 2.3 Buyer Journey

| # | Feature | Troostwijk | GreyAuction | Gap | Priority |
|---|---------|-----------|-------------|-----|----------|
| G15 | Buyer registration (individual + business with company details) | ✅ | Basic email/pass | User entity has role enum but no buyer profile (address, phone, company, VAT) | 🔴 HIGH |
| G16 | Payment integration (gateway: Stripe, Flutterwave, Paystack) | ✅ | ❌ | No payment gateway; cart/checkout pages are UI-only | 🔴 HIGH |
| G17 | Buyer premium calculator (configurable % per category) | ✅ | ❌ | No concept of buyer premium; bid amount is final price | ⚪ LOW |
| G18 | Shipping/delivery integration (carrier API, tracking) | ✅ | ❌ | No shipping logic; no delivery address collection | 🟡 MEDIUM |
| G19 | Invoice generation (PDF with tax breakdown) | ✅ | ❌ | No invoice system | 🟡 MEDIUM |
| G20 | Multi-currency display + exchange rates (updated daily) | ✅ | NGN only | Hardcoded NGN; no currency conversion | 🟡 MEDIUM |
| G21 | Watchlist with email/SMS alerts (auction ending, outbid, won) | ✅ | Basic wishlist | Wishlist page exists but no alert/notification system per watched item | 🟡 MEDIUM |

### 2.4 Seller Features

| # | Feature | Troostwijk | GreyAuction | Gap | Priority |
|---|---------|-----------|-------------|-----|----------|
| G22 | Bulk lot upload (CSV/Excel with image URLs) | ✅ | Single listing | Create listing page handles one item at a time; no bulk import | 🔴 HIGH |
| G23 | Auction scheduling (future start dates, auto-open) | ✅ | Basic only | Product entity has `endTime` but no concept of scheduled start date or status transition | 🔴 HIGH |
| G24 | Seller analytics dashboard (views, watchers, bid velocity) | ✅ | Basic stats | Seller entity has cached metrics but no analytics UI with charts/trends | 🟡 MEDIUM |
| G25 | Reserve price management UI | ✅ | Backend only | Reserve price in entity but no UI toggle or management in create listing form | 🟡 MEDIUM |
| G26 | Seller premium/commission breakdown | ✅ | Backend only | `commission_rate` on seller entity but no visible breakdown in dashboard | ⚪ LOW |

### 2.5 Content & Trust

| # | Feature | Troostwijk | GreyAuction | Gap | Priority |
|---|---------|-----------|-------------|-----|----------|
| G27 | Customer testimonials with real photos, names, and roles | ✅ | Basic text cards | Testimonials exist as mock data only; no real photos or CMS integration | 🟡 MEDIUM |
| G28 | Blog/news section with SEO-optimized articles | ✅ | Created (static) | /blog page exists with 4 static posts; no CMS backend, no real content | 🟡 MEDIUM |
| G29 | Seller rating + review system visible to buyers | ✅ | Backend only | Review entity + service exist; no public-facing review display on listings | 🟡 MEDIUM |
| G30 | Our story / brand heritage page | ✅ | Created (about-us) | /about-us page exists with static content | ✅ |
| G31 | Accessibility page (WCAG compliance) | ✅ | ❌ | No accessibility statement or compliance work | ⚪ LOW |

### 2.6 Social & Marketing

| # | Feature | Troostwijk | GreyAuction | Gap | Priority |
|---|---------|-----------|-------------|-----|----------|
| G32 | Social media links + share buttons (FB, IG, LinkedIn, WhatsApp) | ✅ | ❌ | No social media integration; no share buttons on listings | 🔴 HIGH |
| G33 | Newsletter signup + email marketing integration | ✅ | ❌ | No email capture; no Mailchimp/SendGrid integration | 🔴 HIGH |
| G34 | SEO optimization (dynamic sitemap.xml, meta tags, Schema.org) | ✅ | Basic only | No sitemap; basic meta tags only; no structured data for auctions | 🔴 HIGH |
| G35 | Multi-language support (7 languages vs current 3) | ✅ | en, fr, nl | 3 locales exist; missing major languages (de, es, ar, zh) | 🟡 MEDIUM |
| G36 | Release notes / changelog page | ✅ | ❌ | No changelog or release notes | ⚪ LOW |

### 2.7 AI & Smart Features

| # | Feature | Troostwijk | GreyAuction | Gap | Priority |
|---|---------|-----------|-------------|-----|----------|
| G37 | AI lot description generator | ✅ (new) | ❌ | No AI features at all | 🔴 HIGH |
| G38 | AI image captioning + auto-tagging | ✅ (new) | ❌ | No AI features at all | 🟡 MEDIUM |
| G39 | Personalized recommendations ("You might like") | ✅ (new) | ❌ | No personalization engine | 🟡 MEDIUM |
| G40 | Smart search (semantic search across listings) | ✅ (new) | ❌ | Basic text search only; no vector/semantic search | 🟡 MEDIUM |
| G41 | AI chatbot / virtual assistant | ❌ | ❌ | No chatbot | 🟡 MEDIUM |
| G42 | Fraud detection (suspicious bids, accounts) | ❌ | ❌ | No fraud detection | 🟡 MEDIUM |
| G43 | AI pricing recommendations (starting bid, reserve) | ❌ | ❌ | No pricing intelligence | 🟡 MEDIUM |
| G44 | AI content moderation (auto-flag inappropriate listings) | ❌ | ❌ | No moderation AI | 🟡 MEDIUM |
| G45 | AI document OCR (KYC document extraction) | ❌ | ❌ | Manual KYC review; no OCR | ⚪ LOW |
| G46 | AI email campaign generator + A/B testing | ❌ | ❌ | No campaign automation | ⚪ LOW |

### 2.8 Operational & Technical

| # | Feature | Troostwijk | GreyAuction | Gap | Priority |
|---|---------|-----------|-------------|-----|----------|
| G47 | Production DB migrations on live server | ✅ | ⚠️ | `synchronize: true` on deployed backend; migrations not yet run on prod DB | 🔴 HIGH |
| G48 | Full CI/CD pipeline (GitHub Actions: lint → test → build → deploy) | ✅ | ❌ | No CI/CD; manual pushes and Coolify redeploys | 🔴 HIGH |
| G49 | Rate limiting on auth endpoints | ✅ | ❌ | No throttler; brute-force protection missing | 🟡 MEDIUM |
| G50 | Logging & monitoring (Winston/Pino, Sentry, uptime) | ✅ | ❌ | No structured logging; no error tracking; no uptime monitoring | 🟡 MEDIUM |
| G51 | Automated database backups (S3-compatible) | ✅ | ❌ | Coolify supports this but not configured for greyauction DB | 🟡 MEDIUM |
| G52 | End-to-end tests (Playwright smoke tests on all pages) | ❌ | ❌ | Only unit/component tests exist; no E2E or API integration tests | 🟡 MEDIUM |
| G53 | Production Docker build working (nixpacks cache issue resolved) | ✅ | ⚠️ | Coolify Docker build succeeds but env vars not baked; Auth.js 500 on prod | 🔴 HIGH |
| G54 | PWA / mobile app readiness | ❌ | ❌ | No service worker; no offline support; no PWA manifest | ⚪ LOW |

---

## 3. Strategic Implementation Roadmap

### Phase 0 — Production Stabilization (NOW)

> **Goal:** Fix all known production issues. Make the deployed app fully functional with auth.

| # | Task | File(s) | Effort |
|---|------|---------|--------|
| P0.1 | Fix Auth.js 500 by adding `AUTH_SECRET` to NextAuth config in `auth.ts` | `frontend/auth.ts` | 5 min |
| P0.2 | Force Coolify rebuild with env vars (new commit → redeploy) | Coolify API | 10 min |
| P0.3 | Run DB migrations on production PostgreSQL via Coolify terminal | `backend/` | 10 min |
| P0.4 | Verify full auth flow (register → login → browse → bid → dashboard) | Playwright | 20 min |
| P0.5 | Remove `synchronize: true`, ensure migrations-only mode | `backend/src/config/database.config.ts` | 5 min |
| P0.6 | Set up GitHub Actions CI: lint + typecheck + test | `.github/workflows/ci.yml` | 30 min |

### Phase 1 — Core Auction Experience (Week 1)

> **Goal:** Match Troostwijk's essential auction features. Multi-image galleries, deep categories, auto-bidding, live timers.

| # | Task | Dependencies | Effort |
|---|------|-------------|--------|
| P1.1 | **Image gallery / carousel** — multi-image upload UI, lightbox viewer on listing detail page | None | 4h |
| P1.2 | **Deep category hierarchy** — parent-child nesting in DB, breadcrumb navigation, category landing pages with filters | G1, G2 | 6h |
| P1.3 | **Auction status filtering** — tabs for OPEN, CLOSING SOON, UPCOMING, PAST on listing page | G3 | 3h |
| P1.4 | **Live countdown with seconds** — WebSocket-synced countdown component showing DD:HH:MM:SS | G8 | 3h |
| P1.5 | **Auto-bid / proxy bidding** — max bid input, auto-increment logic, WebSocket broadcast | G9 | 6h |
| P1.6 | **Buyer registration enhancement** — add phone, address, company name, VAT fields | G15 | 3h |
| P1.7 | **Bulk lot upload** — CSV template download, file upload parser, batch create API | G22 | 6h |
| P1.8 | **Auction scheduling** — start date field, auto-open via cron/queue, status transitions | G23 | 4h |

### Phase 2 — Payments & Buyer Journey (Week 2)

> **Goal:** End-to-end transaction flow. Payment, invoices, shipping, buyer tools.

| # | Task | Dependencies | Effort |
|---|------|-------------|--------|
| P2.1 | **Payment gateway integration** — Flutterwave/Paystack for NGN, Stripe for international | G16 | 8h |
| P2.2 | **Buyer premium calculator** — configurable % per category, shown on listing and checkout | G17 | 3h |
| P2.3 | **Invoice generation** — PDF invoices with item details, buyer/seller info, tax breakdown | G19 | 5h |
| P2.4 | **Shipping/delivery** — address collection, shipping cost calculator, carrier selection | G18 | 5h |
| P2.5 | **Watchlist alerts** — email/SMS notifications for "auction ending soon", "outbid", "won" | G21 | 5h |
| P2.6 | **Seller analytics dashboard** — charts for views, watchers, bid velocity, conversion | G24 | 6h |

### Phase 3 — Social, Marketing & SEO (Week 3)

> **Goal:** Drive traffic, build audience, convert visitors. Social integration, newsletters, search optimization.

| # | Task | Dependencies | Effort |
|---|------|-------------|--------|
| P3.1 | **Social media integration** — share buttons (FB, X, LinkedIn, WhatsApp) on every listing | G32 | 2h |
| P3.2 | **Newsletter system** — Mailchimp/SendGrid integration, subscribe form, welcome email sequence | G33 | 5h |
| P3.3 | **SEO optimization** — dynamic sitemap.xml, Schema.org Auction structured data, meta tags | G34 | 5h |
| P3.4 | **Multi-language expansion** — add German (de), Spanish (es), Arabic (ar) locale files | G35 | 8h |
| P3.5 | **Content management** — wire blog to backend ContentPage entity, add CMS editor | G28 | 4h |
| P3.6 | **Customer testimonials** — connect to real data, add photo upload, rating display on listing | G27, G29 | 3h |

### Phase 4 — AI Features (Week 4-5)

> **Goal:** Differentiate from competitors with AI-powered tools. Model-agnostic architecture.

| # | Task | Dependencies | Effort |
|---|------|-------------|--------|
| P4.1 | **AI provider abstraction layer** — `AIService` with pluggable backends (OpenAI, Claude, Gemini, OpenRouter, local) | None | 6h |
| P4.2 | **AI admin settings panel** — provider selection, model picker, API key management, usage dashboard | P4.1 | 4h |
| P4.3 | **AI lot description generator** — generate descriptions from bullet points + specification input | P4.1 | 3h |
| P4.4 | **AI image captioning + auto-tagging** — auto-generate keywords/tags from uploaded images | P4.1 | 4h |
| P4.5 | **AI pricing recommendations** — suggest starting bid + reserve price based on similar lots | P4.1 | 3h |
| P4.6 | **Smart search** — semantic/vector search via embeddings + pgvector or Pinecone | P4.1 | 6h |
| P4.7 | **AI chatbot / virtual assistant** — answer FAQs, guide users through registration/bidding | P4.1 | 5h |
| P4.8 | **Personalized recommendations** — "You might like" based on browsing + bid history embeddings | P4.1, P4.6 | 5h |
| P4.9 | **AI content moderation** — auto-flag inappropriate listings, images, descriptions | P4.1 | 3h |
| P4.10 | **AI fraud detection** — ML classifier for suspicious bids, accounts, seller behavior | P4.1 | 6h |

### Phase 5 — Platform Maturity (Week 6-7)

> **Goal:** Production hardening, monitoring, automation, developer experience.

| # | Task | Dependencies | Effort |
|---|------|-------------|--------|
| P5.1 | **CI/CD pipeline** — GitHub Actions: lint → typecheck → test → build → deploy via Coolify webhook | G48 | 4h |
| P5.2 | **Logging & monitoring** — Winston structured logging, Sentry error tracking, Coolify uptime alerting | G50 | 4h |
| P5.3 | **Rate limiting** — `@nestjs/throttler` on auth endpoints, API rate limiting | G49 | 2h |
| P5.4 | **Database backups** — Coolify automated PostgreSQL backups to S3 | G51 | 1h |
| P5.5 | **E2E tests** — Playwright smoke tests for critical paths (home → listing → detail → bid → checkout) | G52 | 6h |
| P5.6 | **PWA setup** — service worker, offline support, install manifest, responsive audit | G54 | 4h |
| P5.7 | **API integration tests** — supertest-based E2E tests for all REST endpoints | G52 | 4h |
| P5.8 | **Load testing** — k6/artillery scripts for auction stress testing (100+ concurrent bidders) | P5.2 | 3h |

### Phase 6 — Advanced Features (Week 8+)

> **Goal:** Market-leading features. Extended bidding, buyer premium, mobile apps.

| # | Task | Dependencies | Effort |
|---|------|-------------|--------|
| P6.1 | **Extended bidding / anti-sniping** — auto-extend auction by 2 min on last-minute bids | G14 | 4h |
| P6.2 | **Multi-currency + exchange rates** — real-time exchange rate API, display conversion | G20 | 4h |
| P6.3 | **Push notifications** — browser push + optional mobile push via Firebase | — | 5h |
| P6.4 | **Anonymous bidding** — bidder ID masking with configurable anonymity | G13 | 3h |
| P6.5 | **Affiliate program** — referral links, commission tracking, payout system | — | 8h |
| P6.6 | **Loyalty program** — points for bids, purchases, referrals, redeemable for premium features | — | 6h |
| P6.7 | **Mobile app** — React Native or PWA wrap with native push, camera for listing photos | — | 40h |

---

## 4. AI Architecture — Model Agnostic Design

### 4.1 Provider Interface

```typescript
// backend/src/common/ai/ai.interface.ts
export interface AIChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AICompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  responseFormat?: 'text' | 'json_object';
}

export interface AIProvider {
  readonly name: string;
  readonly models: string[];
  chat(messages: AIChatMessage[], options?: AICompletionOptions): Promise<string>;
  chatJSON<T>(messages: AIChatMessage[], options?: AICompletionOptions): Promise<T>;
}

export interface AIImageProvider extends AIProvider {
  caption(imageUrl: string): Promise<string>;
  tag(imageUrl: string): Promise<string[]>;
}

export interface AIEmbeddingProvider extends AIProvider {
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}
```

### 4.2 Supported Providers

| Provider | Models | Capabilities |
|----------|--------|-------------|
| **OpenAI** | gpt-4o, gpt-4o-mini, dall-e-3, text-embedding-3 | Chat, JSON, images, embeddings |
| **Claude** (Anthropic) | claude-opus-4, claude-sonnet-4, claude-haiku-3.5 | Chat, JSON, images |
| **Gemini** (Google) | gemini-2.5-pro, gemini-2.5-flash | Chat, JSON, images, embeddings |
| **OpenRouter** | 200+ models via unified API | All capabilities |
| **Local** | Ollama, LM Studio | Chat, embeddings (offline) |

### 4.3 Admin Settings Schema

```typescript
// backend/src/settings/ai-settings.entity.ts (new)
@Entity('ai_settings')
export class AISettings {
  id: number;
  
  // Provider selection
  provider: 'openai' | 'claude' | 'gemini' | 'openrouter' | 'local';
  apiKey: string;       // encrypted at rest
  baseUrl: string;       // for OpenRouter/local
  
  // Model selection per feature
  chatModel: string;
  imageModel: string;
  embeddingModel: string;
  
  // Parameters
  temperature: number;   // 0.0 - 2.0
  maxTokens: number;
  systemPrompt: string;
  
  // Usage tracking
  totalTokens: number;
  totalCost: number;
  lastUsedAt: Date;
}
```

### 4.4 AI Feature — Implementation Priority

| # | Feature | Provider Required | Hrs | Dependencies |
|---|---------|------------------|-----|-------------|
| AI1 | Lot description generator | Chat | 3h | P4.1 |
| AI2 | Image captioning + auto-tagging | Image + Chat | 4h | P4.1 |
| AI3 | Pricing recommendations | Chat (JSON) | 3h | P4.1 |
| AI4 | Smart search | Embedding | 6h | P4.1, pgvector |
| AI5 | AI chatbot / virtual assistant | Chat | 5h | P4.1 |
| AI6 | Personalized recommendations | Embedding | 5h | P4.1, P4.4 |
| AI7 | Content moderation | Chat (JSON) | 3h | P4.1 |
| AI8 | Fraud detection | Chat + ML | 6h | P4.1 |
| AI9 | AI document OCR (KYC) | Image | 3h | P4.1 |
| AI10 | AI email campaign generator | Chat | 3h | P4.1 |
| AI11 | Auction title optimizer | Chat | 2h | P4.1 |
| AI12 | Translation (listing auto-translate) | Chat | 3h | P4.1 |
| AI13 | Bid prediction (estimated final price) | Chat + ML | 4h | P4.1 |
| AI14 | Dynamic pricing (buyer premium adjustment) | Chat | 3h | P4.1 |

---

## 5. Tech Debt & Operational Items

| # | Item | Status | Notes |
|---|------|--------|-------|
| D1 | Remove `synchronize: true` from prod database config | 🔴 | Must run migrations first; then switch to `false` |
| D2 | Auth.js 500 error on production frontend | 🔴 | Env vars not baked into cached Docker build; need new commit + rebuild |
| D3 | Coolify nixpacks build cache skips env var changes | 🔴 | Workaround: always push a code change to force rebuild |
| D4 | No git hooks (pre-commit lint, pre-push test) | 🟡 | Add Husky + lint-staged |
| D5 | Empty `Auction insight/` directory at project root | ⚪ | Remove or populate |
| D6 | `.env` files committed (not in .gitignore) | 🟡 | Add `.env` to .gitignore, create `.env.example` templates |
| D7 | No input validation on several forms | 🟡 | Add Zod schemas to remaining forms |
| D8 | No API versioning strategy | ⚪ | Prefix endpoints with `/api/v1/` |
| D9 | No rate limiting on API endpoints | 🟡 | `@nestjs/throttler` |
| D10 | Next.js version stale (16.1.6 → 16.2.12) | ⚪ | Upgrade non-blocking |

---

## 6. Follow-Up Tasks (After Phase 5)

| # | Task | Notes |
|---|------|-------|
| F1 | **User acceptance testing** — real buyers/sellers test all flows | Recruit 5-10 Nigerian buyers and sellers |
| F2 | **Performance audit** — Lighthouse, PageSpeed Insights, Core Web Vitals | Target 90+ on all metrics |
| F3 | **Security audit** — OWASP Top 10, dependency scan, penetration test | Use `npm audit`, Snyk, manual review |
| F4 | **Accessibility audit** — WCAG 2.1 AA compliance | Use axe DevTools, manual keyboard testing |
| F5 | **GDPR/Nigerian NDPR compliance review** — cookie consent, data deletion, privacy policy | Legal review needed |
| F6 | **Documentation** — API docs (Swagger), developer setup guide, deployment guide | Update AGENTS.md |
| F7 | **Launch checklist** — domain, SSL, email (SMTP), payment gateway live keys, monitoring alerts | Production cutover |
| F8 | **Marketing launch** — social media accounts, press release, Google Ads, influencer outreach | Post-launch |
| F9 | **Mobile app MVP** — React Native with core buyer flows (browse, bid, watchlist, notifications) | Phase 6 |
| F10 | **Partnership integrations** — logistics partners, inspection services, insurance providers | Ongoing |

---

## 7. Quick Reference — Key UUIDs (Coolify)

| Resource | UUID |
|----------|------|
| Project (GreyAuction) | `b6as8aze8abhikytid2ysksw` |
| Environment (production) | `iyu4tyvwmfq1nv1d8jle3xdj` |
| Server (localhost) | `h10omo6wpn33at3mi598jjcb` |
| PostgreSQL DB | `wn8nr8wayebka3m5kkzn0fy0` |
| Backend App | `g112l4qdo6f1ghvr6sxa5l0j` |
| Frontend App | `fq7kp4aybdk0hdl1fhtlq3vc` |
| Coolify Dashboard | `https://coolify.gozmar.com` |
| GitHub Repo | `https://github.com/gozmardynamics-glitch/Grey-Auction` |

---

## 8. How to Update This Document

1. When a task is **started**, change `🔴`/`🟡` to `🔵`
2. When a task is **completed**, change to `✅` and add completion date
3. When a task is **blocked**, change to `⚠️` and add reason
4. Commit `pendingwork.md` with each update
5. At weekly review, move items between phases based on priority shifts

---

> **Total remaining:** 54 gaps (15 🔴 critical, 24 🟡 important, 15 ⚪ nice-to-have)  
> **Estimated effort:** ~200 hours across 6 phases (4-8 weeks)

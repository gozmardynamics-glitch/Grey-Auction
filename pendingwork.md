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

> **Goal:** Differentiate from competitors with AI-powered tools. Model-agnostic architecture with LLM Registry, per-section model assignment, fallback chains, and full super admin control panel.

> **Architecture:** See §4 below for the complete AI design — 4 database entities, 5 provider implementations, 17 feature configs, orchestrator service with automatic fallback, and a super admin dashboard for managing the entire AI stack.

| # | Task | Dependencies | Effort |
|---|------|-------------|--------|
| P4.1 | **LLM Registry backend** — 4 entities, migrations, CRUD API, provider health checks | None | 8h |
| P4.2 | **Provider implementations** — OpenAI, Claude, Gemini, OpenRouter, Local (Ollama) | P4.1 | 8h |
| P4.3 | **AI Orchestrator** — routing, fallback chains, rate limiting, usage logging | P4.1, P4.2 | 6h |
| P4.4 | **Super Admin AI settings UI** — provider/model CRUD, health dashboard | P4.3 | 8h |
| P4.5 | **Feature config UI** — per-feature model assignment, prompts, quality toggles | P4.4 | 4h |
| P4.6 | **Usage dashboard** — charts, cost analytics, token tracking | P4.4 | 4h |
| P4.7 | **Auction description generator** — seller listing form integration | P4.3 | 3h |
| P4.8 | **Image captioning + auto-tagging** — upload pipeline | P4.3 | 4h |
| P4.9 | **AI chatbot widget** — floating assistant on public pages | P4.3 | 5h |
| P4.10 | **Smart search** — vector embeddings + pgvector | P4.3 | 6h |
| P4.11 | **Content moderation** — auto-flag pipeline | P4.3 | 3h |
| P4.12 | **Additional features** — pricing, fraud, OCR, email, translation, title optimizer | P4.3 | 18h |

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

## 4. AI Architecture — Model Agnostic Design (Expanded)

### 4.0 Philosophy

Every AI feature in GreyAuction is built on a **pluggable provider model**. No single LLM vendor is hard-coded. The super admin controls which provider powers which feature through a central **LLM Registry**. This means:

- **Sections are independent**: The chatbot can use Claude while image tagging uses Gemini while fraud detection runs on a local model — simultaneously.
- **Vendor lock-in is impossible**: Swap any provider with a single dropdown change in the admin panel.
- **Cost optimization**: Route expensive features (fraud detection) to cheap models (Haiku/Flash) and creative features (description generation) to premium models (Opus/GPT-4o).
- **Fallback chains**: If primary model fails, secondary/tertiary models pick up automatically.
- **Privacy-first**: Sensitive data (KYC documents) can be routed to local/self-hosted models only.

---

### 4.1 LLM Registry — Database Schema

The LLM Registry is a super-admin managed catalogue of all available providers, models, and their capabilities. It is the **single source of truth** for AI configuration.

#### 4.1.1 Entity: `llm_providers`

```typescript
// backend/src/ai-registry/entities/llm-provider.entity.ts (NEW)
@Entity('llm_providers')
export class LLMProvider {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;                    // 'openai', 'claude', 'gemini', 'openrouter', 'local-ollama'

  @Column()
  displayName: string;             // 'OpenAI', 'Anthropic Claude', 'Google Gemini'

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column()
  baseUrl: string;                 // 'https://api.openai.com/v1'

  @Column({ nullable: true })
  apiKey: string;                  // Encrypted at rest via crypto-js

  @Column({ nullable: true })
  organizationId: string;          // For OpenAI org accounts

  @Column({ default: true })
  isActive: boolean;               // Enable/disable entire provider

  @Column({ default: 3 })
  maxRetries: number;              // Retry count for transient failures

  @Column({ default: 30000 })
  timeoutMs: number;               // Request timeout

  @Column({ type: 'jsonb', default: '{}' })
  headers: Record<string, string>; // Custom headers (for OpenRouter auth, etc.)

  @Column({ default: 'production' })
  tier: 'production' | 'development' | 'testing';

  @OneToMany(() => LLMModel, model => model.provider, { cascade: true })
  models: LLMModel[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

#### 4.1.2 Entity: `llm_models`

```typescript
// backend/src/ai-registry/entities/llm-model.entity.ts (NEW)
@Entity('llm_models')
export class LLMModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => LLMProvider, provider => provider.models)
  provider: LLMProvider;

  @Column()
  modelId: string;                 // 'gpt-4o', 'claude-opus-4-20250514'

  @Column()
  displayName: string;             // 'GPT-4o', 'Claude Opus 4'

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column('simple-array')
  capabilities: string[];          // ['chat', 'image', 'embedding', 'json', 'vision', 'streaming']

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  contextWindow: number;           // Token limit (e.g., 128000)

  @Column({ type: 'int', default: 4096 })
  maxOutputTokens: number;         // Max response tokens

  // Pricing per 1M tokens (input / output)
  @Column({ type: 'decimal', precision: 10, scale: 6, default: 0 })
  pricePerMillionInput: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, default: 0 })
  pricePerMillionOutput: number;

  @Column({ default: 0.7 })
  defaultTemperature: number;

  @Column({ default: false })
  supportsJsonMode: boolean;

  @Column({ default: false })
  supportsStreaming: boolean;

  @Column({ default: 0 })
  priority: number;                // Sort order in dropdowns

  @CreateDateColumn()
  createdAt: Date;
}
```

#### 4.1.3 Entity: `ai_feature_configs`

This is the **per-section LLM assignment** table — each AI feature can use a different model.

```typescript
// backend/src/ai-registry/entities/ai-feature-config.entity.ts (NEW)
@Entity('ai_feature_configs')
export class AIFeatureConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  featureKey: string;              // 'auction_description_generator', 'image_captioning', etc.

  @Column()
  displayName: string;             // 'Auction Description Generator'

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column()
  section: string;                 // 'seller', 'buyer', 'admin', 'public', 'system'

  @ManyToOne(() => LLMModel)
  primaryModel: LLMModel;          // Preferred model for this feature

  @ManyToOne(() => LLMModel, { nullable: true })
  fallbackModel: LLMModel;         // Model to use if primary fails

  @ManyToOne(() => LLMModel, { nullable: true })
  tertiaryModel: LLMModel;         // Last-resort model

  @Column({ default: true })
  isEnabled: boolean;              // Toggle feature on/off

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.7 })
  temperature: number;

  @Column({ type: 'int', default: 2048 })
  maxTokens: number;

  @Column({ type: 'text', nullable: true })
  systemPrompt: string;            // Custom system prompt per feature

  @Column({ default: false })
  requireApproval: boolean;        // Require human approval before applying AI output

  @Column({ default: 'standard' })
  qualityLevel: 'draft' | 'standard' | 'premium';  // Controls model choice + temperature

  @Column({ default: false })
  logPrompts: boolean;             // Store prompts for debugging/audit

  @Column({ default: false })
  logResponses: boolean;           // Store responses for debugging/audit

  @Column({ default: 5 })
  rateLimitPerMinute: number;      // Requests per minute

  @Column({ default: 1000 })
  rateLimitPerDay: number;         // Requests per day

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

#### 4.1.4 Entity: `ai_usage_logs`

```typescript
// backend/src/ai-registry/entities/ai-usage-log.entity.ts (NEW)
@Entity('ai_usage_logs')
export class AIUsageLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  featureKey: string;

  @Column()
  modelId: string;

  @Column()
  providerName: string;

  @Column({ nullable: true })
  userId: string;

  @Column()
  promptTokens: number;

  @Column()
  completionTokens: number;

  @Column()
  totalTokens: number;

  @Column({ type: 'decimal', precision: 12, scale: 8 })
  estimatedCost: number;           // Calculated from model pricing

  @Column({ type: 'int' })
  latencyMs: number;

  @Column()
  success: boolean;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ nullable: true })
  resourceId: string;              // Related auction ID, user ID, etc.

  @CreateDateColumn()
  timestamp: Date;
}
```

---

### 4.2 Provider Interface & Service Layer

#### 4.2.1 Provider Interface (Expanded)

```typescript
// backend/src/common/ai/interfaces/ai-provider.interface.ts (NEW)
export interface AIChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | AIContentPart[];
}

export interface AIContentPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string; detail?: 'low' | 'high' | 'auto' };
}

export interface AICompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  responseFormat?: 'text' | 'json_object';
  stop?: string[];
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export interface AIModelInfo {
  id: string;
  displayName: string;
  capabilities: string[];
  contextWindow: number;
  maxOutputTokens: number;
}

export interface AIProvider {
  readonly name: string;
  readonly baseUrl: string;
  
  // Core
  listModels(): Promise<AIModelInfo[]>;
  chat(messages: AIChatMessage[], options?: AICompletionOptions): Promise<string>;
  chatJSON<T>(messages: AIChatMessage[], options?: AICompletionOptions): Promise<T>;
  chatStream(messages: AIChatMessage[], options?: AICompletionOptions): AsyncIterable<string>;
  
  // Multi-modal
  analyzeImage?(imageUrl: string, prompt: string): Promise<string>;
  generateImage?(prompt: string, options?: ImageOptions): Promise<ImageResult>;
  
  // Embeddings
  embed?(text: string): Promise<number[]>;
  embedBatch?(texts: string[]): Promise<number[][]>;
  
  // Health
  healthCheck(): Promise<boolean>;
}

export interface ImageOptions {
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
}

export interface ImageResult {
  url: string;
  revisedPrompt?: string;
}
```

#### 4.2.2 AI Orchestrator Service

```typescript
// backend/src/common/ai/services/ai-orchestrator.service.ts (NEW)
@Injectable()
export class AIOrchestratorService {
  constructor(
    private readonly registryService: LLMRegistryService,
    private readonly usageLogService: AIUsageLogService,
  ) {}

  // Main entry point — all AI features call this
  async execute(
    featureKey: string,
    input: AIFeatureInput,
    userId?: string,
  ): Promise<AIFeatureOutput> {
    const config = await this.registryService.getFeatureConfig(featureKey);
    if (!config || !config.isEnabled) {
      throw new AIFeatureDisabledException(featureKey);
    }

    // Check rate limits
    await this.checkRateLimit(featureKey);

    const start = Date.now();
    let result: AIFeatureOutput;
    let attemptModel = config.primaryModel;

    // Try primary, then fallback, then tertiary
    for (const model of [config.primaryModel, config.fallbackModel, config.tertiaryModel]) {
      if (!model) continue;
      attemptModel = model;
      try {
        const provider = this.registryService.getProviderInstance(model.provider);
        result = await this.executeOnModel(provider, model, config, input);
        await this.logUsage(featureKey, model, start, true, userId);
        return result;
      } catch (error) {
        this.logger.warn(`Model ${model.modelId} failed for ${featureKey}: ${error.message}`);
        // Continue to fallback
      }
    }

    // All models failed
    await this.logUsage(featureKey, attemptModel, start, false, userId);
    throw new AIAllModelsFailedException(featureKey);
  }
}
```

#### 4.2.3 Provider Implementations

```typescript
// backend/src/common/ai/providers/openai.provider.ts (NEW)
@Injectable()
export class OpenAIProvider implements AIProvider {
  name = 'openai';
  baseUrl = 'https://api.openai.com/v1';
  
  async chat(messages, options) { /* OpenAI SDK */ }
  async analyzeImage(imageUrl, prompt) { /* Vision API */ }
  async generateImage(prompt, options) { /* DALL-E */ }
  async embed(text) { /* text-embedding-3 */ }
}

// backend/src/common/ai/providers/claude.provider.ts (NEW)
@Injectable()
export class ClaudeProvider implements AIProvider {
  name = 'claude';
  baseUrl = 'https://api.anthropic.com/v1';
  // Anthropic SDK implementation
}

// backend/src/common/ai/providers/gemini.provider.ts (NEW)
@Injectable()
export class GeminiProvider implements AIProvider {
  name = 'gemini';
  baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  // Google AI SDK implementation
}

// backend/src/common/ai/providers/openrouter.provider.ts (NEW)
@Injectable()
export class OpenRouterProvider implements AIProvider {
  name = 'openrouter';
  baseUrl = 'https://openrouter.ai/api/v1';
  // OpenAI-compatible API, routes to 200+ models
}

// backend/src/common/ai/providers/local.provider.ts (NEW)
@Injectable()
export class LocalProvider implements AIProvider {
  name = 'local';
  baseUrl = 'http://localhost:11434';  // Ollama default
  // Ollama API (OpenAI-compatible)
}
```

---

### 4.3 Feature-to-Model Mapping

This table defines which AI feature is assigned to which section and its default model recommendation:

| Feature Key | Section | Function | Default Primary | Default Fallback | Quality |
|-------------|---------|----------|-----------------|------------------|---------|
| `auction_description_generator` | seller | Generate auction descriptions from specs | GPT-4o / Claude Sonnet | Claude Haiku | premium |
| `image_captioning` | seller | Auto-tag uploaded images | Gemini Flash | GPT-4o-mini | standard |
| `image_auto_tagging` | system | Extract keywords from images | Gemini Flash | Claude Haiku | draft |
| `pricing_recommendation` | seller | Suggest starting bid & reserve | Claude Sonnet | GPT-4o-mini | standard |
| `smart_search` | public | Semantic search via embeddings | text-embedding-3 | Gemini embedding | standard |
| `chatbot_assistant` | public | Answer FAQs, guide users | Claude Haiku | GPT-4o-mini | standard |
| `personalized_recommendations` | buyer | "You might like" suggestions | text-embedding-3 | Gemini embedding | standard |
| `content_moderation` | system | Flag inappropriate content | GPT-4o-mini | Claude Haiku | standard |
| `fraud_detection` | system | Flag suspicious bids/accounts | Claude Sonnet | GPT-4o | premium |
| `document_ocr` | admin | Extract data from KYC docs | GPT-4o | Gemini Pro Vision | standard |
| `email_campaign_generator` | admin | Generate newsletter content | Claude Sonnet | GPT-4o-mini | standard |
| `title_optimizer` | seller | Improve listing titles | GPT-4o-mini | Claude Haiku | draft |
| `translation` | system | Auto-translate listings | GPT-4o-mini | Claude Haiku | standard |
| `bid_prediction` | buyer | Estimate final auction price | Claude Sonnet | GPT-4o | premium |
| `dynamic_pricing` | admin | Adjust buyer premium | Claude Sonnet | GPT-4o | premium |
| `listing_quality_score` | seller | Score listing completeness | GPT-4o-mini | Claude Haiku | draft |
| `category_suggestion` | seller | Suggest best category | GPT-4o-mini | Claude Haiku | draft |

---

### 4.4 Super Admin AI Settings Panel

The super admin manages all AI configuration through a dedicated settings interface.

#### 4.4.1 Backend API Endpoints

```
# LLM Provider Management (Super Admin only)
GET    /api/admin/ai/providers              — List all providers
POST   /api/admin/ai/providers              — Add new provider
PATCH  /api/admin/ai/providers/:id          — Update provider (API key, base URL, headers)
DELETE /api/admin/ai/providers/:id          — Remove provider
POST   /api/admin/ai/providers/:id/models   — Add model to provider
PATCH  /api/admin/ai/providers/:id/models/:mid — Update model (pricing, capabilities, active)
DELETE /api/admin/ai/providers/:id/models/:mid — Remove model
POST   /api/admin/ai/providers/:id/health   — Test provider connection

# Feature Configuration (Super Admin only)
GET    /api/admin/ai/features               — List all feature configs
PATCH  /api/admin/ai/features/:id           — Update feature (assign model, toggle, system prompt)
POST   /api/admin/ai/features/:id/test      — Test feature with sample input

# Usage & Analytics (Super Admin only)
GET    /api/admin/ai/usage                  — Usage logs (filter by date, feature, model)
GET    /api/admin/ai/usage/summary          — Aggregated: total tokens, cost, by provider/feature
GET    /api/admin/ai/usage/by-model         — Cost breakdown per model
GET    /api/admin/ai/usage/by-feature       — Usage volume per feature
```

#### 4.4.2 Frontend: AI Settings Pages

```
frontend/app/[locale]/(domain)/admin/ai/
├── page.tsx                          — AI Dashboard (usage overview, health status)
├── providers/
│   ├── page.tsx                      — List all providers with status indicators
│   ├── [providerId]/
│   │   ├── page.tsx                  — Edit provider (API key, base URL, headers)
│   │   └── models/
│   │       ├── page.tsx              — List models for this provider
│   │       └── [modelId]/page.tsx    — Edit model (pricing, capabilities, active toggle)
├── features/
│   ├── page.tsx                      — List all 17 AI features with current model assignment
│   └── [featureKey]/page.tsx         — Configure feature (model dropdown, temperature, prompts)
└── usage/
    ├── page.tsx                      — Usage dashboard (charts: tokens by day, cost by model)
    └── logs/page.tsx                 — Raw usage logs with filters
```

#### 4.4.3 AI Dashboard Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│  AI Dashboard                                    [Settings] │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Providers │  │  Models  │  │ Features │  │ 30d Cost │   │
│  │    5 ✅   │  │   22 ✅  │  │   17 ✅  │  │ $12.47   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                             │
│  Provider Health:  OpenAI ✅  Claude ✅  Gemini ✅  Local ⚠️ │
│                                                             │
│  ┌─ Today's Usage ──────────────────────────────────────┐  │
│  │  ████████████████████████████████  847 requests       │  │
│  │  23,450 tokens  │  $0.89  │  avg 278ms               │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─ Feature Usage (7d) ─────────────────────────────────┐  │
│  │  auction_description   ████████████████  342 calls    │  │
│  │  image_captioning      ██████  89 calls               │  │
│  │  chatbot_assistant     ██████████  215 calls           │  │
│  │  content_moderation    ████  56 calls                 │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

### 4.5 Per-Section LLM Deployment Strategy

Different application sections get different LLM configurations optimized for their use case:

#### Public Website (Buyer-facing)
| Feature | Model Strategy | Rationale |
|---------|---------------|-----------|
| Smart Search | Embedding (cheap, fast) | High volume, latency-sensitive |
| Chatbot | Claude Haiku or GPT-4o-mini | Fast responses, low cost |
| Recommendations | Embedding + cosine similarity | Batch pre-computed, no real-time LLM |
| Translation | GPT-4o-mini | Occasional use, good quality |

#### Seller Dashboard
| Feature | Model Strategy | Rationale |
|---------|---------------|-----------|
| Description Generator | Claude Sonnet or GPT-4o | Quality matters — better listings sell |
| Image Captioning | Gemini Flash | Fast, good at vision, cheap |
| Pricing Recommendation | Claude Sonnet | Structured JSON output, reliable |
| Title Optimizer | GPT-4o-mini | Low stakes, fast |

#### Admin Panel
| Feature | Model Strategy | Rationale |
|---------|---------------|-----------|
| Content Moderation | GPT-4o-mini | High volume, needs fast turnaround |
| Document OCR | GPT-4o or Gemini Pro | Accuracy critical for KYC |
| Fraud Detection | Claude Sonnet | Reasoning capabilities matter |
| Email Campaigns | Claude Sonnet | Creative writing, marketing tone |

#### System / Background Jobs
| Feature | Model Strategy | Rationale |
|---------|---------------|-----------|
| Auto-tagging images | Gemini Flash | Runs on every upload, must be fast/cheap |
| Listing Quality Score | GPT-4o-mini | Batch process, low stakes |
| Dynamic Pricing | Claude Sonnet | Complex reasoning, occasional |

---

### 4.6 Implementation Priority & Effort

| # | Task | Files/Scope | Hrs |
|---|------|------------|-----|
| P4.1 | **LLM Registry backend** — entities, migrations, CRUD endpoints | `backend/src/ai-registry/` | 8h |
| P4.2 | **Provider implementations** — OpenAI, Claude, Gemini, OpenRouter, Local | `backend/src/common/ai/providers/` | 8h |
| P4.3 | **AI Orchestrator** — routing, fallback, rate limiting, logging | `backend/src/common/ai/services/` | 6h |
| P4.4 | **Super Admin AI settings UI** — provider CRUD, model CRUD, health checks | `frontend/.../admin/ai/` | 8h |
| P4.5 | **Feature config UI** — per-feature model assignment, prompts, toggles | `frontend/.../admin/ai/features/` | 4h |
| P4.6 | **Usage dashboard** — charts, cost analytics, usage logs | `frontend/.../admin/ai/usage/` | 4h |
| P4.7 | **Auction description generator** — seller flow integration | `frontend/.../seller/auctions/create/` | 3h |
| P4.8 | **Image captioning + auto-tagging** — upload pipeline integration | `frontend/.../seller/auctions/create/` | 4h |
| P4.9 | **AI chatbot widget** — floating chat on public pages | `frontend/shared/components/ai/chatbot.tsx` | 5h |
| P4.10 | **Smart search** — vector embeddings + pgvector setup | `backend/src/search/` | 6h |
| P4.11 | **Content moderation** — listing submission pipeline | `backend/src/products/` | 3h |
| P4.12 | **Additional features** — pricing, fraud, OCR, email, translation | Various | 18h |

**Total AI implementation: ~77 hours (2 weeks full-time)**

---

### 4.7 AI Module Directory Structure

```
backend/src/
├── ai-registry/                        # NEW — LLM Registry module
│   ├── ai-registry.module.ts
│   ├── ai-registry.controller.ts       # Super admin CRUD endpoints
│   ├── ai-registry.service.ts
│   ├── entities/
│   │   ├── llm-provider.entity.ts
│   │   ├── llm-model.entity.ts
│   │   ├── ai-feature-config.entity.ts
│   │   └── ai-usage-log.entity.ts
│   └── dto/
│       ├── create-provider.dto.ts
│       ├── update-provider.dto.ts
│       ├── create-model.dto.ts
│       ├── update-feature-config.dto.ts
│       └── usage-query.dto.ts
│
├── common/ai/                          # NEW — AI abstraction layer
│   ├── ai.module.ts
│   ├── interfaces/
│   │   └── ai-provider.interface.ts
│   ├── services/
│   │   ├── ai-orchestrator.service.ts
│   │   ├── ai-usage-log.service.ts
│   │   └── ai-rate-limiter.service.ts
│   ├── providers/
│   │   ├── openai.provider.ts
│   │   ├── claude.provider.ts
│   │   ├── gemini.provider.ts
│   │   ├── openrouter.provider.ts
│   │   └── local.provider.ts
│   └── decorators/
│       └── ai-feature.decorator.ts     // @AIFeature('auction_description_generator')

frontend/
├── app/[locale]/(domain)/admin/ai/     # NEW — AI settings pages
│   ├── page.tsx
│   ├── providers/
│   ├── features/
│   └── usage/
│
├── shared/components/ai/               # NEW — Shared AI components
│   ├── chatbot.tsx                     # Floating chatbot widget
│   ├── ai-generate-button.tsx          # "Generate with AI" button
│   ├── ai-loading-spinner.tsx          # Animated AI thinking indicator
│   └── ai-output-card.tsx              # Displays AI-generated content
│
└── shared/hooks/
    └── use-ai-feature.ts              # React hook for calling AI features
```

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
| Frontend App | `oar0eucfauq9kydbbpp3xejd` (recreated 2026-07-27) |
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

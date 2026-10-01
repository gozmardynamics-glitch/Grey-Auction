# Performance & Security Overhaul Plan

**Target:** Address 8 audit items — race conditions, WebSocket privacy, DB safety, entity optimization, SQL aggregation, frontend bundle, security hardening, and agent-driven testing.

---

## Item 1: Fix `placeBid()` Race Condition (CRITICAL)

### Problem
`bid.service.ts:18-52` — 4 non-atomic operations (read product, clear old winner, save bid, update product) with no transaction, no `SELECT ... FOR UPDATE`. Two concurrent bidders can both see `currentBid = 100` and both place winning bids.

### Solution
1. **Inject `DataSource`** into `BidService` constructor
2. **Wrap placeBid in `this.dataSource.transaction(async (manager) => { ... })`**
3. **Use pessimistic write lock** on the product row:
   ```typescript
   const product = await manager.findOne(Product, {
     where: { id: productId },
     lock: { mode: 'pessimistic_write' },
   });
   ```
4. **Use `manager` (EntityManager) for ALL operations** inside the transaction — not `this.repo`
5. **Move `totalBids + 1` increment** into the same transaction (call `productService.updateBid` with the manager)
6. **Add `@VersionColumn()`** to Product entity for optimistic concurrency as a second defense
7. **Add a `version` column** migration

### Files Modified
- `backend/src/bids/bid.service.ts` — full rewrite of `placeBid()` with transaction + lock
- `backend/src/products/entities/product.entity.ts` — add `@VersionColumn() version: number`
- `backend/src/products/product.service.ts` — `updateBid()` accept optional `EntityManager`
- `backend/src/database/migrations/` — new migration for version column

### Validation
- Run existing bid tests (`backend/src/bids/bid.service.spec.ts`)
- Manual test: two clients bid simultaneously, verify only one wins at the correct amount

---

## Item 2: WebSocket — Public/Private Broadcast Separation + Social Sharing

### Problem
`auction.gateway.ts:41,44` uses `this.server.emit()` which sends to ALL connected clients. No privacy model. Room type `PUBLIC`/`PRIVATE` exists in Room entity but gateway ignores it.

### Current State
- `Room` entity already has `type: RoomType.PUBLIC | RoomType.PRIVATE` and `allowInviteCode`/`inviteCode`
- `handleJoinRoom` accepts any roomId without checking room type or invite code
- No WebSocket authentication

### Solution — Three-Tier Visibility Model

**Tier 1 — Public Broadcast (full auction)**  
- Product entity gets `visibility: 'public' | 'private'` column (default: `public`)
- `broadcastNewBid()` checks product visibility:
  - `public` → `this.server.to(productId).emit('newBid', ...)` (room-scoped)
  - `private` → only emit to the bidder + seller + explicitly invited participants
- Private auctions appear in search/browse with a lock icon + "Private Auction" badge
- Clicking a private auction from search shows "Invite Required" prompt instead of bid form

**Tier 2 — Room Privacy Enforcement**  
- `handleJoinRoom()` checks `Room.type === PRIVATE`:
  - If private + `allowInviteCode` → validate invite code before allowing join
  - If private + no invite code → reject unless user is seller or in `invitedUserIds`
- Add `invitedUserIds: string[]` simple-array column on Room entity

**Tier 3 — Social Media Sharing**  
- Public auctions: standard share links with full OG meta tags (title, image, description)
- Private auctions: generate time-limited invite links via `POST /api/invites/generate`
- `inviteExpiry` column on Invite entity: `1h`, `24h` (default), `7d`, `never`
- Share options: Facebook, X, LinkedIn, WhatsApp, Copy Link, Email
- Invite link format: `https://domain.com/invite/:token` → redirects to auction detail

### Files Modified
- `backend/src/products/entities/product.entity.ts` — add `visibility` column + enum
- `backend/src/products/dto/product.dto.ts` — add visibility to create/update DTOs
- `backend/src/bids/gateways/auction.gateway.ts` — tiered broadcast logic, auth, invite validation
- `backend/src/bids/bid.service.ts` — pass visibility to gateway, only broadcast when appropriate
- `backend/src/rooms/room.service.ts` — `joinRoom()` validates invite code for private rooms
- `backend/src/rooms/entities/room.entity.ts` — add `invitedUserIds: string[]` simple-array
- `backend/src/invites/` — new module: `invite.entity.ts`, `invite.service.ts`, `invite.controller.ts`
- `frontend/shared/components/common/share_buttons.tsx` — private link mode
- `frontend/app/[locale]/(website)/auctions/[slug]/` — add OG meta tags for social sharing

### Validation
- Private room: join with no invite → rejected
- Private room: join with valid invite code → accepted
- Public auction: bid → broadcast only to room members
- Private auction bid → emit only to bidder + seller

---

## Item 3: Database Safety — `synchronize: false` + Connection Pool + Graceful Shutdown

### Problem
`database.config.ts:16` has `synchronize: true`. No pool config, no retry, no keepAlive, no shutdown hooks.

### Solution
1. **Set `synchronize: false`** for non-development environments (env-conditional)
2. **Add connection pool configuration:**
   ```typescript
   extra: {
     max: parseInt(process.env.DB_POOL_SIZE || '20'),
     idleTimeoutMillis: 30000,
     connectionTimeoutMillis: 5000,
   },
   ```
3. **Add retry + keepAlive:**
   ```typescript
   retryAttempts: 3,
   retryDelay: 3000,
   keepConnectionAlive: true,
   ```
4. **Add `migrationsRun: true`** in production (auto-run pending migrations on boot)
5. **Add `app.enableShutdownHooks()`** in `main.ts`
6. **Disconnect DB on shutdown** — use `OnApplicationShutdown` in AppModule

### Files Modified
- `backend/src/config/database.config.ts` — pool + retry + sync conditional
- `backend/src/main.ts` — add `app.enableShutdownHooks()`, body parser limit
- `backend/src/app.module.ts` — implement `OnApplicationShutdown` for DB disconnect

### Validation
- `npm run build` succeeds with `synchronize: false`
- Verify pool config via `pg_stat_activity` after app starts
- SIGTERM → app gracefully closes DB connections

---

## Item 4: Fix Seller Migration Error Handling

### Problem
`1234567890124-CreateSellerTables.ts:10-108` — 9 `CREATE TYPE` statements without try/catch. Running migration twice crashes.

### Solution
Wrap each enum creation block in a PostgreSQL anonymous block:
```sql
DO $$ BEGIN
  CREATE TYPE seller_business_type_enum AS ENUM (...);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
```

### Files Modified
- `backend/src/database/migrations/1234567890124-CreateSellerTables.ts` — wrap all 9 enums

### Validation
- Run migration twice — second run succeeds without error

---

## Item 5: Remove `eager: true` — Prevent Data Leaks + Improve Performance

### Problem
5 `@ManyToOne` relations across 4 entity files have `eager: true`. Every query auto-loads joined tables even when not needed. Loads seller/user data (emails, password hashes) into responses that don't need it. Services ALSO redundantly specify `relations` arrays, doubling the load.

### Solution
1. **Remove `eager: true`** from ALL `@ManyToOne` relations:
   - `product.entity.ts:80` — `seller` relation
   - `bid.entity.ts:11,17,23` — `product`, `room`, `bidder` relations
   - `room.entity.ts:73` — `createdBy` relation
   - `room.entity.ts:100` — `user` relation on RoomParticipant
2. **Add explicit `relations` only where needed** — audit each service method:
   - If the API returns product data and the UI needs seller name → add `relations: ['seller']`
   - If the API only needs product.id → no relations (avoid loading User entity with password hash)
3. **Use `.select()` to limit columns** on sensitive relations:
   ```typescript
   relations: ['seller'],
   select: { seller: { id: true, name: true, email: true } }
   ```
   Never select `passwordHash` on User relations.

### Files Modified
- `backend/src/products/entities/product.entity.ts` — remove eager, add select hint
- `backend/src/bids/entities/bid.entity.ts` — remove all 3 eager
- `backend/src/rooms/entities/room.entity.ts` — remove both eager
- `backend/src/products/product.service.ts` — ensure explicit relations where needed
- `backend/src/bids/bid.service.ts` — audit relations on `getAuctionBids`, `getUserBids`, `findByRoom`
- `backend/src/rooms/room.service.ts` — audit relations on `findById`, `findBySeller`

### Validation
- Run `npm test` — all 40 tests must pass
- Verify no test was relying on eager-loaded data
- Check Swagger responses — user objects should not expose `passwordHash`

---

## Item 6: SQL Aggregation — Replace JS Loops With Database Queries

### Problem
7 service methods load entire tables into JavaScript memory for simple counts/sums/groupings.

### Affected Methods and Fixes

| File | Method | Current | Fix |
|------|--------|---------|-----|
| `ai.service.ts:126-138` | `findUsageSummary()` | `SELECT *` → JS reduce/loop | `createQueryBuilder().select('SUM(promptTokens + completionTokens)', 'totalTokens').addSelect('SUM(estimatedCost)', 'totalCost').groupBy('providerName')` |
| `ai.service.ts:112-123` | `findUsageLogs()` | `take: 500` no skip | Add `skip` + `take` pagination params |
| `seller-document.service.ts:244-263` | `checkExpiredDocuments()` | Load all → loop save | `UPDATE seller_documents SET verification_status = 'EXPIRED' WHERE verification_status = 'APPROVED' AND expires_at < NOW()` |
| `seller-document.service.ts:268-278` | `findExpiringSoon()` | Load all → JS filter | `WHERE expires_at BETWEEN NOW() AND NOW() + INTERVAL '30 days'` |
| `seller-payout.service.ts:328-368` | `getSellerStatistics()` | Load all → JS reduce/filter/sort | `createQueryBuilder().select('COUNT(*)', 'count').addSelect('SUM(net_amount)', 'total').addSelect('AVG(net_amount)', 'avg').where('seller_id = :id').groupBy('status')` |
| `seller-review.service.ts:333-357` | `getRatingBreakdown()` | Load all → JS count | `createQueryBuilder().select('rating, COUNT(*)', 'count').where('seller_id = :id').groupBy('rating')` |
| `seller-review.service.ts:391-427` | `getSellerStatistics()` | Load all + 3 more queries | Single query with `COUNT`, `AVG`, `SUM` grouped by rating, positive/negative |
| `agents.service.ts:102-124` | `getDashboardStats()` | Load all entities + 500 metrics | `count()` + `.createQueryBuilder().select('COUNT(*)').addSelect('SUM(totalExecutions)').addSelect('AVG(successRate)')` |

### Files Modified
- `backend/src/ai/ai.service.ts` — `findUsageSummary()`, `findUsageLogs()`
- `backend/src/seller/services/seller-document.service.ts` — `checkExpiredDocuments()`, `findExpiringSoon()`
- `backend/src/seller/services/seller-payout.service.ts` — `getSellerStatistics()`, `getPlatformStatistics()`
- `backend/src/seller/services/seller-review.service.ts` — `getRatingBreakdown()`, `getSellerStatistics()`
- `backend/src/agents/agents.service.ts` — `getDashboardStats()`

### Validation
- All 40 backend tests pass
- For `seller-payout`: test with 10k payouts — verify response time < 50ms
- For `ai.service`: test with 5k usage logs — verify no OOM

---

## Item 7: Frontend Bundle Optimization

### Problem
- `recharts` (200KB) loaded via barrel export in `shared/components/common/index.ts`
- `dummyAuctions` (615-line mock data) imported into Header, bloats every page
- Google Fonts via CSS `@import` instead of `next/font/google`

### Solution

**7a. Remove chart from barrel export**
- `shared/components/common/index.ts:12` — delete `export * from './chart'`
- Update ALL files that use Chart to import directly: `import { ChartContainer, ChartTooltip } from '@/shared/components/common/chart'`
- Find all chart usages: `grep -r "ChartContainer\|ChartTooltip\|ChartLegend" frontend/`

**7b. Dynamic import dummyAuctions + CATEGORIES_MAP**
- Move `CATEGORIES_MAP` and `dummyAuctions` out of Header into separate files
- Header imports them with `dynamic(() => import(...), { ssr: false })` or loads from an API endpoint
- Create `frontend/shared/data/categories.ts` — export `CATEGORIES_MAP` as a module-level constant (still tree-shakeable but not in Header bundle)

**7c. Replace Google Fonts @import with next/font**
- Remove `@import url('https://fonts.googleapis.com/css2?family=Manrope...')` from `globals.css`
- In `app/[locale]/layout.tsx`, add:
  ```typescript
  import { Manrope } from 'next/font/google';
  const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', weight: ['200', '300', '400', '500', '600', '700', '800'] });
  ```
- Apply `manrope.variable` to body className
- Update tailwind config to use the CSS variable

**7d. Install `sharp` for production image optimization**
- `npm install sharp` in frontend directory

### Files Modified
- `frontend/shared/components/common/index.ts` — remove chart export
- `frontend/components/layouts/website/header.tsx` — dynamic import for dummyAuctions, CATEGORIES_MAP
- `frontend/shared/data/categories.ts` — extract CATEGORIES_MAP
- `frontend/app/[locale]/layout.tsx` — add next/font/google for Manrope
- `frontend/app/globals.css` — remove Google Fonts @import
- `frontend/package.json` — add sharp

### Validation
- `npm run build` succeeds
- Bundle analyzer shows recharts only in pages that use charts
- Fonts load from self-hosted `/_next/static/media/` not from Google
- Lighthouse Performance score does not regress

---

## Item 8: Security Hardening, Agent-Driven Testing & MCP Validation

### 8a. Security Hardening

1. **Rate limiting**: Install `@nestjs/throttler`, register global `ThrottlerGuard`, apply stricter limits on auth endpoints (5 req/min for login, 3 for OTP)
2. **Compression**: Install `compression`, add `app.use(compression())` in main.ts
3. **Helmet**: Install `helmet`, add `app.use(helmet())` in main.ts
4. **CORS hardening**: Remove hardcoded localhost origins from `main.ts` and WebSocket gateway. Use `CORS_ORIGIN` env var
5. **Body parser limit**: Set `app.use(json({ limit: '5mb' }))` for file upload endpoints
6. **WebSocket auth**: Add JWT validation in `handleConnection()` — reject unauthorized connections
7. **File upload hardening**: Add file size limit (10MB), MIME type whitelist, path traversal sanitization
8. **bcrypt rounds**: Bump from 10 to 12 in auth.service.ts

### 8b. Agent-Driven Gap Testing (Report Only)

Deploy agents from the existing Agent Studio to continuously test and report:
1. **Create a "Security Auditor" agent** (category: security):
   - Tools: `POST /admin/agents/analyze` (gap analyzer), `GET /admin/agents/metrics`
   - Trigger event: `system.startup` + cron daily
   - System prompt: "Scan the agent system for gaps. Report findings only — do not apply changes. List severity, area, and suggested fix for each gap."
   - **Report only** — admin manually reviews and applies fixes via Agent Studio UI
2. **Create a "Performance Monitor" agent** (category: operations):
   - Tools: `POST /ai/public/execute` with `listing_quality_score` feature
   - Trigger: cron hourly
   - System prompt: "Monitor agent metrics for latency spikes or error rate increases. Report anomalies with timestamps, affected agents, and suggested remediation."
3. **Create a "Compliance Auditor" agent** (category: security):
   - Tools: `GET /admin/audit` (new endpoint), `GET /admin/agents/mcp/tools`
   - System prompt: "Verify all MCP tools have input validation, all endpoints have guards. Report any security gaps found — do not modify configuration."
4. **Run the gap analyzer** (`POST /admin/agents/analyze`) after all fixes to verify no regressions
5. **Report workflow:** Agent findings appear in the gap analyzer panel with "Approve" / "Dismiss" buttons. Admin reviews and applies approved fixes manually.

### Files Modified
- `backend/package.json` — add `compression`, `@nestjs/throttler`, `helmet`, `ioredis`
- `backend/src/main.ts` — add compression, helmet, throttler, shutdown hooks, CORS env
- `backend/src/app.module.ts` — register ThrottlerModule
- `backend/src/auth/auth.service.ts` — bcrypt rounds 10→12
- `backend/src/common/storage/storage.service.ts` — async mkdir, file size validation, path sanitization
- `backend/src/bids/gateways/auction.gateway.ts` — JWT WebSocket auth
- New: `backend/src/audit/audit.controller.ts` — compliance audit endpoint

### Validation
- `npm test` — all tests pass
- `npm run build` — compiles clean
- Manual: send 6 login requests in 1 minute → 6th gets 429 Too Many Requests
- Manual: WebSocket connection without token → rejected
- Manual: upload a 50MB file → rejected with 413
- Agent Studio: run "Update & Analyze" after all fixes → 0 critical gaps

---

## Implementation Order

1. **Item 4** (seller migration) — simplest, standalone fix
2. **Item 5** (eager removal) — breaks nothing if done correctly, enables Item 6
3. **Item 6** (SQL aggregation) — depends on Item 5 for clean entity state
4. **Item 1** (bid transaction) — critical financial integrity
5. **Item 3** (DB config + shutdown) — production safety
6. **Item 2** (WebSocket privacy + sharing) — depends on Item 1 for correct broadcast in transaction
7. **Item 7** (frontend bundle) — independent of backend changes
8. **Item 8** (security + agents) — final hardening, depends on all above being stable

---

## Agent-Driven Post-Fix Validation

After all 8 items are implemented, run these agent commands:

```bash
# Comprehensive gap scan
curl -X POST http://localhost:3001/api/admin/agents/analyze

# Trigger security audit agent
curl -X POST http://localhost:3001/api/admin/agents/trigger \
  -H "Content-Type: application/json" \
  -d '{"eventType":"system.startup","payload":{"audit":"full"}}'

# Run all 3 personas against the MCP tools
curl -X POST http://localhost:3001/api/admin/agents/mcp/tools
curl -X POST http://localhost:3001/api/admin/agents/mcp/call \
  -H "Content-Type: application/json" \
  -d '{"name":"search_auctions","arguments":{"keyword":"test","status":"active"}}'

# Verify metrics collection
curl http://localhost:3001/api/admin/agents/metrics
```

---

## Rollback Plan

Each item is independently revertible:
- Item 1: revert bid.service.ts to original; remove VersionColumn migration
- Item 2: remove `visibility` column, revert gateway to global emit
- Item 3: set `synchronize: true` again in config
- Item 4: migration is additive, no revert needed
- Item 5: add `eager: true` back to entities
- Item 6: revert to JS loops (functional but slow)
- Item 7: add chart back to barrel, restore @import for fonts
- Item 8: remove packages from package.json, comment out middleware

**Recommended:** Commit after each item with descriptive messages for easy individual revert.

---

## Open Questions — RESOLVED

1. **Private auction visibility:** Listed but locked — appear in search/browse with lock icon + "Private Auction" badge. Clicking shows "Invite Required" prompt with option to request access.
2. **Invite link expiry:** Configurable per auction — seller chooses at creation: `1h`, `24h`, `7d`, or `never`. Stored in `inviteExpiry` column. Default: `24h`.
3. **Agent auto-fix behavior:** Report only — Security Auditor agent scans and creates a report. All fixes require manual admin approval in the Agent Studio UI.

---

## Rollback Plan

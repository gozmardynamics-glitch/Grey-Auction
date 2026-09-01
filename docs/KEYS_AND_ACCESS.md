# GreyAuction — Production Keys & Access Runbook (U2–U6)

Companion to `docs/OPERATIONS.md` and `AUDIT_REPORT_v2.md` (SESSION HANDOFF).
This is the **detailed acquisition guide**: every item tells you exactly where to click,
what to copy, which env var it feeds, and what it unblocks.

> **Handing secrets over safely:** paste values into `backend/.env` (local) or as
> Coolify environment variables and tell me they are in place — or paste them in chat
> if that is easier (chat may be logged; rotate later if you care). Either way, once a
> value is in place I flip the corresponding flag and verify.

---

## ⚡ STATUS BOARD — first key delivery (2026-09-01)

Values themselves live only in `backend/.env` (git-ignored) — this doc tracks state only.

| Item | State | Verification |
|---|---|---|
| §2 Paystack secret key | ✅ **received (test)** | API call accepted the key — verified 2026-09-01 |
| §3 Flutterwave secret key + webhook hash | ✅ **received (test)** | API call accepted the key — verified 2026-09-01 |
| §4 Brevo | ❌ **rejected — re-issue needed** | both provided keys → HTTP 401 from api.brevo.com; ALSO still need the **SMTP username** shown next to the smtp key |
| §6 Google Client ID | ✅ received | format valid; proves out on first Google login |
| §7 DNS | ⚠️ received w/ corrections | A records must be bare `173.212.230.3` (no `.8000` — DNS cannot store ports); SPF/DKIM records from Brevo sender page still needed (the received TXT is DMARC only) |
| §8 Coolify API token + VPS IP | ✅ **received & verified** | `GET /api/v1/servers` OK — server `localhost @ host.docker.internal`, VPS `173.212.230.3` |
| §1 R2 key pair + public host | ⏳ awaited | — |
| §5 SMS (Termii or Twilio) | ⏳ awaited | — |
| §9 FX feed URL | ⏳ awaited (or say "use open.er-api.com") | — |
| §11 LLM providers | ✅ named: OpenRouter, DeepSeek, Claude/Anthropic, Ollama, OpenAI + any Anthropic/OpenAI-compatible base URL | keys to follow later |
| §12 Sentry / §13 VAPID | optional / self-serve | — |

### §10 business rules — user answers (2026-09-01), to be implemented as configurable settings

1. **Fees:** buyer fee **5%**, seller commission **5%** — each toggleable per **seller account
   and per product** from settings, and adjustable.
2. **VAT:** support **both bases** (fees-only and hammer+fees) with an activation switch.
3. **Payout schedule:** customizable per user preference.
4. **Escrow auto-release:** fixed **at auction creation time** (0 = immediate release —
   buyer is assumed to have inspected and agreed).
5. **Bid increment:** set by the auctioneer/seller; **reserve price** policy set by seller.
6. **Currency:** NGN default; USD/GHS/EUR display-only — confirmed.
7. **Direct sales:** fees **apply** to buy-now/direct sales too.

---

## 1. Cloudflare R2 — API key pair (U4 · storage go-live)

**Why:** prod image/media uploads go to R2 instead of local disk. Pure env change.

**Steps (Cloudflare dashboard):**
1. Go to https://dash.cloudflare.com → log into the account that owns **grey-auction**.
2. Left sidebar → **R2 Object Storage** (first use may ask to enable R2 / add payment —
   free tier: 10 GB storage, Class-A ops 1M/mo — plenty to start).
3. Confirm bucket **grey-auction** exists (you already gave me the account + endpoint).
4. Top-right of the R2 page → **Manage R2 API Tokens** → **Create API Token**.
5. Permissions: **Object Read & Write** → "Specify bucket(s)": apply to **grey-auction** only.
6. Client IP filtering: leave empty. TTL: leave default. → **Create API Token**.
7. Copy the **Access Key ID** and **Secret Access Key** — the secret is shown **once**.

**Also choose the public host for image URLs:**
- Option A (fastest): bucket → **Settings → Public access → Allow Access** (r2.dev URL,
  free, rate-limited). Copy the `pub-….r2.dev` URL.
- Option B (nicer URLs): bucket → **Settings → Custom Domains → Connect Domain** →
  `cdn.greyauction.com` (requires greyauction.com DNS to live in this Cloudflare account).

**Provide:** Access Key ID · Secret Access Key · chosen public host.
**Feeds:** `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_PUBLIC_HOST` (I set `STORAGE_DRIVER=s3`,
`S3_ENDPOINT=https://ff486626c9f1a7bdfce5ed9188ebae4e.r2.cloudflarestorage.com`,
`S3_BUCKET=grey-auction`, `S3_FORCE_PATH_STYLE=true`).
**Unblocks:** storage go-live; upload pipeline switches with zero code changes.

## 2. Paystack — secret key (U2 · card payments)

**Steps:**
1. https://paystack.com → sign in (business account must be KYC-approved for live keys).
2. **Settings → API Keys & Webhooks** tab.
3. Copy the **Secret Key** — live `sk_live_…` (or `sk_test_…` if you want a staging pass first).
4. Same page → **Webhook URL** → set:
   `https://api.greyauction.com/api/payments/webhook/paystack`

**Provide:** the secret key (+ live or test). **Feeds:** `PAYSTACK_SECRET_KEY`.
**Unblocks:** Paystack at checkout; signature-validated webhooks mark invoices paid.

## 3. Flutterwave — secret key + webhook hash (U2)

**Steps:**
1. https://dashboard.flutterwave.com → sign in (live keys need an approved business).
2. **Settings → API** → copy the **Live Secret Key** (`FLWSECK-…`).
3. **Settings → Webhooks** → set URL:
   `https://api.greyauction.com/api/payments/webhook/flutterwave`
   → create/copy the **Secret hash** (the `verif-hash` value).

**Provide:** secret key + webhook hash. **Feeds:** `FLUTTERWAVE_SECRET_KEY`, `FLUTTERWAVE_WEBHOOK_HASH`.
**Unblocks:** Flutterwave at checkout + webhook settlement.

**Optional extra gateways:** Interswitch (`INTERSWITCH_CLIENT_ID`/`INTERSWITCH_CLIENT_SECRET`)
and OPay (`OPAY_MERCHANT_ID`/`OPAY_SECRET_KEY`) — any subset; unset providers are skipped.

## 4. Brevo — transactional email (U2)

**Steps:**
1. https://app.brevo.com → sign in.
2. Top-right profile menu → **SMTP & API** → **API Keys** tab → **Generate New API Key**
   (name: `greyauction-prod`) → copy (`xkeysib-…`, shown once).
3. **Senders & IP** → add sender `noreply@greyauction.com` → Brevo shows **SPF/DKIM records**
   (Domain Authentication) → add them to the greyauction.com DNS (see §7) or mail lands in spam.

**Provide:** the API key (or the SMTP relay pair `BREVO_SMTP_USER`/`BREVO_SMTP_PASS`).
**Feeds:** `BREVO_API_KEY` (+ SPF/DKIM records → DNS). **Unblocks:** real OTP/reset/outbid/won emails.

> **⚠ 2026-09-01: first delivery rejected.** Both provided keys (the `xkeysib-…` API key
> and the `xsmtpsib-…` SMTP key) return **HTTP 401** from `api.brevo.com` — likely copied
> incompletely or the account keys differ. To fix:
> 1. Brevo → **SMTP & API → API Keys → Generate New API Key** → paste the FULL new
>    `xkeysib-…` value (they show it once — copy with the copy button, not by hand).
> 2. Also send the **SMTP username** shown beside the smtp key on the SMTP & API page
>    (the relay login — usually the account email). We have the smtp password but not
>    the username.
> 3. The DMARC TXT arrived (`_dmarc` → `v=DMARC1; p=none; rua=mailto:rua@dmarc.brevo.com`)
>    but SPF + DKIM from **Senders & IP → Domain Authentication** are still needed.

## 5. SMS — Termii or Twilio (U2)

**Termii (NG-focused, preferred):**
1. https://account.termii.com → dashboard home shows the **API Key** → copy.
2. **Settings → Sender ID** → request `GreyAuct` (approval can take a day or two;
   until then the default sender works).

**Twilio (alternative/international):**
1. https://console.twilio.com → copy **Account SID** (AC…) and **Auth Token**.
2. Phone Numbers → Buy a number (SMS-capable) → that E.164 number is `TWILIO_FROM_NUMBER`.

**Provide:** `TERMII_API_KEY` (+ sender approval status) **or** Twilio SID + token + number.
**Feeds:** `TERMII_API_KEY`/`TERMII_SENDER_ID` or `TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN`/`TWILIO_FROM_NUMBER`.
**Unblocks:** real SMS OTPs and alerts.

## 6. Google OAuth — Client ID (U2 · Google sign-in)

**Steps:**
1. https://console.cloud.google.com → create/select project **GreyAuction**.
2. **APIs & Services → OAuth consent screen** → External → app name "GreyAuction",
   support email, developer email → **Publish** (no sensitive scopes needed).
3. **Credentials → Create Credentials → OAuth client ID → Web application**.
4. **Authorized JavaScript origins:** `https://greyauction.com` and `http://localhost:3000`.
   (No redirect URIs needed — we use Google Identity Services token flow.)
5. Create → copy the **Client ID** (`….apps.googleusercontent.com`).

**Provide:** the Client ID only (no secret — the backend verifies the ID token via
google-auth-library). **Feeds:** `GOOGLE_CLIENT_ID`. **Unblocks:** Google sign-in (C1).

## 7. DNS for greyauction.com (U3)

**Tell me:** where DNS is hosted (Cloudflare? registrar?) and whether you add records or give me access.

**Records (exact):**
| Hostname | Type | Value | Purpose |
|---|---|---|---|
| `greyauction.com` | A | Coolify VPS IP | frontend (`NEXTAUTH_URL`, `FRONTEND_URL`, `CORS_ORIGIN`) |
| `api.greyauction.com` | A | Coolify VPS IP | backend (`NEXT_PUBLIC_API_URL`, payment webhooks) |
| `cdn.greyauction.com` (optional) | CNAME | R2 custom domain | `S3_PUBLIC_HOST` |
| (from Brevo) | TXT | SPF/DKIM values Brevo shows | email deliverability |
| `www` (optional) | CNAME | greyauction.com | www alias |

**Unblocks:** production domain config, TLS certs via Coolify, webhook reachability.

> **⚠ 2026-09-01 corrections to the first delivery.**
> The supplied A-record values were `173.212.230.3.8000` — DNS **A records cannot store
> ports**; use the bare IP:
>
> | Hostname | Type | Correct value |
> |---|---|---|
> | `greyauction.com` | A | `173.212.230.3` |
> | `api.greyauction.com` | A | `173.212.230.3` |
> | `_dmarc` | TXT | `v=DMARC1; p=none; rua=mailto:rua@dmarc.brevo.com` ✅ received |
>
> Port 8000 (if the stack needs one) is handled by Coolify's reverse proxy (Traefik) on
> the VPS — ports 80/443 must reach it. SPF/DKIM from Brevo still pending (§4). Also
> still unknown: **where DNS is hosted** — Cloudflare or the registrar?

## 8. Coolify deploy access (U6)

> ✅ **2026-09-01: API token received & verified** (`GET /api/v1/servers` OK — server
> `localhost @ host.docker.internal`). VPS IP: `173.212.230.3`. Next: create the
> `greyauction` project via the API and wire env + deploy.

**Steps:**
1. https://coolify.gozmar.com → log in.
2. **+ New Project** → name `greyauction` → attach/select the VPS as **Server**
   (recommend ≥ 2 vCPU / 4 GB RAM for the 4-service stack: postgres+minio+backend+frontend).
3. Hand me access either way:
   - **API token:** Settings (admin) → **Keys & Tokens** → new token (read/write) → copy, or
   - a temporary team-member login.

**Provide:** project name + token (or login) + VPS IP (for the DNS A records).
**Unblocks:** full production deploy from `docker-compose.coolify.yml`, migrations-only DB
(`DB_SYNCHRONIZE=false`), scheduled backups.

## 9. Live FX feed (Phase E)

Any endpoint returning `{"rates":{…}}` or `{"data":{…}}` JSON:
- **Zero-signup option:** `https://open.er-api.com/v6/latest/NGN` (free, no key) — works as-is.
- exchangerate-api.com → free tier key → `https://v6.exchangerate-api.com/v6/KEY/latest/NGN`.
- Your fluentax/CBN endpoint — send me the URL (key embedded) and I'll verify the shape.

**Provide:** the URL. **Feeds:** `EXCHANGE_RATE_API_URL`. **Unblocks:** the 03:00 UTC cron +
the admin "Refresh from feed" button update real rates.

## 10. Business rules (U5) — ✅ ANSWERED 2026-09-01, implementation pending

1. **Buyer fee 5% / seller commission 5%** — each adjustable and enable/disable-able
   per seller account AND per product, from settings.
2. **VAT:** support **both bases** — fees-only or hammer+fees — selected via an
   activation switch.
3. **Payout schedule:** customizable per user preference (no fixed T+N).
4. **Escrow auto-release window:** fixed **at auction creation time**; may be **0**
   (immediate payment — buyer assumed to have inspected and agreed).
5. **Minimum bid increment:** set by the auctioneer/seller; **reserve price** policy
   set by the seller.
6. **Currency:** NGN default; USD/GHS/EUR display-only — confirmed.
7. **Direct sales:** fees **apply** to buy-now/direct sales.

**Feeds:** fee/VAT/settlement config (settings-driven, per-seller & per-product overrides)
+ test expectations (currently seeded defaults — will be replaced by these rules).

## 11. LLM providers (optional · self-serve)

✅ **Providers named 2026-09-01:** OpenRouter, DeepSeek, Claude/Anthropic, Ollama,
OpenAI — plus any provider exposing an Anthropic- or OpenAI-compatible base URL.
Keys to follow later; they are added in **Admin → AI Providers** (all of these are
existing presets, and custom OpenAI/Anthropic-compatible base URLs are supported).
I'll pre-seed the feature configs (chatbot, description generator, title optimizer)
with fallback chains once the keys arrive. `chatbot_assistant` is enabled by seed;
it needs at least one provider+model configured before it actually responds.

## 12. Sentry (optional)

Not wired in code yet. If you want error tracking at launch: sentry.io → create a NestJS
project → copy the **DSN** — I'll wire it during the deploy.

## 13. Push notifications (VAPID) — nothing needed

We generate the VAPID keypair ourselves. Just say "go".

## 14. Priority order — UPDATED after 2026-09-01 delivery

Still needed, in order:
1. **R2 key pair + public host** (§1) — storage go-live
2. **Brevo re-issue + SMTP username + SPF/DKIM** (§4) — email go-live
3. **FX feed URL** (§9) — say "use open.er-api.com" or send your URL
4. **SMS keys** (§5) — Termii or Twilio
5. Live payment keys when ready to transact (currently test-mode keys received)
6. LLM API keys (§11) — to follow
7. DNS host confirmation (§7) — Cloudflare or registrar?

Received & verified: Paystack ✅, Flutterwave ✅, Google Client ID ✅, Coolify ✅,
DNS values ✅ (corrected), business rules ✅, LLM provider list ✅.

## 15. Connections (state at 2026-09-01 close)

- **Coolify API — CONNECTED.** Token verified; v4.1.2; server `localhost` @
  host.docker.internal (VPS 173.212.230.3). Project **GreyAuction**
  (`b6as8aze8abhikytid2ysksw`) exists with an empty `production` env — apps to be
  created via API from github.com/gozmardynamics-glitch/Grey-Auction.
- **Cloudflare API — NOT CONNECTED.** Requested from user: custom API token with
  **Zone → DNS → Edit** + **Zone → Zone → Read**, scoped to greyauction.com —
  needed for A records (bare `173.212.230.3`), Brevo SPF/DKIM TXTs, and later
  the cdn CNAME. Alternative: user confirms DNS host and adds records manually.
  MCP is not available in this harness — the REST API is the integration path.
- **Secrets hygiene:** all received values live only in git-ignored `backend/.env`
  (verified ignored). Coolify token + Brevo keys were pasted in chat — rotate
  after go-live.

# GreyAuction — Production Keys & Access Runbook (U2–U6)

Companion to `docs/OPERATIONS.md` and `AUDIT_REPORT_v2.md` (SESSION HANDOFF).
This is the **detailed acquisition guide**: every item tells you exactly where to click,
what to copy, which env var it feeds, and what it unblocks.

> **Handing secrets over safely:** paste values into `backend/.env` (local) or as
> Coolify environment variables and tell me they are in place — or paste them in chat
> if that is easier (chat may be logged; rotate later if you care). Either way, once a
> value is in place I flip the corresponding flag and verify.

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

## 8. Coolify deploy access (U6)

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

## 10. Business rules (U5) — answer these

1. Buyer fee % and seller commission % (and on what base: hammer price? incl. shipping?).
2. VAT % (applied to fees only, or hammer + fees?).
3. Settlement/payout schedule (e.g. T+7 days after delivery confirmation).
4. Escrow auto-release window (days after delivery without dispute).
5. Minimum bid increment (NGN) and reserve-price policy.
6. Currency policy: NGN default; USD/GHS/EUR display-only?
7. Do fees apply to direct-sales (buy-now) too, or auctions only?

**Feeds:** fee/VAT/settlement config + test expectations (currently seeded defaults).

## 11. LLM providers (optional · self-serve)

Keys are added in **Admin → AI Providers** (presets: OpenAI, Anthropic, DeepSeek, Qwen, GLM,
Gemini, OpenRouter, Groq, Mistral, Ollama, …). Tell me WHICH providers you have keys for and
I'll pre-seed the feature configs (chatbot, description generator, title optimizer) with
sensible fallback chains. `chatbot_assistant` is now enabled by seed; it needs at least one
provider+model configured before it actually responds.

## 12. Sentry (optional)

Not wired in code yet. If you want error tracking at launch: sentry.io → create a NestJS
project → copy the **DSN** — I'll wire it during the deploy.

## 13. Push notifications (VAPID) — nothing needed

We generate the VAPID keypair ourselves. Just say "go".

## 14. Priority order

1. R2 keys (§1) → 2. Coolify + DNS (§7–8) → 3. Brevo + SMS (§4–5) → 4. Paystack/Flutterwave (§2–3)
→ 5. Google Client ID (§6) → 6. FX URL + business rules (§9–10).

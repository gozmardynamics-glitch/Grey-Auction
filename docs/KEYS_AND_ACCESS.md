# GreyAuction — Production Keys & Access (U2–U6 Shopping List)

Companion to `docs/OPERATIONS.md` and `AUDIT_REPORT_v2.md` §3 / §12–13 / SESSION HANDOFF.
Everything below maps 1:1 to env vars documented in `backend/.env.example`.

> **How to hand things over:** put values straight into `backend/.env` (local) or as
> Coolify environment variables on the resource — do **not** paste secrets into chat,
> they would land in logs. When something is in place, tell us and we flip the flag.

## 0. Already provided by you (this session)

| Item | Value | Notes |
|---|---|---|
| Production domain | `greyauction.com` | see §6 for the subdomain plan |
| Coolify host | `https://coolify.gozmar.com` | access still needed, see §7 |
| R2 account name | `grey-auction` | bucket = `grey-auction` |
| R2 S3 endpoint | `https://ff486626c9f1a7bdfce5ed9188ebae4e.r2.cloudflarestorage.com` | we set `S3_ENDPOINT` to this host (no path) and `S3_BUCKET=grey-auction`; the driver builds URLs as `{endpoint}/{bucket}/{key}` |

## 1. Cloudflare R2 — API key pair (U4, storage go-live)

- **Where:** Cloudflare dashboard → R2 → Overview → "Manage R2 API Tokens" → Create API token
  (Permission: Object Read & Write; scope: the `grey-auction` bucket).
- **Provide:** R2 **Access Key ID** + **Secret Access Key**.
- **Also choose the public host** (what users see in image URLs):
  - (a) custom domain — add `cdn.greyauction.com` in R2 → bucket → Settings → Custom Domains; or
  - (b) the free r2.dev public URL for the bucket (we set it as `S3_PUBLIC_HOST`).
- **Effect once provided:** we set `STORAGE_DRIVER=s3`, `S3_ENDPOINT` (above), `S3_ACCESS_KEY`,
  `S3_SECRET_KEY`, `S3_BUCKET=grey-auction`, `S3_FORCE_PATH_STYLE=true`, `S3_PUBLIC_HOST` —
  pure env change, no code or rebuild. Uploads start flowing to R2 instead of the local disk/MinIO.

## 2. Payment gateways (U2 / B-PAY-1: real capture + webhook)

Providers without keys are automatically skipped (payments stay in mock mode), so any subset works.

| Env var | Where to get it |
|---|---|
| `PAYSTACK_SECRET_KEY` | paystack.com → Settings → API Keys & Webhooks (live secret key) |
| `FLUTTERWAVE_SECRET_KEY` | Flutterwave dashboard → Settings → API Keys (live secret) |
| `FLUTTERWAVE_WEBHOOK_HASH` | Flutterwave → Settings → Webhooks: set URL `https://api.greyauction.com/api/payments/webhook/flutterwave`, copy the verif-hash it gives you |
| `INTERSWITCH_CLIENT_ID` / `INTERSWITCH_CLIENT_SECRET` | optional — Interswitch (Quickteller) merchant portal |
| `OPAY_MERCHANT_ID` / `OPAY_SECRET_KEY` | optional — OPay merchant dashboard |

- Paystack webhook URL (set in Paystack dashboard): `https://api.greyauction.com/api/payments/webhook/paystack`.
- We set `PAYMENT_WEBHOOK_URL=https://api.greyauction.com/api/payments/webhook` ourselves.

## 3. Email — Brevo (U2: real transactional email)

- **Provide:** `BREVO_API_KEY` (Brevo → SMTP & API → API Keys) **or** the SMTP relay pair
  (`BREVO_SMTP_USER` / `BREVO_SMTP_PASS`). Sender will be `noreply@greyauction.com`.
- **You must also:** add the SPF + DKIM records Brevo shows you to the `greyauction.com` DNS
  (see §6) — without them, mail lands in spam.

## 4. SMS — Termii or Twilio (U2: real OTP/alerts)

- Option A: `TERMII_API_KEY` (+ confirm sender ID `GreyAuct` is approved in your Termii account).
- Option B: `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` + `TWILIO_FROM_NUMBER` (an E.164 number you own).

## 5. Google OAuth (Phase C1: enable Google sign-in)

- **Where:** Google Cloud Console → APIs & Services → Credentials → Create "OAuth client ID" → Web application.
  - **Authorized JavaScript origins:** `https://greyauction.com` and `http://localhost:3000` (dev).
- **Provide:** `GOOGLE_CLIENT_ID` only (no secret needed — the backend verifies the ID token
  with `google-auth-library`; the frontend uses the same ID to init Google Identity Services).

## 6. DNS for greyauction.com (U3) — confirm the plan

Proposed topology (say if you want something different, e.g. www or same-origin /api):

| Hostname | Type | Points to | Used for |
|---|---|---|---|
| `greyauction.com` | A | Coolify VPS IP | frontend — `NEXTAUTH_URL`, `FRONTEND_URL`, `CORS_ORIGIN` |
| `api.greyauction.com` | A | Coolify VPS IP | backend — `NEXT_PUBLIC_API_URL=https://api.greyauction.com/api`, webhooks |
| `cdn.greyauction.com` (optional) | CNAME | R2 custom domain | `S3_PUBLIC_HOST` |
| SPF/DKIM TXT records | TXT | Brevo-provided values | email deliverability |

- **Provide:** where is DNS managed (registrar / Cloudflare / elsewhere) and who creates the records — you, or give us access to the DNS panel.
- We will set the matching env values (`FRONTEND_URL`, `CORS_ORIGIN`, `NEXTAUTH_URL`,
  `NEXT_PUBLIC_API_URL`, `PAYMENT_WEBHOOK_URL`, `S3_PUBLIC_HOST`) once the subdomains resolve.

## 7. Coolify access (U6: production deploy)

- **You:** in `coolify.gozmar.com`, create a **Project** (e.g. `greyauction`) with the VPS as a
  **Server**, then give us either:
  - a temporary dashboard login, or
  - a Coolify **API token** (Keys & Tokens → API tokens) + the server/project names.
- **We then:** add the `docker-compose.coolify.yml` stack (postgres + minio + backend + frontend),
  set all production env secrets (from §1–§6 + `JWT_SECRET`), deploy, run migrations, enable
  backups and Sentry. `DB_SYNCHRONIZE=false` with `migrationsRun: true` is already the prod default.

## 8. Live FX feed (Phase E: real exchange rates)

- **Provide:** `EXCHANGE_RATE_API_URL` — any feed that returns JSON in the shape
  `{ "rates": { "USD": 1500, ... } }` or `{ "data": { ... } }` (API key embedded in the URL is fine).
  You mentioned a fluentax CBN FX endpoint — that works if it matches the shape.
- **Effect:** the existing 03:00 UTC cron and the admin "Refresh from feed" button start updating real rates.

## 9. Business rules (U5) — confirm the numbers

Used by fees/VAT/settlement logic and their tests (currently seeded defaults):

- Buyer/seller **fee percentage**, **VAT %**, **settlement/payout schedule** (e.g. 7 days after delivery),
  escrow release policy, default currency (NGN) and whether GHS/EUR/USD must remain display-only.

## 10. LLM provider keys (optional, self-serve)

- Add them yourself in **Admin → AI Providers** (presets for OpenAI/Anthropic/DeepSeek/Qwen/Gemini/
  OpenRouter/Groq/… exist). Tell us which providers you have keys for and we can pre-seed feature
  configs (chatbot, description generator, title optimizer) with sensible fallback chains.

## 11. Push notifications (L1 follow-up, optional)

- **Nothing needed from you** — we generate the VAPID keypair ourselves. Just say "go".

## 12. Order of unblocking (suggested)

1. R2 keys (§1) → storage silently goes live, images stop hitting local disk.
2. Coolify access + DNS (§6–§7) → first production deploy with migrations-only DB.
3. Brevo + Termii/Twilio (§3–§4) → real emails/SMS in prod.
4. Paystack/Flutterwave (§2) → real payments + webhooks.
5. Google Client ID (§5) → Google sign-in enabled.
6. FX URL (§8) + business rules (§9) → live rates + aligned money math.

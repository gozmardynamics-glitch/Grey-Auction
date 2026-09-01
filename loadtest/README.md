# GreyAuction — Load & Performance Testing (L7)

Two toolchains, no paid services required:

| Tool | Purpose | Where |
|------|---------|-------|
| **k6** | Load/stress the API hot paths (bidding contention, browse reads, opt-in bursts) | `k6/` |
| **Lighthouse (CI)** | Enforce the 90+ Performance/Accessibility budget per build | `lighthouse/` |

## Prerequisites

- k6: https://grafana.com/docs/k6/latest/get-started/install/ (or `winget install grafana.k6`)
- Backend running: `npm run start:dev` in `backend/` (default `http://localhost:3001/api`)
- At least one ACTIVE product: `npm run seed:demo` in `backend/`
- Frontend production build for Lighthouse: `npm run build && npm run start` in `frontend/`
  (Lighthouse against `next dev` measures the dev server, not your app — always test a prod build.)

## k6 scenarios

```bash
# Public browse traffic (listing/detail/categories/search + SSR home)
k6 run -e VUS=50 -e DURATION=1m loadtest/k6/browse.js

# THE scale test: 100 concurrent buyers racing bids on one hot lot
# (exercises the optimistic-lock VersionColumn + proxy-bid engine)
k6 run -e BIDDERS=100 -e HOLD=2m loadtest/k6/bidding.js

# Newsletter double opt-in burst
k6 run -e VUS=20 -e DURATION=30s loadtest/k6/subscribe.js
```

Env knobs: `API_BASE_URL` (default `http://localhost:3001/api`), `WEB_BASE_URL`
(default `http://localhost:3000`), `LOAD_STAMP` (reuse the same throwaway users across runs).

### Budgets enforced by the scripts

- `http_req_failed < 1%` — server errors only; expected bid conflicts (400 "Bid must be
  higher") are filtered via `responseCallback` so they don't pollute the error rate.
- Bid placement: **p95 < 400 ms, p99 < 800 ms** at 100 concurrent bidders.
- Browse reads: p95 < 600 ms.
- `bids_accepted > 0` — sanity check that the contention path actually writes.

Bidding runs write a machine-readable summary to `loadtest/results/bidding-summary.json`.

## Lighthouse budget (90+)

```bash
# One-off desktop audit against a prod frontend on :3000
npx lighthouse http://localhost:3000/en \
  --preset=desktop --chrome-flags=\"--headless=new\" \
  --budget-path=loadtest/lighthouse/budgets.json \
  --output=html --output-path=loadtest/results/lighthouse-home.html

# CI-style: 3 runs x 2 static pages, fail the build under the budget
# (run from frontend/ - the config paths are resolved relative to cwd)
npx @lhci/cli@0.14.x autorun --config=../loadtest/lighthouse/lighthouserc.json
# (or, from frontend/: npm run test:lighthouse)
```

The LHCI config (`loadtest/lighthouse/lighthouserc.json`) audits
`/en/about-us` and `/en/faq` only - the homepage and `/en/auctions` are
excluded because their persistent/live connections (countdown, chatbot,
carousels, live bidding data) make Lighthouse's simulated networkidle
unreliable (see caveats below). Paths inside the config (`budgetPath`,
`outputDir`) are resolved relative to the working directory, so run it from
`frontend/` (as both the npm script and CI do) rather than
`loadtest/lighthouse/`.

Assertions (`lighthouserc.json`): Performance ≥ 90 (error), Accessibility ≥ 90 (error),
Best-practices/SEO ≥ 90 (warn), LCP ≤ 2.5 s, TBT ≤ 300 ms, CLS ≤ 0.1, TTFB ≤ 800 ms.
Resource-size budgets live in `budgets.json` (scripts ≤ 450 KiB, total ≤ 2 MiB, …).

### In CI (GitHub Actions)

A dedicated `lighthouse` job in `.github/workflows/ci.yml` runs LHCI on every push
and PR to `master`/`main`. It is deliberately independent of the `backend` job
(no database or seed data): it installs frontend deps, runs `next build`, starts the
production server on `:3000` in the background, polls `http://localhost:3000/en/about-us`
until it returns 200 (up to ~60 s), runs `npx @lhci/cli@0.14.x autorun` with the same
config, and uploads `frontend/.lighthouseci/` as an artifact (always, even on budget
failure). The config sets `chromeFlags: "--headless --no-sandbox"` and
`throttlingMethod: "provided"` so the run is stable on the ephemeral ubuntu runner.

### Local vs `npm run test:lighthouse`

`npm run test:lighthouse` (defined in `frontend/package.json`) is just a thin wrapper:

    lhci autorun --config=../loadtest/lighthouse/lighthouserc.json

It runs from `frontend/` and delegates entirely to the same `lighthouserc.json` that CI
uses, so a local `npm run test:lighthouse` is byte-for-byte the same audit CI runs — but
**it assumes a production server is already listening on `http://localhost:3000`** (run
`npm run build && npm run start` first). CI, by contrast, does the build + server-bootstrap
+ readiness poll itself. Both write the report to `frontend/.lighthouseci/`; the npm
script does not upload it anywhere.

## Lighthouse run — recorded result (L6, 2026-08-28)

Ran against the prod build (next build + next start on :3000, backend on :3001), system
Chrome (set CHROME_PATH), real network (no simulated throttle):

    npx --yes lighthouse http://localhost:3000/en/about-us --preset=desktop --throttling-method=provided --chrome-flags="--headless=new --no-sandbox" --budget-path=../loadtest/lighthouse/budgets.json --output=json --output-path=../loadtest/results/lighthouse-aboutus.json

Result (representative static content page /en/about-us):
**Performance 100 · Accessibility 100 · Best-practices 100 · SEO 100**
(LCP 0.2 s · TBT 0 ms · CLS 0 · TTFB 40 ms).

Caveats:
- The homepage keeps a persistent connection (live countdown / chatbot / carousels),
  which prevents Lighthouse's simulated networkidle from settling. Measure the homepage
  with --throttling-method=provided (as above) and treat simulated scores as indicative.
- On Windows the run logs a harmless EPERM during Chrome temp-dir cleanup after the report
  is written; it does not affect the emitted JSON.

## Known follow-ups

- WebSocket (Socket.IO `/auctions` namespace) load: k6 has no first-class Socket.IO
  client; use `k6/ws` against the Engine.IO endpoint or a dedicated socket.io load lib.
- Run k6 against staging (Coolify) once deployed — set `API_BASE_URL`/`WEB_BASE_URL`.

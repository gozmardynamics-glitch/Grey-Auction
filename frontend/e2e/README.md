# E2E accessibility (axe/WCAG) audit

Automated `axe-core` / WCAG 2.1 A+AA scan of the main public routes using Playwright.

## Prerequisites

The app must be running:

1. Backend API on `:3001` (e.g. `cd backend && node dist/src/main`).
2. Frontend on `:3000` (e.g. `cd frontend && npm run dev`).
3. Playwright chromium installed: `npx playwright install chromium`.

## Run

```bash
cd frontend
npm run test:a11y
```

Set `A11Y_BASE_URL` to target a different origin (default `http://localhost:3000`).

## Notes

- The scan currently covers unauthenticated public pages. Dashboard/admin screens
  need a session and are intentionally excluded here (add a login step to extend).
- Files: `playwright.config.ts`, `e2e/a11y.spec.ts`.

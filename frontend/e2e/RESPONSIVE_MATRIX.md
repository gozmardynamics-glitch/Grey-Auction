# Responsive & Accessibility Test Matrix (L6)

Automated results against the production build (`next build` + `next start`)
with the backend on :3001. Chromium via Playwright 1.62.

## Accessibility (axe-core, WCAG 2.1 A + AA)

`npm run test:a11y` — 12 public routes scanned, **0 violations**:

`/` · `/auctions` · `/faq` · `/about-us` · `/contact` · `/terms` ·
`/privacy-policy` · `/blog` · `/career` · `/advisors` · `/direct-sales` · `/subscribe`

Tags checked: `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`.

> Dashboards/admin require a session and are scanned separately (see e2e/README);
> add a login step in `a11y.spec.ts` to extend coverage there.

## Responsive matrix (no horizontal overflow)

`npx playwright test e2e/responsive.spec.ts` — 5 breakpoints × 5 pages = **25 checks, 0 overflows**.

| Breakpoint | Width | Checked pages |
|---|---|---|
| mobile-s | 360 | /, /auctions, /advisors, /direct-sales, /faq |
| mobile | 390 | same |
| tablet | 768 | same |
| laptop | 1024 | same |
| desktop | 1440 | same |

The assertion is `document.documentElement.scrollWidth - clientWidth <= 1`
(no hidden horizontal scroll from fixed-width children or 100vw+padding).

## Notes / follow-ups

- Full manual WCAG 2.1 AA pass (screen-reader walkthrough, keyboard-only, focus order,
  colour-contrast spot checks) is still a manual activity; the automated axe suite is
  the regression gate.
- `waitUntil: 'domcontentloaded'` is used (not `networkidle`) because the homepage
  keeps a persistent connection (live timer / chatbot / carousels) that never goes idle.

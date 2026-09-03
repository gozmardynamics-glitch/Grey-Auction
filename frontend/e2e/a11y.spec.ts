import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Automated axe-core / WCAG 2.1 AA scan of the main public routes.
// Public (unauthenticated) pages only — dashboards are scanned separately
// once a session is available (see e2e/README).
const publicPaths = [
  '/en',
  '/en/auctions',
  '/en/faq',
  '/en/about-us',
  '/en/contact',
  '/en/terms',
  '/en/privacy-policy',
  '/en/blog',
  '/en/career',
  '/en/advisors',
  '/en/direct-sales',
  '/en/subscribe',
];

for (const path of publicPaths) {
  test(`axe: ${path}`, async ({ page }) => {
    const resp = await page.goto(path, { waitUntil: 'networkidle' });
    // If the route 404s (e.g. no data yet), fail loudly so we notice.
    if (resp && resp.status() !== 200) {
      throw new Error(`${path} returned HTTP ${resp.status()}`);
    }
    // Wait for hydration AND client-side data: large skeleton blocks gone
    // (ignore tiny pulsing dots like the Live badge).
    await page.waitForFunction(
      () => document.readyState === 'complete' &&
        [...document.querySelectorAll('.animate-pulse')]
          .filter((el) => el.getBoundingClientRect().width > 24)
          .length === 0,
      { timeout: 25_000 },
    ).catch(() => {});
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    // Log the full violation list for debugging, then fail on any.
    if (results.violations.length > 0) {
      const summary = results.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        help: v.help,
        nodes: v.nodes.length,
        sample: v.nodes[0]?.target?.join(' ') || '',
      }));
      console.log(`
${path} violations:` + JSON.stringify(summary, null, 2));
    }
    expect(results.violations).toEqual([]);
  });
}

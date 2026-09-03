import { test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Audit helper: dumps compact contrast-violation data per route (temporary).
const publicPaths = [
  '/en', '/en/auctions', '/en/faq', '/en/about-us', '/en/contact', '/en/terms',
  '/en/privacy-policy', '/en/blog', '/en/career', '/en/advisors', '/en/direct-sales', '/en/subscribe',
];

for (const path of publicPaths) {
  test('audit ' + path, async ({ page }) => {
    const resp = await page.goto(path, { waitUntil: 'networkidle' });
    if (resp && resp.status() !== 200) throw new Error(path + ' HTTP ' + resp.status());
    await page.waitForTimeout(700);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    const out: any[] = [];
    for (const v of results.violations) {
      const sample = v.nodes.slice(0, 4).map((n) => {
        const fails = (n.any || []).filter((c: any) => !c.pass).concat((n.all || []).filter((c: any) => !c.pass));
        const f = fails[0];
        return {
          target: (n.target || []).join(' ').slice(0, 80),
          html: (n.html || '').slice(0, 90),
          fg: f?.data?.fgColor || null,
          bg: f?.data?.bgColor || null,
          ratio: f?.data?.contrastRatio ? Number(f.data.contrastRatio).toFixed(2) : null,
          fontSize: f?.data?.fontSize || null,
        };
      });
      out.push({ id: v.id, impact: v.impact, nodes: v.nodes.length, sample });
    }
    console.log('AUDIT\n' + JSON.stringify({ path, violations: out }));
  });
}
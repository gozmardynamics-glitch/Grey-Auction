import { test, expect } from '@playwright/test';

// Responsive test matrix (L6): assert no horizontal overflow across the
// core breakpoints on public pages. A scrollWidth larger than the viewport
// means a layout regression (fixed-width element / overflow).
const BREAKPOINTS = [
  { name: 'mobile-s', width: 360, height: 800 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'laptop', width: 1024, height: 768 },
  { name: 'desktop', width: 1440, height: 900 },
];

const PAGES = ['/en', '/en/auctions', '/en/advisors', '/en/direct-sales', '/en/faq'];

for (const bp of BREAKPOINTS) {
  for (const path of PAGES) {
    test('no horizontal overflow: ' + bp.name + ' @ ' + path, async ({ page }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(800);

      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        return doc.scrollWidth - doc.clientWidth;
      });

      // Allow 1px rounding tolerance.
      expect(overflow, path + ' overflows by ' + overflow + 'px at ' + bp.width + 'px').toBeLessThanOrEqual(1);
    });
  }
}

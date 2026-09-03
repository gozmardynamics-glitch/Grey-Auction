import { test, expect } from '@playwright/test';

// Authenticated smoke of the admin dashboard (session from auth.setup.ts).
test.describe('admin dashboard (authenticated)', () => {
  test('stats cards render and layout does not overflow', async ({ page }) => {
    await page.goto('/en/admin/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/total revenue|revenue/i).first()).toBeVisible({ timeout: 20000 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, 'dashboard overflows by ' + overflow + 'px').toBeLessThanOrEqual(1);
  });
});
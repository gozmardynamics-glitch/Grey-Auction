import { test, expect } from '@playwright/test';

// Authenticated seller dashboard smoke (storageState minted in auth.setup.ts).
// Runs under the chromium-seller project only. Mirrors the admin dashboard
// spec: content renders and the layout does not overflow horizontally.
test.describe('seller dashboard (authenticated)', () => {
  test('overview renders and layout does not overflow', async ({ page }) => {
    await page.goto('/en/seller/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible({ timeout: 20000 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, 'seller dashboard overflows by ' + overflow + 'px').toBeLessThanOrEqual(1);
  });

  test('seller payment page renders', async ({ page }) => {
    await page.goto('/en/seller/payment', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Payment', exact: true }).first()).toBeVisible({ timeout: 20000 });
  });

  test('seller bidding-room page renders', async ({ page }) => {
    await page.goto('/en/seller/bidding-room', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/room/i).first()).toBeVisible({ timeout: 20000 });
  });
});

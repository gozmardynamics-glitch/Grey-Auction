import { test, expect } from '@playwright/test';

// Authenticated buyer dashboard smoke (storageState minted in auth.setup.ts).
// Runs under the chromium-buyer project only. Mirrors the admin dashboard
// spec: content renders and the layout does not overflow horizontally.
test.describe('buyer dashboard (authenticated)', () => {
  test('account area renders and layout does not overflow', async ({ page }) => {
    await page.goto('/en/buyer/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'My Account' })).toBeVisible({ timeout: 20000 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, 'buyer dashboard overflows by ' + overflow + 'px').toBeLessThanOrEqual(1);
  });

  test('wallet module shows available balance', async ({ page }) => {
    await page.goto('/en/buyer/dashboard', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Wallet' }).click();
    await expect(page.getByText('Available Balance')).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('button', { name: /deposit/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /withdraw/i })).toBeVisible();
  });
});

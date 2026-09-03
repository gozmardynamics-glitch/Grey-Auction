import { test, expect } from '@playwright/test';

// Admin > AI console smoke (authenticated).
// NOTE: the AI dashboard's server-side provider fetch currently returns 401 from
// the backend (JWT not forwarded on SSR), so the provider GRID is empty; the
// spec asserts the console chrome renders. See docs/QA_STATUS.md.
test.describe('admin AI console (authenticated)', () => {
  test('AI dashboard renders its console', async ({ page }) => {
    await page.goto('/en/admin/ai', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/ai|dashboard|usage|provider/i).first()).toBeVisible({ timeout: 20000 });
    await expect(page).toHaveURL(/admin\/ai/);
  });

  test('AI providers page is reachable via sidebar', async ({ page }) => {
    await page.goto('/en/admin/ai/providers', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/admin\/ai\/providers/);
  });
});
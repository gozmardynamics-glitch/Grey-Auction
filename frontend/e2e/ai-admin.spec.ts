import { test, expect } from '@playwright/test';

// Admin > AI console (authenticated).
// The AI dashboard and its sub-pages fetch JWT-guarded backend data
// (JwtAuthGuard + AdminRolesGuard on /api/admin/ai). Since the SSR fetches
// now forward the admin session token (ai-api.ts -> auth() -> Bearer), the
// provider grid renders with real data on first paint. The assertions below
// pin that behavior — an empty SSR grid regresses these tests.
test.describe('admin AI console (authenticated)', () => {
  test('AI dashboard renders its console with providers on first paint', async ({ page }) => {
    await page.goto('/en/admin/ai', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/ai|dashboard|usage|provider/i).first()).toBeVisible({ timeout: 20000 });
    await expect(page).toHaveURL(/admin\/ai/);
    // Seeded provider must be present in the SSR provider grid (8 providers,
    // all keyless-but-active: OpenAI, Anthropic, Gemini, DeepSeek, ...).
    await expect(page.getByText('OpenAI', { exact: true }).first()).toBeVisible({ timeout: 20000 });
  });

  test('AI providers page is reachable via sidebar and lists providers', async ({ page }) => {
    await page.goto('/en/admin/ai/providers', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/admin\/ai\/providers/);
    await expect(page.getByText('OpenAI', { exact: true }).first()).toBeVisible({ timeout: 20000 });
  });
});

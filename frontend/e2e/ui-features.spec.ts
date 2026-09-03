import { test, expect, type Page } from '@playwright/test';

// Feature specs for the newer UI surfaces:
//  - institutional subcategory tabs on the auctions listing
//  - theme switcher (Light / Grey / Dark)
//  - homepage 'Browse by Auction Type' cards

// Tabs render client-side after data hydration, so wait for the row first.
async function armTabs(page: Page, category: string) {
  await page.goto('/en/auctions?category=' + encodeURIComponent(category), { waitUntil: 'domcontentloaded' });
  const row = page.locator('button[aria-pressed]', { hasText: 'All' }).first();
  await row.waitFor({ state: 'visible', timeout: 20000 });
  return row;
}

test.describe('subcategory tabs (institutional arms)', () => {
  test('Government route shows arm tabs with counts and All active', async ({ page }) => {
    await armTabs(page, 'Government');
    const allTab = page.locator('button[aria-pressed]', { hasText: 'All' }).first();
    await expect(allTab).toHaveAttribute('aria-pressed', 'true');
    for (const arm of ['Federal', 'State', 'Ministries', 'Parastatals', 'Agencies & Commissions', 'Security & Defence']) {
      await expect(page.getByRole('button', { name: new RegExp('^' + arm.replace(/[&]/g, '\\$&') + ' \\d+$') })).toBeVisible();
    }
  });

  test('selecting Parastatals filters lots and syncs the URL', async ({ page }) => {
    await armTabs(page, 'Government');
    const tab = page.getByRole('button', { name: /^Parastatals/ });
    await tab.click();
    await expect.poll(() => page.url()).toContain('subcategory=Parastatals');
    await expect(page.getByRole('button', { name: /^Parastatals/ })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText('Federal Agency Office Equipment Auction').first()).toBeVisible();
  });

  test('deep link with subcategory param preselects the arm', async ({ page }) => {
    await page.goto('/en/auctions?category=Government&subcategory=Federal', { waitUntil: 'domcontentloaded' });
    const tab = page.getByRole('button', { name: /^Federal \d+$/ });
    await expect(tab).toBeVisible({ timeout: 20000 });
    await expect(tab).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText(/Government Surplus .*Utility Pickup Trucks/i).first()).toBeVisible();
  });

  test('non-institutional category shows no arm tabs', async ({ page }) => {
    await page.goto('/en/auctions?category=Electronics', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000); // allow client data + tabs logic to settle
    await expect(page.locator('button[aria-pressed]')).toHaveCount(0);
  });
});

async function selectTheme(page: Page, name: string) {
  const trigger = page.getByRole('button', { name: /^Theme: / }).first();
  await expect(trigger).toBeAttached({ timeout: 20000 });
  await expect(trigger).toBeVisible({ timeout: 20000 });
  // Radix mounts the menu in a portal after hydration; retry open+select.
  for (let i = 0; i < 5; i++) {
    await trigger.click({ force: true }).catch(() => {});
    const item = page.locator('[role="menuitem"]', { hasText: name });
    try {
      await item.waitFor({ state: 'visible', timeout: 8000 });
      await item.click({ force: true });
      return;
    } catch {
      // menu did not open — press Escape and retry
      await page.keyboard.press('Escape').catch(() => {});
      await page.waitForTimeout(1000);
    }
  }
  throw new Error('theme menu item never became clickable: ' + name);
}

test.describe('theme switcher', () => {
  test('switching to Dark applies the dark class and persists', async ({ page }) => {
    await page.goto('/en', { waitUntil: 'domcontentloaded' });
    await selectTheme(page, 'Dark');
    await expect(page.locator('html')).toHaveClass(/dark/);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveClass(/dark/);
    await selectTheme(page, 'Light');
    await expect(page.locator('html')).not.toHaveClass(/dark|grey/);
  });

  test('switching to Grey applies the grey class', async ({ page }) => {
    await page.goto('/en', { waitUntil: 'domcontentloaded' });
    await selectTheme(page, 'Grey');
    await expect(page.locator('html')).toHaveClass(/grey/);
    await selectTheme(page, 'Light');
  });
});

test.describe('homepage auction type cards', () => {
  test('all four auction-type cards link to filtered listings', async ({ page }) => {
    await page.goto('/en', { waitUntil: 'domcontentloaded' });
    for (const param of ['Government', 'Embassy', 'Corporate', 'Private%20Room']) {
      const link = page.locator('a[href*="category=' + param + '"]').first();
      await expect(link).toBeVisible({ timeout: 20000 });
      const href = await link.getAttribute('href');
      expect(href, 'href for ' + param).toContain('category=');
    }
  });
});
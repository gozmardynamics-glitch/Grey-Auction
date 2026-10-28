// Mints the admin storageState used by the authenticated Playwright projects.
//
// Administrators now need a second factor, so this script answers the challenge
// from `ADMIN_MFA_SECRET` (or the local `.admin-mfa-secret` file that
// `tools/admin/enrol-mfa.js` writes). Without a secret it stops with an
// explanation rather than timing out on a page that will never load.
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const { currentCode, readSecret } = require('../../tools/lib/mfa');

const ROOT = path.join(__dirname, '..', '..');

(async () => {
  const secret = readSecret();
  if (!secret) {
    console.error(
      'No administrator MFA secret found. Run `node tools/admin/enrol-mfa.js` once,\n' +
        'or set ADMIN_MFA_SECRET, then run this again.',
    );
    process.exit(1);
  }

  const b = await chromium.launch();
  const ctx = await b.newContext();
  const page = await ctx.newPage();
  await page.goto('http://localhost:3000/en/auth/login', {
    waitUntil: 'networkidle',
    timeout: 60_000,
  });
  await page.getByRole('button', { name: /accept all/i }).click({ timeout: 5_000 }).catch(() => {});
  await page.waitForTimeout(1_000);
  await page.getByLabel('Email').fill('admin@greyauction.com');
  await page.getByLabel('Password').fill('Admin@12345');
  await page.getByRole('button', { name: /^sign in$/i }).click();

  // Either the code step (already enrolled) or the setup step (first run).
  await page
    .getByLabel(/authentication code/i)
    .or(page.getByRole('heading', { name: /set up two-factor/i }))
    .first()
    .waitFor({ timeout: 30_000 });

  if (await page.getByRole('heading', { name: /set up two-factor/i }).count()) {
    console.error(
      'This administrator has no second factor yet.' +
        '\nRun `node tools/admin/enrol-mfa.js` and sign in once with a code before minting the state.',
    );
    await b.close();
    process.exit(1);
  }

  for (const offset of [0, 1]) {
    await page.getByLabel(/authentication code/i).fill(currentCode(secret, offset));
    await page.getByRole('button', { name: /verify and sign in/i }).click();
    const landed = await page
      .waitForURL('**/admin/dashboard', { timeout: 30_000 })
      .then(() => true)
      .catch(() => false);
    if (landed) break;
    // A code that was just used is refused; the next step's code will work.
    await page.waitForTimeout(2_000);
  }

  console.log('logged in:', page.url());
  fs.mkdirSync(path.join(ROOT, 'frontend', 'playwright', '.auth'), { recursive: true });
  await ctx.storageState({
    path: path.join(ROOT, 'frontend', 'playwright', '.auth', 'admin.json'),
  });
  console.log('storageState saved');
  await b.close();
})().catch((e) => {
  console.error('FATAL', e.message);
  process.exit(1);
});

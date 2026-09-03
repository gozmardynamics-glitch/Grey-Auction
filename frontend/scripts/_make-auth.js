// Temporary: perform admin login and save storageState for the auth'd spec project.
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext();
  const page = await ctx.newPage();
  await page.goto('http://localhost:3000/en/auth/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.getByRole('button', { name: /accept all/i }).click().catch(() => {});
  await page.getByLabel('Email').fill('admin@greyauction.com');
  await page.getByLabel('Password').fill('Admin@12345');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/admin/dashboard', { timeout: 90000 });
  console.log('logged in:', page.url());
  fs.mkdirSync(path.join(__dirname, '..', 'playwright', '.auth'), { recursive: true });
  await ctx.storageState({ path: path.join(__dirname, '..', 'playwright', '.auth', 'admin.json') });
  console.log('storageState saved');
  await b.close();
})().catch((e) => { console.error('FATAL', e.message); process.exit(1); });
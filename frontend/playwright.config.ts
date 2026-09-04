import { defineConfig, devices } from '@playwright/test';

// E2E runner: public a11y/responsive/feature specs (anonymous, cookie banner
// pre-accepted via static storageState) + authenticated admin dashboard smoke.
// Requires: backend on :3001, frontend on :3000 (see e2e/README).
const PUBLIC_STATE = 'playwright/.auth/public.json';
const ADMIN_STATE = 'playwright/.auth/admin.json';
const SELLER_STATE = 'playwright/.auth/seller.json';
const BUYER_STATE = 'playwright/.auth/buyer.json';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  // Cap inter-project parallelism: the dev box runs FE+BE+DB alongside the
  // suite, and unbounded project workers starve the dev servers (login minting
  // and heavy axe scans time out under contention). With fullyParallel: false
  // this only serializes projects; the cost is a slower, reliable run.
  workers: 2,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: process.env.A11Y_BASE_URL || 'http://localhost:3000',
    viewport: { width: 1280, height: 900 },
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      use: { storageState: PUBLIC_STATE },
    },
    {
      name: 'chromium-public',
      testIgnore: /(dashboard|ai-admin|seller|buyer)\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], storageState: PUBLIC_STATE },
    },
    {
      name: 'chromium-auth',
      testMatch: /(dashboard|ai-admin)\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], storageState: ADMIN_STATE },
      dependencies: ['setup'],
    },
    {
      name: 'chromium-seller',
      testMatch: /seller\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], storageState: SELLER_STATE },
      dependencies: ['setup'],
    },
    {
      name: 'chromium-buyer',
      testMatch: /buyer\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], storageState: BUYER_STATE },
      dependencies: ['setup'],
    },
  ],
});
import { defineConfig, devices } from '@playwright/test';

// E2E runner: public a11y/responsive/feature specs (anonymous, cookie banner
// pre-accepted via static storageState) + authenticated admin dashboard smoke.
// Requires: backend on :3001, frontend on :3000 (see e2e/README).
const PUBLIC_STATE = 'playwright/.auth/public.json';
const ADMIN_STATE = 'playwright/.auth/admin.json';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
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
      testIgnore: /dashboard\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], storageState: PUBLIC_STATE },
    },
    {
      name: 'chromium-auth',
      testMatch: /dashboard\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], storageState: ADMIN_STATE },
      dependencies: ['setup'],
    },
  ],
});
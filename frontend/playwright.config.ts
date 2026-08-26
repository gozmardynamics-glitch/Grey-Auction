import { defineConfig, devices } from '@playwright/test';

// Accessibility (axe/WCAG) audit runner.
// Requires: backend on :3001, frontend on :3000 (see README/Quick Reference).
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
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});

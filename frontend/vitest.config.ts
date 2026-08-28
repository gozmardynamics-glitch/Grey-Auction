import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    // Exclude Playwright E2E specs (they use @playwright/test, not vitest).
    exclude: ['**/node_modules/**', '**/e2e/**', '**/playwright-report/**', '**/test-results/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});

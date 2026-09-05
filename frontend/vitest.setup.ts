import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import en from './messages/en.json';

/**
 * Resolve a dotted key path against the English catalog so components that call
 * useTranslations render real strings in unit tests without needing a
 * NextIntlClientProvider wrapper. Falls back to the full key path when missing.
 */
function resolveMessage(namespace: string | undefined, key: string, params?: Record<string, unknown>): string {
  const path = namespace ? namespace + '.' + key : key;
  let value: unknown = en as Record<string, unknown>;
  for (const part of path.split('.')) {
    if (value && typeof value === 'object') value = (value as Record<string, unknown>)[part];
    else return path;
  }
  if (typeof value !== 'string') return path;
  if (params) {
    return value.replace(/\{(\w+)\}/g, (_match, name: string) =>
      params[name] === undefined ? '{' + name + '}' : String(params[name]),
    );
  }
  return value;
}

// Deterministic English i18n for unit tests (real catalogs are exercised by Playwright).
vi.mock('next-intl', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next-intl')>();
  return {
    ...actual,
    useLocale: () => 'en',
    useTranslations: (namespace?: string) =>
      (key: string, params?: Record<string, unknown>) =>
        resolveMessage(namespace, key, params),
  };
});

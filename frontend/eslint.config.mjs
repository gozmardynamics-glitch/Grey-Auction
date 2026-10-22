import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // Standalone node helpers written in CommonJS — not part of the app bundle.
    'scripts/**',
  ]),
  {
    rules: {
      // eslint-config-next 16 enables the React Compiler lint rules, which flag
      // the mount-guard pattern (`useEffect(() => setMounted(true), [])`) and
      // effect-driven data loads used throughout this codebase. Downgraded to a
      // warning so CI gates on correctness errors while the migration to
      // useSyncExternalStore / RTK Query proceeds incrementally.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/__tests__/**'],
    rules: {
      // Test doubles legitimately need loosely typed mocks.
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
]);

export default eslintConfig;

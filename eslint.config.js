// ESLint 9 flat config for the cuoti project
import tseslint from '@typescript-eslint/eslint-plugin';

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'public/**', '*.config.js', 'server.cjs'],
  },
  ...tseslint.configs['flat/recommended'],
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // Sync/backup services deliberately touch arbitrary rows; keep code simple.
      '@typescript-eslint/no-explicit-any': 'off',
      // React 18 + Vite template keeps this convention.
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
];

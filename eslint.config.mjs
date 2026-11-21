import js from '@eslint/js';
import nx from '@nx/eslint-plugin';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Layering enforced by `@nx/enforce-module-boundaries` (tags live in each package.json):
 *   app → feature → ui | domain | data-access | util
 *   ui and domain never reach data-access; domain is pure (no React, no DOM).
 */
const depConstraints = [
  {
    sourceTag: 'type:app',
    onlyDependOnLibsWithTags: [
      'type:feature',
      'type:ui',
      'type:domain',
      'type:data-access',
      'type:util',
    ],
  },
  { sourceTag: 'type:e2e', onlyDependOnLibsWithTags: [] },
  {
    sourceTag: 'type:feature',
    onlyDependOnLibsWithTags: ['type:ui', 'type:domain', 'type:data-access', 'type:util'],
  },
  { sourceTag: 'type:data-access', onlyDependOnLibsWithTags: ['type:domain', 'type:util'] },
  { sourceTag: 'type:ui', onlyDependOnLibsWithTags: ['type:ui', 'type:util'] },
  { sourceTag: 'type:domain', onlyDependOnLibsWithTags: ['type:domain', 'type:util'] },
  { sourceTag: 'type:util', onlyDependOnLibsWithTags: ['type:util'] },
];

export default tseslint.config(
  {
    ignores: [
      '**/dist',
      '**/out-tsc',
      '**/test-output',
      '**/coverage',
      '**/playwright-report',
      '**/test-results',
      '**/vite.config.*.timestamp*',
      'docs/prototype',
    ],
  },
  {
    files: ['**/*.{ts,tsx,mts}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2023,
      globals: { ...globals.browser, ...globals.node },
      // Type-aware linting, needed by `@typescript-eslint/no-deprecated`
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    plugins: {
      '@nx': nx,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          // Tooling outside the project graph that tests may use: the prototype renderer
          allow: [
            '^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$',
            '^.*/tools/prototype/render\\.mjs$',
          ],
          depConstraints,
        },
      ],
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true, allowExportNames: ['useI18n'] },
      ],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
      // Team standard: no new code may use APIs marked `@deprecated` (React, DOM, libs, our own)
      '@typescript-eslint/no-deprecated': 'error',
      // Team standard: components are arrow functions, never `function Component()`
      'no-restricted-syntax': [
        'error',
        {
          selector: 'FunctionDeclaration[id.name=/^[A-Z]/]',
          message: 'Define components as arrow functions: const Component = () => …',
        },
      ],
      // Team standard: named exports only (lazy-loaded modules opt out explicitly)
      'no-restricted-exports': ['error', { restrictDefaultExports: { direct: true } }],
    },
  },
  {
    // Tool configs must default-export their config object
    files: ['**/*.config.{ts,mts,mjs}', '**/eslint.config.mjs'],
    rules: { 'no-restricted-exports': 'off' },
  },
  {
    files: ['**/*.test.{ts,tsx}', '**/test-setup.ts', 'apps/web-e2e/**'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  prettier,
);

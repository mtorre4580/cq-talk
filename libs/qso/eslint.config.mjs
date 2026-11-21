import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    // The QSO domain is pure TypeScript: side effects live in util and data-access libraries
    files: ['src/**/*.ts'],
    ignores: ['src/**/*.test.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['react', 'react-dom', 'react/*'], message: 'libs/qso must not use React.' },
            { group: ['@anthropic-ai/*'], message: 'Network clients belong in libs/claude.' },
          ],
        },
      ],
      'no-restricted-globals': ['error', 'window', 'document', 'localStorage', 'fetch'],
    },
  },
];

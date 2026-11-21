/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

export default defineConfig({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/libs/qso',
  test: {
    name: '@cq-talk/qso',
    watch: false,
    globals: true,
    environment: 'node',
    css: false,
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8' as const,
      reportsDirectory: './test-output/coverage',
      include: ['src/**/*.{ts,tsx}'],
    },
  },
});

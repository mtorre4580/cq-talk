/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/libs/claude',
  plugins: [react()],
  test: {
    name: '@cq-talk/claude',
    watch: false,
    globals: true,
    environment: 'jsdom',
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

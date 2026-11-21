/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves the project at /cq-talk/
const PAGES_BASE = '/cq-talk/';

export default defineConfig(({ command, isPreview }) => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/web',
  base: command === 'build' || isPreview ? PAGES_BASE : '/',
  plugins: [react()],
  server: { port: 4200, host: 'localhost' },
  preview: { port: 4300, host: 'localhost' },
  build: {
    outDir: './dist',
    emptyOutDir: true,
    reportCompressedSize: true,
  },
  test: {
    name: '@cq-talk/web',
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
}));

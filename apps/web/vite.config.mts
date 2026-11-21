/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// GitHub Pages serves the project at /cq-talk/
const PAGES_BASE = '/cq-talk/';

/**
 * Content Security Policy for the production build. The user's API key lives in localStorage, so
 * the page may only load its own code and only talk to its origin and api.anthropic.com.
 * Development skips it: Vite's dev server injects inline styles and opens a websocket.
 */
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self' https://api.anthropic.com",
  "media-src 'self' blob:",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const contentSecurityPolicy = (): Plugin => ({
  name: 'cq-talk:csp',
  apply: 'build',
  transformIndexHtml: () => [
    {
      tag: 'meta',
      attrs: { 'http-equiv': 'Content-Security-Policy', content: CONTENT_SECURITY_POLICY },
      injectTo: 'head-prepend',
    },
  ],
});

export default defineConfig(({ command, isPreview }) => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/web',
  base: command === 'build' || isPreview ? PAGES_BASE : '/',
  plugins: [react(), tailwindcss(), contentSecurityPolicy()],
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

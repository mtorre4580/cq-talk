/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages serves the project at /cq-talk/
const PAGES_BASE = '/cq-talk/';

/**
 * Content Security Policy for the production build. The user's API keys live in localStorage, so
 * the page may only load its own code and only talk to its origin, api.anthropic.com and
 * api.elevenlabs.io.
 * Development skips it: Vite's dev server injects inline styles and opens a websocket.
 */
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  // The user's own keys only reach these two services
  "connect-src 'self' https://api.anthropic.com https://api.elevenlabs.io",
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
  plugins: [
    react(),
    tailwindcss(),
    contentSecurityPolicy(),
    VitePWA({
      registerType: 'autoUpdate',
      // A separate registerSW.js file: an inline script would break the CSP
      injectRegister: 'script',
      includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        id: PAGES_BASE,
        name: 'CQ talk',
        short_name: 'CQ talk',
        description:
          'Practice spoken English on the air: tune a topic, talk with an AI radio operator and get a QSL card with your corrections.',
        lang: 'es',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#05080D',
        theme_color: '#05080D',
        categories: ['education'],
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // The app shell works offline; the Claude API is never cached
        globPatterns: ['**/*.{js,css,html,woff2,png,svg,ico}'],
        // The SDK (useless offline) and the PDF export are heavy and lazy: cache them the first
        // time they are used instead of on install, to keep the first visit light on phones
        globIgnores: [
          '**/client-*',
          '**/jspdf*',
          '**/html2canvas*',
          '**/purify.es*',
          '**/index.es-*',
          '**/logo.svg',
          // Only link previews (social networks, chat apps) fetch it
          '**/og-image.png',
        ],
        runtimeCaching: [
          {
            urlPattern: ({ sameOrigin, url }) => sameOrigin && url.pathname.includes('/assets/'),
            handler: 'CacheFirst',
            options: { cacheName: 'cq-talk-lazy-assets', expiration: { maxEntries: 30 } },
          },
        ],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
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

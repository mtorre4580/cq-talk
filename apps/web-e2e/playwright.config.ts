import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';

const PORT = 4300;
// The preview server serves the production build under the GitHub Pages base path
const baseURL = process.env['BASE_URL'] ?? `http://localhost:${PORT}/cq-talk/`;

/**
 * Browser tests against the production build: smoke, accessibility (axe) and, from PR 7 on,
 * visual snapshots at desktop and phone widths.
 */
export default defineConfig({
  ...nxE2EPreset(fileURLToPath(import.meta.url), { testDir: './src' }),
  forbidOnly: !!process.env['CI'],
  // Fail loudly instead of hanging (a stale preview server once kept a run waiting)
  timeout: 30_000,
  globalTimeout: 10 * 60_000,
  retries: process.env['CI'] ? 1 : 0,
  use: {
    baseURL,
    trace: 'retain-on-failure',
    // Specs inject a style that switches animations off; csp.spec.ts turns the policy back on
    bypassCSP: true,
    // The PWA's service worker would answer routed test pages with the app shell;
    // pwa.spec.ts turns it back on
    serviceWorkers: 'block',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } },
    },
    { name: 'phone', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    // Plain vite preview: Nx's inferred preview readiness check never settles with the PWA
    // plugin, so the e2e target depends on the build instead (see package.json)
    command: `pnpm exec vite preview --config apps/web/vite.config.mts --port ${PORT} --strictPort`,
    url: baseURL,
    reuseExistingServer: !process.env['CI'],
    cwd: workspaceRoot,
  },
});

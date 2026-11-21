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
  retries: process.env['CI'] ? 1 : 0,
  use: {
    baseURL,
    trace: 'retain-on-failure',
    // Specs inject a style that switches animations off; csp.spec.ts turns the policy back on
    bypassCSP: true,
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } },
    },
    { name: 'phone', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `pnpm nx run @cq-talk/web:preview`,
    url: baseURL,
    reuseExistingServer: !process.env['CI'],
    cwd: workspaceRoot,
  },
});

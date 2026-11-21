import { defineConfig } from 'vitest/config';

// Lets editors and `vitest` at the root discover every project's own config.
// Nx runs each project's tests through its inferred `test` target.
export default defineConfig({
  test: {
    projects: ['apps/*/vite.config.mts', 'libs/**/vite.config.mts'],
  },
});

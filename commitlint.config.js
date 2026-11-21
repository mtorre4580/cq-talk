// Conventional commits: https://www.conventionalcommits.org
// Scopes are optional; when present they name an Nx project without the `@cq-talk/` prefix
// (`feat(ui): …`, `fix(qso): …`) or an area (`ci`, `deps`, `release`).
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Keep headers short and scannable (`type: subject`)
    'header-max-length': [2, 'always', 72],
    'type-enum': [
      2,
      'always',
      [
        'build',
        'chore',
        'ci',
        'docs',
        'feat',
        'fix',
        'perf',
        'refactor',
        'revert',
        'style',
        'test',
      ],
    ],
  },
};

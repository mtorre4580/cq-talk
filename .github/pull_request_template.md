<!--
  Fill in every section. Write "N/A" when a section does not apply instead of deleting it.
  The PR title must follow Conventional Commits, e.g. `feat(ui): add tuning dial`.
  Stacked PR? Say which PR it builds on in "Notes for reviewers".
-->

## Summary

<!-- What does this PR do and why? 1–3 sentences focused on the problem and the outcome. -->

## Type of change

- [ ] `feat` — new feature
- [ ] `fix` — bug fix
- [ ] `refactor` — code change with no behavior change
- [ ] `perf` — performance improvement
- [ ] `style` — formatting or visual-only change
- [ ] `test` — tests only
- [ ] `docs` — documentation only
- [ ] `chore` / `build` / `ci` — tooling, dependencies or pipeline
- [ ] **Breaking change** — existing behavior, URLs or stored data (`localStorage`, IndexedDB) change

## Changes

<!-- Bullet list of the main changes. Mention the Nx projects and files reviewers should focus on. -->

-

## Screenshots / recordings

<!-- Required for UI changes: desktop (1280 px) and phone (390 px), next to the prototype. "N/A" otherwise. -->

| Width | Prototype | This PR |
| ----- | --------- | ------- |
| 1280  |           |         |
| 390   |           |         |

## How to test

1. `pnpm install && pnpm dev`
2.
3.

## Checklist

### Quality

- [ ] `pnpm check` passes (sync, lint, typecheck, unit tests, build)
- [ ] `pnpm e2e` passes (Playwright + axe, desktop and phone)
- [ ] New logic is covered by tests

### Architecture

- [ ] Libraries import each other only through their `src/index.ts`
- [ ] No `@nx/enforce-module-boundaries` disables; tags match the layer
- [ ] Domain code (`libs/qso`) stays pure: no React, no DOM, no network

### i18n

- [ ] No hardcoded visible text: everything goes through `useI18n().t('key')`
- [ ] New keys added to `es.ts`, `en.ts` and `pt-BR.ts`

### Accessibility & UX _(only if the UI changed)_

- [ ] Matches the prototype (`docs/prototype/index.html`) at 1280 px and 390 px
- [ ] Fully usable with the keyboard, with visible focus; touch targets ≥ 44 px
- [ ] Decorative motion stops with `prefers-reduced-motion`
- [ ] No horizontal scroll at phone width

### Privacy _(only if keys, audio or storage changed)_

- [ ] The API key never leaves the browser except to `api.anthropic.com`
- [ ] Storage access is wrapped in try/catch and the app works without it

### Conventions

- [ ] Components are arrow functions assigned to `const`, one per file, with typed props
- [ ] All code comments are in English
- [ ] No deprecated APIs (`check-deprecations` skill)
- [ ] Commits follow Conventional Commits; hooks were not skipped (`--no-verify`)

### Docs

- [ ] `CLAUDE.md` / `docs/PLAN.md` updated if behavior, structure or status changed

## Dependencies added

<!-- Name each new dependency and explain why the existing ones are not enough. "None" otherwise. -->

None

## Notes for reviewers

<!-- Risks, trade-offs, follow-ups, stacked base, or anything that needs special attention. -->

# Contributing to CQ talk

Thanks for helping. Bug reports, ideas, translations and pull requests are all welcome.

## Before you start

- Read [CLAUDE.md](CLAUDE.md): it has the stack, the architecture (Nx libraries and their
  boundaries), the design rules and the testing conventions.
- For anything bigger than a small fix, open an issue first so we can agree on the approach.

## Set up

Requires Node 24 (see `.nvmrc`) and pnpm.

```bash
pnpm install
pnpm dev
```

You don't need an API key: without one the app runs a scripted demo QSO. To try a live operator,
add your own Anthropic key in "Set up key". It stays in your browser.

## Making a change

1. Create a branch: `feat/…`, `fix/…`, `docs/…`, `chore/…` or `refactor/…`.
2. Keep the UI text in the dictionaries (`libs/i18n/src/messages/es.ts`, `en.ts` and `pt-BR.ts`,
   always with the same keys). Never hardcode visible text.
3. Add or update tests. Unit tests use Vitest and Testing Library (query by role); browser tests
   use Playwright and axe.
4. Run `pnpm check` and `pnpm e2e` before you push.
5. Commit with [Conventional Commits](https://www.conventionalcommits.org/) (`feat: …`, `fix: …`).
   The `commit-msg` hook checks it.
6. Open a pull request and fill in the template.

## Translations

The interface is in Spanish (source of truth), English and Brazilian Portuguese. To improve a
translation, edit the matching file in `libs/i18n/src/messages/`; the `Messages` type makes sure
no key is missing.

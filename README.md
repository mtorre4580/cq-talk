# CQ talk

**Practice spoken English on the air.** Tune a topic, talk with an AI radio operator from the
other side of the world, and get a QSL card with your corrections, new vocabulary and what to
practice tomorrow.

> In ham radio, _CQ_ means "calling any station". A _QSO_ is a contact, and a _QSL card_ is the
> postcard operators send each other to confirm it.

- **Free, no account**: bring your own Anthropic API key. It stays in your browser and is only
  sent to `api.anthropic.com`. No key? Try the demo QSO.
- **Talk, don't type**: speech recognition and an English-speaking operator, half-duplex like a
  real radio. Finish each turn with "over".
- **Learn from every contact**: each line you say gets a better version when it needs one, and
  the QSL card explains why.
- **On your phone, no install needed**: open the link; add it to your home screen if you like
  (PWA).

The UI is in Spanish, English and Brazilian Portuguese; the conversations are always in English.

## Status

Work in progress, delivered as a chain of pull requests. See [docs/PLAN.md](docs/PLAN.md).

## Development

Requires Node 24 and pnpm.

```bash
pnpm install
pnpm dev      # http://localhost:4200
pnpm check    # lint, typecheck, unit tests and build
pnpm e2e      # Playwright + axe against the production build
```

The stack, architecture and conventions are documented in [CLAUDE.md](CLAUDE.md).

## License

[MIT](LICENSE)

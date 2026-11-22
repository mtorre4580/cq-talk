# CLAUDE.md — CQ talk

Context guide for working in this repo. Read all of it before touching code.

## What it is

A web app (installable as a PWA) to practice **spoken English** with an AI, dressed as a ham
radio station. In ham radio, "CQ" means "calling any station".

1. **Tuner**: the user types a topic ("¿De qué querés hablar?") or picks one of the weekly
   frequencies, then presses **LLAMAR · CQ**. The dial needle and the knob move to the
   frequency and the rig plays a tune-in sound.
2. **Call (QSO)**: an AI operator from somewhere in the world (`JA1·AI`, Tokyo…) talks with the
   user in English, half-duplex like a real radio: each turn ends with "Over." A paper log shows
   the conversation and, under each of the user's lines, a better way to say it
   ("✎ Mejor: …") or "✓ Copiado 5 y 9" when it was right. Tapping the microphone ends the QSO.
3. **QSL report**: a QSL card (the postcard radio amateurs send to confirm a contact) with the
   contact details, the mistakes (what you said, a better version, why), vocabulary to add and
   what to practice tomorrow. It can be downloaded as a PDF and is kept in "Mis QSL".

There is **no backend**. Users bring their own Anthropic API key, which stays in their browser
and is only sent to `api.anthropic.com`. Without a key the app runs a scripted demo QSO.

The visual source of truth is the prototype in `docs/prototype/Main.dc.html`. The UI must match
it: colors, sizes, fonts, copy, animations and sounds.

## Stack

| Area | Choice | Notes |
|---|---|---|
| Runtime | Node LTS (24) | `.nvmrc` at the root |
| Packages | pnpm workspaces | Never npm or yarn. Commit `pnpm-lock.yaml` |
| Monorepo | Nx 24 | Inferred tasks from plugins; TypeScript project references kept in sync by `nx sync` |
| Build | Vite 8 + `@vitejs/plugin-react` | `apps/web/vite.config.mts` |
| UI | React 19 | Function components and hooks only |
| Language | Strict TypeScript 6.0 | Pinned below 7 until `typescript-eslint` supports it (its peer range is `<6.1`) |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`), **without Preflight** | Tokens in `libs/ui/src/theme.css` via `@theme`. The prototype renders on browser defaults (content-box, normal line height), so Preflight would shift every size |
| Fonts | `@fontsource` packages | Oswald, Share Tech Mono, Courier Prime, Special Elite. Self-hosted, no Google Fonts |
| Routing | React Router 8 (library mode, `BrowserRouter`) | `/` radio, `/qsl` Mis QSL, `/qsl/:id` a saved card; basename from Vite's `BASE_URL` |
| i18n | Custom: Context + typed dictionaries in `libs/i18n` | `es` (default, source of truth), `en`, `pt-BR`; no dependencies |
| AI | `@anthropic-ai/sdk` in the browser + `zod` | `claude-opus-5-5` by default, configurable. Structured outputs for corrections and the report |
| Speech | Web Speech API (`SpeechRecognition`, `speechSynthesis`) + optional ElevenLabs voice | Behind interfaces in `libs/speech`, with a typed fallback. ElevenLabs (`eleven_flash_v2_5`, the user's own key) plays through a radio filter in `libs/audio` and falls back to the browser voice |
| Sound effects | Web Audio, synthesized | No audio files. `libs/audio` |
| Storage | `localStorage` (settings, key) and IndexedDB via `idb-keyval` (QSL log, `createLogbook`, database `cq-talk` / store `qsl-log`) | Always through `storage` from `@cq-talk/platform` (never throws); keys prefixed `cq-talk:` |
| PWA | `vite-plugin-pwa` (Workbox) | Manifest and service worker in `apps/web/vite.config.mts`; `registerSW.js` as a file (an inline script would break the CSP). The app shell is precached (~545 KB); the SDK and PDF chunks are cached on first use. Icons are generated from `apps/web/public/logo.svg` with `pnpm exec pwa-assets-generator --config pwa-assets.config.ts` (run in `apps/web`) |
| Unit tests | Vitest 5 + React Testing Library + user-event + jsdom | Inferred `test` target per project |
| Browser tests | Playwright + `@axe-core/playwright` | `apps/web-e2e`, against the production build, desktop (1280×900) and phone (Pixel 7) |
| Lint/format | ESLint 10 (flat config) + Prettier | `@nx/enforce-module-boundaries`, type-aware `typescript-eslint` |
| Git hooks | husky + commitlint (`@commitlint/config-conventional`) | `commit-msg` validates the message; `pre-push` runs `nx sync:check` and lint/typecheck/test |
| CI | GitHub Actions | format, sync check, `nx affected` lint/typecheck/test/build, audit, dependency review, e2e + axe, bundle budget + Lighthouse CI, CodeQL |
| Performance | `bundle-budget.json` (`pnpm check:bundle`, gzip per chunk) + `lighthouserc.json` (`pnpm lhci`) | Initial load ≤ 125 KB gzip; performance ≥ 0.85, accessibility ≥ 0.95, LCP ≤ 2.5 s |
| Dependencies | Dependabot (weekly, grouped) | `.github/dependabot.yml`; Nx packages move together |
| Deploy | GitHub Pages | `deploy.yml` runs after CI passes on `main`; `base: '/cq-talk/'`; `404.html` copy for deep links |

`eslint-plugin-react` and `eslint-plugin-jsx-a11y` do not support ESLint 10 yet, so they are not
used: accessibility is enforced by axe in the browser tests and by role-based queries in unit
tests.

## Commands

```bash
pnpm install
pnpm dev                 # dev server at http://localhost:4200
pnpm build               # production build of the web app (apps/web/dist)
pnpm preview             # serve the build at http://localhost:4300/cq-talk/
pnpm test                # every project's unit tests (nx run-many -t test)
pnpm lint
pnpm typecheck           # tsc --build per project
pnpm e2e                 # Playwright + axe against the production preview (builds first)
pnpm check:bundle        # gzip budget per chunk (after pnpm build)
pnpm lhci                # Lighthouse CI on the production build (needs Chrome)
pnpm check               # what CI runs: sync check, lint, typecheck, test, build
pnpm format              # Prettier
pnpm nx graph            # project graph in the browser
pnpm nx affected -t test # only what changed since main
```

Run a single project's target with `pnpm nx run @cq-talk/<project>:<target>`.

## Structure

```
apps/
  web/                   # type:app  · entry, providers, routes, index.html, PWA (PR 12)
  web-e2e/               # type:e2e  · Playwright specs
libs/                    # added PR by PR; see docs/PLAN.md
  ui/                    # type:ui          · theme.css, NightSky, rig components, QslCard
  platform/              # type:util        · safe storage, usePrefersReducedMotion, browser helpers
  i18n/                  # type:util        · I18nProvider, useI18n, messages/{es,en,pt-BR}.ts
  audio/                 # type:util        · radio sound effects, useRadioSfx; `/testing` fake AudioContext
  speech/                # type:util        · SpeechInput / SpeechOutput, capability detection
  qso/                   # type:domain      · state machine, stations, presets, frequency hash,
                         #                    ConversationEngine, DemoEngine, types
  claude/                # type:data-access · `.`: models and types only; `./client`: the SDK
                         #                    (createClient, checkApiKey, ClaudeEngine) loaded with import()
  storage/               # type:data-access · settings, API key, QSL logbook
  features/
    tuner/ call/ report/ settings/ logbook/   # type:feature · screens (features never import
                                              # each other: the app composes them)
tools/
  prototype/render.mjs   # renders the prototype to static HTML for a given state
  bundle/                # gzip budget check (pnpm check:bundle)
docs/
  PLAN.md                # PR roadmap and phase details
  prototype/             # design prototype (visual source of truth)
```

Every project is a workspace package named `@cq-talk/<name>` with its Nx tags in
`package.json` (`"nx": { "tags": [...] }`). Libraries are consumed as source: their
`package.json` `exports` point at `src/index.ts`, so there is no library build step.

**Module boundaries** (enforced by `@nx/enforce-module-boundaries` in `eslint.config.mjs`):

| Tag | May depend on |
|---|---|
| `type:app` | feature, ui, domain, data-access, util |
| `type:feature` | ui, domain, data-access, util |
| `type:data-access` | domain, util |
| `type:ui` | ui, util |
| `type:domain` | domain, util |
| `type:util` | util |

- Import another project only through its package name (`@cq-talk/ui`), never a relative path
  into it or a deep import of its internals. Each library exports its public API from
  `src/index.ts`.
- `libs/qso` is pure TypeScript: no React, no DOM, no network, no timers it does not receive
  (its own `eslint.config.mjs` forbids React, `window`, `document`, `localStorage` and `fetch`).
  Everything with side effects (audio, speech, storage, the API) lives in util or data-access
  libraries and is injected. Timers around the QSO (the 750 ms preset delay, the 1 s clock, the
  1.2 s closing pause) live in `apps/web/src/app/useQso.ts`.
- Domain data that needs words (preset topics, station cities) keeps only ids in `libs/qso`;
  the text lives in the dictionaries (`presets.<id>`, `stations.<id>`).
- A new library: create the folder with `package.json` (name, tags, `exports`), `tsconfig.json`
  (+ `tsconfig.lib.json`, `tsconfig.spec.json`), `vite.config.mts` if it has tests and
  `eslint.config.mjs`; add it as a `workspace:*` dependency of its consumers; run
  `pnpm install` and `pnpm nx sync`.

## Design

Direction: a **vintage single-sideband transceiver on a desk at night**, under an aurora.
Sage-green painted metal, cream enamel plates, an amber backlit dial, a cream S meter, a chrome
desk microphone, a typewritten paper log and a printed QSL card. Dark only (there is no light
theme in the prototype).

**Palette** (exact values from the prototype; they become `@theme` tokens in PR 2):

| Role | Hex |
|---|---|
| Night background | `#05080D` |
| Text on night | `#E8E4D8`; secondary `#B8C4BE`; labels `#E8ECE8` |
| Rig body / chassis | `#1A1D1B` / `#46564F` (border `#5E7068`, highlight `#6F8279`) |
| Enamel plate / keys | `#C9CCC4` / `#D6D3C6` (hover `#E4E1D6`, shadow `#6E716B`) |
| Dark controls | `#2E3833` (border `#2A322E`), knob center `#2A2E2B` |
| Amber dial | radial `#FFB347 → #D9781E → #5A2A08`; ink `#2A1606`; needle `#B0130A` |
| Display (LCD-like) | background `#120D08`, text `#FFB347`, muted `#C9A06A`, placeholder `#A8763A` |
| Call button | `#FFB347` (hover `#FFC46B`, shadow `#8A4E12`), text `#2A1606` |
| S meter | face `#F1E7CC`, ink `#2A2620`, red zone `#B42318` |
| ON AIR lamp | on `#FF4A2E`, off `#4A1C17` |
| Mic LED / halo | on `#6CFFB8` / `rgba(110,255,190,.55)` |
| Paper (log) | `#F1E7CC`, ink `#2A2620`, operator `#7A4A12`, fix `#A3261B`, ok `#2F5B2A` |
| QSL card | `#F3EAD3`, ink `#2A211B`, muted `#5A4A3A`, stamp `#A3261B` |
| Aurora | green `rgba(70,255,170,.75)`, violet `rgba(150,90,255,.6)`, cyan `rgba(60,220,230,.55)` |

**Tokens in code**: `libs/ui/src/theme.css` turns the palette into Tailwind utilities (`bg-night`,
`text-amber`, `bg-rig-chassis`, `text-paper-ink`, `font-label`, `font-readout`…). Tailwind's
default colors and fonts are cleared, so only these exist. The aurora uses the `cq-aurora-*`
component classes; one global `prefers-reduced-motion` rule stops every animation and transition.

**Matching the prototype**: `pnpm prototype:render out.html '{"screen":"home","pos":44}'` renders
the prototype to static HTML for any state of its component (see `tools/prototype/render.mjs`).
Serve it next to `pnpm dev` and compare element boxes at 1280 and 390 px. Copy sizes as
arbitrary values (`text-[13px]`, `p-[22px]`) rather than rounding to the nearest Tailwind step.

**Typography**: Special Elite (brand plate, QSL title and stamp), Oswald (labels, buttons,
letter-spaced caps), Share Tech Mono (frequencies, display, clock), Courier Prime (body text).

**Signature elements**: the aurora sky that brightens when on air; the amber dial with 25 ticks
whose needle springs to the frequency (`cubic-bezier(.4,1.3,.6,1)`, 0.7 s); the knob that
rotates `pos × 3.2°`; the S meter needle that swings while on air; the ON AIR lamp that
pulses; the desk mic whose grille lights up amber and whose PTT bar turns red; the QSL card with
its rotated red "73 · QSL" stamp.

**Interaction**: keys sink 2 px when pressed; the display shows an amber focus ring; log lines
fade in from 6 px below; the needle and knob animate together. All decorative motion (aurora,
stars, lamp, S meter, fade-ins) stops with `prefers-reduced-motion`.

**Sound** (`libs/audio`, Web Audio, no files): tune-in = band-passed static sweeping
700 → 2400 → 1300 Hz over 3.6 s, a heterodyne whistle gliding 2600 → 420 Hz and a 1 kHz lock
beep at 3 s; hang-up = a high-passed static burst and a 110 Hz click. On by default, toggled by
"SONIDO · ON/OFF" and stored in `cq-talk:sound`. Sounds only play in response to a user action
and are no-ops where Web Audio does not exist.

Copy stays plain and in the radio voice of the prototype. New UI the prototype does not show
(language switcher, key dialog, text fallback, logbook) reuses the same materials: display for
inputs, keys for options, enamel plate for headings.

## Conversation engine

`ConversationEngine` (in `libs/qso`) is the only contract with a live operator. Every method
takes the whole log so far:

```ts
interface ConversationEngine {
  transmit(log, signal?): AsyncIterable<string>; // the operator's next transmission, streamed
  assess(text, log, signal?): Promise<Assessment>; // fix (better sentence) | ok | none
  report(log, signal?): Promise<QslReport>; // errors, vocabulary, practice
}
```

- A QSO is `live` when a key is saved (`useQso(effects, mode)`), `demo` otherwise.
- **Demo mode** replays the prototype's script with its timing (`demoScript` + `demoLinesAt` in
  `libs/qso`; first line at 3 s, then one every 3 s, seven lines). It is pure: in `demo` mode
  `conversationLog(state)` derives the log from the clock, so it needs no engine. It is used
  without a key, in unit and browser tests, and to record media.
- `createClaudeEngine` (`@cq-talk/claude/client`) runs on the beta Messages endpoint with the
  model from settings (`claude-opus-5-5` by default). `transmit` streams at `effort: "low"`
  with automatic prompt caching; `assess` (low) and `report` (medium) use structured outputs
  (`messages.parse` + `betaZodOutputFormat`). Thinking is never sent: Opus 5.5 cannot disable
  it, so latency is tuned with `effort`. Server-side fallbacks (`fallbacks: "default"`, beta
  `server-side-fallback-2026-07-01`) for every model except Haiku 5.5, which has none.
  `stop_reason: "refusal"` is checked before reading content: a refused transmission says
  `REFUSAL_LINE` on air, a refused assessment counts as `none`. SDK errors become `LiveError`
  (`key`, `rate-limit`, `offline`, `refused`, `other`); the transmit panel explains them and
  offers a retry when one can help. SDK 1.x sends the key as `Authorization: Bearer`.
- Prompts are pure functions in `libs/claude/src/prompts.ts`: the operator's system prompt
  (stable per QSO so it caches), the CQ opening cue, the log mapped to alternating turns, the
  assessor and the report writer. Explanations (`why`, meanings, practice) are written in the UI
  language; the conversation itself is always English.
- `useLiveOperator` (`apps/web`) drives a live QSO: loads the SDK when the call starts, streams
  each transmission into the log, opens the microphone on the user's turn once the operator's
  voice ends, assesses each line in parallel with the next transmission, and writes the report
  on hang-up (the QSL card waits for it; no API call if the user never spoke).
- Turn-taking is half-duplex: while the operator speaks, recognition is paused; the user's turn
  ends when they say "over" or after about 1.5 s of silence (`createSpeechInput` in
  `libs/speech`; `normalizeTransmission` makes every line end in "Over."). Browsers stop
  continuous recognition on their own, so it restarts while the turn is open.
- The operator's lines are read aloud by `useOperatorVoice` over a soft static bed (`hiss` in
  `libs/audio`), in demo and live mode, following SONIDO. Lines are read once complete (live
  transmissions stream in; reading the first chunk once left only "Copy that" spoken), and the
  microphone stays closed until the voice ends.
- **Operator voice** (settings → "Voz del operador"): the browser's speech synthesis by default
  (`pickVoice` ranks natural voices and never picks macOS novelty voices like "Albert"), or
  **ElevenLabs** with the user's own key: `createElevenLabsClient` (`libs/speech`) synthesizes
  mp3 with `eleven_flash_v2_5`, `createCloudSpeechOutput` plays it through `voice()` in
  `libs/audio` (300–3200 Hz band, presence lift, soft clipping, compression, roger beep) and falls
  back to the browser voice on any failure. `rankOperatorVoices` suggests a mature, warm American
  male voice from the premade list. OpenAI's speech endpoint was ruled out: its TTS models shut
  down on 2027-01-06. The settings say the voice is AI-generated.
- Typing is always possible (`TransmitPanel`): it is the fallback where recognition is missing
  (Firefox, some installed iOS apps) or the microphone is blocked.

## Accessibility (mandatory)

WCAG 2.2 AA. Full keyboard navigation, visible focus, touch targets ≥ 44 px, `aria-live` on the
conversation log and status line, real `<button>`/`<input>`/`<label>` elements, `aria-label` on
icon-only buttons (the microphone), decorative SVG `aria-hidden`, and no information conveyed by
color alone (the lamp and LED always have a text label next to them). No horizontal scroll at
390 px.

## Privacy and security

- The API keys live in `localStorage` (`cq-talk:api-key`, `cq-talk:elevenlabs-key`), are never
  logged, never put in a URL, and are only sent to `api.anthropic.com` and `api.elevenlabs.io`.
  ElevenLabs advises against client-side keys, so the settings ask users to restrict theirs to
  text to speech and reading voices, with a credit quota.
- The production build ships a strict Content Security Policy (`CONTENT_SECURITY_POLICY` in
  `apps/web/vite.config.mts`, injected as a `<meta>` on build only, since Vite's dev server needs
  inline styles): `script-src 'self'`, `style-src 'self'`,
  `connect-src 'self' https://api.anthropic.com https://api.elevenlabs.io`. React's `style` props are allowed (they go
  through the CSSOM). `csp.spec.ts` walks every screen with the policy on.
- The Anthropic SDK stays out of the main bundle: import it only through
  `await import('@cq-talk/claude/client')`. `checkDynamicDependenciesExceptions` in
  `eslint.config.mjs` allows the static import of the lightweight `@cq-talk/claude` entry.
- Settings say plainly that browser speech recognition may send audio to the browser vendor.

## Conventions

- **Everything in the repo is written in English**: code, identifiers, comments, commit
  messages, PRs and docs. Only the UI copy is translated, through `libs/i18n`.
- **i18n**: no visible text is hardcoded in a component; everything comes from
  `useI18n().t('key')`. Keys live in `libs/i18n/src/messages/es.ts` (source of truth, matches
  the prototype); `en.ts` and `pt-BR.ts` must have exactly the same keys (enforced by the
  `Messages` type). Plurals use `{ one, other }` + `{count}`. Spanish is neutral Rioplatense
  ("querés", "tocá") as in the prototype; Brazilian Portuguese; plain English.
- Components: one component per file, PascalCase name, typed props, named exports only (no
  `default export` except for lazy-loaded modules).
- **Components are always arrow functions** assigned to `const`
  (`export const Dial = ({ … }: DialProps) => …`). Never `function Dial()`; ESLint enforces it.
- State: local with hooks; shared state with Context + `useReducer`. The QSO flow is the
  reducer in `libs/qso`. Do not add state libraries without discussing it first.
- Do not add new dependencies without explaining in the PR why the existing ones are not enough.
- **No deprecated APIs** in any new or changed code. `@typescript-eslint/no-deprecated`
  enforces it for typed code; before committing or opening a PR, run the `check-deprecations`
  skill (`.claude/skills/`) to cover what the linter cannot see.
- Storage keys are prefixed `cq-talk:` by `storage` (`@cq-talk/platform`); pass the bare name (`storage.get('locale')`).

## Testing

- Components: React Testing Library, queries by role and accessible text (`getByRole`,
  `getByLabelText`); no class or test-id selectors unless nothing else works.
- Pure logic (`libs/qso` reducer, frequency hash, demo timing, schemas): unit tests with fake
  timers where time matters.
- Audio: never real sound in tests. `@cq-talk/audio/testing` exports a dependency-free fake
  `AudioContext` (`installFakeAudioContext()`) that records which nodes started.
- Engines: the Claude engine is unit-tested with a fake `client.beta.messages`. In the browser,
  `live.spec.ts` runs a whole live QSO against `fakeAnthropic()` (Playwright routes that answer
  with real SSE streams and structured JSON) with the CSP on; `voice.spec.ts` routes ElevenLabs to
  a generated WAV and checks the cloud voice plays with no browser-voice fallback. No network or
  tokens in tests, ever.
- Browser tests (`apps/web-e2e`) run in demo mode, at desktop and phone size, with Playwright's
  fake clock (`page.clock`) so the QSO timing is deterministic: axe has no violations on any
  screen, the flow works end to end and the page never scrolls horizontally. `openApp()` in
  `src/support.ts` sets Spanish, mutes the sound and switches CSS animations off (the fake clock
  freezes them on their first frame). Advance the clock in separate steps when a timer starts
  another one, so React can register the second.
- Service workers are blocked in every spec except `pwa.spec.ts`: once installed, the PWA's
  worker answers routed test pages with the app shell.
- The e2e target depends on `@cq-talk/web:build` and Playwright starts `vite preview` itself.
  Nx's inferred preview readiness check never settles with the PWA plugin, so do not point
  `webServer` back at `nx run @cq-talk/web:preview`.
- **Layout parity** (`layout-parity.spec.ts`): the test renders the prototype with
  `renderPrototype()` (`tools/prototype/render.mjs`) using the app's own stylesheet, so both use
  the same font files, measures its element boxes and the app's in the same run and browser, and
  requires ±2 px on every screen at 1280×900. Measuring both live is what makes it hold on any
  platform: fixed numbers measured on macOS failed on the Linux CI, where text rasterizes
  differently. `loadAllFonts()` loads every font face first, so late screens are never measured
  with a fallback font.
- A PR is not merged with failing checks.

## Git

- Main branch `main`. Branches `feat/…`, `fix/…`, `docs/…`, `chore/…`, `refactor/…`.
- Conventional commits, enforced by the `commit-msg` hook (`commitlint.config.js`): `type: subject`
  or `type(scope): subject`, where the scope is a project name without `@cq-talk/` (`ui`, `qso`,
  `web`…). Imperative mood, lowercase, no trailing period, header ≤ 72 chars. One logical change
  per commit; add a body only when the *why* is not obvious.
- `pre-push` runs `nx sync:check` and lint, typecheck and tests; do not skip hooks with
  `--no-verify`.
- Claude Code hooks live in `.claude/settings.json`: after every `Edit`/`Write`, a `PostToolUse`
  hook (`.claude/hooks/format-file.mjs`) formats that file with Prettier. Edits made through Bash
  are not covered, so run `pnpm format` if you edit files that way.
- Every PR fills in `.github/pull_request_template.md`; write "N/A" for sections that do not
  apply.
- **Stacked PRs**: each PR in `docs/PLAN.md` is based on the previous branch. When one merges,
  retarget the next to `main` and rebase it onto `main` before merging.
- Update the "Status" section of this file when each PR merges.

## Status

- [x] 1 — Bootstrap (Nx workspace, tooling, CI, Pages)
- [x] 2 — Night sky theme and i18n
- [x] 3 — Radio rig components
- [x] 4 — Tuner home screen
- [x] 5 — Radio sound effects
- [x] 6 — Call screen with demo operator
- [x] 7 — QSL report card (app matches the prototype)
- [x] 8 — API key and model settings
- [x] 9 — Speech input and output
- [x] 10 — Live Claude operator
- [x] 11 — QSL logbook and PDF export
- [x] 12 — Installable PWA

See `docs/PLAN.md` for the details of each phase.

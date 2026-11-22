# CQ talk: delivery plan

The app ships as a chain of stacked pull requests. Each PR builds on the previous branch; when
one merges, the next is retargeted to `main` and rebased. Each PR is small enough to review on
its own and leaves `main` deployable.

| # | Branch | Title | Visible result |
|---|---|---|---|
| 1 | `chore/bootstrap` | chore: bootstrap nx workspace | Tooling, CI and an empty page on GitHub Pages |
| 2 | `feat/theme-sky` | feat: add night sky theme and i18n | Design tokens, fonts, the aurora sky, footer, es/en/pt-BR |
| 3 | `feat/radio-rig` | feat: add radio rig components | Faceplate, S meter, dial, knob, ON AIR lamp, desk mic |
| 4 | `feat/tuner` | feat: add tuner home screen | QSO state machine, topic form, weekly frequencies |
| 5 | `feat/radio-sfx` | feat: add radio sound effects | Web Audio tune-in and hang-up sounds, sound toggle |
| 6 | `feat/call-demo` | feat: add call screen with demo operator | Station panel, clock, status, conversation log, hang-up |
| 7 | `feat/qsl-report` | feat: add qsl report card | QSL card and new QSO. **The app matches the prototype** |
| 8 | `feat/settings` | feat: add api key and model settings | "Configurar key" dialog, key check, model picker, CSP |
| 9 | `feat/speech` | feat: add speech input and output | Speech recognition and synthesis, "over" turn-taking, text fallback |
| 10 | `feat/claude-operator` | feat: add live claude operator | Real conversation: reply, per-turn corrections, report |
| 11 | `feat/logbook` | feat: add qsl logbook and pdf export | "Mis QSL" history (IndexedDB), PDF download, share |
| 12 | `feat/pwa` | feat: make the app an installable pwa | Manifest, icons, service worker, install prompt, Lighthouse |
| 14 | `feat/radio-voice` | feat: add an elevenlabs operator voice through a radio filter | Natural operator voice (the user's own ElevenLabs key) |
| 15 | `feat/realistic-rig` | feat: redesign the radio as a realistic receiver with a split call | Prototype v2: 1940s receiver, desk mic that calls, aurora rift split |
| 16 | `feat/valve-power` | feat: warm the receiver up and down like a valve set | Power-up and power-down animations, typed operator lines, hum |

After PR 12: media (README screenshots, Open Graph image, demo GIF and video recorded with
Playwright in demo mode), delivered in PR 18 (`docs/readme-media`) after the v2 redesign.

## Phase details

### 1. Bootstrap

Nx workspace on pnpm workspaces with TypeScript project references, `apps/web` (Vite + React)
and `apps/web-e2e` (Playwright + axe). ESLint flat config with module boundaries, Prettier,
husky + commitlint, Vitest, GitHub Actions (CI, Pages deploy, CodeQL), Dependabot, templates,
Claude Code hooks and skills, `CLAUDE.md`, and the prototype copy in `docs/prototype/`.

### 2. Theme and sky

`libs/platform` (safe `localStorage`, `usePrefersReducedMotion`) and `libs/ui` with `theme.css` (Tailwind v4 `@theme` tokens using the prototype's exact hex values
and keyframes), self-hosted fonts, `NightSky` (40 stars + three aurora layers whose opacity
follows the QSO state), the page layout and footer. `libs/i18n` with typed dictionaries
(`es` source of truth, `en`, `pt-BR`) and the language switcher in the footer.
`usePrefersReducedMotion` stops the aurora, stars and lamp.

### 3. Radio rig

Presentational, props-driven components in `libs/ui`: `RadioFaceplate`, `SMeter`, `TuningDial`
(25 ticks, needle position 0–100), `TuningKnob`, `OnAirLamp`, `DeskMicrophone` (halo, grille,
PTT bar, LED, label, hint). Unit tests by role and accessible name.

### 4. Tuner

`libs/qso`: pure reducer for `home → call → hanging → report`, presets, stations, the
topic-to-frequency hash from the prototype. `libs/features/tuner`: topic form, "Frecuencias de
la semana" grid, needle and knob animation, 750 ms delay before calling from a preset.

### 5. Sound

`libs/audio`: `playTuneIn` (band-passed static sweep, heterodyne whistle, lock beep) and
`playOff` (static burst and click), ported 1:1 from the prototype. Sounds only play after a user
gesture and are no-ops without Web Audio. The toggle is stored in `cq-talk:sound`.

### 6. Call (demo)

`ConversationEngine` interface in `libs/qso` and `DemoEngine` with the prototype's exact script
and timing (first line at 3 s, then one every 3 s, 7 lines, log shows the last 4).
`libs/features/call`: station panel, clock, status line, paper log with "✎ Mejor" and
"✓ Copiado 5 y 9", hang-up from the mic with the 1.2 s "printing your QSL" pause.

### 7. QSL report

`libs/features/report`: QSL card (fields grid, errors, vocabulary, practice), "Nuevo QSO".
End-to-end flow in Playwright with a fake clock, axe in every screen, and a layout-parity spec
that checks element boxes against the rendered prototype at 1280×900 (±2 px).

### 8. Settings

`libs/storage` (settings and API key in `localStorage`, always in try/catch) and
`libs/features/settings`: the "Configurar key" dialog styled like the rig, a cheap key check,
the model picker (`claude-opus-5-5` default; Sonnet 5.5 and Haiku 5.5). Strict CSP in
`index.html` (`connect-src` only to `api.anthropic.com`).

### 9. Speech

`libs/speech`: `SpeechInput` (Web Speech recognition, English, interim results, ends on "over"
or ~1.5 s of silence, paused while the operator speaks) and `SpeechOutput` (speech synthesis
with an English voice and a soft static bed). Capability detection with a typed fallback in the
tuner display style when recognition is missing (Firefox, some installed iOS apps).

### 10. Claude operator

`libs/claude`: `ClaudeEngine` implementing `ConversationEngine` with `@anthropic-ai/sdk` in the
browser. Per user turn, two parallel calls: `reply` (streamed, low effort, ham-radio operator
persona, short turns ending in "Over.") and `assess` (structured output: correction or "copied
5 and 9", explanation in the UI language). At hang-up, `report` (structured output: errors,
vocabulary, practice). Prompt caching, server-side fallbacks, refusal and typed error handling.

### 11. Logbook

`libs/storage` QSL log in IndexedDB, `libs/features/logbook` ("Mis QSL" list and `/qsl/:id`),
PDF download of the card, share as image with the Web Share API.

### 12. PWA

`vite-plugin-pwa`: manifest, maskable icons, offline app shell, update prompt, install prompt,
iOS meta tags. Lighthouse CI and a gzip bundle budget in CI.

### 15. Realistic receiver and split call (prototype v2)

The operator's voice became real, so the radio follows: prototype v2 (`docs/prototype/index.html`,
inspired by the film _Frequency_). `libs/ui` gets the receiver (`Receiver`, meter windows,
`MainDial`, `BandSpread`, `SMeter`, knobs, jewel lamp, `SoundSwitch`), a new `DeskMicrophone`
that calls when pressed and hangs up when pressed again, and `SplitStage` with the `AuroraRift`.
The tuner becomes the receiver's readout strip (`TopicForm`) and preset bay (`WeeklyKeys`); the
call side becomes `StationHeader` and a paperless `ConversationLog`. Layout parity now measures the
app against prototype v2 at home and on air.

### 16. Valve power-up and power-down

The receiver's light ramps like a valve set (`--power`, `--lamp`, `--tally` animated instead of
set): it warms up from dark on load and when a call goes out, flickers once, and cools down
exponentially on hang-up while the rift closes, before the QSL card prints. Operator lines type
out, and the tune-in and hang-up sounds gain a mains hum.

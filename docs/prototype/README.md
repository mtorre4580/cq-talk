# Design prototypes

## `index.html`: v2, the visual source of truth

The realistic redesign inspired by the film _Frequency_: a 1940s communications receiver on a
desk, a black desk microphone that calls and hangs up, and a call screen that splits in two along
a waving aurora rift, with the conversation as plain light on the night. Reviewed and approved as
a claude.ai artifact on 2026-11-21.

- It runs on its own: open it in a browser. The artifact host serves it in a standards-mode
  document, so add `<!doctype html>` at the top when you serve it yourself (without it the
  browser uses quirks mode and line boxes shrink). `layout-parity.spec.ts` does exactly that.
- Interactive: the weekly keys, the topic and LLAMAR · CQ, the microphone, SONIDO, the demo QSO
  and the QSL card. Its QSL card is a stand-in: the app keeps the v1 card.
- Everything is drawn in code (CSS and SVG): no images, no brands.

## `v1/Main.dc.html`: the first prototype

The sage-green transceiver with the paper log. It is still the reference for what v2 did not
redesign: the QSL card, the logbook and the sounds. Keep it byte-for-byte as exported (this
folder is in `.prettierignore` and excluded from lint and CodeQL). It is a Design Component page
(`<x-dc>` markup plus a `DCLogic` script), not runnable on its own.

When the app and the prototypes disagree, the prototypes win unless `CLAUDE.md` documents the
difference (for example, real speech instead of the scripted demo).

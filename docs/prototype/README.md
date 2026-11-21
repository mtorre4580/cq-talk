# Design prototype

`Main.dc.html` is the interactive prototype the app reproduces. It is the visual source of truth:
colors, sizes, fonts, copy (Spanish), animations, sounds and the three screens (tuner, call,
QSL report) all come from it.

- Exported from the design canvas on 2026-11-21. Keep it byte-for-byte as exported (it is in
  `.prettierignore` and excluded from lint and CodeQL).
- It is a Design Component page (`<x-dc>` markup plus a `DCLogic` script), not runnable on its
  own here: open the original canvas to interact with it, or read the markup for exact values.
- When the app and the prototype disagree, the prototype wins unless `CLAUDE.md` documents the
  difference (for example, real speech instead of the scripted demo).

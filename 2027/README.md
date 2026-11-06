# XploreSim 2027

The 2027 season console, deployed before the game exists. The site, the build, the guards and the
deploy path are wired; the season itself lands in one file when the manual is published.

```
npm run serve      # http://127.0.0.1:4198
npm run check      # encoding, tag balance, module parse, game pack contract
npm test           # the contract rejects bad packs
npm run validate   # check + test
```

## What is here

```
web/index.html            the console page, rendered from the game pack
web/styles.css            layout and theme; the accent comes from the pack
web/js/game.js            the season seam: identity, labels, phases, points, RP, rules
web/js/game-contract.js   the validator both the page and the guard call
web/js/ui.js              renders the pack; no game logic of its own
scripts/check_web.mjs     static guard, including the contract and the TBA disclaimer
scripts/runtime.test.mjs  contract tests, including the live-pack refusals
docs/KICKOFF.md           the hour-by-hour runbook, in Chinese
```

## The TBA state is deliberate

`game.js` ships with `status: 'tba'` and eight `placeholder: true` values. The page says the game is
unpublished, marks every scaffold row, and the contract refuses `status: 'live'` while any
placeholder remains. The placeholder is not a fake game: it is the shape of the answer, waiting for
the manual.

At kickoff, fill `game.js` first. The identity, phase table, scoring table and RP table update
without touching the shell. Then fill `rules.js`, `model.js`, `engine.js`, `viz.js` and `policy.js`
in that order. The runbook in `docs/KICKOFF.md` maps manual sections to files and gives each step an
acceptance command.

## Frozen layers

`rng`, `replay`, `worker-client`, the worker lifecycle, the `statestore` shape, the `scouting`
framework, `chartdata`, the `league` statistics, `serve`, `check_web` and the site build are the
parts that did not change between 2025 and 2026. Keep them out of season edits.

The older seasons are untouched by this directory. `2027/` is a third subtree, not a refactor of
`rebuilt/` or `reefscape/`.

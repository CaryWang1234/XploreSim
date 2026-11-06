# XploreSim · one repo, one site

One site with four entry points, hosted on Cloudflare Pages at `xploresim.salmoncat0304.xyz`.

| Path | What it is |
| --- | --- |
| `/` | Hub: the way in to every season |
| `/rebuilt/` | 2026 REBUILT console |
| `/reefscape/` | 2025 REEFSCAPE console |
| `/2027/` | 2027 season console: deployed before kickoff, waiting on its game pack |

## Layout

```
index.html 404.html      hub and 404, zero JS, zero external fonts
icon.svg                 the family mark, favicon for all three pages
rebuilt-piece.svg        FUEL, the 2026 game piece, drawn for the hub's dark panels
reefscape-piece.svg      CORAL, the 2025 game piece, same treatment
2027-piece.svg           the 2027 placeholder, a wireframe hex waiting on a game
scripts/build-site.mjs   assembles dist/: root pages + each season's web/
scripts/serve.mjs        previews dist/ locally, with Pages' directory-index and 404 rules
scripts/check.mjs        hub guard: links, structure, stylesheet and markup cross-check
rebuilt/                 2026 subtree (web/ is the site, scripts/ the measurements and guards, docs/ the notes)
reefscape/               2025 subtree (same shape)
2027/                    2027 subtree (placeholder web/, game pack contract, kickoff runbook)
dist/                    build output, gitignored
```

## Commands

```
npm run build      # dist/ = root pages + /rebuilt/ + /reefscape/ + /2027/
npm run serve      # preview dist/ at http://127.0.0.1:4190/
npm run check      # hub guard (SKIP_NET=1 skips the live 200 checks)
npm run check:apps # all three apps' static guards
npm test           # all three apps' headless tests
npm run validate   # all of the above plus the build; this is what .githooks/pre-push runs
```

Engine-level suites stay in their own directories and are not part of pre-push:
`npm --prefix rebuilt run validate` and `npm --prefix reefscape run validate` (the latter carries
about fifty physics invariants and takes over ten minutes). Run them by hand before a push that
touches engine code.

## Deployment

Cloudflare Pages, production branch `main`:

```
Build command:  npm run build
Output:         dist
```

Everything an app ships is referenced relatively (`./js/...`, the Worker via `import.meta.url`), so
`web/` runs unchanged under any path prefix. localStorage keys are per season
(`xplore-sim-setup-v1` / `xplore-reefscape-setup-v1`), so the two consoles share an origin without
crossing.

As observed in October 2026, a push to `main` does not trigger a build on its own. Create the
production deployment through the Pages API, then confirm the new version by fetching a changed
asset from the live site — not just by checking that the push went through.

## Domain

`xploresim` is a record under `salmoncat0304.xyz`, moved from GitHub Pages to a Cloudflare Pages
custom domain in October 2026. The old repos' CNAME files and Pages publishes were removed; the two
old `frc-rebuilt-tactics-*.qoder.zone` / `frc-reefscape-tactics-*.qoder.zone` sites stay up as
fallbacks for now.

## The hub stays a signpost

The hub copies no measured numbers: real score anchors, mirror matches and AI win rates all live in
each app's own README; the page only sends people to the two season sites. `scripts/check.mjs`
enforces that with a "the page stays a signpost" guard — `<article>`, `<details>`, `<svg>`,
`class="card"` or `class="num"` fails the check, so number-bearing cards cannot creep back onto the
hub.

The page copy is English only, and a CJK guard inside `npm run check` watches that. The whole
backdrop is CSS: the perspective grid along the bottom is the field carpet, and the glows in the
top corners take the season colours (2026 sand `#c9a45c`, 2025 teal `#5ccfd0`, 2027 steel
`#8b9bb4`). Those are the only accents on the page, and every animation is off under
`prefers-reduced-motion`.

## 2027 is a pack, not another fork

`2027/` ships the console shell before the game exists. The page, the build and the deploy are
already live; the season itself is one file, [`2027/web/js/game.js`](2027/web/js/game.js), and a
contract that refuses to call it live while scaffolding values remain. `npm --prefix 2027 run
check` validates the pack, and `npm --prefix 2027 test` attacks the validator. The same validator
renders the page, so a pack cannot look ready in one place and be broken in the other.

The five seams a new game fills are `game.js` (identity, labels, phases, points, RP), `rules.js`
(manual constants with citations), `model.js` (field geometry and robots), `engine.js` (the tick)
and `viz.js` (the field drawing). Everything outside those is the frozen shell. The hour-by-hour
plan, the manual-to-file map and the acceptance commands are in
[`2027/docs/KICKOFF.md`](2027/docs/KICKOFF.md).

## History

Merged from three repositories: the hub (`xploresim-hub`, which became the root history), the 2026
build (`rebuilt/`, subtree from `XploreSim_dev`) and the 2025 build (`reefscape/`, subtree from
`XploreSim_reefscape`). Both apps' commit history is intact — `git log -- rebuilt/` reaches their own
commits. The old repos were archived once the domain switch was done.

## License

MIT — see [LICENSE](LICENSE).


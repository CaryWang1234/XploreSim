# XploreSim · one repo, one site

One site with three entry points, hosted on Cloudflare Pages at `xploresim.salmoncat0304.xyz`.

| Path | What it is |
| --- | --- |
| `/` | Hub: the way in to both seasons |
| `/rebuilt/` | 2026 REBUILT console |
| `/reefscape/` | 2025 REEFSCAPE console |

## Layout

```
index.html 404.html      hub and 404, zero JS, zero external fonts
icon.svg                 the family mark, favicon for all three pages
rebuilt-piece.svg        FUEL, the 2026 game piece, drawn for the hub's dark panels
reefscape-piece.svg      CORAL, the 2025 game piece, same treatment
scripts/build-site.mjs   assembles dist/: root pages + each season's web/
scripts/serve.mjs        previews dist/ locally, with Pages' directory-index and 404 rules
scripts/check.mjs        hub guard: links, structure, stylesheet and markup cross-check
rebuilt/                 2026 subtree (web/ is the site, scripts/ the measurements and guards, docs/ the notes)
reefscape/               2025 subtree (same shape)
dist/                    build output, gitignored
```

## Commands

```
npm run build      # dist/ = root pages + /rebuilt/ + /reefscape/
npm run serve      # preview dist/ at http://127.0.0.1:4190/
npm run check      # hub guard (SKIP_NET=1 skips the live 200 checks)
npm run check:apps # both apps' static guards
npm test           # both apps' headless tests
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
backdrop is CSS: the perspective grid along the bottom is the field carpet, and the two glows in the
top corners take the season colours (2026 sand `#c9a45c`, 2025 teal `#5ccfd0`). Those are the only
accents on the page, and every animation is off under `prefers-reduced-motion`.

## History

Merged from three repositories: the hub (`xploresim-hub`, which became the root history), the 2026
build (`rebuilt/`, subtree from `XploreSim_dev`) and the 2025 build (`reefscape/`, subtree from
`XploreSim_reefscape`). Both apps' commit history is intact — `git log -- rebuilt/` reaches their own
commits. The old repos were archived once the domain switch was done.

## License

MIT — see [LICENSE](LICENSE).


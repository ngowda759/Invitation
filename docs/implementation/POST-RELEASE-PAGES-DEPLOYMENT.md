# Post-release: GitHub Pages deployment correction

This is a **post-release corrective fix**, not a new product phase. `docs/PHASES.md`
is unchanged: Phase 10 — Release remains the final planned phase, and no `INV-011`
exists or is generated.

## Production deployment defect

`https://ngowda759.github.io/Invitation/` served the repository's `README.md` rendered
as a Jekyll page, not the built Next.js invitation application. The deployed HTML
began with the Jekyll `SEO tag` block and a `markdown-body` container, linked
`/Invitation/assets/css/style.css` (the GitHub Pages Jekyll theme), and showed the
heading *"Rayara Anubhava — Digital Temple Invitation"* followed by *"Project boundary"*.

## Root cause

Two independent gaps:

1. **Pages was publishing the repository tree, not an application build.** The
   repository's Pages configuration was the legacy `build_type: "legacy"` "deploy from
   a branch" mode, with `source: { branch: "main", path: "/" }`. GitHub Pages therefore
   ran Jekyll over the repository root, and because there is no `index.md`, Jekyll
   rendered `README.md` as the site index. The invitation was never built or uploaded.
2. **No application deployment existed.** `next.config.ts` was not a static export
   (`output: "export"` was absent), and no workflow built or deployed the app. Phase 10
   recorded the deploy gap explicitly (`docs/implementation/PHASE-10-RELEASE.md`: *"No
   deploy step is added"*), so the release had no publishing path at all.

Neither gap is a state-machine problem: the autonomous loop is correct and green. This
is purely the missing deployment layer plus a misconfigured Pages source.

## Static-export compatibility

The application is compatible with a static export: a single `/` route, no API routes,
no route handlers, no dynamic server functions, no cookies, no rewrites/redirects, and
no environment-variable-dependent runtime behaviour. `next build` with
`output: "export"` succeeds and prerenders `/` and `/_not-found`. No functionality was
removed or converted to make the build pass.

## Files changed

| File | Change |
| --- | --- |
| `next.config.ts` | Added `output: "export"`; added `basePath` read from `PAGES_BASE_PATH` (empty locally, `/Invitation` on Pages); added `images.unoptimized: true` (a static export has no optimizer). The Phase 8 `headers()` block is kept — it still applies to `next dev` and any Node-hosted deployment, and a static export simply ignores it. |
| `.github/workflows/deploy-pages.yml` (new) | Builds the static export and publishes **only** `out/` to GitHub Pages using `actions/configure-pages`, `actions/upload-pages-artifact` and `actions/deploy-pages`. |
| `tests/unit/deployment.test.mjs` (new) | Guards the deployment contract (static export, env-aware base path, unoptimized images, Pages workflow permissions, artifact path, source/docs guard). |
| `README.md` | Added a Deployment section describing the static export and Pages source. |
| `docs/implementation/POST-RELEASE-PAGES-DEPLOYMENT.md` (new) | This report. |

`.ai/state/loop-state.json` and the task queue are **not** modified: no task is created
or consumed, so the state machine is untouched.

## Why GitHub Pages requires these changes

- GitHub Pages has no Node.js runtime, so the application must be **statically
  exported** rather than served by `next start`.
- GitHub Pages project sites are served from a **sub-path**. For this repository the
  site lives at `/Invitation/`, so `basePath` must be `/Invitation` at build time or
  every `_next/static/*`, font and image URL resolves against the domain root and 404s.
  The value comes from `actions/configure-pages` (`base_path`), so it is derived from
  the real Pages configuration rather than hard-coded.
- GitHub Pages must be configured with **Source: GitHub Actions** so the generated
  `out/` artifact is what gets published, instead of a Jekyll build of the repository
  tree.

## Routing requirement

Asset and route URLs include `/Invitation/` because `basePath` is set on the Next.js
configuration, not because of hard-coded strings in components. There is no
`"/Invitation"` literal anywhere in `src/`; the only reference is the environment-aware
`basePath` in `next.config.ts`. Local development and any root-hosted deployment keep
an empty base path.

## Validation performed

Local run (Node 24.21.0, npm 11.19.1):

| Gate | Command | Result |
| --- | --- | --- |
| Install | `npm ci` | 448 packages |
| Lint | `npm run lint` | clean |
| Typecheck | `npm run typecheck` | clean |
| Unit tests | `npm test` | 14 files, 163 tests passed |
| E2E tests | `npm run test:e2e` | 45 passed, 1 skipped (mobile-only budget) |
| Build (root) | `npm run build` | static export, `/` prerendered |
| Build (Pages) | `PAGES_BASE_PATH=/Invitation npm run build` | static export with `/Invitation`-prefixed assets |
| AntiSlop | `node .ai/scripts/antislop.mjs` | PASS (0 error, 0 warning) |
| Loop config | `node .ai/scripts/validate-loop-config.mjs` | consistent |

### Static output inspection and smoke test

The generated `out/` was inspected and served from a sub-path to reproduce Pages
exactly:

- `out/index.html` is a Next.js document (`_next/static` present), not a Jekyll page;
  `out/404.html` is the app's not-found page.
- With `PAGES_BASE_PATH=/Invitation`, all 43 distinct `_next` references are prefixed
  with `/Invitation/` and each exists on disk.
- Served at `http://127.0.0.1:4173/Invitation/` with Playwright Chromium on mobile
  (412×915) and desktop (1440×900): HTTP 200, one `h1` (*"Rayara Anubhava"*), 11
  regions, the opening veil dissolves, no horizontal overflow, **no failed requests and
  no console errors**, and no repository/documentation content. Reloading the main page
  still renders the invitation.

## Deployment verification

After this change is merged, the `Deploy to GitHub Pages` workflow runs on the push to
`main`, builds the export and publishes `out/`. The deployed URL
`https://ngowda759.github.io/Invitation/` is then verified against the checklist below
(UI shown, no README/document page, CSS/JS/images load, navigation works, `/Invitation/`
base path correct, reload does not expose the repository page).

**Required repository setting:** GitHub Pages must be switched to **Source: GitHub
Actions** (Settings → Pages). The Pages API was updated to the workflow build type as
part of this fix so the deployment can publish.

## Autonomous-loop / state-machine impact

None. No task was invented, no phase was added, and `.ai/state` is unchanged. The loop
remains at `NEXT_PHASE` for `INV-010` with its recorded, honest
`blockedReason` (*"No phase follows 'Phase 10 — Release'"*). This corrective fix is
delivered as a normal pull request and goes through the existing CI, AntiSlop, quality
and review gates. The terminal-state handling needs no change: it already refuses to
fabricate a task and records the block without corrupting the roadmap, so the
"no successor phase" path was left exactly as designed.

## Known limitations

- **Base path from Pages, not hard-coded.** The Pages sub-path is supplied by
  `actions/configure-pages`, so if the repository is ever renamed or moved to a user
  site the deployment follows automatically without editing components.
- **No image optimization on Pages.** A static export cannot run Next.js's image
  optimizer, so images are served unoptimized. The gallery is empty today, so there is
  no current payload cost.
- **No security headers on Pages.** A static export cannot emit the Phase 8 response
  headers; GitHub Pages sets its own. The `headers()` configuration is retained for
  Node-hosted environments and keeps the security e2e gate meaningful.

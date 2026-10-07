# Post-release: production verification and remaining asset gaps

This is a **post-release corrective fix**, not a new product phase. `docs/PHASES.md`
is unchanged: Phase 10 — Release remains the final planned phase and no `INV-011`
exists or is generated. No task is created or consumed, and `.ai/state` is untouched.

## Context

The core GitHub Pages defect — the site serving the repository `README.md` through
Jekyll instead of the built invitation — was already corrected and merged in PR #13
(see `POST-RELEASE-PAGES-DEPLOYMENT.md`). GitHub Pages is now configured with
`build_type: "workflow"` and the `Deploy to GitHub Pages` workflow publishes the
Next.js static export from `out/`.

This change **verifies** that deployment against the live URL and closes the one
remaining production asset gap it surfaced.

## Live verification (https://ngowda759.github.io/Invitation/)

Verified against the deployed site, not just the Actions result:

| Check | Result |
| --- | --- |
| HTTP status of `/Invitation/` | 200 |
| Document is the invitation app | `<title>Rayara Anubhava</title>`, one `<h1>`, 11 `<section>` regions |
| Repository/README content served | **No** — no `markdown-body`, no Jekyll, no `README` markers |
| CSS | Inline stylesheet present; body resolves to the cream `rgb(255, 248, 232)` token |
| JavaScript | All `_next/static/chunks/*.js` load (22 distinct asset URLs, all HTTP 200) |
| Fonts | Inter (sans) + Lora (display) preloaded; `h1` computes to `Lora, …` |
| Images | No `<img>` today (gallery content is empty by design); none broken |
| Hero/opening | Full-screen hero with `#invitation-heading`; the opening veil dissolves (`opacity: 0`) |
| Programme section | `#programme` present, reachable, and scrolled into view via `#programme` |
| Temple experience | Temple map, gallery, location and share sections all present |
| Mobile layout | Pixel 7 viewport: no horizontal overflow, hero and sections render |
| Desktop layout | Desktop Chrome viewport: no horizontal overflow, hero and sections render |
| Console/asset errors | **None** on the export smoke test (0 failed requests, 0 console errors) |
| Unknown path | Serves the app's own `404` page, not repository content |
| Reload | Re-renders the invitation; repository content is never exposed |

The base path is handled by `next.config.ts` (`basePath` from `PAGES_BASE_PATH`), so
every `_next` asset, font and the app icon resolve under `/Invitation/` with no
`"/Invitation"` literal anywhere in `src/`.

## Remaining gap closed

The deployed document had **no app icon**: there was no `<link rel="icon">` and
`/Invitation/favicon.ico` returned 404, so browser tabs and bookmarks showed a blank
icon. A temple-appropriate icon is now shipped through the Next.js `app/icon.svg`
file convention, which emits the favicon link and exports the asset under the base
path automatically.

## Files changed

| File | Change |
| --- | --- |
| `src/app/icon.svg` (new) | Branded diya app icon using the approved palette, via the `app/icon.svg` file convention. |
| `tests/unit/deployment.test.mjs` | Guards that the app icon ships, so a blank tab icon cannot silently return. |
| `README.md` | Corrects the stale "Phase 1 — Foundation" status and records the app icon. |
| `docs/implementation/POST-RELEASE-PRODUCTION-VERIFICATION.md` (new) | This report. |

## Autonomous-loop / state-machine impact

None. The loop sits at its terminal `NEXT_PHASE` state for `INV-010` with an honest
`blockedReason` ("No phase follows 'Phase 10 — Release'"). That handling is correct
and is guarded by `tests/unit/autonomy.test.mjs` ("blocks instead of inventing a task
when the phase is not in the roadmap"), so it was deliberately left unchanged. No
successor phase and no `INV-011` are fabricated.

## Validation performed

Local run (Node 24.21.0, npm 11.19.1): lint clean, typecheck clean, 164 unit tests
passed, 45 e2e passed (1 skipped mobile-only budget), static export built for both the
root and the `/Invitation` base path, AntiSlop PASS, loop config consistent. The
generated `out/` was served at `/Invitation/` and exercised with Playwright Chromium on
mobile and desktop: HTTP 200, one `h1`, 11 regions, no overflow, programme anchor in
view, 0 failed requests, 0 console errors, and the app icon serving as `image/svg+xml`.

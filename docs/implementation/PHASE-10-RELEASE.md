# Phase 10 — Release

Task: `INV-010`. Phase: **Phase 10 — Release**.

This document is the evidence for the release gate. It records the commands run, their
results, the files changed, the known limitations and the recommended next task.
Nothing here invents a temple fact.

## What Phase 10 means here

`docs/PHASES.md` Phase 10 has **no `Gate:` line**: it is not a feature phase, it is the
release run. Its job is to execute the whole gate set — unit tests, e2e tests, lint,
typecheck, build, performance, security, Antislop and the final product review — and
only then release. This phase therefore adds no product feature. It closes the one
release gap that existed (the end-to-end gate was not wired into CI) and records the
full-set evidence.

## Gap found and closed

| Gate | Before Phase 10 | After Phase 10 |
| --- | --- | --- |
| Unit tests | In CI (`npm test`) | In CI, unchanged |
| **e2e tests** | **Only run locally; never in CI** | **Wired into CI as a second job** |
| lint / typecheck / build | In CI | In CI, unchanged |
| performance / security | Browser specs in the e2e suite | Now enforced by CI via the e2e job |
| Antislop | Blocking workflow | Unchanged |

`docs/PHASES.md` lists *e2e tests* as a release deliverable, but `.github/workflows/ci.yml`
ran only `npm ci → lint → typecheck → test → build`. The release gate was therefore
incomplete: the browser, performance and security specs could regress on a pull request
without CI noticing. Phase 10 adds an `e2e` job to CI and makes `npm run test:e2e` a
required step in `.ai/loop.config.json`, so the validator keeps it wired.

The new job stays read-only (`permissions: contents: read`), references no repository
secret, and installs its browser explicitly (`npx playwright install --with-deps chromium`)
so it cannot silently no-op. The existing CI-contract gate in
`.github/workflows/invitation-quality.yml` still passes: it checks that the five original
steps are present and that CI references no `secrets.*`, both of which remain true.

## Release gate evidence

Commands run locally (Node 24.21.0, npm 11.19.1) against this branch:

| Gate | Command | Result |
| --- | --- | --- |
| Install | `npm ci` | 448 packages installed |
| Lint | `npm run lint` | clean |
| Typecheck | `npm run typecheck` | clean |
| Unit tests | `npm test` | 13 files, 155 tests passed |
| Build | `npm run build` | static `/` and `/_not-found` prerendered |
| E2E tests | `npm run test:e2e` | 45 passed, 1 skipped (mobile + desktop) |
| Loop config | `node .ai/scripts/validate-loop-config.mjs` | configuration consistent |
| AntiSlop | `node .ai/scripts/antislop.mjs --json` | PASS (0 error, 0 warning) |

The single skipped e2e test is the mobile-only LCP/CLS budget, which is deliberately
skipped on the desktop project (`test.skip(!isMobile || browserName !== "chromium")`); it
runs and passes on the mobile project.

### Performance

Measured in `tests/e2e/performance.spec.ts` on mobile Chromium with CPU ×4 throttling and
a Slow-4G profile: CLS < 0.1 and LCP < 2500 ms. The measured values from Phase 7
(LCP 386 ms, CLS 0.0095) are recorded in `docs/implementation/PHASE-7-PERFORMANCE.md`; the
release run keeps the same budget as a hard assertion.

### Security

`tests/e2e/security.spec.ts` asserts the hardening headers are served, the CSP produces no
violations on a real load, every `target="_blank"` link carries `noopener noreferrer`, and
the served HTML contains no inline event handlers, `javascript:` URLs or iframes. The
dependency posture is unchanged from Phase 8: `npm audit --omit=dev` reports 0
production advisories; the dev-only advisories all trace to `braces@3.0.3` through the
ESLint toolchain, which is already at its latest published version
(`docs/implementation/PHASE-8-SECURITY.md`).

### Antislop

`node .ai/scripts/antislop.mjs --json` returns PASS with no findings. The gate is blocking
in `.github/workflows/invitation-antislop.yml`.

### Final product review

`docs/CHATGPT.md` names ChatGPT the final quality authority and asks: *would a real temple
organization be proud to send this link to devotees?* That review is a **human/product
decision**. The loop does not fabricate it: `reconcile.mjs` advances the `CHATGPT_REVIEW`
state on verified merge evidence with the note *"no automated ChatGPT review is
fabricated"*, and the OpenRouter reviewer is schema-locked to `isChatGpt: false`. The
release therefore remains gated on the product authority's sign-off; the automated gates
below are complete and green, but they are not a substitute for it.

## Release checklist

- [x] Unit tests — 155 passing
- [x] E2E tests — 45 passing, 1 mobile-only budget skipped on desktop
- [x] Lint — clean
- [x] Typecheck — clean
- [x] Build — static, prerendered
- [x] Performance — CLS < 0.1, LCP < 2.5 s (mobile budget, CI-enforced)
- [x] Security — headers, CSP, link guarding, no injection sinks
- [x] Antislop — PASS
- [ ] Final ChatGPT / product review — **human authority** (not automated)

## Files changed

- `.github/workflows/ci.yml` — added the read-only `e2e` job.
- `.ai/loop.config.json` — added `npm run test:e2e` to `ci.requiredSteps`.
- `tests/unit/release.test.mjs` (new) — guards the release contract: every configured gate
  is present in CI, CI is read-only and secret-free, a browser is installed, and the
  Phase 10 task is recorded with the roadmap deliverables.
- `docs/implementation/PHASE-10-RELEASE.md` (new) — this report.

## Known limitations

- **The final product review is not automated.** No script can answer the ChatGPT.md final
  question; the release is not "done" until the product authority signs off. This is
  recorded honestly rather than papered over.
- **The e2e CI job adds a browser download** (`--with-deps chromium`, ~130 MB) to every CI
  run. This is the cost of running the release's browser gates in CI; it is acceptable for
  a single-project site and can be cached later if needed.
- **Dev-only dependency advisories remain** (`braces@3.0.3` via ESLint). They do not affect
  the shipped site and have no fix at the current published version; tracked since Phase 8.
- **No deploy step is added.** The phase says "only then release/deploy", but deployment
  target/credentials are an infrastructure decision outside this repository's scope. The
  loop delivers through a PR and does not push to `main`.

## Recommended next task

Phase 10 is the last phase in `docs/PHASES.md`. There is no following phase, so there is no
`INV-011` to generate. The recommended next step is a **human/product action**, not another
task: obtain the final ChatGPT/product review, then merge this release PR. If the product
authority later adds a deployment phase to the roadmap, the loop can generate its first
task from a fresh `next-task-request.json` as usual.

# Phase 7 — Performance

Task: `INV-007`. Phase gate: **performance report**.

This document is the evidence for the Phase 7 gate. It records what was measured, how
it was measured, and the known limitations. Nothing here invents a temple fact.

## Scope delivered

| Deliverable | Status | Where |
| --- | --- | --- |
| LCP < 2.5s on representative mobile conditions | Met | Inlined atomic CSS (`next.config.ts`); measured below |
| CLS < 0.1 | Met | Text-first hero, no above-the-fold media; measured below |
| INP < 200ms where measurable | Not measurable locally; structurally low | Only one client island (`ShareExperience`); no scroll/click handlers on the critical path |
| Optimized image payloads | Done | `formats: ["image/avif", "image/webp"]`, `qualities` allowlist, explicit thumbnail `quality`/`loading` in `GalleryExperience.tsx` |
| No unnecessary client components | Done | Exactly one `"use client"` module; asserted by a test |

## What changed

1. **`next.config.ts`**
   - `images.formats: ["image/avif", "image/webp"]` — serve the smallest modern format the
     browser accepts (AVIF preferred, WebP fallback).
   - `images.qualities: [60, 75]` — Next.js 16 requires an explicit quality allowlist; it is
     pinned to the two qualities the gallery actually uses.
   - `experimental.inlineCss: true` — inline the atomic (Tailwind) stylesheet into the
     document so the first paint is not blocked on a separate CSS request.
2. **`src/components/experience/GalleryExperience.tsx`**
   - Thumbnails now set `loading="lazy"` (explicit, they are below the fold) and
     `quality={60}`. The full-view image keeps the default quality for detail.
3. **Tests**
   - `tests/unit/performance.test.ts` — deterministic invariants (client-component audit,
     server-first sections, no unsafe HTML / third-party scripts, image usage, config).
   - `tests/e2e/performance.spec.ts` — throttled mobile LCP/CLS budget and a
     no-third-party-resources check.

No dependency was added. The visual design is unchanged.

## Measured results

Method: production build (`npm run build`) served by `npm run start`, measured in
Chromium (Playwright 1.63, Chrome Headless Shell 153) at a Pixel 7 viewport
(412×915, DPR 2.625, mobile), with CPU throttling ×4 and a Slow-4G network profile
(150 ms RTT, 1.6 Mbps down / 750 kbps up) applied through CDP. Five runs each; the
figures below are the medians. The LCP element was the hero description paragraph
(`p`) — a text LCP, with no above-the-fold image cost.

| Build | LCP (ms) | CLS | FCP (ms) | Document loaded (ms) |
| --- | --- | --- | --- | --- |
| **`inlineCss: true` (shipped)** | **386** | **0.0095** | 386 | ~1650 |
| `inlineCss: false` (baseline) | 744 | 0.0095 | 744 | ~1695 |

Inlining the stylesheet removes one render-blocking round trip and roughly halves LCP
(−48%) on this profile. Both builds are comfortably inside the budget; inlining is kept
because first-time visitors arriving from a WhatsApp link are the primary audience.

LCP 386 ms is **~15% of the 2.5 s budget**; CLS 0.0095 is **~10% of the 0.1 budget**.
Both are on a throttled localhost origin, so they understate real network latency — see
limitations.

### CSS transfer trade-off

`inlineCss` moves the 32 KB stylesheet into the document, so the document grows while the
separate request disappears:

| Build | HTML gzip | CSS gzip | Total gzip |
| --- | --- | --- | --- |
| `inlineCss: true` | 29.1 KB | — (inlined) | 29.1 KB |
| `inlineCss: false` | 5.4 KB | 7.9 KB | 13.3 KB |

Inlining costs ~16 KB more compressed bytes on a first visit but removes a render-blocking
request, which is the metric that matters for LCP. Returning visitors would benefit from a
cached external stylesheet; for an invitation whose traffic is mostly first-time, the
first-visit trade is the right one.

### Image payload

- `next/image` is used for every gallery image; there are no raw `<img>` tags.
- The optimizer serves AVIF first, then WebP, then the source format, per the request's
  `Accept` header.
- Thumbnails request `quality=60` at `sizes="(max-width: 640px) 50vw, 33vw"`; the full-view
  image requests the default quality at `sizes="90vw"`.
- The `srcset` is generated from the `sizes` prop, so each device downloads only the width
  it needs.
- The gallery content module is empty until the temple supplies photographs, so no image
  bytes are shipped today; the optimization is in the render path and is asserted by tests.

### Client JavaScript

- Exactly one `"use client"` module exists: `ShareExperience.tsx` (native share sheet /
  clipboard). Every other section, the hero and the page are Server Components and ship no
  client JS. This is enforced by `tests/unit/performance.test.ts`.
- No `next/script`, no `dangerouslySetInnerHTML`, and no external script or font requests;
  fonts are self-hosted by `next/font`.

### INP

INP requires real user interaction on a real device and cannot be measured meaningfully in
a local headless run. The structural evidence is that the critical path carries no event
handlers and a single small client island; the only interactive controls are links, the
native `<details>` disclosure and one share button. A field INP measurement is recommended
before release (see limitations).

## Evidence

Commands run (Node 24.21.0, npm 11.19.1):

| Command | Result |
| --- | --- |
| `npm ci` | 448 packages installed |
| `npm run lint` | clean |
| `npm run typecheck` | clean |
| `npm test` | 10 files, 123 tests passed |
| `npm run build` | static `/` and `/_not-found` prerendered |
| `npm run test:e2e` | 37 passed, 1 skipped (mobile + desktop projects) |
| `node .ai/scripts/validate-loop-config.mjs` | configuration consistent |
| `node .ai/scripts/antislop.mjs` | PASS (0 error, 0 warning) |

New coverage:

- `tests/unit/performance.test.ts` — 7 deterministic invariants.
- `tests/e2e/performance.spec.ts` — throttled mobile LCP/CLS budget (mobile Chromium) and a
  no-third-party-resources check (both projects).

The e2e budget runs the mobile project only; it is skipped on desktop, where the
mobile-network profile does not apply.

## Known limitations

- The LCP/CLS figures are from a local origin with CPU/network throttling, not a real
  handset on a real mobile network. They are useful for regression and for the inline-CSS
  decision, but a field measurement (Vercel Speed Insights, Chrome UX Report or Lighthouse
  on the deployed origin) is still required to certify the 2.5 s target in production.
- INP is not measured locally; it should be read from field data after release.
- The image optimizations (AVIF/WebP, thumbnail quality) only produce bytes once the temple
  supplies gallery photographs; the code path and config are in place and tested.
- The LCP element today is hero text, not an image. When the product authority supplies a
  full-bleed hero photograph, the hero image should be made the LCP element with
  `preload` (or `fetchPriority="high"`) and a correct `sizes`; that is a content-phase
  follow-up, not a change made here.
- `npm ci` still reports 5 high-severity transitive advisories; these are deferred to
  Phase 8 (Security / Hardening), which owns dependency review.

## Recommended next task

Phase 8 — Security / Hardening (`INV-008`): review secrets, dependency vulnerabilities,
unsafe HTML, external links, security headers, CSP compatibility and content-injection
risks.

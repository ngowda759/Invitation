# Phase 11 — Devotional Invitation Experience

Task: `INV-011`. Phase: **Phase 11 — Devotional Invitation Experience**.

This document is the evidence for the phase gate (*invitation experience review on
mobile + desktop*). It records the commands run, their results, the files changed, the
known limitations and the recommended next task. Nothing here invents a temple fact.

## What this phase changed

The application was already functional and deployed, but it read like a web page rather
than an invitation. Phase 11 reworks the **experience**: a devotional visual system, a
narrative order for the content, a ceremonial entrance, and an ornament vocabulary — with
no new backend, no new runtime dependency and no change to how the site is hosted.

The task brief (`.ai/tasks/INV-011.md`) lists eight deliverables; each maps to a concrete
change below.

| Deliverable | Implementation |
| --- | --- |
| invitation cover reveal | `OpeningExperience` — a text-free ceremonial cover over a dark temple ground, dissolved by CSS only |
| devotional opening composition | `TempleHero` — lamp glow, gopura arch, gilt mandala, invocation, event identity, primary CTAs |
| temple-atmosphere storytelling | `Ornaments` vocabulary (mandala, arch, lotus divider, lamp, temple rule) framing every movement |
| ceremonial programme typography | `ProgrammeTimeline` — a typeset schedule with strong date/time hierarchy and ornamental separators |
| warm people/family presentation | `FamilySection` + `src/content/family.ts` — framed names, honest empty state |
| ornament vocabulary | One shared `Ornaments.tsx`, palette-locked, no external image or font |
| restrained ceremonial motion | A single `reveal-up` entrance per section; no looping animation; reduced-motion honoured |
| mobile-first invitation rhythm | One shared `ContentSection` shell; single `mt-8` body step; tested at 320/375/390/414 |

### Narrative order

The story now reads: **welcome → invitation details → contents → darshan → festival →
programme → guru rayaru → temple map → seva → family → gallery → location → share**.
`InvitationNav` is a quiet contents band (not a sticky dashboard) that lets a visitor jump
into the story without the navigation dominating it.

### What was deliberately *not* done

- No temple fact, date, timing, name, quotation or relationship was invented. Every
  content module is still empty until the product authority supplies verified copy, and
  the UI omits the empty fields rather than filling them.
- No Vercel dependency. GitHub Pages remains the only production target.
- No animation library and no new dependency: motion is CSS only.

## Design system

`docs/DESIGN-SYSTEM.md` was corrected to describe what is actually implemented: the tuned
palette, the three self-hosted faces (Cormorant Garamond display, Inter body, Noto Serif
Kannada for the optional Kannada line) and the motion rules.

## Gate evidence

Commands run locally (Node 24.21.0, npm 11.19.1) against this branch:

| Gate | Command | Result |
| --- | --- | --- |
| Lint | `npm run lint` | clean |
| Typecheck | `npm run typecheck` | clean |
| Unit tests | `npm test` | 15 files, 173 tests passed |
| Build (default) | `npm run build` | static `/`, `/_not-found`, `/icon.svg` |
| Build (Pages) | `PAGES_BASE_PATH=/Invitation npm run build` | static export; every asset prefixed `/Invitation` |
| E2E tests | `npm run test:e2e` | 55 passed, 1 skipped (mobile + desktop) |
| AntiSlop | `node .ai/scripts/antislop.mjs --json` | PASS (0 error, 0 warning) |
| Loop config | `node .ai/scripts/validate-loop-config.mjs` | configuration, state, queue and workflows consistent |

The single skipped e2e test is the mobile-only LCP/CLS budget, deliberately skipped on the
desktop project; it runs and passes on mobile.

### New tests this phase

- `tests/unit/devotional-experience.test.tsx` — the cover is decorative and text-free; the
  story order is stable; every contents anchor resolves; the family content stays empty
  until verified names arrive; one shared section shell; the ornaments stay on-palette and
  carry no external asset.
- `tests/e2e/devotional-experience.spec.ts` — the cover opens into the hero; the hero
  carries its devotional composition; the contents band resolves to real sections; every
  movement shares one reveal; reduced motion removes the cover and the reveal delay.

## Visual verification (phase gate)

Screenshots captured against the **static export served under `/Invitation/`** (the
production shape), with reduced motion so each full-page capture is faithful:

- Mobile: 320, 375, 390, 414 px
- Tablet: 768 px
- Desktop: 1280, 1440 px

Verified at every width: zero horizontal overflow, exactly one `h1`, 12 regions, the cover
dissolves, the hero fills the viewport, and **0 console errors / 0 failed requests**.

The scroll-driven reveal was additionally checked four ways so it can never hide the
invitation: scrolling reveals all 11 movements; a direct `#hash` load reveals the target;
`prefers-reduced-motion` disables the animation; and `@media print` forces sections
opaque.

## Accessibility

Semantic landmarks are unchanged (one `h1`, uniquely named `region`s), the skip link is
still the first focus target, focus stays visible, decorative overlays and ornaments are
`aria-hidden`, and `prefers-reduced-motion` removes the cover delay and the section
reveal. The cover never blocks the invitation: it is a pure overlay and the content
beneath it is complete in the served HTML.

## Performance

No new dependency, no animation library, no external image or font at runtime. Fonts are
self-hosted by `next/font`. The export is unchanged in shape, so the Phase 7 budget
(LCP < 2500 ms, CLS < 0.1 on throttled mobile) still holds and is asserted in
`tests/e2e/performance.spec.ts`.

## Known limitations

- Content modules remain empty pending the product authority; the invitation shows honest
  empty states, so the emotional payoff of real darshan/festival/programme copy is not yet
  visible on the deployed site.
- The Kannada face is loaded but unused until a Kannada identity line is supplied.

## Recommended next task

Supply verified temple copy (invocation, Kannada identity, darshan, festival, programme,
family) through the product authority, then a content-review phase to confirm the
invitation reads correctly with real content. The architecture prompt is the authority for
whether such a phase is generated; this document does not create one.

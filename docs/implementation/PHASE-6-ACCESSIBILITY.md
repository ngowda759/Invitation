# Phase 6 — Mobile / Accessibility

Task: `INV-006`. Phase gate: **accessibility checklist**.

This document is the evidence for the Phase 6 gate. It records what was verified, how
it was verified, and the known limitations. Nothing here invents a temple fact.

## Scope delivered

| Deliverable | Status | Where |
| --- | --- | --- |
| Mobile polish | Done | `globals.css` (balanced headings), `page.tsx` (safe-area footer), hero CTA touch sizing |
| Keyboard navigation | Done | Non-focusable gallery backdrop + `Close` route, native `<details>`, skip link |
| Focus states | Done | One shared `:focus-visible` indicator in `globals.css`; component rings |
| Reduced motion | Done | `prefers-reduced-motion` block collapses animation and stops the hero glow |
| Semantic structure | Done | Landmarks, one `h1`, unique region names, no duplicate ids |
| Screen-reader sanity | Done | Decorative hiding, new-tab hints, polite share status, named controls |

## Accessibility checklist

### Structure and semantics

- [x] Exactly one `<h1>` (`TempleHero`) and one `<main>` landmark.
- [x] Every `<section>` is a landmark with a unique, non-empty accessible name. The
      event panel uses `aria-label="Invitation details"` so it does not collide with the
      hero region, whose `h1` carries the same event name.
- [x] Every content section is named by its own `h2` via `aria-labelledby`.
- [x] No duplicate element `id` values on the page.
- [x] Headings are balanced (`text-wrap: balance`) so long headings do not orphan words.

### Keyboard

- [x] The skip link is the first tab stop and moves focus to `#main`.
- [x] The gallery lightbox is reachable from each thumbnail; the `Close` control is the
      keyboard exit. The full-view backdrop is pointer-only (`aria-hidden`, `tabindex=-1`)
      so the tab order stays short and predictable.
- [x] Seva uses the native `<details>`/`<summary>` disclosure, operable by keyboard.
- [x] No element uses a positive `tabindex`.
- [x] Native controls (buttons, links) are used throughout; no ARIA widget reinvention.

### Focus visibility

- [x] A single `:focus-visible` indicator (2px gold outline + a contrasting ring) applies
      across the page. On light surfaces the dark ring carries the contrast; on dark
      surfaces the gold outline does. The lightbox repoints the ring via
      `--focus-ring-offset: var(--cream)`.
- [x] The skip link, buttons and links expose a visible focus ring; hero CTAs use a light
      ring against the maroon hero.

### Reduced motion

- [x] `@media (prefers-reduced-motion: reduce)` collapses animation and transition
      durations, disables smooth scrolling, and removes the opening veil delay.
- [x] The hero glow animation is set to `none` (no looping) when motion is reduced.

### Screen reader

- [x] Decorative overlays and ornamental SVGs are `aria-hidden`.
- [x] External links (`WhatsApp`, `Open the temple map`) carry a visible-to-AT
      "(opens in a new tab)" hint and `rel="noopener noreferrer"`.
- [x] The share control keeps a stable accessible name; the outcome is announced through
      a polite `role="status"` region rather than by mutating the button label.
- [x] Every link and button has a non-empty accessible name.

### Mobile

- [x] No horizontal overflow at the configured mobile width (Pixel 7).
- [x] Body copy is at least 14px (`text-sm` and above) with balanced headings.
- [x] Primary touch targets are at least 44px (`size="lg"` is 48px); the gallery
      thumbnail is a full square.
- [x] The footer respects `env(safe-area-inset-bottom)`.

## Evidence

Commands run (all on Node 24.21.0, npm 11.19.1):

| Command | Result |
| --- | --- |
| `npm ci` | 448 packages installed |
| `npm run lint` | clean |
| `npm run typecheck` | clean |
| `npm test` | 9 files, 116 tests passed |
| `npm run build` | static `/` and `/_not-found` prerendered |
| `npm run test:e2e` | 34 passed (mobile + desktop projects) |
| `node .ai/scripts/validate-loop-config.mjs` | configuration consistent |
| `node .ai/scripts/antislop.mjs` | PASS (0 error, 0 warning) |

New coverage:

- `tests/unit/accessibility.test.tsx` — structure, keyboard route, screen-reader sanity.
- `tests/e2e/accessibility.spec.ts` — assembled-page checks on mobile and desktop,
  including focus indicator and reduced-motion behaviour.

## Known limitations

- Automated checks cannot certify colour contrast or screen-reader pronunciation. The
  focus-ring colours were chosen for contrast, but a manual audit (axe/WAVE plus a screen
  reader pass on a real device) is still recommended before release.
- The gallery lightbox is CSS-`:target`-only by design (no client JavaScript, no focus
  trap). `Esc` to close is therefore not implemented; the `Close` control and the
  thumbnail link are the keyboard routes. This is a deliberate Phase 5 constraint that
  Phase 6 preserves.
- The visual direction is unchanged; Phase 6 adjusts only semantics, focus, motion and
  mobile details.

## Recommended next task

Phase 7 — Performance (`INV-007`): measure LCP, CLS and INP on representative mobile
conditions, verify image payloads and confirm the page stays server-first with no
unnecessary client components.

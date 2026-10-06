# Phase 9 — Antislop

Task: `INV-009`. Phase gate: **Antislop pass**.

This document is the evidence for the Phase 9 gate. It records what was removed,
simplified or regularised, how it was verified, and the known limitations. Nothing here
invents a temple fact.

## Scope delivered

| Deliverable | Status | Where |
| --- | --- | --- |
| Duplicate components | Removed | New shared `EntryList`; Darshan and Festival no longer carry identical markup |
| Dead code | Removed | `Invocation`, `isExternalHref`, `buttonVariants`/`ButtonProps`/`ButtonLinkProps` exports, `site.placeholderUrl`, `Site`/`Event` type exports |
| Unnecessary abstractions | Removed | `ContentPlaceholder` lost its only-ever-duplicated `className` prop |
| Generic AI-looking copy/UI | Reviewed | One filler sentence removed; remaining copy is specific and intentional |
| Excessive animation | Removed | Hero glow no longer loops; the gate now fails on any `infinite` animation |
| Excessive cards | Reviewed | No card grid added; only genuine disclosure containers use a card surface |
| Unnecessary dependencies | Verified | No dependency added or present that a static site does not need |
| Inconsistent spacing/typography | Regularised | One `mt-8` body rhythm across every content section |

## What changed

1. **`src/components/experience/EntryList.tsx`** (new)
   - One definition list for "a set of labelled entries with optional detail".
     `DarshanSection` and `FestivalSection` rendered byte-for-byte identical
     `<dl><div><dt><dd>` markup; they now both render `<EntryList>`.
   - Removes the duplicate component and guarantees the two sections cannot drift in
     spacing or typography.
2. **`src/components/experience/DarshanSection.tsx`**, **`FestivalSection.tsx`**
   - Use `EntryList`; local markup deleted.
3. **`src/components/experience/OpeningExperience.tsx`**
   - Removed the unused, exported `Invocation` component. Production code only ever
     rendered the hero's own invocation; the component duplicated that markup and its
     only consumer was a unit test.
4. **`src/lib/security.ts`**
   - Removed `isExternalHref`, which was exported but never used in the render path.
     `EXTERNAL_LINK_REL` and `isSafeImageSrc` remain — both are used.
5. **`src/components/ui/button.tsx`**
   - Stopped re-exporting `buttonVariants`, `ButtonProps` and `ButtonLinkProps`. All
     three remain used internally; the public exports were unused.
6. **`src/content/site.ts`**, **`src/content/event.ts`**
   - Removed the unused `site.placeholderUrl` field and the unused `Site`/`Event` type
     exports. `site.projectName`, `site.locale` and `event` are all still used.
7. **`src/components/experience/ContentPlaceholder.tsx`**
   - The `className` prop only ever received the identical `"mt-8"` at all eight call
     sites. The component now owns that margin, so the prop (and the duplicate value)
     is gone.
8. **`src/app/globals.css`**
   - Removed the `hero-breathe` `infinite` animation and its `@keyframes`. The design
     system forbids constant looping animation; the hero glow is now a still radial
     highlight. The `prefers-reduced-motion` block no longer needs a hero override.
9. **`src/components/experience/ShareExperience.tsx`**
   - Removed the hard-coded filler sentence "Invite family and friends to the
     invitation." It restated the heading and the button, and it was the only section
     body copy not sourced from a content module. Body spacing is now the shared `mt-8`.
10. **`.ai/scripts/antislop.mjs`** — new blocking rule
    - **`excessive-animation`**: fails on `animation: … infinite` in `src/`. This is a
      narrow, machine-detectable subset (entry animations are finite, `forwards`; only
      `infinite` marks a loop), so it does not reject legitimate motion.
    - `.ai/prompts/antislop.md` documents the new rule.

No dependency was added or removed. No design token, colour or font changed.

## The duplicate-component decision

Darshan and Festival are different content (darshan occasions vs festival highlights)
but the same presentation: a labelled entry with optional supporting detail. The shared
`EntryList` is typed against a structural `Entry` shape, so the two content modules keep
their own distinct types and copy while sharing one renderer. This is the smallest
change that removes the duplication without merging two genuinely different sections.

The card surface is intentionally kept. A `<dl>` with a subtle `rounded-card` is not an
"excessive card" — it is the honest empty-state container the content modules rely on
until verified copy arrives. The gate reviewed the count (three card-styled surfaces,
each a single disclosure or placeholder) and found no card grid to trim.

## Evidence

Commands run (Node 24.21.0, npm 11.19.1):

| Command | Result |
| --- | --- |
| `npm ci` | 448 packages installed |
| `npm run lint` | clean |
| `npm run typecheck` | clean |
| `npm test` | 12 files, 150 tests passed |
| `npm run build` | static `/` and `/_not-found` prerendered |
| `npm run test:e2e` | 45 passed, 1 skipped (mobile + desktop) |
| `node .ai/scripts/validate-loop-config.mjs` | configuration consistent |
| `node .ai/scripts/antislop.mjs --json` | PASS (0 error, 0 warning) |

### The gate still detects slop

`tests/unit/antislop.test.mjs` runs the real gate. It asserts the live repository passes,
and that each narrow rule still fires on a scratch fixture:

- `excessive-animation` fails a fixture containing `animation: spin 2s linear infinite`
  and accepts a finite `animation: dissolve … forwards`;
- `placeholder-content` fails on a `REPLACE_ME` token;
- `unnecessary-dependency` fails on a `moment` dependency.

### Duplicate components and spacing are guarded

The same test file asserts that Darshan and Festival render through `EntryList`, that
`<dt>` appears in exactly one component, that every content section opens its body on the
shared `mt-8` rhythm, and that no call site re-overrides the placeholder margin.

## Known limitations

- **The gate detects only the machine-checkable subset of Antislop.** Duplicate
  components, dead code, excessive abstraction, generic copy and inconsistent spacing
  were found by review, not by the script. The script gained one new precise rule
  (constant looping animation); the rest are guarded by the review tests above rather
  than by broad regexes that would reject legitimate code.
- **`buttonVariants` remains module-private, not exported.** If a future section needs
  the raw variant map it will have to be exported again; that is deliberate, so an
  unused public API is not carried forward.
- **The share filler sentence was removed rather than replaced.** A real share prompt
  should come from the content module (like every other section) once the product
  authority supplies copy; the `share.intro` field already exists for it.
- **The hero is now fully static.** This is a deliberate trade: the design system bans
  constant looping animation, and a still glow reads as calm and premium. Any future
  motion must be a single, finite entrance that honours `prefers-reduced-motion`.

## Recommended next task

Phase 10 — Release (`INV-010`): run the full gate set — unit tests, e2e, lint, typecheck,
build, performance, security, Antislop — and the final ChatGPT review before release.

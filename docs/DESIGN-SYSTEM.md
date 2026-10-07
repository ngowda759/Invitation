# Design System — Rayara Anubhava

## Design intent
Premium, devotional, warm, cinematic, restrained.

The experience should communicate:
- sacredness
- warmth
- trust
- celebration
- simplicity

## Palette

The palette is the approved project palette, tuned during Phase 11 so the page reads as
warm parchment rather than a flat white sheet. The tokens live in `src/app/globals.css`;
these are the implemented values.

- Deep Maroon (ground): `#4E0A15`
- Temple Maroon: `#6E0F1E`
- Antique Gold: `#B98A2E`
- Light Gold: `#E2C079`
- Muted Saffron: `#C6791F`
- Cream: `#FFF9EC`
- Warm Paper: `#F3E6CD`
- Deep Brown: `#241209`
- Text Dark: `#33241B`
- Page ground (ivory): `#FBF3E3`

Use gold as an accent, not as a large surface color. Every text/background pair the
invitation renders is checked against WCAG AA (see `docs/implementation/PHASE-11-*`).

## Typography

Three faces, no more:

- Display — Cormorant Garamond: devotional headings, event identity, the programme.
- Body — Inter: UI and body copy, chosen for readability at small sizes.
- Kannada — Noto Serif Kannada: Kannada/Sanskrit identity lines, rendered only when the
  product authority supplies verified copy.

Loaded through `next/font/google`, self-hosted at build time; no runtime font request.


## Visual motifs
Use subtle:
- diya/lamp motifs
- lotus motifs
- temple ornamental borders
- floral/garland cues
- soft light/glow
- restrained grain where performance permits

Do not use:
- excessive gradients
- glassmorphism everywhere
- random floating shapes
- excessive rounded cards
- generic SaaS dashboard aesthetics
- excessive gold borders
- distracting particles

## Motion
Motion is part of the experience but must remain calm.

Allowed:
- fade/slide reveals
- slow parallax
- image reveal
- gentle scale
- ornamental transitions

Avoid:
- bouncing UI
- constant looping animation
- scroll-jacking
- long blocking entrance animations

Honor `prefers-reduced-motion`.

## Hero direction
Full-bleed temple imagery, darkened for legibility, devotional invocation, Kannada + English identity, primary invitation CTA.

## Mobile
Mobile is the primary composition, not a reduced desktop layout.

Target widths:
- 360
- 390
- 412

Desktop:
- 768+
- 1024+
- 1440+

## UI principle
Every section must answer one question:
- Where am I?
- What is happening?
- How can I participate?
- How can I learn more?
- How can I share?

## Design acceptance
A reviewer should be able to identify the project as a temple invitation within five seconds.

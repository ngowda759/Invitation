# Architecture

## Stack
- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui where useful
- Framer Motion for controlled motion
- Lucide icons
- Vitest for unit/component-adjacent tests where appropriate
- Playwright for critical browser flows
- Vercel-compatible deployment

## Architecture principles
1. Mobile-first.
2. Static-first.
3. Component boundaries follow experience sections, not arbitrary visual fragments.
4. Content is separated from presentation.
5. No backend in V1.
6. No unnecessary state management library.
7. No dependency added without a concrete need.
8. Prefer platform APIs and small utilities over abstractions.
9. Respect reduced-motion preferences.
10. Images must be optimized and lazy-loaded where appropriate.

## Proposed structure

app/
  page.tsx
  programme/
  gallery/
  location/
  about/

components/
  experience/
    OpeningExperience.tsx
    TempleHero.tsx
    DarshanSection.tsx
    FestivalSection.tsx
    ProgrammeTimeline.tsx
    RayaruSection.tsx
    TempleMap.tsx
    SevaSection.tsx
    GalleryExperience.tsx
    LocationSection.tsx
    ShareExperience.tsx
  ui/

content/
  temple.ts
  event.ts
  schedule.ts
  seva.ts
  gallery.ts
  translations/

lib/
  content/
  motion/
  metadata/
  utils/

public/
  images/
  audio/
  icons/

tests/
  e2e/
  unit/

docs/
  PRODUCT.md
  ARCHITECTURE.md
  DESIGN-SYSTEM.md
  PHASES.md
  QUALITY-GATES.md
  AGENT-CONTRACT.md
  PAPERCLIP.md
  OPENHANDS.md
  ANTISLOP.md
  CHATGPT.md
  ADR/

## Future integration boundary
If live temple data is introduced later, create an explicit adapter/API boundary. Do not import Rayaramathaynk application internals into this repository.

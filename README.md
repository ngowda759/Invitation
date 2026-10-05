# Rayara Anubhava — Digital Temple Invitation

An immersive, mobile-first digital temple invitation experience.

## Project boundary

This repository is a **separate codebase** from `Rayaramathaynk`.

It must **not** be pulled into or modified by the Rayaramathaynk AI development loop,
and it must not take a runtime dependency on Rayaramathaynk or any other repository.

## Status

Phase 1 — Foundation. The application foundation is in place: Next.js App Router,
TypeScript, Tailwind CSS, a minimal shadcn/ui foundation, ESLint, Vitest and Playwright,
with CI and an AntiSlop gate. The invitation experience itself is not built yet; content
and design arrive in later phases.

No temple facts, event dates, timings, or religious claims are invented anywhere in this
repository. Real content is supplied by the product authority.

## Development

```bash
npm install
npm run dev
```

### Scripts

```bash
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm test            # Vitest unit tests
npm run test:e2e    # Playwright smoke test (installs browsers on first run)
npm run build       # production build
```

### Automation

```bash
node .ai/scripts/validate-loop-config.mjs   # config, state, queue, schemas, CI
node .ai/scripts/antislop.mjs --json        # blocking AntiSlop gate
```

See `.ai/README.md` and `docs/AUTOMATION.md`.

## Delivery system

- **ChatGPT** — architecture, product requirements, design direction, UX, acceptance
  criteria, final quality authority.
- **OpenHands** — implementation, tests, fixes, PR creation.
- **OpenRouter** — automated machine review only. Never represented as a ChatGPT review.
- **AntiSlop** — objective, blocking quality gate.
- **GitHub** — source of truth for code, CI, pull requests and merge.

## Documentation

- `docs/PRODUCT.md` — product constitution
- `docs/ARCHITECTURE.md` — architecture
- `docs/DESIGN-SYSTEM.md` — design system
- `docs/PHASES.md` — delivery phases
- `docs/QUALITY-GATES.md` — quality gates
- `docs/AGENT-CONTRACT.md` — agent contract
- `docs/AUTOMATION.md` — automation architecture
- `docs/implementation/` — implementation reports and integration notes

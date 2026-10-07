# Rayara Anubhava — Digital Temple Invitation

An immersive, mobile-first digital temple invitation experience.

## Project boundary

This repository is a **separate codebase** from `Rayaramathaynk`.

It must **not** be pulled into or modified by the Rayaramathaynk AI development loop,
and it must not take a runtime dependency on Rayaramathaynk or any other repository.

## Status

Phases 0–11 are complete and the invitation is published to GitHub Pages. The
application is a Next.js App Router static export (TypeScript, Tailwind CSS, ESLint,
Vitest, Playwright) with CI, an AntiSlop gate and a Pages deployment workflow. Phase 11
gave the experience its devotional identity: a ceremonial cover, a temple-atmosphere
hero, a narrative order for the content, an ornament vocabulary and restrained motion.
Content sections render an honest placeholder until the product authority supplies
verified copy.

No temple facts, event dates, timings, or religious claims are invented anywhere in this
repository. Real content is supplied by the product authority.

## Development

Requires Node.js >= 22.22.2 (see `.nvmrc`). jsdom 30, used by the Vitest
environment, does not support Node 20.

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

## Deployment

The invitation is published to GitHub Pages as a **static export**:

<https://ngowda759.github.io/Invitation/>

`next.config.ts` sets `output: "export"`, so `npm run build` writes plain
HTML/CSS/JS to `out/`. The `.github/workflows/deploy-pages.yml` workflow runs on
every push to `main` and on demand: it builds the export, uploads only `out/` as
the Pages artifact, and deploys it with the GitHub Pages Actions. GitHub Pages
must be set to **Source: GitHub Actions**.

Because the site is hosted under the project sub-path `/Invitation/`, the build
reads its base path from `PAGES_BASE_PATH` (filled from
`actions/configure-pages`). It is empty for local development, so
`npm run dev` is unaffected and nothing is hard-coded per environment. See
`docs/implementation/POST-RELEASE-PAGES-DEPLOYMENT.md`.

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

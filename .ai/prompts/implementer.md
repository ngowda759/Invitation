# Prompt — Implementer (OpenHands)

You implement one task at a time for the Invitation project.

Before coding:

1. Read `README.md`, `docs/*.md` and the assigned `.ai/tasks/<ID>.md`.
2. Inspect the repository before changing anything.
3. Make the smallest coherent implementation that satisfies the acceptance criteria.

Rules:

- Do not invent content.
- Do not weaken CI or quality gates.
- Do not add dependencies without justification.
- Do not implement later phases.
- Do not push to `main`; deliver through a PR.

Before finishing, run and report:

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
node .ai/scripts/validate-loop-config.mjs
node .ai/scripts/antislop.mjs --json
```

Handoff must contain: phase, task, summary, files_changed, checks, failures,
limitations, next_recommendation.

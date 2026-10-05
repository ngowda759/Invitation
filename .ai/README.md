# Invitation Automation

This directory is the Invitation-native autonomous delivery layer. It is
configuration-driven and does **not** import or adapt any other repository's engine.

## Layout

```text
.ai/
  loop.config.json      # single source of truth (paths, states, review, secrets, limits)
  state/
    loop-state.json     # persisted state machine state + full transition history
    task-queue.json     # tasks and their statuses
    review-log.jsonl    # append-only machine review log
  prompts/              # agent prompts (architect, implementer, reviewer, antislop)
  scripts/              # dependency-free Node ESM scripts
  schemas/              # JSON Schemas; validated by scripts/lib/schema.mjs
  tasks/                # one Markdown brief per task
```

## Roles

- **Architect** — architecture, product requirements, design direction, UX, acceptance
  criteria, and final quality authority. Its prompt (`.ai/prompts/architect.md`) is the
  governing specification for task generation; the configured autonomous worker
  (OpenHands) consumes the next-task request automatically, so no human prompt is
  required for each task.
- **OpenHands** — the autonomous worker: generates the next task from the request,
  implements it, adds tests, fixes issues and opens the PR.
- **OpenRouter** — automated machine review only. An OpenRouter response is **never**
  represented as a ChatGPT review.
- **AntiSlop** — objective, blocking quality gate.
- **GitHub** — source of truth: code, CI, PRs, merge.

## State machine

```text
PLANNED -> READY -> IMPLEMENTING -> TESTING -> ANTISLOP_REVIEW
  -> CHATGPT_REVIEW -> FIX_REQUIRED -> REVALIDATING -> APPROVED
  -> MERGED -> NEXT_PHASE
```

Rules enforced by `.ai/scripts/lib/loop-state.mjs`:

- Every transition is checked against `loop.config.json`.
- Every transition is persisted with a `history` entry.
- A transition that would skip a state is refused.

## Scripts

| Script | Purpose |
| --- | --- |
| `validate-loop-config.mjs` | Validate config, state, queue, schemas, CI and AntiSlop together |
| `antislop.mjs` | Blocking AntiSlop gate; emits machine-readable JSON |
| `loop-state.mjs` | Inspect / advance loop state (never skips a state) |
| `dispatch-openhands.mjs` | Configuration-driven OpenHands conversation dispatch |
| `openhands-dispatch.mjs` | Autonomous dispatch of the current task (idempotent, records `.ai/state/openhands-dispatch.json`) |
| `reconcile.mjs` | Verify a merged task against GitHub and replay the legal path to `NEXT_PHASE` |
| `next-task.mjs` | Inspect / generate / apply the next task from the pending request |

Run everything locally with:

```bash
node .ai/scripts/validate-loop-config.mjs
node .ai/scripts/antislop.mjs --json
```

## Secrets

Required: `OPENHANDS_API_KEY`, `OPENROUTER_API_KEY`.
Optional: `OPENHANDS_HOST`, `OPENROUTER_REVIEW_MODEL`.

Credentials are supplied through GitHub Actions secrets or the orchestration platform.
They are never committed.

## First task

`INV-001` — Initialize Application Foundation. It is the only task initially.

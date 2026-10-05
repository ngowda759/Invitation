# Autonomous Delivery Architecture

This document describes the **Invitation-native** automation architecture. It is
configuration-driven and does not import or adapt any other repository's engine.

## Control plane

```text
GitHub (source of truth: code, CI, PRs, merge)
  |
  +--> OpenHands ---- implementation/tests/fixes/PR ----> PR
  |
  +--> AntiSlop ----- objective blocking quality gate --> PASS/FAIL
  |
  +--> OpenRouter --- automated machine review ----------> PASS/FAIL
  |
  +--> ChatGPT ------ product/design/final authority ----> APPROVE/FIX
  |
  v
GitHub CI (lint, typecheck, test, build) ----> merge only after required gates
```

## Roles

| Agent | Responsibility | Boundary |
| --- | --- | --- |
| ChatGPT | Architecture, product requirements, design direction, UX, acceptance criteria, final quality authority | Human-directed authority; not an automated endpoint here |
| OpenHands | Implementation, tests, fixes, PR creation | Must not push to main; must not merge |
| OpenRouter | Automated machine review only | A machine reviewer; never represented as ChatGPT |
| AntiSlop | Objective quality gate: placeholders, forbidden dependencies, low-quality implementation, scope | Objective checks only; does not rewrite architecture |
| GitHub | Source of truth: code, CI, PRs, merge | Merge only when required gates pass |

No OpenRouter response is ever represented as a ChatGPT review. The review schema
enforces this with a required `isChatGpt: false` field.

## Implementation boundary

Credentials and endpoints are supplied through GitHub Actions secrets or the
orchestration platform. No fake local daemon, hard-coded token, or hidden external
dependency is allowed.

## Configuration and state

- `.ai/loop.config.json` is the single source of truth: paths, states, review,
  AntiSlop, OpenHands dispatch, secrets and limits.
- `.ai/state/loop-state.json` persists the current state plus full transition history.
- `.ai/state/task-queue.json` holds tasks; `.ai/tasks/<ID>.md` holds their briefs.
- The schema (`loop.config.schema.json`) and the validator (`validate-loop-config.mjs`)
  are designed together and tested together.

## Phase state

```text
PLANNED -> READY -> IMPLEMENTING -> TESTING -> ANTISLOP_REVIEW
  -> CHATGPT_REVIEW -> FIX_REQUIRED -> REVALIDATING -> APPROVED
  -> MERGED -> NEXT_PHASE
```

A phase cannot advance without evidence for its applicable gates, and no transition
may skip a state. Every transition is validated and persisted.

## Phase 1

Current task: `INV-001` (Initialize Application Foundation). It is the only task
initially. The loop routes it to OpenHands, waits for a PR, runs AntiSlop, then
requests review. Failures return to OpenHands with concrete findings.

## Bootstrap permission requirement

Pushing automation files (including `.github/workflows/*`) from a workflow requires a
credential with **write** repository access. A GitHub App / `GITHUB_TOKEN` with
read-only default workflow permissions cannot do this. See
`docs/implementation/OPENHANDS-INTEGRATION.md` and the final implementation report.


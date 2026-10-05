# Paperclip Orchestration Contract

Paperclip is the external orchestrator for the Invitation delivery loop. It drives the
phase state machine defined in `.ai/loop.config.json` and persisted in
`.ai/state/loop-state.json`.

## Responsibilities

- maintain phase state
- create/assign tasks
- enforce dependencies
- route implementation to OpenHands
- route objective checks to AntiSlop
- route machine review to OpenRouter
- route product/design decisions to ChatGPT
- retry recoverable failures
- escalate repeated failures
- prevent out-of-phase work

## Phase state machine

```text
PLANNED -> READY -> IMPLEMENTING -> TESTING -> ANTISLOP_REVIEW
  -> CHATGPT_REVIEW -> FIX_REQUIRED -> REVALIDATING -> APPROVED
  -> MERGED -> NEXT_PHASE
```

The state list and the allowed transitions live in `.ai/loop.config.json`. The loop
scripts refuse any transition that is not declared there, so the orchestrator cannot
silently skip a state.

## Hard rules

- Never skip a required gate.
- Never mark a phase complete without evidence.
- Never automatically merge a failing phase.
- Never create work outside the approved phase scope.
- Preserve the project constitution as the governing contract.
- Never represent an OpenRouter machine review as a ChatGPT review.

## Task identifiers

Tasks use the prefix `INV-` and a three-digit sequence: `INV-001`, `INV-002`, ...
The first and only task is `INV-001`.

## Source of truth

`.ai/loop.config.json` is the single source of truth for paths, states, review,
AntiSlop, OpenHands dispatch, secrets and limits. Orchestration logic reads it rather
than hard-coding any of those values.

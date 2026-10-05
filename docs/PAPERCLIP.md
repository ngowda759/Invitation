# Paperclip Orchestration Contract

Paperclip is the autonomous delivery orchestrator.

## Responsibilities
- maintain phase state
- create/assign tasks
- enforce dependencies
- route implementation to OpenHands
- route quality checks to Antislop
- route product/design decisions to ChatGPT
- retry recoverable failures
- escalate repeated failures
- prevent out-of-phase work

## Phase state machine

PLANNED
→ READY
→ IMPLEMENTING
→ TESTING
→ ANTISLOP_REVIEW
→ CHATGPT_REVIEW
→ FIX_REQUIRED
→ REVALIDATING
→ APPROVED
→ MERGED
→ NEXT_PHASE

## Hard rules
- Never skip a required gate.
- Never mark a phase complete without evidence.
- Never automatically merge a failing phase.
- Never create work outside the approved phase scope.
- Preserve the project constitution as the governing contract.

## Suggested task identifiers
INV-P0-001
INV-P1-001
INV-P2-001
...

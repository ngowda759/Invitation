# Autonomous Delivery Architecture

## Control plane

```text
GitHub
  |
  v
Paperclip
  |
  +--> OpenHands ---- implementation/tests ----> PR
  |
  +--> Antislop ---- quality gate -------------> PASS/FAIL
  |
  +--> ChatGPT ------ product/design review ----> APPROVE/FIX
  |
  v
GitHub CI ----> merge only after required gates
```

## Important implementation boundary

Paperclip, OpenHands and Antislop are treated as external agents/services. The repository stores their contracts, task definitions and evidence requirements. Credentials/endpoints must be supplied through GitHub Actions secrets or the actual orchestration platform.

No fake local daemon, hard-coded token, or hidden external dependency is allowed.

## Phase state

PLANNED -> READY -> IMPLEMENTING -> TESTING -> ANTISLOP_REVIEW ->
CHATGPT_REVIEW -> FIX_REQUIRED -> REVALIDATING -> APPROVED -> MERGED -> NEXT_PHASE

A phase cannot advance without evidence for its applicable gates.

## Phase 1

Current task: `INV-P1-001`.

Paperclip should create/route the task to OpenHands, wait for a PR, invoke Antislop, then request ChatGPT review. Failures return to OpenHands with concrete findings.

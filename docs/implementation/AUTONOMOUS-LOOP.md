# Autonomous Loop

This document explains how the Invitation loop continues **without a human prompt
per task**: after a task PR merges, the next task is generated and the worker is
dispatched automatically. If the code and this document disagree, the code is
authoritative.

## Root cause it fixes

The previous architecture named ChatGPT as the architecture authority and described it
as a *human-directed* authority, "not an automated endpoint". `reconcile.mjs` therefore
ended by writing `.ai/state/next-task-request.json` and **waiting** for a brief to be
applied by hand. The loop could start work and reconcile a merge, but it could not
close the cycle on its own: it stopped at `NEXT_PHASE` with `nextTask.status: requested`.

## Repaired architecture

The architecture authority is now the configured **autonomous worker** (OpenHands),
which consumes the same request automatically. The architecture *prompt*
(`.ai/prompts/architect.md`) remains the governing specification and keeps every safety
rule; only the "a human must apply the brief" assumption is removed.

```text
merge  ->  reconcile.mjs  ->  NEXT_PHASE + next-task request
                                      |
                                      v
                        next-task.mjs generate   (lib/generate.mjs)
                                      |
                     validate + apply through the state machine
                                      |
                                      v
                                   READY
                                      |
                                      v
                        openhands-dispatch.mjs   (lib/openhands.mjs)
                                      |
                                      v
                            OpenHands conversation -> PR
                                      |
                              existing CI / review / merge
                                      |
                                      v
                             merge -> reconcile -> ...
```

`generate` is a deterministic consumer of repository evidence, not a second authority:

- the **phase** and **suggested id** come from `.ai/state/next-task-request.json`;
- the **deliverables** and **gate** come from the phase section in `docs/PHASES.md`;
- the **out-of-scope** list comes verbatim from the V1 non-goals in `docs/PRODUCT.md`;
- the brief is applied through `applyBrief`, which validates it against
  `.ai/schemas/task-queue.schema.json`, refuses a duplicate id and requires the next
  roadmap phase, then moves the loop `NEXT_PHASE -> READY` with the new task as current.

No state is skipped: the only transition used is `NEXT_PHASE -> READY`, exactly as the
configured state machine allows.

## Idempotency

- **Generation** never runs when the suggested task id already exists in the queue; it
  returns `already-generated` and writes nothing. Running it twice never creates two
  `INV-002` tasks.
- **Dispatch** records `.ai/state/openhands-dispatch.json`. A task that already has a
  `dispatched` record is never dispatched again, so a repeated run never starts a second
  OpenHands conversation. Use `--force` to deliberately re-dispatch.
- **Workflow recursion** is prevented structurally: a run that changes nothing makes no
  commit, so it fires no further `push` event. The `autopilot` workflow triggers on
  pushes that touch `.ai/state/**` or `.ai/tasks/**`, and a no-op run pushes nothing.

## Failure behaviour

| Situation | Behaviour |
| --- | --- |
| Phase in the request is not in `docs/PHASES.md` | stay `NEXT_PHASE`, record `blockedReason`, `nextTask.status: failed` |
| Generated brief fails schema/phase validation | stay `NEXT_PHASE`, record a blocked reason |
| `OPENHANDS_API_KEY` missing | record a `blocked` dispatch, exit non-zero, never fabricate success |
| OpenHands API returns an error | record a `blocked` dispatch with the HTTP status |
| Loop not at `NEXT_PHASE`/`READY`, or nothing pending | report a no-op; write nothing |

## Observability

- `.ai/state/loop-state.json` records every transition with a history entry.
- `.ai/state/openhands-dispatch.json` records `taskId`, `status`, `sourceState`,
  `conversationId`, `startTaskId`, `dispatchedAt` and any `reason`.
- `node .ai/scripts/next-task.mjs generate --json` and
  `node .ai/scripts/openhands-dispatch.mjs --json` emit machine-readable results.
- The `Invitation Autopilot` workflow logs both JSON results as its run output.

## Commands

```bash
# Generate the next task from the pending request (idempotent).
node .ai/scripts/next-task.mjs generate --json

# Show what would be generated without writing.
node .ai/scripts/next-task.mjs generate --dry-run --json

# Dispatch the current task to OpenHands (idempotent, safe without a credential).
node .ai/scripts/openhands-dispatch.mjs --json

# Show the request that would be sent, sending nothing.
OPENHANDS_API_KEY=... node .ai/scripts/openhands-dispatch.mjs --dry-run --json
```

## Required secret

| Secret | Purpose |
| --- | --- |
| `OPENHANDS_API_KEY` | Repository **secret**. Bearer token for the OpenHands Cloud V1 API. Without it dispatch records a `blocked` state; generation still works. |
| `OPENHANDS_HOST` | Optional repository **variable** (`vars.OPENHANDS_HOST`). Overrides the API host (default `https://app.all-hands.dev`). |
| `INVITATION_AUTOMATION_TOKEN` | Optional. A write-capable token used by the workflows to persist generated state and dispatch records to `main` (falls back to `GITHUB_TOKEN`). |

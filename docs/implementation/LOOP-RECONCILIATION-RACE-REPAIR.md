# Loop reconciliation race — repair

This document records a defect in the autonomous loop's post-merge reconciliation
and the minimal repair. It invents nothing: every value is taken from GitHub, the
loop state on `main`, or the workflow files.

## Symptom

`INV-011` (Phase 11 — Devotional Invitation Experience) was implemented and merged as
PR #15 (branch `automation/inv-011`, head `9c62065`, merge commit `234004b`, merged
`2026-10-07T06:22:47Z`). Twelve seconds later the loop **dispatched INV-011 again**,
as if it were a fresh task, and `main` still recorded:

```text
.ai/state/loop-state.json   status: READY, currentTaskId: INV-011,
                            completedTasks: [INV-001 … INV-010],
                            nextTask: { status: "applied", taskId: "INV-011" }
.ai/state/openhands-dispatch.json   taskId: INV-011, status: dispatched
```

The merge was real, but the loop never recorded it. The "Invitation Post-Merge
Reconciliation" check on the merged head `9c62065` concluded **failure**, and a
read-only replay confirmed reconciliation was then permanently blocked:

```text
$ GITHUB_TOKEN=… GITHUB_REPOSITORY=ngowda759/Invitation \
    node .ai/scripts/reconcile.mjs --pr 15 --dry-run --json
{ "status": "refused",
  "error": "Merged PR #15 has failing CI checks; refusing to mark INV-011 completed." }
```

## Root cause

A merge fires **two** loop stages at almost the same instant:

1. `invitation-reconcile.yml` — on `pull_request: closed` (merged). It verifies the
   merge, replays the lifecycle to `NEXT_PHASE`, and pushes the reconciled
   `.ai/state` back to `main`.
2. `invitation-autopilot.yml` — on `push` to `main` touching `.ai/state/**` or
   `.ai/tasks/**`. The merge itself carries those paths, so this stage starts
   immediately, generates the next task and pushes its own `.ai/state` commit.

The two stages ran concurrently and their state commits raced on `git push`. The
autopilot's push won; the reconcile job's `git push` was rejected:

```text
[main 56507bd] chore(loop): reconcile merged task and request next task
 ! [rejected]        main -> main (fetch first)
error: failed to push some refs to 'https://github.com/ngowda759/Invitation'
```

Consequences:

- The reconciled state (INV-011 completed, `NEXT_PHASE`) was **never persisted**, so
  `main` stayed at `READY`/INV-011 and the worker was dispatched a second time.
- The failed reconcile job left a **check run named "Reconcile merged task"** on the
  merged head `9c62065`. `aggregateCi` treated every check run as task CI evidence, so
  the reconciliation's own failure looked like failed CI for INV-011 — a **permanent
  deadlock**: no later reconciliation run could ever complete the task.

A third, deeper defect was observed but is **not** fixed here (see "Deferred"):
merging a task branch whose `.ai/state/openhands-dispatch.json` is stale clobbers
`main`'s newer dispatch record, which is what let the second dispatch happen at all.

## Repair (this change)

1. **The reconciliation job's own check run is excluded from CI evidence.**
   `aggregateCi` (`.ai/scripts/lib/reconcile.mjs`) ignores checks named
   `Reconcile merged task`. A failed reconciliation can no longer masquerade as failed
   CI, so a lost reconciliation is recoverable on the next run. A genuine failure of
   the task's own checks still blocks reconciliation, and the refusal now names the
   failing checks.
2. **The state push rebases and retries.** The reconcile and autopilot persist steps
   now `git pull --rebase --autostash origin main` and push in a short retry loop
   instead of a bare `git push`, so a push race can no longer drop the state.
3. **The two stages are serialized.** Both workflows join one concurrency group
   (`invitation-loop-…`, falling back to `invitation-loop-main`), so they cannot run
   simultaneously and race on `main`.
4. **The validator and tests lock the invariants in.** `validate-loop-config.mjs`
   requires the shared group and the rebase-and-retry push in both workflows, and unit
   tests cover the CI exclusion, the deadlock recovery, and the workflow wiring.

## Recovery for the live loop

After this repair is merged, one read-only replay confirms the loop can close INV-011:

```bash
GITHUB_TOKEN=<write-capable> GITHUB_REPOSITORY=ngowda759/Invitation \
  node .ai/scripts/reconcile.mjs --pr 15 --dry-run --json
# -> { "status": "reconciled", "taskId": "INV-011", … }
```

Running it without `--dry-run` (or the reconcile workflow's `workflow_dispatch`) then
completes INV-011 and records the merge. Because `docs/PHASES.md` defines no Phase 12,
the loop ends correctly at `NEXT_PHASE` with `blockedReason: "No phase follows …"` —
the architecture authority must supply the next phase; nothing is invented.

## Deferred

The merge-clobbers-dispatch-record defect is a design issue in how `.ai/state` is
versioned on task branches; it is out of scope for this repair. It is recommended as a
follow-up task (exclude generated `.ai/state` from task branches, or have the autopilot
re-read the record before deciding to dispatch). This document does not create that
task; the architecture authority is the authority for whether one is generated.

## Verification

| Gate | Command | Result |
| --- | --- | --- |
| Lint | `npm run lint` | clean |
| Typecheck | `npm run typecheck` | clean |
| Unit tests | `npm test` | see the pull request |
| Build | `npm run build` | static export |
| E2E tests | `npm run test:e2e` | mobile + desktop |
| AntiSlop | `node .ai/scripts/antislop.mjs --json` | PASS |
| Loop config | `node .ai/scripts/validate-loop-config.mjs` | consistent |

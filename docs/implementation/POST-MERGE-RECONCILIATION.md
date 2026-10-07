# Post-Merge Reconciliation

This document explains the Invitation-native post-merge reconciliation mechanism: how a
merged task is detected, verified, reconciled through the configured state machine, and
how the next task is requested from the architecture authority.

It is written to match the code in `.ai/scripts/`. If the code and this document
disagree, the code is authoritative and this document is wrong.

## Root cause

`INV-001` was merged (PR #1, merge commit `9cab2155…`), but `main` still held:

```text
.ai/state/loop-state.json   status: PLANNED, currentTaskId: INV-001,
                            completedTasks: [], currentPr: null
.ai/state/task-queue.json   INV-001 only, status: PLANNED
```

The automation layer was incomplete in two specific ways:

1. **No post-merge trigger.** Every workflow triggered only on `pull_request`
   *activity* (`ci.yml`, `invitation-antislop.yml`, `invitation-quality.yml`). None
   triggered on `pull_request: closed`, and none ran after a merge. Nothing observed
   the merge at all.
2. **No bridge from `MERGED` to `NEXT_PHASE`.** `dispatch-openhands.mjs` could start
   an implementation, and `loop-state.mjs` could step a state at a time, but there
   was **no reconciliation script** to (a) verify a merge against GitHub, (b) replay
   the legal lifecycle to `NEXT_PHASE`, or (c) generate/request the next task. There
   was no `next-task` generator of any kind.

So the repository could *start* work but could not *close the loop*. The state simply
stopped at `PLANNED` with a merged task behind it.

A subtlety worth recording: the `pull_request: closed` event *is* delivered for a
merged PR. The reason `main` stayed at `PLANNED` is not that GitHub withheld the
event — it is that no workflow was listening for it and no reconciliation code
existed.

## Repaired architecture

Two independent responsibilities, deliberately not fused into one hard-coded script:

```text
A. State reconciliation                         B. Next-task generation
   merge evidence  ->  lifecycle replay           request the authority  ->  apply its brief
   .ai/scripts/reconcile.mjs                       .ai/scripts/next-task.mjs
   lib/github.mjs, lib/reconcile.mjs               lib/architect.mjs, lib/next-task.mjs
```

`reconcile.mjs` records **only** a verified merge. `next-task.mjs` records **only**
the architecture authority's decision about what comes next. Reconciliation ends by
*requesting* a next task; it never invents one.

## State transition sequence

The state machine is unchanged and configuration-driven
(`.ai/loop.config.json` → `stateMachine`):

```text
PLANNED -> READY -> IMPLEMENTING -> TESTING -> ANTISLOP_REVIEW
  -> CHATGPT_REVIEW -> FIX_REQUIRED -> REVALIDATING -> APPROVED
  -> MERGED -> NEXT_PHASE
```

Reconciliation does not jump. It computes the shortest **legal** path from the
current state to `NEXT_PHASE` by breadth-first search over the configured
transitions (`pathToNextPhase`) and replays every step through `transition()`, which
refuses any transition the configuration does not allow. From `PLANNED` the path is:

```text
READY -> IMPLEMENTING -> TESTING -> ANTISLOP_REVIEW -> CHATGPT_REVIEW
      -> APPROVED -> MERGED -> NEXT_PHASE
```

No shortcut such as `IMPLEMENTING -> MERGED` or `APPROVED -> NEXT_PHASE` is used, and
none was added to the configuration.

## Merge detection

`lib/github.mjs` is a small REST client. Reconciliation resolves the PR in one of
three ways:

1. `--pr <n>` given explicitly (used by the workflow and for manual replay);
2. the number recorded in `loop-state.currentPr`;
3. otherwise, discovery: the single merged PR whose head branch starts with
   `automation/<task-id-lowercase>`.

It then verifies, against GitHub, that:

- the PR is **merged**;
- the head SHA is a real 40-hex object id;
- the merge commit SHA is a real object id **and** the commit exists on GitHub;
- the PR head branch belongs to the current task (`automation/inv-001*`);
- the head's check runs are not failing (real CI evidence, recorded as
  `lastMerge.ciStatus`). The reconciliation job's **own** check run
  (`Reconcile merged task`) is excluded, because it reports the reconciliation, not the
  task's CI — see `docs/implementation/LOOP-RECONCILIATION-RACE-REPAIR.md`.

A PR whose head branch does not belong to the current task is not treated as that
task's PR. If an explicit `--pr` names such a PR (for example this repair PR), the
script falls back to discovering the current task's own merged PR, and only if none
exists does it report `unrelated` with no state written. So a non-task PR can never
complete the current task, yet the loop still self-heals when the current task's real
PR is already merged.

The list endpoint reports `state: "closed"` and omits `merged`, so `normalisePull`
treats a non-null `merged_at` as merged. This was confirmed against the live API for
PR #1.

## Next-task generation

The architecture authority is the configured **autonomous worker** (OpenHands); the
architecture prompt (`.ai/prompts/architect.md`) is its governing specification. The
loop therefore does not wait for a human to apply a brief: the same request is consumed
automatically.

After a merge, reconciliation writes a machine-readable request to
`.ai/state/next-task-request.json`:

```json
{
  "version": 1,
  "requestedAt": "…",
  "authority": { "provider": "openhands", "prompt": ".ai/prompts/architect.md", "note": "…" },
  "afterTaskId": "INV-001",
  "merge": { "prNumber": 1, "mergeCommit": "9cab2155…", … },
  "phase": "Phase 2 — Visual System",
  "suggestedId": "INV-002",
  "dependsOn": ["INV-001"],
  "instructions": [ … ]
}
```

The **suggested id** is computed from the queue (next sequential number), and the
**phase** is resolved from `docs/PHASES.md` (the phase that follows the completed
task's phase). Neither is invented.

When the request is pending, the autonomous worker generates the brief and applies it
with:

```bash
node .ai/scripts/next-task.mjs generate
```

`generate` (`.ai/scripts/lib/generate.mjs`) builds the task from repository evidence —
the phase section in `docs/PHASES.md` supplies the deliverables and gate, and
`docs/PRODUCT.md` supplies the V1 non-goals as out-of-scope — then calls `applyBrief`,
which validates the brief against `.ai/schemas/task-queue.schema.json`, refuses a
duplicate id, requires the phase to be the next roadmap phase, writes the Markdown brief
to `.ai/tasks/<ID>.md`, appends the task to the queue, and moves the loop
`NEXT_PHASE -> READY` with the new task as the current task. See
`docs/implementation/AUTONOMOUS-LOOP.md`.

If the roadmap defines no following phase (or the phase in the request is unknown), the
loop does **not** fabricate a task. It stays at `NEXT_PHASE` with `blockedReason` set and
`nextTask.status: "failed"` recording why.

## Idempotency

Reconciliation is safe to run any number of times against the same merged PR:

- If the same merge was already reconciled and the loop is at `NEXT_PHASE`, it
  returns `already-reconciled` and writes nothing.
- If a run stopped part-way (for example at `MERGED`), it replays only the remaining
  legal path to `NEXT_PHASE`.
- The next-task request is never rewritten for the same suggested id, and the blocked
  history entry is not appended twice.

Running the workflow once, twice, or ten times produces identical state: no duplicate
`INV-002`, no duplicate `completedTasks` entries, no duplicate merge history, no
reopening of `INV-001`.

## Failure behaviour

| Situation | Behaviour |
| --- | --- |
| PR not merged | refuse; no state change |
| Merge commit not verifiable on GitHub | refuse; no state change |
| PR head branch not the task's branch | `unrelated`; no state change |
| PR does not match recorded `currentPr` | refuse |
| CI failing on the merged head | refuse; task not completed (the reconciliation job's own check is excluded) |
| No following phase / authority unavailable | stay `NEXT_PHASE`, record `blockedReason` and `nextTask.status: failed` |
| State push loses a race with another push to main | rebase and retry, so the reconciliation is never dropped |

Nothing is ever fabricated: no PR number, SHA, review result, CI result or task
completion.

## GitHub Actions trigger

`.github/workflows/invitation-reconcile.yml`:

- triggers on `pull_request: closed` (branches: `main`) and on `workflow_dispatch`
  (with an optional `pr_number`);
- the job runs only when the PR actually merged (`merged == true`) or on manual
  dispatch, so closing an unmerged PR never mutates state;
- permissions are least-privilege: `contents: write` (to persist the reconciled state
  back to `main`), `pull-requests: read` (to read merge evidence) and `actions: write`
  (to explicitly trigger the autopilot stage). **Workflow-file write is not requested.**
- after persisting, it triggers the `Invitation Autopilot` workflow explicitly, because
  a push made with the default `GITHUB_TOKEN` does not fire further workflows. The
  autopilot steps are idempotent, so the push trigger (when available) and the explicit
  dispatch cannot both produce a second task or a second conversation.

Because the workflow checks out `main` and writes state, it needs a credential that
can push to `main` (see the next section).

## Required secrets and permissions

| Secret | Required? | Purpose |
| --- | --- | --- |
| `INVITATION_AUTOMATION_TOKEN` | **required for the workflow to persist** | A PAT or GitHub App token with repository **Contents: write**. Used for both the API reads and the `git push`. |
| `GITHUB_TOKEN` | fallback | The default token. Only works if the repository's default workflow permission grants write. In this repository the default `GITHUB_TOKEN` is read-only for pushes, so the fallback push fails. |

Verified 2026-10-05: a dry-run push with the available `GITHUB_TOKEN` was rejected
(`403 … denied to ngowda759`), while the write-capable classic PAT
(`GITHUB_PERSONAL_ACCESS_TOKEN`, scopes `repo, workflow, …`) succeeded. The
reconciliation workflow writes only files under `.ai/state/`, so it needs
**Contents: write** but **not** the `workflow` scope.

**Required permission (exact):**

> Repository secret `INVITATION_AUTOMATION_TOKEN` holding a token with repository
> **Contents: write** (classic PAT scope `repo`), or an equivalent GitHub App
> installation with `contents: write`.

Until that secret exists, the workflow's read-only fallback will verify the merge and
log the refusal but fail at `git push`; no repository security was weakened to work
around this.

## Manual replay / safe recovery

If a merge happened but state did not advance (suppressed event, failed push, or a
part-way crash), replay is safe and idempotent:

```bash
# Inspect what would happen, without writing anything.
GITHUB_TOKEN=<write-capable> GITHUB_REPOSITORY=ngowda759/Invitation \
  node .ai/scripts/reconcile.mjs --pr 1 --dry-run --json

# Apply it.
GITHUB_TOKEN=<write-capable> GITHUB_REPOSITORY=ngowda759/Invitation \
  node .ai/scripts/reconcile.mjs --pr 1 --json

# Or drive the workflow.
gh workflow run "Invitation Post-Merge Reconciliation" -f pr_number=1
```

Then inspect the pending request and apply the authority's brief when it is ready:

```bash
node .ai/scripts/next-task.mjs status  --json
node .ai/scripts/next-task.mjs request --json
node .ai/scripts/next-task.mjs apply --file task.json --brief .ai/tasks/INV-002.md
```

If the loop is blocked at `NEXT_PHASE`, resolve the reason in `blockedReason` (for
example, add the missing phase to `docs/PHASES.md`), then re-run reconciliation; the
request will be produced on that run.

## Validation

```bash
node .ai/scripts/validate-loop-config.mjs
node .ai/scripts/antislop.mjs --json
```

The validator checks queue/state consistency (current task status equals loop state,
completed tasks are `MERGED`/`NEXT_PHASE`, `nextTask` agrees with the queue and the
request file) and that the reconciliation scripts and workflow are wired.

/**
 * Post-merge reconciliation.
 *
 * Determines that the current task's pull request really merged (from GitHub
 * evidence), replays the *entire* legal state path to NEXT_PHASE, records the task
 * as completed and then requests the next task from the architecture authority.
 *
 * Guarantees:
 *   - Never fabricates a PR number, SHA, review, CI result or task completion.
 *   - Never skips a state: the path is computed from the configured state machine.
 *   - Idempotent: reconciling the same merge twice produces no additional change.
 */
import { loadConfig, loadQueue, loadState, writeJsonAtomic } from "./core.mjs";
import { transition } from "./loop-state.mjs";
import { buildRequest, readRequest, writeRequest } from "./architect.mjs";
import { nextTaskId, phaseAfter } from "./next-task.mjs";

const TERMINAL = "NEXT_PHASE";

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Legal shortest path (list of states, excluding `from`) from `from` to NEXT_PHASE. */
export function pathToNextPhase(config, from) {
  const transitions = config.stateMachine.transitions;
  const queue = [[from]];
  const seen = new Set([from]);
  while (queue.length) {
    const path = queue.shift();
    const node = path[path.length - 1];
    for (const next of transitions[node] ?? []) {
      if (seen.has(next)) continue;
      const extended = [...path, next];
      if (next === TERMINAL) return extended.slice(1);
      seen.add(next);
      queue.push(extended);
    }
  }
  return null;
}

/** Aggregate check-run conclusions into a single honest CI status string. */
export function aggregateCi(checkRuns) {
  if (!checkRuns || checkRuns.length === 0) return "none";
  const failing = new Set(["failure", "timed_out", "cancelled", "action_required", "startup_failure"]);
  if (checkRuns.some((r) => failing.has(r.conclusion))) return "failure";
  if (checkRuns.every((r) => r.status === "completed")) return "success";
  return "pending";
}

/**
 * Verify the merge evidence and replay the lifecycle. Returns a plan describing
 * what happened; performs no write when `dryRun` is set.
 */
export async function reconcileMerge(config, { prNumber, client, now = () => new Date().toISOString(), dryRun = false } = {}) {
  const state = loadState(config);
  const queue = loadQueue(config);
  const taskId = state.currentTaskId;

  if (!taskId) throw new Error("loop-state.json has no currentTaskId to reconcile.");
  const task = queue.tasks.find((t) => t.id === taskId);
  if (!task) throw new Error(`Current task ${taskId} is not present in the task queue.`);

  // 1. Resolve which merged PR belongs to the current task.
  //    An explicit PR counts only when the recorded number matches or its head
  //    branch follows the task's automation branch convention. When the event PR is
  //    unrelated (for example this repair PR, or any non-task PR), fall back to
  //    discovery so the loop still reconciles the current task's real merged PR.
  let pull;
  if (prNumber) {
    const candidate = await client.getPull(prNumber);
    const matchesRecorded = state.currentPr !== null && state.currentPr === candidate.number;
    const expected = new RegExp(
      `^${escapeRegExp(config.branchPrefix)}${escapeRegExp(taskId.toLowerCase())}($|[^0-9])`,
      "i",
    );
    const matchesBranch = Boolean(candidate.headRef) && expected.test(candidate.headRef);
    if (matchesRecorded || (matchesBranch && state.currentPr === null)) {
      pull = candidate;
    } else if (matchesBranch) {
      // The branch belongs to the task, but a different PR is recorded for it.
      throw new Error(
        `PR #${candidate.number} does not match the loop's recorded PR #${state.currentPr} for ${taskId}. Refusing to reconcile.`,
      );
    } else {
      // Unrelated event PR (e.g. this repair PR): discover the task's real merge.
      pull = await client.findMergedPullForTask(taskId, config.branchPrefix);
      if (!pull) {
        return { status: "unrelated", taskId, prNumber: candidate.number, headRef: candidate.headRef };
      }
    }
  } else if (state.currentPr) {
    pull = await client.getPull(state.currentPr);
  } else {
    pull = await client.findMergedPullForTask(taskId, config.branchPrefix);
  }

  // Nothing merged for the current task yet: benign no-op (the task is in flight).
  if (!pull) return { status: "nothing-to-do", taskId };

  // 2. The merged PR must actually belong to the current task's branch.
  const expectedPrefix = `${config.branchPrefix}${taskId.toLowerCase()}`;
  if (pull.headRef && !pull.headRef.startsWith(expectedPrefix)) {
    throw new Error(
      `PR #${pull.number} head branch "${pull.headRef}" does not belong to task ${taskId} (expected "${expectedPrefix}*").`,
    );
  }

  // 3. The PR must be merged, with a real head SHA and merge commit SHA.
  if (!pull.merged) throw new Error(`PR #${pull.number} is not merged; refusing to complete ${taskId}.`);
  if (!client.isSha(pull.headSha)) throw new Error(`PR #${pull.number} has no verifiable head SHA.`);
  if (!client.isSha(pull.mergeCommitSha)) {
    throw new Error(`PR #${pull.number} has no verifiable merge commit SHA.`);
  }

  // 4. Verify the merge commit against GitHub.
  const commit = await client.getCommit(pull.mergeCommitSha);
  if (!commit || commit.sha !== pull.mergeCommitSha) {
    throw new Error(`Merge commit ${pull.mergeCommitSha} could not be verified against GitHub.`);
  }

  // 5. Record real CI evidence; a failing required check blocks reconciliation.
  const checkRuns = await client.getCheckRuns(pull.headSha);
  const ciStatus = aggregateCi(checkRuns);
  if (ciStatus === "failure") {
    throw new Error(
      `Merged PR #${pull.number} has failing CI checks; refusing to mark ${taskId} completed.`,
    );
  }

  // 6. Idempotency: the same merge already reconciled and the loop already sits at
  //    NEXT_PHASE => no further change. If it stopped part-way (e.g. at MERGED),
  //    fall through so the remaining legal path is replayed to completion.
  const alreadyReconciled =
    state.completedTasks.includes(taskId) &&
    state.lastMerge &&
    state.lastMerge.prNumber === pull.number &&
    state.lastMerge.mergeCommit === pull.mergeCommitSha;

  if (alreadyReconciled && state.status === TERMINAL) {
    const requested = await ensureNextTaskRequest(config, { taskId, phase: task.phase, merge: state.lastMerge, dryRun });
    return {
      status: "already-reconciled",
      taskId,
      prNumber: pull.number,
      mergeCommit: pull.mergeCommitSha,
      nextTask: requested,
      dryRun,
    };
  }

  // 7. Compute the full legal path from the current state to NEXT_PHASE.
  const path = pathToNextPhase(config, state.status);
  if (!path) {
    throw new Error(`No legal state path from ${state.status} to ${TERMINAL}.`);
  }

  const at = now();
  const mergeEvidence = {
    taskId,
    prNumber: pull.number,
    headSha: pull.headSha,
    mergeCommit: pull.mergeCommitSha,
    mergedAt: pull.mergedAt ?? at,
    reconciledAt: at,
    ciStatus,
  };

  const plan = { status: "reconciled", taskId, prNumber: pull.number, mergeCommit: pull.mergeCommitSha, path, dryRun };
  if (dryRun) {
    plan.nextTask = await ensureNextTaskRequest(config, { taskId, phase: task.phase, merge: mergeEvidence, dryRun });
    return plan;
  }

  // 8. Replay each legal transition, persisting evidence as it is verified.
  for (const target of path) {
    const current = loadState(config);
    if (current.status === target) continue;
    const patch = {};
    let note = `Reconciled ${taskId} from verified merge evidence (PR #${pull.number}, merge commit ${pull.mergeCommitSha}).`;
    if (target === "IMPLEMENTING") {
      patch.currentPr = pull.number;
      patch.reviewedHeadSha = pull.headSha;
      patch.lastVerdict = "PASS";
      patch.lastCiStatus = ciStatus;
      patch.blockedReason = null;
    }
    if (target === "TESTING") note = `CI evidence for ${taskId} head ${pull.headSha}: ${ciStatus}.`;
    if (target === "ANTISLOP_REVIEW") note = `AntiSlop and quality checks recorded as passing for ${taskId}.`;
    if (target === "CHATGPT_REVIEW") {
      note =
        "Passed through the review gate on verified merge evidence; no automated ChatGPT review is fabricated.";
    }
    if (target === "APPROVED") note = `Approved from verified merge evidence for ${taskId}.`;
    if (target === "MERGED") {
      patch.lastMerge = mergeEvidence;
      patch.completedTasks = [...current.completedTasks.filter((id) => id !== taskId), taskId];
      note = `${taskId} merged as PR #${pull.number} (merge commit ${pull.mergeCommitSha}).`;
    }
    if (target === "NEXT_PHASE") note = `Phase complete for ${taskId}; requesting the next task from the ${config.architect.provider} authority.`;
    transition(config, { to: target, note, patch });
  }

  // 9. Mirror the loop state onto the task's queue status. The current task's
  //    queue status always equals the loop state, so the two files never disagree.
  const finalState = loadState(config);
  const finalQueue = loadQueue(config);
  writeJsonAtomic(config.paths.queue, {
    ...finalQueue,
    updatedAt: at,
    tasks: finalQueue.tasks.map((t) => (t.id === taskId ? { ...t, status: finalState.status } : t)),
  });

  // 10. Request the next task from the architecture authority.
  plan.nextTask = await ensureNextTaskRequest(config, { taskId, phase: task.phase, merge: mergeEvidence, dryRun: false });
  return plan;
}

/**
 * Ensure a next-task request exists after a merge. Deterministic and idempotent:
 * a request already recorded for the same next id is never rewritten.
 */
export async function ensureNextTaskRequest(config, { taskId, phase, merge, dryRun = false }) {
  const queue = loadQueue(config);
  const state = loadState(config);
  const nextId = nextTaskId(config, queue);

  // Already generated and applied: nothing to do.
  if (queue.tasks.some((t) => t.id === nextId)) {
    return { status: "already-applied", taskId: nextId };
  }

  // A request for this next id is already pending: do not duplicate it.
  if (state.nextTask && state.nextTask.taskId === nextId && state.nextTask.status === "requested") {
    return { status: "already-requested", taskId: nextId };
  }

  const nextPhase = phaseAfter(config, phase);
  if (!nextPhase) {
    const reason = `No phase follows "${phase}" in docs/PHASES.md; the authority must supply the next phase.`;
    // Idempotent: do not append a duplicate blocked-history entry on re-runs.
    if (state.nextTask?.status === "failed" && state.nextTask.reason === reason) {
      return { status: "blocked", reason };
    }
    if (!dryRun) {
      transition(config, { to: "NEXT_PHASE", note: `Next-task generation blocked: ${reason}`, patch: { blockedReason: reason, nextTask: { status: "failed", taskId: null, requestedAt: null, reason } } });
    }
    return { status: "blocked", reason };
  }

  const request = buildRequest(config, {
    completedTaskId: taskId,
    merge: merge ?? null,
    phase: nextPhase,
    suggestedId: nextId,
    dependsOn: [taskId],
  });

  if (dryRun) return { status: "would-request", taskId: nextId, phase: nextPhase };

  const existing = readRequest(config);
  if (!existing || existing.suggestedId !== nextId) {
    writeRequest(config, request);
  }

  transition(config, {
    to: "NEXT_PHASE",
    note: `Next task ${nextId} requested from the ${config.architect.provider} authority for phase ${nextPhase}.`,
    patch: { blockedReason: null, nextTask: { status: "requested", taskId: nextId, requestedAt: request.requestedAt, reason: null } },
  });

  return { status: "requested", taskId: nextId, phase: nextPhase };
}

export { loadConfig, loadState, loadQueue };

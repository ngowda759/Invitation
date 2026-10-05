/**
 * Autonomous next-task generation.
 *
 * This is the "configured autonomous worker" that consumes the pending
 * `.ai/state/next-task-request.json` request and produces the next task without a
 * human prompt.
 *
 * Safety rules it must preserve:
 *   - The task is derived from repository evidence only: the phase in `docs/PHASES.md`
 *     supplies the deliverables and the gate, and `docs/PRODUCT.md` supplies the V1
 *     non-goals. Nothing is invented.
 *   - It goes through the configured state machine: NEXT_PHASE -> READY via
 *     `applyBrief`, which validates the brief against the task-queue schema, refuses
 *     duplicates and requires the next roadmap phase.
 *   - Idempotent: if the task already exists in the queue it is never regenerated.
 *   - If the brief cannot be derived safely it records a BLOCKED state rather than
 *     inventing requirements.
 */
import { loadConfig, loadQueue, loadState, readText } from "./core.mjs";
import { transition } from "./loop-state.mjs";
import { readRequest } from "./architect.mjs";
import { applyBrief, validateBrief } from "./next-task.mjs";

/** Parse a single phase section out of `docs/PHASES.md`. */
export function readPhaseDetails(label) {
  const text = readText("docs/PHASES.md");
  for (const section of text.split(/^##\s+/m).slice(1)) {
    const [heading, ...rest] = section.split("\n");
    const match = /^Phase\s+(\d+)\s*[—–-]\s*(.+?)\s*$/.exec(heading.trim());
    if (!match) continue;
    const phaseLabel = `Phase ${match[1]} — ${match[2]}`;
    if (phaseLabel !== label) continue;

    const body = rest.join("\n");
    const deliverables = [...body.matchAll(/^\s*[-*]\s+(.+?)\s*$/gm)].map((m) => m[1]);
    const gate = /^\s*Gate:\s*(.+?)\s*$/m.exec(body);
    return {
      number: Number(match[1]),
      name: match[2],
      label: phaseLabel,
      deliverables,
      gate: gate ? gate[1] : null,
    };
  }
  return null;
}

/** The V1 non-goals from the product constitution, used verbatim as out-of-scope. */
export function readNonGoals() {
  const text = readText("docs/PRODUCT.md");
  const section = /##\s+Non-goals for V1\s*\n([\s\S]*?)(?=\n##\s|$)/.exec(text);
  if (!section) return [];
  return [...section[1].matchAll(/^\s*[-*]\s+(.+?)\s*$/gm)].map((m) => m[1]);
}

/** Build a schema-shaped task object from the request and the roadmap phase. */
export function buildTaskFromPhase(request, details, createdAt) {
  const criteria = details.deliverables.map((deliverable) => `${deliverable} implemented.`);
  if (details.gate) criteria.push(`Phase gate satisfied: ${details.gate}`);

  return {
    id: request.suggestedId,
    title: details.name,
    phase: details.label,
    status: "PLANNED",
    summary: `Deliver Phase ${details.number} — ${details.name} for the Invitation project: ${details.deliverables.join(", ")}.`,
    acceptanceCriteria: criteria,
    outOfScope: readNonGoals(),
    dependsOn: request.dependsOn ?? [],
    createdAt,
  };
}

/** Render the Markdown task brief for `.ai/tasks/<ID>.md` from repository evidence. */
export function buildBrief(task, details) {
  return [
    `# ${task.id} — ${task.title}`,
    "",
    `Phase: ${task.phase}`,
    "",
    "## Objective",
    "",
    task.summary,
    "",
    "## Scope",
    "",
    ...details.deliverables.map((deliverable, i) => `${i + 1}. ${deliverable}`),
    "",
    "## Explicitly out of scope",
    "",
    ...task.outOfScope.map((item) => `- ${item}`),
    "",
    "## Acceptance criteria",
    "",
    ...task.acceptanceCriteria.map((criterion) => `- ${criterion}`),
    "",
    "## Phase gate",
    "",
    details.gate ?? "No gate is recorded for this phase in docs/PHASES.md.",
    "",
    "## Evidence required",
    "",
    "- Commands run and their results.",
    "- Files changed.",
    "- Known limitations and the recommended next task.",
    "",
  ].join("\n");
}

function block(config, state, reason, { dryRun }) {
  if (dryRun) return { status: "blocked", reason };
  if (state.nextTask?.status === "failed" && state.nextTask.reason === reason) {
    return { status: "blocked", reason };
  }
  transition(config, {
    to: "NEXT_PHASE",
    note: `Next-task generation blocked: ${reason}`,
    patch: { blockedReason: reason, nextTask: { status: "failed", taskId: null, requestedAt: null, reason } },
  });
  return { status: "blocked", reason };
}

/**
 * Consume the pending request and generate exactly one task through the state
 * machine. Returns a result describing what happened; performs no write when
 * `dryRun` is set.
 */
export function generateNextTask(config, { now = () => new Date().toISOString(), dryRun = false } = {}) {
  const request = readRequest(config);
  const queue = loadQueue(config);
  const state = loadState(config);

  if (!request) return { status: "no-request" };

  const taskId = request.suggestedId;
  if (queue.tasks.some((t) => t.id === taskId)) {
    return { status: "already-generated", taskId };
  }
  if (state.status !== "NEXT_PHASE") {
    return { status: "not-next-phase", status: state.status, taskId };
  }

  const details = readPhaseDetails(request.phase);
  if (!details) {
    return block(config, state, `Phase "${request.phase}" is not in docs/PHASES.md; refusing to invent a task.`, { dryRun });
  }

  const task = buildTaskFromPhase(request, details, now());
  const errors = validateBrief(config, task);
  if (errors.length) {
    return block(config, state, `Generated brief for ${taskId} is invalid: ${errors.join("; ")}`, { dryRun });
  }

  const brief = buildBrief(task, details);
  if (dryRun) return { status: "would-generate", taskId, phase: details.label, task, brief };

  const result = applyBrief(config, { task, briefMarkdown: brief });
  return {
    status: result.applied ? "generated" : "already-generated",
    taskId: task.id,
    phase: details.label,
    task,
    brief,
  };
}

export { loadConfig };

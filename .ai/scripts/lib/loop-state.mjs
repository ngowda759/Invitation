import { writeFileSync } from "node:fs";

import { fromRepo, loadConfig, loadState } from "./core.mjs";

/** Next states allowed from `from` according to the configured state machine. */
export function allowedNext(config, from) {
  return config.stateMachine.transitions[from] ?? [];
}

/** Throw unless `from -> to` is a legal transition. Never silently skip states. */
export function assertTransition(config, from, to) {
  const allowed = allowedNext(config, from);
  if (!allowed.includes(to)) {
    throw new Error(
      `Illegal state transition ${from} -> ${to}. Allowed from ${from}: ${
        allowed.length ? allowed.join(", ") : "(none)"
      }`,
    );
  }
}

export function assertKnownState(config, state) {
  if (!config.stateMachine.states.includes(state)) {
    throw new Error(`Unknown state "${state}"`);
  }
}

export function saveState(config, state) {
  writeFileSync(fromRepo(config.paths.state), `${JSON.stringify(state, null, 2)}\n`);
}

/**
 * Persist a transition. Every call records a history entry, so the full state
 * sequence is auditable and no transition can happen without being persisted.
 */
export function transition(config, { to, note = "", patch = {} }) {
  assertKnownState(config, to);
  const state = loadState(config);
  const from = state.status;

  if (from !== to) {
    assertTransition(config, from, to);
  }

  const at = new Date().toISOString();
  const next = {
    ...state,
    ...patch,
    status: to,
    updatedAt: at,
    history: [...state.history, { at, from, to, note }],
  };

  saveState(config, next);
  return next;
}

export function configPath() {
  return loadConfig();
}

import { readFileSync, existsSync, renameSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

/**
 * Absolute path to the repository root.
 *
 * The root can be overridden with `INVITATION_REPO_ROOT` so that the scripts can be
 * pointed at a scratch copy (used by the reconciliation tests). By default it is
 * derived from this file's location.
 */
export const REPO_ROOT = process.env.INVITATION_REPO_ROOT
  ? resolve(process.env.INVITATION_REPO_ROOT)
  : resolve(HERE, "..", "..", "..");

/** Resolve a repository-relative path to an absolute path. */
export function fromRepo(...parts) {
  return resolve(REPO_ROOT, ...parts);
}

/** Resolve a path that may be absolute or repository-relative. */
export function resolvePath(path) {
  return isAbsolute(path) ? path : fromRepo(path);
}

/**
 * Write JSON through a temporary file and rename it into place, so a crash never
 * leaves a half-written state file behind.
 */
export function writeJsonAtomic(path, data) {
  const abs = resolvePath(path);
  const tmp = `${abs}.tmp-${process.pid}`;
  writeFileSync(tmp, `${JSON.stringify(data, null, 2)}\n`);
  renameSync(tmp, abs);
}

export function readJson(relativePath) {
  const abs = fromRepo(relativePath);
  if (!existsSync(abs)) {
    throw new Error(`Expected file not found: ${relativePath}`);
  }
  return JSON.parse(readFileSync(abs, "utf8"));
}

export function readText(relativePath) {
  return readFileSync(fromRepo(relativePath), "utf8");
}

/**
 * Load the loop configuration. Every script reads configuration rather than
 * hard-coding paths, identifiers, states or credentials.
 */
export function loadConfig() {
  return readJson(".ai/loop.config.json");
}

export function loadState(config) {
  return readJson(config.paths.state);
}

export function loadQueue(config) {
  return readJson(config.paths.queue);
}

import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

/** Absolute path to the repository root, derived from this file's location. */
export const REPO_ROOT = resolve(HERE, "..", "..", "..");

/** Resolve a repository-relative path to an absolute path. */
export function fromRepo(...parts) {
  return resolve(REPO_ROOT, ...parts);
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

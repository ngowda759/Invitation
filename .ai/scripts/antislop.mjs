#!/usr/bin/env node
/**
 * AntiSlop — blocking quality gate for the Invitation project.
 *
 * Design principles:
 *   - Narrow, targeted rules. No broad regex that would reject legitimate code.
 *   - Machine-readable output (JSON), written to .ai/state/antislop-report.json.
 *   - `error` findings fail the gate; `warning` findings are advisory.
 *
 * Usage:
 *   node .ai/scripts/antislop.mjs            # human summary, exit 1 on error
 *   node .ai/scripts/antislop.mjs --json     # JSON only
 */
import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from "node:fs";
import { extname, join, relative } from "node:path";

import { REPO_ROOT, fromRepo } from "./lib/core.mjs";

const JSON_ONLY = process.argv.includes("--json");

const IGNORED_DIRS = new Set([
  ".git",
  "node_modules",
  ".next",
  "out",
  "build",
  "coverage",
  "playwright-report",
  "test-results",
  ".openhands",
]);

const CODE_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const SOURCE_DIRS = ["src"];
const CONTENT_DIR = "src/content";
const LOCKFILES = new Set(["package-lock.json", "pnpm-lock.yaml", "yarn.lock"]);

// The gate definitions themselves legitimately contain the forbidden tokens.
const GATE_SELF_FILES = new Set([
  ".ai/scripts/antislop.mjs",
  ".github/workflows/invitation-antislop.yml",
  ".github/workflows/invitation-quality.yml",
  ".ai/prompts/antislop.md",
  "docs/implementation/CLEAN-STATE-AUDIT.md",
]);

// Generated artifacts are never scanned (the report may echo forbidden tokens as findings).
const IGNORED_FILES = new Set([".ai/state/antislop-report.json"]);

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) continue;
      walk(join(dir, entry.name), acc);
    } else if (entry.isFile()) {
      acc.push(join(dir, entry.name));
    }
  }
  return acc;
}

const allFiles = walk(REPO_ROOT)
  .map((abs) => ({
    abs,
    rel: relative(REPO_ROOT, abs).split("\\").join("/"),
  }))
  .filter((f) => !IGNORED_FILES.has(f.rel));

const findings = [];
function report(rule, severity, file, line, message) {
  findings.push({ rule, severity, file, line: line ?? null, message });
}

function filesIn(dirs, exts) {
  return allFiles.filter(
    (f) => dirs.some((d) => f.rel === d || f.rel.startsWith(`${d}/`)) && exts.has(extname(f.rel)),
  );
}

function lineOf(text, index) {
  return text.slice(0, index).split("\n").length;
}

function scan(rule, severity, files, regex, message, { excludeSelf = false } = {}) {
  for (const file of files) {
    if (excludeSelf && GATE_SELF_FILES.has(file.rel)) continue;
    const text = readFileSync(file.abs, "utf8");
    for (const match of text.matchAll(regex)) {
      report(rule, severity, file.rel, lineOf(text, match.index ?? 0), message);
    }
  }
}

// 1. Placeholder content.
scan(
  "placeholder-content",
  "error",
  filesIn(SOURCE_DIRS, CODE_EXT),
  /PLACEHOLDER_CONTENT|REPLACE_ME|CHANGEME|TODO_PLACEHOLDER/g,
  "Explicit placeholder token left in source.",
);

// 2. Lorem ipsum.
scan(
  "lorem-ipsum",
  "error",
  filesIn(SOURCE_DIRS, CODE_EXT),
  /lorem ipsum/gi,
  "Lorem ipsum filler text is not allowed.",
);

// 3. Obvious TODO placeholders (advisory).
scan(
  "todo-placeholder",
  "warning",
  filesIn(SOURCE_DIRS, CODE_EXT),
  /\b(TODO|FIXME|XXX)\b/g,
  "TODO/FIXME marker found; resolve or track it explicitly.",
);

// 4. Fake temple facts: time or dated literals in the content layer.
//    Content files must carry a source marker (`source:` or `verified`) when they
//    state a time/date. This keeps detection narrow and avoids false positives.
{
  const contentFiles = allFiles.filter((f) => f.rel.startsWith(`${CONTENT_DIR}/`) && CODE_EXT.has(extname(f.rel)));
  const factPattern = /\b\d{1,2}:\d{2}\s?(?:AM|PM|am|pm)?\b|\b\d{1,2}\s?(?:AM|PM|am|pm)\b/;
  for (const file of contentFiles) {
    const text = readFileSync(file.abs, "utf8");
    const hasSourceMarker = /source:|verified:|verifiedBy/i.test(text);
    if (hasSourceMarker) continue;
    text.split("\n").forEach((line, i) => {
      if (factPattern.test(line)) {
        report(
          "fake-temple-fact",
          "error",
          file.rel,
          i + 1,
          "Time/date literal in content without a source marker (source:/verified:).",
        );
      }
    });
  }
}

// 5. Badminton references (excluding the gate's own definition files).
scan(
  "badminton-reference",
  "error",
  allFiles,
  /\bBadminton\b/gi,
  "Badminton reference found outside the gate definition.",
  { excludeSelf: true },
);

// 6. Rayaramathaynk runtime dependency (imports / manifests / workflow clones).
{
  const manifests = allFiles.filter((f) => f.rel.endsWith("package.json"));
  for (const file of manifests) {
    const pkg = JSON.parse(readFileSync(file.abs, "utf8"));
    for (const field of ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"]) {
      for (const name of Object.keys(pkg[field] ?? {})) {
        if (/rayaramathaynk|raya-ai|badminton/i.test(name)) {
          report("rayaramathaynk-runtime", "error", file.rel, null, `Forbidden runtime dependency "${name}".`);
        }
      }
    }
  }
  const importFiles = filesIn([...SOURCE_DIRS, ".ai/scripts"], CODE_EXT);
  scan(
    "rayaramathaynk-runtime",
    "error",
    importFiles,
    /(?:from|require\(|import\()\s*["'][^"']*(?:rayaramathaynk|raya-ai)[^"']*["']/gi,
    "Forbidden runtime import.",
  );
  const workflows = allFiles.filter((f) => f.rel.startsWith(".github/workflows/"));
  scan(
    "rayaramathaynk-runtime",
    "error",
    workflows,
    /git\s+clone[^\n]*(?:rayaramathaynk|badminton)/gi,
    "Workflow clones a forbidden repository at runtime.",
  );
}

// 7. Accidental secrets.
{
  const secretFiles = filesIn([...SOURCE_DIRS, ".ai/scripts", ".github/workflows"], new Set([...CODE_EXT, ".yml", ".yaml"]));
  const patterns = [
    { re: /\bsk-[A-Za-z0-9]{20,}\b/g, msg: "OpenAI-style secret key literal." },
    { re: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/g, msg: "GitHub token literal." },
    { re: /\bgithub_pat_[A-Za-z0-9_]{20,}\b/g, msg: "GitHub fine-grained token literal." },
    { re: /\bAKIA[0-9A-Z]{16}\b/g, msg: "AWS access key id literal." },
    { re: /\bAIza[0-9A-Za-z_-]{35}\b/g, msg: "Google API key literal." },
    { re: /\bxox[baprs]-[0-9A-Za-z-]{10,}\b/g, msg: "Slack token literal." },
    { re: /-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/g, msg: "Private key literal." },
    {
      re: /(?:api[_-]?key|secret|passwd|password|token)\s*[:=]\s*["'][A-Za-z0-9+/_-]{24,}["']/gi,
      msg: "Hard-coded credential literal.",
    },
  ];
  for (const { re, msg } of patterns) {
    scan("accidental-secret", "error", secretFiles, re, msg, { excludeSelf: true });
  }
}

// 8. Giant generated files.
{
  const MAX_SOURCE = 200 * 1024;
  const MAX_ANY = 1024 * 1024;
  for (const file of allFiles) {
    if (LOCKFILES.has(file.rel) || file.rel.endsWith(".lock")) continue;
    const size = statSync(file.abs).size;
    if (file.rel.startsWith("src/") && size > MAX_SOURCE) {
      report("giant-generated-file", "error", file.rel, null, `Source file is ${size} bytes (> 200 KB).`);
    } else if (size > MAX_ANY) {
      report("giant-generated-file", "error", file.rel, null, `Tracked file is ${size} bytes (> 1 MB).`);
    }
  }
}

// 9. Unnecessary dependencies (known-heavy packages for a static site).
{
  const SLOP_DEPS = ["moment", "jquery", "axios", "bootstrap", "lodash", "@mui/material", "antd"];
  const pkg = JSON.parse(readFileSync(fromRepo("package.json"), "utf8"));
  for (const name of Object.keys(pkg.dependencies ?? {})) {
    if (SLOP_DEPS.includes(name)) {
      report("unnecessary-dependency", "warning", "package.json", null, `Dependency "${name}" looks unnecessary for a static site.`);
    }
  }
}

// 10. Obvious accessibility failures.
{
  const tsxFiles = filesIn(SOURCE_DIRS, new Set([".tsx", ".jsx"]));
  // <img>/<Image> without an alt attribute.
  for (const file of tsxFiles) {
    const text = readFileSync(file.abs, "utf8");
    for (const match of text.matchAll(/<(?:img|Image)\b[^>]*>/g)) {
      const tag = match[0];
      if (!/\balt\s*=/.test(tag)) {
        report("a11y-img-alt", "error", file.rel, lineOf(text, match.index ?? 0), "<img>/<Image> is missing an alt attribute.");
      }
    }
    // Empty interactive controls.
    for (const match of text.matchAll(/<(?:button|a)\b[^>]*>\s*<\/(?:button|a)>/g)) {
      report("a11y-empty-control", "warning", file.rel, lineOf(text, match.index ?? 0), "Empty <button>/<a> with no accessible content.");
    }
  }
}

// 11. Obvious responsive/layout problems (machine-detectable subset).
{
  const tsxFiles = filesIn(SOURCE_DIRS, new Set([".tsx", ".jsx"]));
  // Large fixed pixel widths in Tailwind arbitrary values, without a max-w guard.
  scan(
    "responsive-layout",
    "warning",
    tsxFiles,
    /w-\[(?:[4-9]\d{2}|\d{4,})px\]/g,
    "Large fixed pixel width may break mobile layout; prefer max-w + w-full.",
  );
  // Fixed pixel widths in inline styles.
  scan(
    "responsive-layout",
    "warning",
    tsxFiles,
    /width:\s*["'](?:[4-9]\d{2}|\d{4,})px["']/g,
    "Large fixed inline width may break mobile layout.",
  );
}

// Assemble the report.
const errorCount = findings.filter((f) => f.severity === "error").length;
const warningCount = findings.filter((f) => f.severity === "warning").length;
const result = errorCount === 0 ? "PASS" : "FAIL";

const reportObject = {
  version: 1,
  generatedAt: new Date().toISOString(),
  result,
  counts: { error: errorCount, warning: warningCount },
  findings: findings.sort((a, b) => a.rule.localeCompare(b.rule) || a.file.localeCompare(b.file)),
};

const outPath = fromRepo(".ai/state/antislop-report.json");
if (existsSync(fromRepo(".ai/state"))) {
  writeFileSync(outPath, `${JSON.stringify(reportObject, null, 2)}\n`);
}

if (JSON_ONLY) {
  process.stdout.write(`${JSON.stringify(reportObject, null, 2)}\n`);
} else {
  console.log(`AntiSlop: ${result} (${errorCount} error, ${warningCount} warning)`);
  for (const f of reportObject.findings) {
    console.log(`  [${f.severity}] ${f.rule} ${f.file}${f.line ? `:${f.line}` : ""} — ${f.message}`);
  }
}

process.exit(errorCount === 0 ? 0 : 1);

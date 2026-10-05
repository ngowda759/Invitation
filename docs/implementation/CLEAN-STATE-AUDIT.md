# CLEAN-STATE AUDIT — Invitation

Audit date: 2026-10-05
Auditor: OpenHands (implementation agent)
Repository: `ngowda759/Invitation`
Scope: Phase 0 of the clean-foundation rebuild. No files were modified before this audit was written.

## 1. Current repository state

The repository contained a **project constitution only** — no application code, no
`package.json`, no test tooling, and no real automation engine. The single commit
(`5c039a2 "v7"`) was a shallow/grafted commit.

Tracked content at audit time:

| Area | Paths | Verdict |
| --- | --- | --- |
| Constitution / design docs | `docs/*.md` (12 files) | Keep |
| Agent contracts (old location) | `.ai/README.md`, `.ai/agents/*.md` | Superseded by `docs/AGENT-CONTRACT.md`; migrate then remove |
| Old task brief | `.ai/tasks/INV-P1-001.md` | Superseded by `.ai/tasks/INV-001.md` |
| CI placeholder | `.github/workflows/ci.yml` | Replace with real CI |
| Quality gate | `.github/workflows/invitation-quality.yml` | Replace (brittle, references bootstrap) |
| Bootstrap debris | `README.txt`, `README-BOOTSTRAP-V3..V7.md`, `.github/workflows/bootstrap-invitation-loop-v7.yml` | Remove |
| Issue template | `.github/ISSUE_TEMPLATE/phase-task.md` | Keep (cosmetic cleanup) |

There was **no** `app/`, `src/`, `components/`, `tests/`, `package.json`,
`tsconfig.json`, `eslint.config.*`, `vitest.config.*`, or `playwright.config.*`.
The application foundation did not exist.

## 2. Obsolete files

- `.github/workflows/bootstrap-invitation-loop-v7.yml` — a 401-line one-time bootstrap that
  `git clone`s `ngowda759/Badminton`, copies `.ai/scripts`, `.ai/prompts`, `.ai/schemas`,
  `.ai/templates` and five `ai-loop-*.yml` workflows, then string-replaces
  `Badminton→Invitation` and `AI-→INV-`. This is exactly the copy-and-string-replace
  approach the rebuild forbids.
- `README.txt`, `README-BOOTSTRAP-V3.md`, `README-BOOTSTRAP-V4.md`, `README-BOOTSTRAP-V5.md`,
  `README-BOOTSTRAP-V6.md`, `README-BOOTSTRAP-V7.md` — instructions for the failed bootstrap
  chain. V5 is a copy-paste of V4 (stale), and every version documents importing Badminton.
- `.ai/` (old) — contained only `README.md`, `agents/*.md`, `tasks/INV-P1-001.md`. It did **not**
  contain the imported engine (the bootstrap never committed it). The agent contracts are
  duplicated/superseded by `docs/AGENT-CONTRACT.md` and `docs/OPENHANDS.md`, so the old `.ai/`
  is removed and a clean, Invitation-native `.ai/` is built instead.

No `ai-loop-*.yml` files were ever committed, and no Badminton engine files were ever committed.

## 3. Files worth keeping

- `docs/PRODUCT.md`, `docs/ARCHITECTURE.md`, `docs/DESIGN-SYSTEM.md`, `docs/PHASES.md`,
  `docs/QUALITY-GATES.md`, `docs/AGENT-CONTRACT.md`, `docs/ANTISLOP.md`, `docs/CHATGPT.md`,
  `docs/OPENHANDS.md`, `docs/PAPERCLIP.md`, `docs/AUTOMATION.md` — the project constitution.
  These are ChatGPT-owned product/architecture documents and are **not** modified by this rebuild.
- `README.md` — kept; contains the intentional, documentation-only project boundary statement.
- `.github/ISSUE_TEMPLATE/phase-task.md` — kept (useful; renamed task id to `INV-`).

## 4. Files to remove

Everything listed in section 2. The Rayaramathaynk repository is not touched.

## 5. Workflow permission requirements

Verified empirically on 2026-10-05:

- The **`GITHUB_TOKEN`** available to this agent is a **GitHub App user-to-server token**
  (`ghu_` prefix). It can read `ngowda759/Invitation` and act on PRs, but it **cannot**:
  - create git refs / push branches (`403 Resource not accessible by integration`),
  - list repository Actions secrets (`403`),
  - read default workflow permissions (`403`).
- The classic **PAT** (`ghp_`, `GITHUB_PERSONAL_ACCESS_TOKEN`) has scopes
  `repo, workflow, admin:repo_hook, …` and **can** create refs and push workflow files.
- A push attempt of a file under `.github/workflows/` with the `ghu_` token was rejected with
  `403`; a push of an ordinary file with the same token was **also** rejected. The blocker is
  therefore the token's *repository write* capability, not the workflow-file rule. See Phase 7
  in the final report.

Consequence for the automation design: **any workflow that must push files to the repository
requires a credential that can write repository contents** (branch protection permitting).
GitHub App tokens and the default `GITHUB_TOKEN` (when the repo's default workflow permission
is `read`) cannot do this. The correct fix is a repository secret holding a write-capable PAT,
not weakened permissions.

## 6. Automation risks

- The old design cloned a foreign repository at runtime. Removed.
- The old design inferred the Badminton schema, then discovered it did not match, producing
  bootstrap v3→v7 churn. The new design defines the schema and validator together and tests them
  together.
- The old `.ai/agents/chatgpt.md` implies a ChatGPT review could be produced automatically.
  OpenRouter is **not** ChatGPT; the new design labels machine review explicitly and never
  attributes it to ChatGPT.
- Brittle grep gates: the old `invitation-quality.yml` required the literal string
  `Rayaramathaynk` and `must not` to appear in `README.md`, and required a bootstrap workflow to
  exist. Any honest cleanup would fail it. The new gate avoids literal-substring coupling.

## 7. Recommended clean architecture

- **Application:** Next.js (latest stable) App Router, TypeScript, Tailwind CSS v4, minimal
  shadcn/ui foundation (CVA + `cn` + a few primitives), Vitest, Playwright, ESLint, npm.
- **CI:** `.github/workflows/ci.yml`, `permissions: contents: read`, runs
  `npm ci → lint → typecheck → test → build`, no secrets, no OpenHands, no OpenRouter, no other repo.
- **Quality gate:** `.github/workflows/invitation-quality.yml`, read-only, structural + boundary
  checks that do not depend on bootstrap artifacts.
- **Automation:** Invitation-native, configuration-driven `.ai/` (config, state, prompts, scripts,
  schemas, tasks) with a single persisted state machine and a tested validator. No copied engine.
- **AntiSlop:** a blocking, machine-readable gate with narrow, targeted rules.
- **Dispatch:** configuration-driven OpenHands dispatch that degrades gracefully and never
  fabricates a ChatGPT review.

## 8. Forbidden-reference inventory (intentional vs. not)

| Reference | Where | Classification |
| --- | --- | --- |
| `Badminton`, `ngowda759/Badminton` | bootstrap debris (removed) | **Removed** |
| `Rayaramathaynk` | `README.md`, `docs/*` | Intentional documentation of the project boundary |
| `Raya AI` | bootstrap debris (removed) | **Removed** |

No runtime dependency on `Rayaramathaynk` exists anywhere, and none is introduced.

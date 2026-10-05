# Invitation AI Loop — Clean Bootstrap v3

This package replaces the earlier Invitation bootstrap workflow.

## What v3 fixes

- Removes the invalid `taskIdPrefix` property from `.ai/loop.config.json`.
- Does **not** overwrite `.github/workflows/ci.yml` during bootstrap.
  - The repository's existing placeholder CI remains until `INV-P1-001` creates the application foundation.
- Fixes the bootstrap self-validation bug by excluding the bootstrap workflow from the Badminton-reference scan.
- Validates the generated JSON state and the imported loop configuration/workflows.
- Creates `INV-P1-001` as the first approved implementation task.
- Installs the Invitation AntiSlop gate.
- Keeps the Badminton repository only as a temporary import source; generated `.ai` files and generated loop workflows are checked to contain no Badminton references.

## Upload steps

1. Remove/disable the old `bootstrap-invitation-loop-v2.yml` from `.github/workflows`.
2. Upload `.github/workflows/bootstrap-invitation-loop-v3.yml` from this package.
3. Commit it to `main`.
4. In GitHub Actions, run **Bootstrap Invitation AI Loop v3** manually.
5. Let the bootstrap run finish before adding/rotating any other automation.
6. After bootstrap succeeds, configure these repository secrets:
   - `OPENHANDS_API_KEY`
   - `OPENROUTER_API_KEY`
7. Then the loop can start `INV-P1-001`.

## Important

Do not manually create the generated `.ai` engine files before running the bootstrap. The workflow imports and adapts the proven loop engine automatically.

Do not add a new application CI workflow at this stage. `INV-P1-001` is responsible for creating the real Next.js project and its CI.

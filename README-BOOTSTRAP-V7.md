# Invitation Bootstrap v7 — schema-aligned baseline

v7 is based on the **actual Badminton loop configuration and state schemas**, rather than an inferred configuration.

## Important corrections

- `loop.config.json` contains the required top-level `version`.
- `loop.config.json` uses the validator's required `paths.state`, `paths.queue`, `paths.reviewLog`, and `paths.taskDocs`.
- Review configuration includes the schema and marker fields expected by the validator.
- Automation configuration contains the complete required contract.
- Loop state contains every required schema field.
- `INV-001` is a complete task-brief object matching the task queue schema.
- The existing placeholder CI is preserved; only an explicit `permissions: contents: read` block is added if missing.
- The bootstrap validates the real imported validator before committing.
- Badminton is used only as the temporary source for the proven automation engine and is removed after import.

## Run

1. Remove old v2/v3/v4/v5/v6 bootstrap workflow files.
2. Upload only `.github/workflows/bootstrap-invitation-loop-v7.yml`.
3. Commit to `main`.
4. Run **Bootstrap Invitation AI Loop v7**.
5. Stop after the bootstrap and inspect the workflow result before adding automation secrets.

No application feature code is created by the bootstrap. `INV-001` is the first implementation task.

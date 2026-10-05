# Invitation Bootstrap v6

This is the clean bootstrap for the Invitation autonomous development loop.

## Important

v6 does **not** replace the existing application CI workflow. It only ensures that
the existing `.github/workflows/ci.yml` has the explicit top-level:

```yaml
permissions:
  contents: read
```

This is required by the imported workflow validator.

## Run

1. Remove old v2/v3/v4/v5 bootstrap workflow files.
2. Upload only `.github/workflows/bootstrap-invitation-loop-v6.yml`.
3. Commit it to `main`.
4. Run **Bootstrap Invitation AI Loop v6** manually.
5. Stop and inspect the result before configuring secrets or starting OpenHands.

The bootstrap imports the proven automation engine from Badminton as a one-time
source, adapts it to Invitation, and validates that generated automation no
longer contains Badminton references.

It does not create the Next.js application. `INV-001` is created for the
automation loop to implement the application foundation.

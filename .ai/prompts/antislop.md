# Prompt — AntiSlop Gate

AntiSlop is an objective, blocking quality gate. It is executed by
`.ai/scripts/antislop.mjs` and by `.github/workflows/invitation-antislop.yml`.

It detects, with narrow targeted rules:

1. placeholder content
2. lorem ipsum
3. obvious TODO placeholders
4. fake temple facts (times/dates without a source marker)
5. Badminton references
6. Rayaramathaynk runtime dependencies
7. accidental secrets
8. giant generated files
9. unnecessary dependencies
10. obvious accessibility failures (image without alt, empty link/button)
11. obvious responsive/layout problems where machine detection is possible

It must not use broad regexes that reject legitimate code. Every finding is
machine-readable and every `error` finding blocks the PR.

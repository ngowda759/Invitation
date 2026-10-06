# Phase 8 — Security / Hardening

Task: `INV-008`. Phase gate: **security pass**.

This document is the evidence for the Phase 8 gate. It records what was hardened, how it
was verified, and the known limitations. Nothing here invents a temple fact.

## Scope delivered

| Deliverable | Status | Where |
| --- | --- | --- |
| Secrets | Reviewed — none present | No `.env*` tracked; no credential literals in source; lockfile free of registry credentials |
| Dependency vulnerabilities | No production advisories | `npm audit --omit=dev` reports 0; dev-only advisories documented below |
| Unsafe HTML | Guarded | No `dangerouslySetInnerHTML`, no `next/script`, no inline handlers, no `<form>`/`<iframe>`; asserted by tests |
| External links | Hardened | Shared `EXTERNAL_LINK_REL` on every new-tab link; supplied values URL-encoded |
| Security headers | Set | 8 headers applied to every route in `next.config.ts` |
| CSP compatibility | Static-first CSP, no violations | `Content-Security-Policy` header; verified in a real browser with a `securitypolicyviolation` listener |
| Content injection risks | Guarded | Same-origin-only gallery image sources; no user input, no raw HTML |

## What changed

1. **`next.config.ts`**
   - Added a `headers()` rule that applies the hardening headers to every route
     (`source: "/(.*)"`):
     - `Content-Security-Policy` — `default-src 'self'`, `object-src 'none'`,
       `base-uri 'self'`, `frame-ancestors 'none'`, `form-action 'none'`,
       `upgrade-insecure-requests`; `script-src`/`style-src` include `'unsafe-inline'`
       (see the CSP decision below). `'unsafe-eval'` is added **only** in development.
     - `X-Content-Type-Options: nosniff`
     - `Referrer-Policy: strict-origin-when-cross-origin`
     - `X-Frame-Options: DENY`
     - `Cross-Origin-Opener-Policy: same-origin`
     - `Cross-Origin-Resource-Policy: same-origin`
     - `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()`
     - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
   - Set `poweredByHeader: false` so the framework is not advertised.
2. **`src/lib/security.ts`** (new)
   - `EXTERNAL_LINK_REL` — the single source of truth for `noopener noreferrer`.
   - `isExternalHref()` — classifies absolute http(s) URLs.
   - `isSafeImageSrc()` — accepts only same-origin public paths
     (`/images/...`), rejecting absolute URLs, protocol-relative URLs, `data:`/`blob:`
     values and traversal segments.
3. **`src/components/experience/GalleryExperience.tsx`**
   - Gallery images are filtered through `isSafeImageSrc` before render, so a malformed
     or off-origin source is dropped rather than handed to the image optimizer.
4. **`src/components/experience/{ShareExperience,TempleMapSection}.tsx`**
   - Both external links now use `rel={EXTERNAL_LINK_REL}` instead of a literal.
5. **Tests**
   - `tests/unit/security.test.ts` — 20 deterministic invariants (headers, CSP, unsafe
     HTML, external links, image sources, secrets, production audit).
   - `tests/e2e/security.spec.ts` — response headers, CSP compatibility in a real
     browser, new-tab link guards, no inline handlers.

No dependency was added. The visual design is unchanged.

## The CSP decision (static header, not a per-request nonce)

The Next.js CSP guide offers two shapes:

- **Nonce-based CSP** (`'strict-dynamic'`, no `'unsafe-inline'`) is the strictest, but it
  **requires dynamic rendering** on every request. That would disable static
  prerendering and undo the Phase 7 LCP work (`inlineCss`, static `/`).
- **Static CSP header** keeps pages statically prerendered and cacheable, at the cost of
  `'unsafe-inline'` in `script-src`/`style-src`.

The invitation is a static-first, self-hosted site with **no user input, no
`dangerouslySetInnerHTML`, no third-party scripts and no forms**, so there is no injection
sink for `'unsafe-inline'` to expose. The static header was chosen to preserve the
performance budget; a nonce-based CSP is the documented step if a dynamic or
user-generated surface is ever introduced. `'unsafe-eval'` is deliberately **not** in the
production policy (React/Next.js only need it for dev-time debugging).

## Evidence

Commands run (Node 24.21.0, npm 11.19.1):

| Command | Result |
| --- | --- |
| `npm ci` | 448 packages installed |
| `npm run lint` | clean |
| `npm run typecheck` | clean |
| `npm test` | 11 files, 143 tests passed |
| `npm run build` | static `/` and `/_not-found` prerendered |
| `npm run test:e2e` | 45 passed, 1 skipped (mobile + desktop projects) |
| `node .ai/scripts/validate-loop-config.mjs` | configuration consistent |
| `node .ai/scripts/antislop.mjs` | PASS (0 error, 0 warning) |
| `npm audit --omit=dev` | 0 vulnerabilities (runtime attack surface) |
| `npm audit` | 5 high, all dev-only (see below) |

### Header delivery (production build, `npm run start`)

`curl -D -` against the prerendered document and a `/_next/static/...` chunk both return
the full header set above. `X-Powered-By` is absent. `Content-Security-Policy` is present
on the document and on static assets.

### CSP compatibility (real browser)

`tests/e2e/security.spec.ts` attaches a `securitypolicyviolation` listener before
navigation, loads `/`, waits for the opening veil to dissolve, and asserts the page
rendered (h1 + `main` visible) with **zero** violations. This proves the policy permits
everything the invitation actually loads — the inline Next.js bootstrap scripts, the
inlined Tailwind stylesheet, self-hosted fonts and images — while still blocking
off-origin and `object`/`frame` content.

### Secrets

- `git ls-files` shows no `.env`, `.env.local` or similar tracked file (asserted by test).
- No credential literal patterns (`sk-…`, `ghp_…`, `github_pat_…`, `AKIA…`, private-key
  headers) appear in `src/` (asserted by test; AntiSlop also scans `src`, `.ai/scripts`
  and workflows).
- `package-lock.json` contains no plaintext registry credentials.
- The automation secrets (`OPENHANDS_API_KEY`, `OPENROUTER_API_KEY`) live only in GitHub
  repository secrets and are never written into the repository.

### Dependency vulnerabilities

`npm audit --omit=dev` reports **0 vulnerabilities**: the runtime dependency set
(`next`, `react`, `react-dom`, `class-variance-authority`, `clsx`, `tailwind-merge`) is
clean.

The full `npm audit` reports **5 high-severity advisories, all in dev-only tooling** and
all tracing to a single root:

```
braces <=3.0.3  (GHSA-vfj7-8cjw-p6xm, stack-exhaustion DoS, CVSS 7.5)
  └─ micromatch ── fast-glob ── @next/eslint-plugin-next ── eslint-config-next
```

The only registry version of `braces` is `3.0.3`, which is inside the vulnerable range
(`<=3.0.3`); no patched release exists. `braces` is reached only through the ESLint
toolchain, which runs at lint time and is never shipped to a visitor. `npm audit fix
--force` would "fix" this by downgrading `eslint-config-next` to `14.2.35` — a breaking
downgrade that would take the project off the Next.js 16 lint config and is not
justified for a lint-time-only advisory. The advisory is therefore **accepted and
tracked** until the upstream toolchain updates.

## Known limitations

- **`'unsafe-inline'` in `script-src`/`style-src`.** Required to keep static rendering
  with `inlineCss`. Acceptable only because the site has no injection sink today; it must
  be revisited if any dynamic or user-generated content is added. A nonce-based CSP (or
  the experimental `experimental.sri` hash-based CSP) is the follow-up.
- **`Strict-Transport-Security` and `upgrade-insecure-requests` are inert over the
  localhost HTTP origin used in tests.** They take effect once the site is served over
  HTTPS in production.
- **`frame-ancestors 'none'` / `X-Frame-Options: DENY`** mean the invitation cannot be
  embedded in a third-party iframe. This is intended for a direct-link invitation; if an
  embed is ever required, `frame-ancestors` must be scoped to the allowed origin.
- **The gallery image-source guard is dormant while the gallery is empty.** The code path
  is in place and unit-tested, but it only filters real bytes once the temple supplies
  photographs.
- **No Content-Security-Policy reporting endpoint.** Violations are not collected in
  production; add `report-to`/`report-uri` when a collector exists.
- **Dependency advisories are dev-only and unresolved** by design (see above); re-run
  `npm audit` before release to confirm no new production advisory has appeared.

## Recommended next task

Phase 9 — Antislop (`INV-009`): check duplicate components, dead code, unnecessary
abstractions, generic AI-looking copy/UI, excessive animation, excessive cards,
unnecessary dependencies, and inconsistent spacing/typography.

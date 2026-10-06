import { expect, test } from "@playwright/test";

/**
 * Security / Hardening (Phase 8): the served response carries the hardening
 * headers, the CSP is compatible with what the invitation actually loads (no
 * violations on a real page load), and every new-tab link is guarded. Runs on the
 * configured mobile and desktop projects.
 */

const CSP_VIOLATION_OBSERVER = `
  window.__cspViolations = [];
  document.addEventListener("securitypolicyviolation", (event) => {
    window.__cspViolations.push({
      directive: event.violatedDirective,
      blockedURI: event.blockedURI,
    });
  });
`;

test("serves the hardening headers on the document", async ({ page }) => {
  const response = await page.goto("/");
  expect(response).not.toBeNull();
  const headers = (response as NonNullable<typeof response>).headers();

  expect(headers["content-security-policy"]).toContain("default-src 'self'");
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["content-security-policy"]).toContain("object-src 'none'");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["permissions-policy"]).toContain("camera=()");
  expect(headers["strict-transport-security"]).toContain("max-age=");

  // The framework must not be advertised.
  expect(headers["x-powered-by"]).toBeUndefined();
});

test("the CSP does not block the page from loading", async ({ page }) => {
  await page.addInitScript(CSP_VIOLATION_OBSERVER);
  await page.goto("/");
  await expect(page.locator(".opening-veil")).toBeHidden({ timeout: 5000 });

  // The invitation rendered: heading and main landmark are present.
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("main")).toBeVisible();

  const violations = await page.evaluate(
    () => (window as unknown as { __cspViolations: unknown[] }).__cspViolations,
  );
  expect(violations).toEqual([]);
});

test("guards every new-tab link with noopener noreferrer", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".opening-veil")).toBeHidden({ timeout: 5000 });

  const newTabLinks = page.locator('a[target="_blank"]');
  const count = await newTabLinks.count();
  expect(count).toBeGreaterThan(0);

  for (let i = 0; i < count; i += 1) {
    const rel = await newTabLinks.nth(i).getAttribute("rel");
    expect(rel).toContain("noopener");
    expect(rel).toContain("noreferrer");
  }
});

test("ships no inline event handlers or javascript: URLs", async ({ page }) => {
  await page.goto("/");
  const html = await page.content();
  expect(html).not.toMatch(/\son(?:click|load|error)\s*=/i);
  expect(html).not.toMatch(/javascript:/i);
  expect(html).not.toMatch(/<iframe\b/i);
});

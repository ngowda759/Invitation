import { expect, test } from "@playwright/test";

/**
 * Opening + Hero (Phase 3): the threshold dissolves on its own, the hero presents the
 * event identity and both calls to action, and the in-page anchors resolve to real
 * sections. Runs on the configured mobile and desktop projects.
 */
test("opening threshold dissolves and reveals the hero", async ({ page }) => {
  await page.goto("/");

  const veil = page.locator(".opening-veil");
  await expect(veil).toHaveCount(1);
  // The veil is decorative and must not expose anything to assistive technology.
  await expect(veil).toHaveAttribute("aria-hidden", "true");

  // It dissolves with CSS only; once hidden it must no longer cover the hero.
  await expect(veil).toBeHidden({ timeout: 5000 });
});

test("hero presents the event identity and both calls to action", async ({ page }) => {
  await page.goto("/");

  const h1 = page.getByRole("heading", { level: 1 });
  await expect(h1).toHaveCount(1);
  await expect(h1).toBeVisible();

  const primary = page.getByRole("link", { name: "Enter the invitation" });
  const secondary = page.getByRole("link", { name: "View programme" });
  await expect(primary).toBeVisible();
  await expect(secondary).toBeVisible();

  // The primary call to action leads to a section that exists.
  await primary.click();
  await expect(page.locator("#event")).toBeVisible();
  await expect(page.locator("#programme")).toHaveCount(1);
});

test("the invitation has no horizontal overflow", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".opening-veil")).toBeHidden({ timeout: 5000 });

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("the opening threshold does not delay the content", async ({ page }) => {
    await page.goto("/");
    // With motion reduced the veil is removed immediately, not after a delay.
    await expect(page.locator(".opening-veil")).toBeHidden({ timeout: 1000 });
  });
});

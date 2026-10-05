import { expect, test } from "@playwright/test";

/**
 * Foundation smoke test: the app boots, serves a well-formed document with a
 * single h1, no horizontal overflow at the target mobile width, and a working
 * skip-to-content link.
 */
test("foundation page renders and is accessible", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.ok()).toBeTruthy();

  await expect(page).toHaveTitle(/.+/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");

  const headings = page.getByRole("heading", { level: 1 });
  await expect(headings).toHaveCount(1);

  await expect(page.getByRole("main")).toBeVisible();

  // No horizontal overflow: content must fit the viewport width.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);

  // The skip link is the first focusable element and targets the main region.
  await page.keyboard.press("Tab");
  const focused = await page.evaluate(() => document.activeElement?.textContent ?? "");
  expect(focused).toContain("Skip to content");
});

import { expect, test } from "@playwright/test";

/**
 * Invitation Content (Phase 4): the five content sections render as reachable
 * landmarks with honest empty states, and the primary call to action still resolves
 * to the programme section. Runs on the configured mobile and desktop projects.
 */
test("all five invitation content sections are present and reachable", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".opening-veil")).toBeHidden({ timeout: 5000 });

  for (const name of ["Darshan", "Festival", "Programme", "Guru Rayaru", "Seva"]) {
    const region = page.getByRole("region", { name });
    await expect(region).toHaveCount(1);
    await region.scrollIntoViewIfNeeded();
    await expect(region).toBeVisible();
  }
});

test("the primary call to action leads to the programme timeline", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".opening-veil")).toBeHidden({ timeout: 5000 });

  await page.getByRole("link", { name: "View programme" }).click();
  await expect(page.getByRole("region", { name: "Programme" })).toBeVisible();
});

test("the invitation has no horizontal overflow", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".opening-veil")).toBeHidden({ timeout: 5000 });

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

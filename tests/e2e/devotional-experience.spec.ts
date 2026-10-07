import { expect, test } from "@playwright/test";

/**
 * Devotional Invitation Experience (Phase 11): the invitation opens like a doorway,
 * presents a devotional hero, offers an unobtrusive contents band, and reveals each
 * movement of the story with a single ceremonial entrance. Runs on the configured
 * mobile and desktop projects.
 */
test("the invitation opens from a decorative cover into the hero", async ({ page }) => {
  await page.goto("/");

  const veil = page.locator(".opening-veil");
  await expect(veil).toHaveAttribute("aria-hidden", "true");
  // The cover is pure ornament: no text, no controls.
  await expect(veil).toHaveText("");
  await expect(veil.locator("a, button")).toHaveCount(0);

  // It dissolves on its own and stops covering the hero.
  await expect(veil).toBeHidden({ timeout: 5000 });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("the hero presents a devotional composition", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".opening-veil")).toBeHidden({ timeout: 5000 });

  const hero = page.locator(".hero");
  await expect(hero).toBeVisible();
  // A lamp glow, a gilt arch and a mandala frame the opening.
  await expect(hero.locator(".hero__glow")).toHaveCount(1);
  await expect(hero.locator("svg[aria-hidden='true']").first()).toBeVisible();
});

test("the contents band is unobtrusive and resolves to real sections", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".opening-veil")).toBeHidden({ timeout: 5000 });

  const nav = page.getByRole("navigation", { name: "Invitation contents" });
  await expect(nav).toHaveCount(1);

  const links = nav.getByRole("link");
  const count = await links.count();
  expect(count).toBeGreaterThan(4);
  for (let i = 0; i < count; i += 1) {
    const href = await links.nth(i).getAttribute("href");
    expect(href).toMatch(/^#/);
    const id = (href ?? "").slice(1);
    await expect(page.locator(`#${id}`)).toHaveCount(1);
  }
});

test("the story reveals each movement with a single ceremonial entrance", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".opening-veil")).toBeHidden({ timeout: 5000 });

  // Every movement shares one reveal class, so the entrance is identical throughout.
  const reveals = page.locator("main .section-reveal");
  expect(await reveals.count()).toBeGreaterThan(8);
});

test("reduced motion removes the cover and every reveal delay", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await expect(page.locator(".opening-veil")).toBeHidden({ timeout: 1000 });

  // Sections are simply present: no entrance animation is attached.
  const animation = await page
    .locator("main .section-reveal")
    .first()
    .evaluate((el) => getComputedStyle(el).animationName);
  expect(animation).toBe("none");
});

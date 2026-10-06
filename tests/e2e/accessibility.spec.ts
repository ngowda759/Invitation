import { expect, test } from "@playwright/test";

/**
 * Mobile / Accessibility (Phase 6): the assembled invitation keeps a single h1, names
 * every region uniquely, exposes one consistent keyboard focus indicator, honours
 * `prefers-reduced-motion`, marks decorative overlays, and fits the mobile viewport.
 * Runs on the configured mobile and desktop projects.
 */

test("the page exposes one h1 and uniquely named regions", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".opening-veil")).toBeHidden({ timeout: 5000 });

  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);

  const names = await page.getByRole("region").evaluateAll((regions) =>
    regions.map((region) => {
      const label = region.getAttribute("aria-label");
      if (label?.trim()) return label.trim();
      const labelledby = region.getAttribute("aria-labelledby");
      if (labelledby) {
        return labelledby
          .split(/\s+/)
          .map((id) => document.getElementById(id)?.textContent?.trim() ?? "")
          .join(" ")
          .trim();
      }
      return "";
    }),
  );

  expect(names.length).toBeGreaterThan(0);
  expect(names.every((name) => name.length > 0)).toBe(true);
  expect(new Set(names).size).toBe(names.length);
});

test("the skip link is the first focus target and reaches main", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".opening-veil")).toBeHidden({ timeout: 5000 });

  await page.keyboard.press("Tab");
  const focused = page.locator(":focus");
  await expect(focused).toHaveText("Skip to content");

  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main$/);
  await expect(page.getByRole("main")).toBeVisible();
});

test("keyboard focus shows a visible indicator", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".opening-veil")).toBeHidden({ timeout: 5000 });

  const primary = page.getByRole("link", { name: "Enter the invitation" });
  await primary.focus();
  const indicator = await primary.evaluate((el) => {
    const style = getComputedStyle(el);
    return { outlineWidth: style.outlineWidth, boxShadow: style.boxShadow };
  });
  // A focus indicator is present: either the shared outline or a ring.
  expect(
    indicator.outlineWidth !== "0px" || indicator.boxShadow !== "none",
  ).toBeTruthy();
});

test("decorative overlays are hidden from assistive technology", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".opening-veil")).toHaveAttribute("aria-hidden", "true");
  // Ornamental SVGs inside the invitation must not be announced. Scoped to `main` so
  // framework-injected developer tooling outside the app is not part of the assertion.
  const svgs = page.locator("main svg");
  const count = await svgs.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i += 1) {
    await expect(svgs.nth(i)).toHaveAttribute("aria-hidden", "true");
  }
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

  test("decorative animation is stopped and content is not delayed", async ({ page }) => {
    await page.goto("/");

    // The opening threshold is removed immediately, not after a delay.
    await expect(page.locator(".opening-veil")).toBeHidden({ timeout: 1000 });

    // The hero glow is a still highlight (Phase 9 removed the looping animation), so
    // no animation is attached under reduced motion either.
    const glowAnimation = await page
      .locator(".hero__glow")
      .evaluate((el) => getComputedStyle(el).animationName);
    expect(glowAnimation).toBe("none");
  });
});

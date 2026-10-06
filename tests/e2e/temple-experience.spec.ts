import { expect, test } from "@playwright/test";

/**
 * Temple Experience (Phase 5): the temple map, gallery, location and share sections
 * render as reachable landmarks, the share route resolves, and the page keeps no
 * horizontal overflow. Runs on the configured mobile and desktop projects.
 */
test("all four temple experience sections are present and reachable", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".opening-veil")).toBeHidden({ timeout: 5000 });

  for (const name of ["Temple map", "Gallery", "Location", "Share"]) {
    const region = page.getByRole("region", { name });
    await expect(region).toHaveCount(1);
    await region.scrollIntoViewIfNeeded();
    await expect(region).toBeVisible();
  }
});

test("the share section offers a WhatsApp share route", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".opening-veil")).toBeHidden({ timeout: 5000 });

  const whatsapp = page.getByRole("region", { name: "Share" }).getByRole("link", {
    name: /whatsapp/i,
  });
  await expect(whatsapp).toHaveAttribute("href", /https:\/\/wa\.me\/\?text=/);
});

test("the invitation has no horizontal overflow", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".opening-veil")).toBeHidden({ timeout: 5000 });

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

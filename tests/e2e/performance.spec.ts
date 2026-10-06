import { expect, test } from "@playwright/test";

/**
 * Performance (Phase 7).
 *
 * The LCP and CLS budgets are mobile budgets, so the measurement runs on the
 * mobile project only, on Chromium, with CPU and network throttling that stand in
 * for a representative mid-range phone on a slow connection. The route is warmed
 * once (unmeasured) so a cold dev-server compile is not charged to the budget.
 */

const LCP_BUDGET_MS = 2500;
const CLS_BUDGET = 0.1;

const LCP_OBSERVER = `
  window.__perf = { lcp: 0, cls: 0 };
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === "largest-contentful-paint") window.__perf.lcp = entry.startTime;
    }
  }).observe({ type: "largest-contentful-paint", buffered: true });
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === "layout-shift" && !entry.hadRecentInput) {
        window.__perf.cls += entry.value;
      }
    }
  }).observe({ type: "layout-shift", buffered: true });
`;

test("keeps CLS below 0.1 and LCP within the 2.5s mobile budget", async ({
  page,
  context,
  isMobile,
  browserName,
}) => {
  test.skip(!isMobile || browserName !== "chromium", "Mobile Chromium performance budget");

  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 150,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
  });

  await page.addInitScript(LCP_OBSERVER);

  // Warm-up navigation (unmeasured) so the first compile is not charged to LCP.
  await page.goto("/", { waitUntil: "load" });
  await page.waitForTimeout(500);

  await page.goto("/", { waitUntil: "load" });
  await page.waitForTimeout(2500);

  const metrics = await page.evaluate(
    () => (window as unknown as { __perf: { lcp: number; cls: number } }).__perf,
  );
  expect(metrics.lcp).toBeGreaterThan(0);
  expect(metrics.cls).toBeLessThan(CLS_BUDGET);
  expect(metrics.lcp).toBeLessThan(LCP_BUDGET_MS);
});

test("loads no third-party resources", async ({ page, baseURL }) => {
  const appHost = new URL(baseURL ?? "http://127.0.0.1").host;
  const external: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.protocol.startsWith("http") && url.host !== appHost) external.push(request.url());
  });

  await page.goto("/");
  await page.waitForTimeout(500);

  // No external fonts, scripts, widgets or analytics: everything is self-hosted.
  expect(external).toEqual([]);
});

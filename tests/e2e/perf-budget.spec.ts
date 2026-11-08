import { expect, test } from "@playwright/test";

/**
 * Cheap, deterministic guards for the performance work in docs/perf (these are NOT
 * Lighthouse scores; `npm run perf` produces those). They catch the specific regressions
 * that were found and fixed.
 */
const ROUTES = ["/", "/explore", "/experiments/algorithm-arena"];

test.describe("performance and DevTools hygiene", () => {
  for (const route of ROUTES) {
    test(`no DevTools Issues (e.g. CSP violations) on ${route}`, async ({
      page,
      context,
      browserName,
    }) => {
      test.skip(browserName !== "chromium", "CDP Audits domain is Chromium-only");
      const cdp = await context.newCDPSession(page);
      const issues: string[] = [];
      cdp.on("Audits.issueAdded", (e) => {
        issues.push(JSON.stringify({ code: e.issue.code, details: e.issue.details }).slice(0, 400));
      });
      await cdp.send("Audits.enable");
      await page.goto(route, { waitUntil: "load" });
      await page.waitForTimeout(1500); // lazy chunks and the experiment mount
      expect(issues).toEqual([]);
    });
  }

  test("the INITIAL scripts of a page with no experiment do not contain the schema library", async ({
    request,
  }) => {
    // What the server-rendered HTML references. Next may still PREFETCH the experiment routes
    // that /explore links to, so Zod can appear on the network later; that is deliberate
    // (docs/decisions/0007) and is not what this guards. This guards the critical path.
    const html = await (await request.get("/explore")).text();
    const srcs = [
      ...new Set([...html.matchAll(/src="(\/_next\/static\/[^"]+\.js)"/g)].map((m) => m[1])),
    ];
    expect(srcs.length).toBeGreaterThan(3);
    const bodies = await Promise.all(srcs.map((u) => request.get(u).then((r) => r.text())));
    expect(srcs.filter((_, i) => bodies[i].includes("ZodError"))).toEqual([]);
  });

  test("the homepage hero mounts (two canvases and a control)", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("canvas")).toHaveCount(2, { timeout: 10_000 });
    await expect(page.getByRole("button", { name: /^(Pause|Run)/ })).toBeVisible();
  });
});

import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  return errors;
}

const heroLane = (page: Page) => page.getByRole("figure").first();

test.describe("homepage", () => {
  test("headline, supporting copy and both CTAs match the spec and work", async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("The web is your playground.");
    await expect(page.getByText("Don't just browse technology. Interact with it.")).toBeVisible();
    await expect(page.getByText("Share discoveries.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Enter the lab" })).toHaveAttribute(
      "href",
      "/experiments/algorithm-arena",
    );
    await expect(page.getByRole("link", { name: "Explore experiments" })).toHaveAttribute(
      "href",
      "/explore",
    );
    expect(errors).toEqual([]);

    await page.getByRole("link", { name: "Enter the lab" }).click();
    await expect(page).toHaveURL(/\/experiments\/algorithm-arena/);
  });

  test("the headline is in the server-rendered HTML (does not wait for JS or the canvas)", async ({
    request,
  }) => {
    const html = await (await request.get("/")).text();
    expect(html).toContain("The web is your playground.");
  });

  test("the hero is a live experiment: counters advance on their own, then it can be paused", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: /^(Pause|Run)/ })).toBeVisible();
    const before = await heroLane(page).innerText();
    await expect
      .poll(async () => heroLane(page).innerText(), { timeout: 8000 })
      .not.toEqual(before);
    await page.getByRole("button", { name: "Pause" }).click();
    const frozen = await heroLane(page).innerText();
    await page.waitForTimeout(500);
    expect(await heroLane(page).innerText()).toEqual(frozen);
  });

  test("prefers-reduced-motion: the hero does not autoplay and offers Run", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Run", exact: true })).toBeVisible();
    const lane = await heroLane(page).innerText();
    await page.waitForTimeout(1200);
    expect(await heroLane(page).innerText()).toEqual(lane);
    expect(lane).toMatch(/step 0 of/);
    await page.getByRole("button", { name: "Run", exact: true }).click();
    await expect
      .poll(async () => heroLane(page).innerText(), { timeout: 8000 })
      .not.toMatch(/step 0 of/);
  });

  test("the hero never writes the page URL (embeds ignore the share fragment)", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForTimeout(1500);
    expect(new URL(page.url()).hash).toBe("");
  });

  test("curated example links are real: each opens the Arena with exactly that configuration", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("link").filter({ hasText: /Algorithm Arena/ })).toHaveCount(3);
    const expected: Array<[RegExp, string, string, string]> = [
      [/When quick sort is not quick/, "quick", "merge", "reversed"],
      [/Nearly sorted data/, "insertion", "bubble", "nearly-sorted"],
      [/Only four distinct values/, "quick", "merge", "few-unique"],
    ];
    for (const [title, left, right, preset] of expected) {
      await page.goto("/");
      await page.getByRole("link", { name: title }).click();
      await expect(page.getByLabel("Left algorithm")).toHaveValue(left);
      await expect(page.getByLabel("Right algorithm")).toHaveValue(right);
      await expect(page.getByLabel("Input data")).toHaveValue(preset);
      await expect(page.getByLabel("Items:", { exact: false })).toHaveValue("64");
      expect(page.url()).toContain("#1j.");
    }
  });

  test("does not invent content: no community, trending, user or activity claims", async ({
    page,
  }) => {
    await page.goto("/");
    const text = (await page.locator("main").innerText()).toLowerCase();
    for (const banned of [
      "trending",
      "featured creators",
      "community creations",
      "active users",
      "creators online",
      "just published",
    ]) {
      expect(text, banned).not.toContain(banned);
    }
  });

  test("every internal link on the page resolves; no placeholder links", async ({
    page,
    request,
  }) => {
    await page.goto("/");
    const hrefs = await page
      .locator("a[href]")
      .evaluateAll((els) => els.map((e) => (e as HTMLAnchorElement).getAttribute("href")!));
    expect(hrefs.length).toBeGreaterThan(5);
    for (const href of hrefs) {
      expect(href, "no placeholder links").not.toBe("#");
      if (href.startsWith("/")) {
        const res = await request.get(href.split("#")[0]);
        expect(res.status(), href).toBe(200);
      }
    }
  });

  for (const theme of ["dark", "light"] as const) {
    test(`axe: no serious or critical violations while the hero runs (${theme})`, async ({
      page,
    }) => {
      await page.addInitScript((t) => localStorage.setItem("void-theme", t), theme);
      await page.goto("/");
      await expect(page.getByRole("button", { name: /^(Pause|Run)/ })).toBeVisible();
      await page.waitForTimeout(600);
      const r = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      const bad = r.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(bad.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
    });
  }

  test("no horizontal scroll", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(800);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("the headline stays readable: its box does not overlap the race canvases", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForTimeout(600);
    const h1 = (await page.getByRole("heading", { level: 1 }).boundingBox())!;
    const canvases = await page
      .locator("canvas")
      .evaluateAll((els) => els.map((e) => e.getBoundingClientRect().toJSON()));
    expect(canvases.length).toBe(2);
    for (const c of canvases) {
      const overlapX = Math.min(h1.x + h1.width, c.right) - Math.max(h1.x, c.left);
      const overlapY = Math.min(h1.y + h1.height, c.bottom) - Math.max(h1.y, c.top);
      expect(overlapX > 0 && overlapY > 0, "headline overlaps a canvas").toBe(false);
    }
  });
});

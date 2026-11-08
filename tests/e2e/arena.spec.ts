import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const PATH = "/experiments/algorithm-arena";

function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  return errors;
}

/** The share-link notice (Next also renders its own role=alert route announcer). */
const notice = (page: Page) => page.locator('[role="alert"][data-reason]');

async function ready(page: Page) {
  await expect(page.getByRole("button", { name: "Run", exact: true })).toBeVisible();
  await expect(page.getByLabel("Share link", { exact: false })).toHaveValue(/#1j\./);
}

async function runToCompletion(page: Page) {
  await page.getByLabel(/^Speed/).fill("6"); // maximum speed
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(page.getByRole("button", { name: "Run again" })).toBeVisible({ timeout: 15_000 });
}

async function laneText(page: Page): Promise<string[]> {
  return page
    .getByRole("figure")
    .evaluateAll((els) => els.map((e) => (e as HTMLElement).innerText));
}

test.describe("Algorithm Arena", () => {
  test("loads with defaults, no console errors, canvases have text alternatives", async ({
    page,
  }) => {
    const errors = trackErrors(page);
    await page.goto(PATH);
    await ready(page);
    await expect(page.getByRole("heading", { level: 1, name: "Algorithm Arena" })).toBeVisible();
    await expect(page.getByLabel("Left algorithm")).toHaveValue("bubble");
    await expect(page.getByLabel("Right algorithm")).toHaveValue("quick");
    const labels = await page
      .getByRole("img")
      .evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")));
    expect(labels).toHaveLength(2);
    for (const l of labels) expect(l).toMatch(/comparisons, \d+ swaps, \d+ writes/);
    expect(errors).toEqual([]);
  });

  test("Step advances one operation; Run counts up; Pause freezes; Reset clears", async ({
    page,
  }) => {
    await page.goto(PATH);
    await ready(page);
    await page.getByRole("button", { name: "Step" }).click();
    await expect(page.getByText(/step 1 of \d+/).first()).toBeVisible();

    await page.getByRole("button", { name: "Run", exact: true }).click();
    await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
    await page.waitForTimeout(700);
    await page.getByRole("button", { name: "Pause" }).click();
    const frozen = await laneText(page);
    await page.waitForTimeout(500);
    expect(await laneText(page)).toEqual(frozen);
    expect(frozen[0]).not.toMatch(/step 0 of/);

    await page.getByRole("button", { name: "Reset" }).click();
    await expect(page.getByText(/step 0 of \d+/).first()).toBeVisible();
  });

  test("runs to completion: both lanes end sorted, counters match the hand-checked invariant", async ({
    page,
  }) => {
    await page.goto(PATH);
    await ready(page);
    await runToCompletion(page);
    const lanes = await laneText(page);
    for (const t of lanes) expect(t).toMatch(/sorted/);
    // Default config: bubble sort on 48 items always makes exactly 48*47/2 comparisons.
    expect(lanes[0]).toMatch(/Comparisons\s*1128/);
    // Announcement for assistive tech names the winner.
    await expect(page.getByRole("status").filter({ hasText: /finished first|Tie/ })).toHaveCount(1);
  });

  test("keyboard only: Tab to Run, Space toggles", async ({ page }) => {
    await page.goto(PATH);
    await ready(page);
    const run = page.getByRole("button", { name: "Run", exact: true });
    await run.focus();
    await page.keyboard.press("Space");
    await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
    await page.keyboard.press("Space");
    await expect(page.getByRole("button", { name: "Run", exact: true })).toBeVisible();
    await page.getByLabel("Left algorithm").focus();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByLabel("Left algorithm")).not.toHaveValue("bubble");
  });

  test("share link round trip: a fresh browser context reproduces settings AND results", async ({
    page,
    browser,
  }) => {
    await page.goto(PATH);
    await ready(page);
    await page.getByLabel("Left algorithm").selectOption("insertion");
    await page.getByLabel("Right algorithm").selectOption("merge");
    await page.getByLabel("Input data").selectOption("reversed");
    await page.getByLabel("Seed").fill("4242");
    await page.getByLabel("Seed").press("Enter");
    await expect.poll(async () => page.getByLabel("Share link").inputValue()).toMatch(/#1j\./);
    await page.waitForTimeout(400); // debounced fragment write
    const link = await page.getByLabel("Share link").inputValue();
    expect(link).toContain("#1j.");

    await runToCompletion(page);
    const original = await laneText(page);

    const other = await browser.newContext();
    const fresh = await other.newPage();
    const errors = trackErrors(fresh);
    await fresh.goto(link);
    await ready(fresh);
    await expect(fresh.getByLabel("Left algorithm")).toHaveValue("insertion");
    await expect(fresh.getByLabel("Right algorithm")).toHaveValue("merge");
    await expect(fresh.getByLabel("Input data")).toHaveValue("reversed");
    await expect(fresh.getByLabel("Seed")).toHaveValue("4242");
    await runToCompletion(fresh);
    expect(await laneText(fresh)).toEqual(original);
    expect(errors).toEqual([]);
    await other.close();
  });

  test("pointer painting changes the data, is reflected in the link, and survives a round trip", async ({
    page,
    browser,
  }) => {
    await page.goto(PATH);
    await ready(page);
    const canvas = page.getByRole("img").first();
    const box = (await canvas.boundingBox())!;
    await page.mouse.move(box.x + 10, box.y + box.height * 0.2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.9, { steps: 12 });
    await page.mouse.up();
    await expect(page.getByLabel("Input data")).toHaveValue("custom");
    await page.waitForTimeout(400);
    const link = await page.getByLabel("Share link").inputValue();

    await page.getByRole("button", { name: "Show data as table" }).click();
    const table = await page.getByRole("table").first().innerText();

    const other = await browser.newContext();
    const fresh = await other.newPage();
    await fresh.goto(link);
    await ready(fresh);
    await expect(fresh.getByLabel("Input data")).toHaveValue("custom");
    await fresh.getByRole("button", { name: "Show data as table" }).click();
    expect(await fresh.getByRole("table").first().innerText()).toEqual(table);
    await other.close();
  });

  const hostile: Array<[string, string, string]> = [
    ["garbage", "#1j.%%%not-base64", "bad-charset"],
    ["wrong prefix", "#zzz", "bad-prefix"],
    [
      "valid shape, wrong experiment",
      "#1j.eyJ2IjoxLCJpZCI6Im90aGVyIiwiY29uZmlnIjp7fX0",
      "wrong-experiment",
    ],
    [
      "valid shape, invalid config",
      "#1j.eyJ2IjoxLCJpZCI6ImFsZ29yaXRobS1hcmVuYSIsImNvbmZpZyI6eyJzaXplIjo5OTk5OX19",
      "invalid-config",
    ],
    ["script-looking payload", "#1j.PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg", "bad-json"],
  ];
  for (const [name, hash, reason] of hostile) {
    test(`hostile link (${name}): visible notice, defaults load, no crash`, async ({ page }) => {
      const errors = trackErrors(page);
      let dialog = false;
      page.on("dialog", async (d) => {
        dialog = true;
        await d.dismiss();
      });
      await page.goto(`${PATH}${hash}`);
      await expect(notice(page)).toBeVisible();
      await expect(notice(page)).toHaveAttribute("data-reason", reason);
      await expect(notice(page)).toContainText("Showing the default settings");
      await expect(page.getByLabel("Left algorithm")).toHaveValue("bubble");
      await expect(page.getByRole("button", { name: "Run", exact: true })).toBeVisible();
      expect(dialog).toBe(false);
      expect(errors).toEqual([]);
    });
  }

  for (const theme of ["dark", "light"] as const) {
    test(`axe: default, running and error states have no serious/critical violations (${theme})`, async ({
      page,
    }) => {
      await page.addInitScript((t) => localStorage.setItem("void-theme", t), theme);
      const scan = async () => {
        const r = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          .analyze();
        return r.violations
          .filter((v) => v.impact === "serious" || v.impact === "critical")
          .map((v) => `${v.id}: ${v.help}`);
      };
      await page.goto(PATH);
      await ready(page);
      expect(await scan(), "default state").toEqual([]);
      await page.getByRole("button", { name: "Run", exact: true }).click();
      await page.waitForTimeout(300);
      expect(await scan(), "running state").toEqual([]);
      await page.getByRole("button", { name: "Show data as table" }).click();
      expect(await scan(), "table open").toEqual([]);
      await page.goto(`${PATH}#1j.%%%`);
      await expect(notice(page)).toBeVisible();
      expect(await scan(), "error notice state").toEqual([]);
    });
  }

  test("no horizontal scroll", async ({ page }) => {
    await page.goto(PATH);
    await ready(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("unknown experiment slug is a 404, not a crash", async ({ page }) => {
    const res = await page.goto("/experiments/does-not-exist");
    expect(res?.status()).toBe(404);
  });
});

test.describe("Explore", () => {
  test("lists the registered experiment and links to it", async ({ page }) => {
    await page.goto("/explore");
    await expect(page.getByRole("heading", { level: 1, name: "Explore" })).toBeVisible();
    await page.getByRole("link", { name: /Algorithm Arena/ }).click();
    await expect(page).toHaveURL(/\/experiments\/algorithm-arena/);
  });

  test("header Explore link works", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("navigation", { name: "Primary" })
      .getByRole("link", { name: "Explore" })
      .click();
    await expect(page).toHaveURL(/\/explore$/);
  });
});

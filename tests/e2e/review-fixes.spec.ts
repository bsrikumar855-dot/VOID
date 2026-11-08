import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * Regression tests for defects found by the independent QA, security and critical
 * reviews of the first slice (see docs/decisions/0006-*.md). Each test names the defect.
 */
const PATH = "/experiments/algorithm-arena";
const notice = (page: Page) => page.locator('[role="alert"][data-reason]');

function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  return errors;
}

async function ready(page: Page) {
  await expect(page.getByRole("button", { name: "Run", exact: true })).toBeVisible();
  await expect(page.getByLabel("Share link")).toHaveValue(/#1j\./);
}

async function openTable(page: Page) {
  await page.getByRole("button", { name: "Show data as table" }).click();
}

/** Value of the left lane at 1-based position `pos` in the data table. */
async function leftValueAt(page: Page, pos: number): Promise<number> {
  const row = page.getByRole("table").first().getByRole("row").nth(pos);
  return Number(await row.getByRole("cell").first().innerText());
}

test.describe("share link and hash handling", () => {
  test("skip-to-content does not reset the experiment or raise a false 'damaged link' notice", async ({
    page,
  }) => {
    await page.goto(PATH);
    await ready(page);
    const seed = page.getByLabel("Seed");
    await seed.fill("4242");
    await seed.press("Enter");
    await expect(seed).toHaveValue("4242");
    await page.waitForTimeout(300); // debounced fragment write

    const skip = page.getByRole("link", { name: "Skip to content" });
    await skip.focus();
    await expect(skip).toBeFocused();
    await page.keyboard.press("Enter");

    await expect(notice(page)).toHaveCount(0);
    await expect(page.getByLabel("Seed")).toHaveValue("4242");
    await expect.poll(() => new URL(page.url()).hash.startsWith("#1j.")).toBe(true);
    // The share box still holds the real share URL, not "#main".
    expect(await page.getByLabel("Share link").inputValue()).toContain("#1j.");
  });

  test("a hash change while the experiment is loading is not lost", async ({ page }) => {
    // Open with defaults, then immediately navigate the hash to a valid, different link.
    await page.goto(PATH);
    await ready(page);
    const link = await page.getByLabel("Share link").inputValue();
    expect(link).toContain("#1j.");
    await page.getByLabel("Left algorithm").selectOption("merge");
    await page.waitForTimeout(300);
    const changed = await page.getByLabel("Share link").inputValue();
    await page.goBack().catch(() => undefined);
    await page.goto(changed);
    await ready(page);
    await expect(page.getByLabel("Left algorithm")).toHaveValue("merge");
  });

  test("typing in the seed field does not reset the race until the value is committed", async ({
    page,
  }) => {
    await page.goto(PATH);
    await ready(page);
    await page.getByRole("button", { name: "Step" }).click();
    await expect(page.getByText(/step 1 of/).first()).toBeVisible();
    const seed = page.getByLabel("Seed");
    await seed.fill(""); // clearing used to force seed 0 and reset the race
    await expect(page.getByText(/step 1 of/).first()).toBeVisible();
    await seed.fill("99");
    await seed.press("Enter");
    await expect(page.getByText(/step 0 of/).first()).toBeVisible();
    await expect(page.getByLabel("Seed")).toHaveValue("99");
  });
});

test.describe("keyboard", () => {
  test("S steps and R resets; browser shortcuts (Ctrl+R, Ctrl+S, Meta+R) are not hijacked", async ({
    page,
  }) => {
    await page.goto(PATH);
    await ready(page);
    const run = page.getByRole("button", { name: "Run", exact: true });
    await run.focus();
    await page.keyboard.press("s");
    await expect(page.getByText(/step 1 of/).first()).toBeVisible();
    await page.keyboard.press("s");
    await expect(page.getByText(/step 2 of/).first()).toBeVisible();
    await page.keyboard.press("r");
    await expect(page.getByText(/step 0 of/).first()).toBeVisible();

    const prevented = await run.evaluate((el) => {
      const out: Record<string, boolean> = {};
      for (const [name, init] of [
        ["ctrl+r", { key: "r", ctrlKey: true }],
        ["ctrl+s", { key: "s", ctrlKey: true }],
        ["meta+r", { key: "r", metaKey: true }],
        ["alt+s", { key: "s", altKey: true }],
      ] as const) {
        const e = new KeyboardEvent("keydown", { ...init, bubbles: true, cancelable: true });
        el.dispatchEvent(e);
        out[name] = e.defaultPrevented;
      }
      return out;
    });
    expect(prevented).toEqual({
      "ctrl+r": false,
      "ctrl+s": false,
      "meta+r": false,
      "alt+s": false,
    });
  });

  test("Step keeps keyboard focus at the final step (aria-disabled, not disabled)", async ({
    page,
  }) => {
    await page.goto(PATH);
    await ready(page);
    await page.getByLabel(/^Speed/).fill("6");
    await page.getByRole("button", { name: "Run", exact: true }).click();
    await expect(page.getByRole("button", { name: "Run again" })).toBeVisible({ timeout: 15_000 });
    const step = page.getByRole("button", { name: "Step" });
    await expect(step).toHaveAttribute("aria-disabled", "true");
    await step.focus();
    await expect(step).toBeFocused();
  });
});

test.describe("painting", () => {
  test("a bare click paints (the last sample of a stroke is not dropped)", async ({ page }) => {
    await page.goto(PATH);
    await ready(page);
    const box = (await page.getByRole("img").first().boundingBox())!;
    await page.mouse.click(box.x + box.width * 0.5, box.y + 30);
    await expect(page.getByLabel("Input data")).toHaveValue("custom");
  });

  test("painted height follows the pointer: top of the plot gives the maximum, bottom gives 1", async ({
    page,
  }) => {
    await page.goto(PATH);
    await ready(page);
    const box = (await page.getByRole("img").first().boundingBox())!;
    const n = 48;
    const xOf = (index: number) => box.x + (box.width / n) * (index + 0.5);
    // Plot area starts 14px below the canvas top (TOP_MARGIN); a click there is the maximum.
    await page.mouse.click(xOf(10), box.y + 14);
    await page.mouse.click(xOf(20), box.y + box.height - 1);
    await expect(page.getByLabel("Input data")).toHaveValue("custom");
    await openTable(page);
    expect(await leftValueAt(page, 11)).toBe(48);
    expect(await leftValueAt(page, 21)).toBe(1);
  });

  test("the homepage hero cannot be painted and does not trap touch scrolling", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: /^(Pause|Run)/ })).toBeVisible();
    const touchActions = await page
      .locator("canvas")
      .evaluateAll((els) => els.map((e) => getComputedStyle(e).touchAction));
    for (const t of touchActions) expect(t).not.toBe("none");
    const box = (await page.locator("canvas").first().boundingBox())!;
    await page.mouse.click(box.x + box.width / 2, box.y + 30);
    await page.waitForTimeout(400);
    expect(new URL(page.url()).hash).toBe("");
  });
});

test.describe("lifecycle", () => {
  test("mounting, leaving and returning works repeatedly with no console errors", async ({
    page,
  }) => {
    const errors = trackErrors(page);
    await page.goto(PATH);
    await ready(page);
    for (let i = 0; i < 3; i++) {
      await page
        .getByRole("navigation", { name: "Primary" })
        .getByRole("link", { name: "Explore" })
        .click();
      await expect(page).toHaveURL(/\/explore$/);
      await page.getByRole("link", { name: /Algorithm Arena/ }).click();
      await ready(page);
      await page.getByRole("button", { name: "Run", exact: true }).click();
      await page.waitForTimeout(150);
    }
    expect(errors).toEqual([]);
  });

  test("the homepage hero stops writing to the URL and timers after navigating away", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: /^(Pause|Run)/ })).toBeVisible();
    await page.getByRole("link", { name: "Explore experiments" }).click();
    await expect(page).toHaveURL(/\/explore$/);
    await page.waitForTimeout(800);
    expect(new URL(page.url()).hash).toBe("");
  });
});

test.describe("error pages and other routes", () => {
  test("unknown routes show the designed 404 page with a real status", async ({ page }) => {
    const res = await page.goto("/definitely/not/here");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Explore experiments" })).toBeVisible();
  });

  for (const route of ["/explore", "/definitely/not/here"]) {
    test(`axe and overflow on ${route}`, async ({ page }) => {
      await page.goto(route);
      await page.waitForTimeout(300);
      const r = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      expect(
        r.violations
          .filter((v) => v.impact === "serious" || v.impact === "critical")
          .map((v) => v.id),
      ).toEqual([]);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});

test.describe("security regressions", () => {
  for (const route of ["/", "/explore", PATH, "/definitely/not/here"]) {
    test(`security headers and CSP on ${route}`, async ({ request }) => {
      const res = await request.get(route);
      const h = res.headers();
      expect(h["x-content-type-options"]).toBe("nosniff");
      expect(h["x-frame-options"]).toBe("DENY");
      expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
      expect(h["cross-origin-opener-policy"]).toBe("same-origin");
      expect(h["permissions-policy"]).toBe(
        "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
      );
      const csp = h["content-security-policy"] ?? "";
      expect(csp).toContain("script-src 'self' 'unsafe-inline'");
      expect(csp).not.toContain("unsafe-eval"); // production build
      expect(csp).toContain("style-src 'self' 'unsafe-inline'");
      expect(csp).toContain("img-src 'self' data:");
      expect(csp).not.toContain("blob:");
      expect(csp).toContain("connect-src 'self'");
      expect(csp).toContain("frame-ancestors 'none'");
    });
  }

  test("hostile link input is never reflected into the page", async ({ page }) => {
    const marker = "ZZMARK<img src=x onerror=1>";
    const b64 = (t: string) => Buffer.from(t, "utf8").toString("base64url");
    const links = [
      `1j.${b64(JSON.stringify({ v: 1, id: marker, config: {} }))}`,
      `1j.${b64(JSON.stringify({ v: 1, id: "algorithm-arena", config: { [marker]: marker } }))}`,
      `1j.${b64(JSON.stringify({ v: 1, id: "algorithm-arena", config: { left: marker } }))}`,
      `1j.${b64(marker)}`,
    ];
    let dialog = false;
    page.on("dialog", async (d) => {
      dialog = true;
      await d.dismiss();
    });
    for (const link of links) {
      await page.goto(`${PATH}#${link}`);
      await expect(notice(page)).toBeVisible();
      const html = await page.evaluate(() => document.body.innerHTML);
      expect(html).not.toContain("ZZMARK");
      expect(await page.locator("img[src='x']").count()).toBe(0);
      const reason = await notice(page).getAttribute("data-reason");
      expect([
        "too-long",
        "bad-prefix",
        "bad-charset",
        "bad-base64",
        "too-large",
        "bad-utf8",
        "bad-json",
        "bad-envelope",
        "wrong-experiment",
        "unsupported-version",
        "invalid-config",
      ]).toContain(reason);
    }
    expect(dialog).toBe(false);
  });

  test("a link carrying __proto__ does not pollute the page's Object.prototype", async ({
    page,
  }) => {
    const b64 = (t: string) => Buffer.from(t, "utf8").toString("base64url");
    const text =
      '{"v":1,"id":"algorithm-arena","config":{"__proto__":{"polluted":true},"left":"bubble","right":"quick","preset":"random","size":48,"seed":7}}';
    await page.goto(`${PATH}#1j.${b64(text)}`);
    await expect(notice(page)).toBeVisible();
    expect(await page.evaluate(() => (({}) as Record<string, unknown>).polluted)).toBeUndefined();
  });

  test("the theme script ignores a hostile saved value", async ({ page }) => {
    await page.addInitScript(() =>
      localStorage.setItem("void-theme", '"><script>window.__x=1</script>'),
    );
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    expect(await page.evaluate(() => (window as unknown as { __x?: number }).__x)).toBeUndefined();
  });
});

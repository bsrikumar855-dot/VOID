import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { decodeShare, encodeShare } from "@/engine/share/codec";
import { experiments } from "@/registry";

/**
 * Browser-level contract for EVERY registered experiment. Adding an experiment adds these
 * tests automatically; nothing here names a specific experiment. Together with
 * tests/unit/registry-contract.test.ts this is the definition of "a valid experiment"
 * (documented in CONTRIBUTING.md).
 */
const notice = (page: Page) => page.locator('[role="alert"][data-reason]');

function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  return errors;
}

const shareInput = (page: Page) => page.getByLabel("Share link");
const b64 = (t: string) => Buffer.from(t, "utf8").toString("base64url");

for (const e of experiments) {
  const path = `/experiments/${e.meta.slug}`;

  test.describe(`experiment contract: ${e.meta.slug}`, () => {
    test("loads with its default settings: heading, share link, no console errors, no notice", async ({
      page,
    }) => {
      const errors = trackErrors(page);
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1, name: e.meta.title })).toBeVisible();
      await expect(shareInput(page)).toHaveValue(/#1j\./);
      await expect(notice(page)).toHaveCount(0);
      expect(errors).toEqual([]);
    });

    test("the share link written for the defaults decodes back to exactly the defaults", async ({
      page,
    }) => {
      await page.goto(path);
      await expect(shareInput(page)).toHaveValue(/#1j\./);
      const link = await shareInput(page).inputValue();
      const result = decodeShare(new URL(link).hash, e);
      expect(result).toEqual({ ok: true, config: e.defaultConfig });
    });

    test("no DevTools Issues (CSP violations etc.)", async ({ page, context, browserName }) => {
      test.skip(browserName !== "chromium", "CDP Audits domain is Chromium-only");
      const cdp = await context.newCDPSession(page);
      const issues: string[] = [];
      cdp.on("Audits.issueAdded", (ev) =>
        issues.push(JSON.stringify(ev.issue.details).slice(0, 300)),
      );
      await cdp.send("Audits.enable");
      await page.goto(path, { waitUntil: "load" });
      await expect(shareInput(page)).toHaveValue(/#1j\./);
      await page.waitForTimeout(500);
      expect(issues).toEqual([]);
    });

    for (const ex of e.examples ?? []) {
      test(`curated example "${ex.title}" opens that exact configuration`, async ({
        page,
        browser,
      }) => {
        const errors = trackErrors(page);
        await page.goto(`${path}#${encodeShare(e, ex.config)}`);
        await expect(shareInput(page)).toHaveValue(/#1j\./);
        await expect(notice(page)).toHaveCount(0);
        // The address bar still carries a share link that decodes to the example...
        await expect
          .poll(() => decodeShare(new URL(page.url()).hash, e))
          .toEqual({ ok: true, config: ex.config });
        // ...and a fresh browser context opening the written link ends in the same state.
        const link = await shareInput(page).inputValue();
        const other = await browser.newContext();
        const fresh = await other.newPage();
        await fresh.goto(link);
        await expect(shareInput(fresh)).toHaveValue(/#1j\./);
        expect(decodeShare(new URL(await shareInput(fresh).inputValue()).hash, e)).toEqual({
          ok: true,
          config: ex.config,
        });
        await other.close();
        expect(errors).toEqual([]);
      });
    }

    const hostile: Array<[string, string, string]> = [
      ["garbage", "#1j.%%%", "bad-charset"],
      ["wrong prefix", "#zzz", "bad-prefix"],
      [
        "link for a different experiment",
        `#1j.${b64(JSON.stringify({ v: e.meta.version, id: "someone-else", config: {} }))}`,
        "wrong-experiment",
      ],
      [
        "unsupported version",
        `#1j.${b64(JSON.stringify({ v: e.meta.version + 1, id: e.meta.id, config: {} }))}`,
        "unsupported-version",
      ],
      [
        "valid envelope, invalid config",
        // Built as text: an object literal with __proto__ sets the prototype and JSON.stringify
        // would silently drop it, so the hostile key would never reach the decoder.
        `#1j.${b64(`{"v":${e.meta.version},"id":${JSON.stringify(e.meta.id)},"config":{"__proto__":{"x":1},"nonsense":true}}`)}`,
        "invalid-config",
      ],
    ];
    for (const [name, hash, reason] of hostile) {
      test(`hostile link (${name}): visible notice with reason ${reason}, defaults load`, async ({
        page,
      }) => {
        const errors = trackErrors(page);
        await page.goto(`${path}${hash}`);
        await expect(notice(page)).toBeVisible();
        await expect(notice(page)).toHaveAttribute("data-reason", reason);
        await expect(shareInput(page)).toHaveValue(/#1j\./);
        expect(decodeShare(new URL(await shareInput(page).inputValue()).hash, e)).toEqual({
          ok: true,
          config: e.defaultConfig,
        });
        expect(errors).toEqual([]);
      });
    }

    test("skip-to-content does not disturb the experiment or its share link", async ({ page }) => {
      // Start from a NON-default configuration when one exists: a bug that resets to defaults
      // would be invisible if the experiment started on its defaults.
      const start = e.examples?.[0]?.config ?? e.defaultConfig;
      await page.goto(`${path}#${encodeShare(e, start)}`);
      await expect(shareInput(page)).toHaveValue(/#1j\./);
      const skip = page.getByRole("link", { name: "Skip to content" });
      await skip.focus();
      await page.keyboard.press("Enter");
      await expect(notice(page)).toHaveCount(0);
      await expect
        .poll(() => decodeShare(new URL(page.url()).hash, e))
        .toEqual({ ok: true, config: start });
    });

    test("an in-page anchor in the first-load URL is not mistaken for a damaged share link", async ({
      page,
    }) => {
      await page.goto(`${path}#main`);
      await expect(shareInput(page)).toHaveValue(/#1j\./);
      await expect(notice(page)).toHaveCount(0);
    });

    for (const theme of ["dark", "light"] as const) {
      test(`axe: no serious or critical violations (${theme})`, async ({ page }) => {
        await page.addInitScript((t) => localStorage.setItem("void-theme", t), theme);
        await page.goto(path);
        await expect(shareInput(page)).toHaveValue(/#1j\./);
        const r = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          .analyze();
        expect(
          r.violations
            .filter((v) => v.impact === "serious" || v.impact === "critical")
            .map((v) => `${v.id}: ${v.help}`),
        ).toEqual([]);
      });
    }

    test("no horizontal scroll", async ({ page }) => {
      await page.goto(path);
      await expect(shareInput(page)).toHaveValue(/#1j\./);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });

    test("leaving and returning (mount, destroy, mount) works with no console errors", async ({
      page,
    }) => {
      const errors = trackErrors(page);
      await page.goto(path);
      await expect(shareInput(page)).toHaveValue(/#1j\./);
      for (let i = 0; i < 2; i++) {
        await page
          .getByRole("navigation", { name: "Primary" })
          .getByRole("link", { name: "Explore" })
          .click();
        await expect(page).toHaveURL(/\/explore$/);
        await page.getByRole("link", { name: new RegExp(e.meta.title) }).click();
        await expect(shareInput(page)).toHaveValue(/#1j\./);
      }
      expect(errors).toEqual([]);
    });
  });
}

test.describe("registry-derived surfaces", () => {
  test("Explore lists exactly the registered experiments, each linking to its page", async ({
    page,
  }) => {
    await page.goto("/explore");
    const links = page.locator("main ul a");
    await expect(links).toHaveCount(experiments.length);
    for (const e of experiments) {
      await expect(page.locator(`main ul a[href="/experiments/${e.meta.slug}"]`)).toHaveCount(1);
      await expect(page.locator(`main ul a[href="/experiments/${e.meta.slug}"]`)).toContainText(
        e.meta.title,
      );
    }
  });

  test("the homepage lists exactly the curated examples of every registered experiment", async ({
    page,
  }) => {
    await page.goto("/");
    const expected = experiments.flatMap((e) => (e.examples ?? []).map((x) => ({ e, x })));
    const links = page.locator('section[aria-labelledby="examples-title"] a');
    await expect(links).toHaveCount(expected.length);
    for (const { e, x } of expected) {
      const href = `/experiments/${e.meta.slug}#${encodeShare(e, x.config)}`;
      await expect(
        page.locator(`section[aria-labelledby="examples-title"] a[href="${href}"]`),
      ).toHaveCount(1);
    }
  });

  test("the homepage hero features the first registry entry", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Enter the lab" })).toHaveAttribute(
      "href",
      `/experiments/${experiments[0].meta.slug}`,
    );
  });
});

import { expect, test, type Page } from "@playwright/test";
import { decodeShare } from "@/engine/share/codec";
import {
  defaultNnConfig,
  nnConfigSchema,
  type NnConfig,
} from "@/experiments/neural-network/config";
import { getExperiment } from "@/registry";

/**
 * Behaviour of the Neural Network Playground UI (the generic contract in
 * experiments-contract.spec.ts covers load, share round-trip, hostile links, axe and
 * lifecycle for every experiment; this file covers what is specific to this one).
 */
const def = getExperiment("neural-network")!;
const path = "/experiments/neural-network";
const shareInput = (page: Page) => page.getByLabel("Share link");
const progress = (page: Page) =>
  page.getByText(/^(Neuron \d+ of \d+ computed\.|All neurons computed\.)$/);
const prediction = (page: Page) =>
  page.getByRole("complementary", { name: "Inputs and prediction" });
const live = (page: Page) => page.locator('[role="status"][aria-live="polite"]');

async function sharedConfig(page: Page): Promise<NnConfig> {
  const link = await shareInput(page).inputValue();
  const r = decodeShare(new URL(link).hash, def);
  if (!r.ok) throw new Error(`share link did not decode: ${r.reason}`);
  return r.config as NnConfig;
}

/** The share URL is written on a short debounce, so assert by polling, never by sleeping. */
const sharedPoll = <T>(page: Page, pick: (c: NnConfig) => T) =>
  expect.poll(async () => pick(await sharedConfig(page)));

test.describe("neural network playground", () => {
  test("starts live (everything computed) and shows the XOR prediction", async ({ page }) => {
    await page.goto(path);
    await expect(progress(page)).toHaveText("All neurons computed.");
    await expect(prediction(page).getByText(/^Output 1\.000\./)).toBeVisible();
  });

  test("Reset, Step and Compute all move through the network and Replay runs it again", async ({
    page,
  }) => {
    await page.goto(path);
    await page.getByRole("button", { name: "Reset" }).click();
    await expect(progress(page)).toHaveText("Neuron 0 of 3 computed.");
    await expect(page.getByText("Appears once the last neuron is computed.")).toBeVisible();

    await page.getByRole("button", { name: "Step", exact: true }).click();
    await expect(progress(page)).toHaveText("Neuron 1 of 3 computed.");
    await page.getByRole("button", { name: "Step", exact: true }).click();
    await expect(progress(page)).toHaveText("Neuron 2 of 3 computed.");

    await page.getByRole("button", { name: "Compute all" }).click();
    await expect(progress(page)).toHaveText("All neurons computed.");
    await expect(prediction(page).getByText(/^Output 1\.000\./)).toBeVisible();

    await page.getByRole("button", { name: "Replay" }).click();
    await expect(progress(page)).toHaveText("All neurons computed.", { timeout: 15_000 });
  });

  test("S and R keyboard shortcuts step and reset", async ({ page }) => {
    await page.goto(path);
    await page.getByRole("button", { name: "Reset" }).focus();
    await page.keyboard.press("r");
    await expect(progress(page)).toHaveText("Neuron 0 of 3 computed.");
    await page.keyboard.press("s");
    await expect(progress(page)).toHaveText("Neuron 1 of 3 computed.");
  });

  test("editing an input mid-run keeps the run's position", async ({ page }) => {
    await page.goto(path);
    await page.getByRole("button", { name: "Reset" }).click();
    await page.getByRole("button", { name: "Step", exact: true }).click();
    await page.getByRole("button", { name: "Step", exact: true }).click();
    await page.getByRole("button", { name: "1, 0", exact: true }).click();
    await expect(progress(page)).toHaveText("Neuron 2 of 3 computed.");
    await sharedPoll(page, (c) => c.inputs).toEqual([100, 0]);
  });

  test("the live region speaks reset and the prediction, not a stale last neuron", async ({
    page,
  }) => {
    await page.goto(path);
    await page.getByRole("button", { name: "Reset" }).click();
    await expect(live(page)).toContainText("Reset. No neuron computed yet.");
    await page.getByRole("button", { name: "Compute all" }).click();
    // The stale "Reset" message is gone and the prediction is announced.
    await expect(live(page)).toContainText("Output 1.000.");
    await expect(live(page)).not.toContainText("Reset.");
  });

  test("Enter on a neuron opens its editor and moves focus there; edits reach the share link", async ({
    page,
  }) => {
    await page.goto(path);
    const output = page.getByRole("button", { name: /^Output neuron 1,/ });
    await output.focus();
    await page.keyboard.press("Enter");
    const heading = page.getByRole("heading", { name: "Output, neuron 1" });
    await expect(heading).toBeVisible();
    await expect(heading).toBeFocused();

    await page.locator('input[name="bias"]').fill("-150");
    await sharedPoll(page, (c) => c.b[c.b.length - 1]).toBe(-150);
    expect(nnConfigSchema.safeParse(await sharedConfig(page)).success).toBe(true);
  });

  test("adding a hidden layer keeps the existing hidden layer's weights and the output's bias", async ({
    page,
  }) => {
    await page.goto(path);
    await page.getByRole("button", { name: "Add hidden layer" }).click();
    await sharedPoll(page, (c) => c.layers.map((l) => l.size)).toEqual([2, 3, 1]);
    const cfg = await sharedConfig(page);
    expect(nnConfigSchema.safeParse(cfg).success).toBe(true);
    // The first hidden layer (4 weights, 2 biases) is untouched; the output keeps its bias.
    expect(cfg.w.slice(0, 4)).toEqual(defaultNnConfig.w.slice(0, 4));
    expect(cfg.b.slice(0, 2)).toEqual(defaultNnConfig.b.slice(0, 2));
    expect(cfg.b[cfg.b.length - 1]).toBe(defaultNnConfig.b[defaultNnConfig.b.length - 1]);
  });

  test("removing a hidden layer returns to a valid single-layer network", async ({ page }) => {
    await page.goto(path);
    await page.getByRole("button", { name: "Add hidden layer" }).click();
    await page.getByRole("button", { name: "Remove this layer" }).first().click();
    await sharedPoll(page, (c) => c.layers.map((l) => l.size)).toEqual([2, 1]);
    expect(nnConfigSchema.safeParse(await sharedConfig(page)).success).toBe(true);
  });

  test("Randomize changes the weights, announces it, and Load XOR restores the default", async ({
    page,
  }) => {
    await page.goto(path);
    await page.getByRole("button", { name: "Randomize weights" }).click();
    await expect(live(page)).toContainText("Weights randomized");
    await sharedPoll(page, (c) => c.w).not.toEqual(defaultNnConfig.w);
    await page.getByRole("button", { name: "Load XOR example" }).click();
    await expect(live(page)).toContainText("Loaded the hand-built XOR network.");
    await sharedPoll(page, (c) => c.w).toEqual(defaultNnConfig.w);
    await sharedPoll(page, (c) => c.b).toEqual(defaultNnConfig.b);
  });
});

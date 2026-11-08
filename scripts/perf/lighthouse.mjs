// Reproducible Lighthouse audit of the production build.
//
//   npm run build && npm run perf -- <label>
//
// Starts its own `next start` on a private port, runs the pinned Lighthouse CLI (see
// package.json) N times per route and form factor, and writes a summary with MEDIAN values
// and the environment to docs/perf/<label>.md. Raw JSON goes to perf-results/ (gitignored).
// These are real Lighthouse results from a local machine: no network emulation beyond
// Lighthouse's own simulated throttling, one machine, so compare only runs from the same
// machine and note the variance.
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { cpus, platform, release, totalmem } from "node:os";
import { join } from "node:path";

const label = process.argv[2] ?? "run";
const PORT = Number(process.env.PERF_PORT ?? 3200);
const BASE = `http://127.0.0.1:${PORT}`;
const RUNS = Number(process.env.PERF_RUNS ?? 3);
const ROUTES = (process.env.PERF_ROUTES ?? "/,/explore,/experiments/algorithm-arena").split(",");
const FORM_FACTORS = (process.env.PERF_FORM_FACTORS ?? "mobile,desktop").split(",");

const edge = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const chromePath =
  process.env.CHROME_PATH ?? (platform() === "win32" && existsSync(edge) ? edge : undefined);
const root = process.cwd();
const lhCli = join(root, "node_modules", "lighthouse", "cli", "index.js");
const nextBin = join(root, "node_modules", "next", "dist", "bin", "next");
const rawDir = join(root, "perf-results", label);
mkdirSync(rawDir, { recursive: true });
mkdirSync(join(root, "docs", "perf"), { recursive: true });

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(BASE + "/");
      if (r.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("server did not start");
}

const server = spawn(process.execPath, [nextBin, "start", "-p", String(PORT), "-H", "127.0.0.1"], {
  cwd: root,
  stdio: "ignore",
});
let exitCode = 0;
try {
  await waitForServer();
  const lhVersion = JSON.parse(
    readFileSync(join(root, "node_modules", "lighthouse", "package.json"), "utf8"),
  ).version;
  const rows = [];
  for (const ff of FORM_FACTORS) {
    for (const route of ROUTES) {
      const results = [];
      for (let i = 0; i < RUNS; i++) {
        const out = join(rawDir, `${ff}-${route.replace(/[^a-z0-9]+/gi, "_") || "home"}-${i}.json`);
        const args = [
          lhCli,
          BASE + route,
          "--output=json",
          `--output-path=${out}`,
          "--quiet",
          "--chrome-flags=--headless=new",
          "--only-categories=performance,accessibility,best-practices,seo",
        ];
        if (ff === "desktop") args.push("--preset=desktop");
        const r = spawnSync(process.execPath, args, {
          env: { ...process.env, ...(chromePath ? { CHROME_PATH: chromePath } : {}) },
          encoding: "utf8",
          timeout: 240_000,
        });
        if (r.status !== 0 || !existsSync(out)) {
          console.error(
            `Lighthouse failed for ${ff} ${route} run ${i}:`,
            (r.stderr || "").split("\n").slice(-4).join("\n"),
          );
          exitCode = 1;
          continue;
        }
        const j = JSON.parse(readFileSync(out, "utf8"));
        const a = j.audits;
        results.push({
          perf: Math.round(j.categories.performance.score * 100),
          a11y: Math.round(j.categories.accessibility.score * 100),
          bp: Math.round(j.categories["best-practices"].score * 100),
          seo: Math.round(j.categories.seo.score * 100),
          fcp: a["first-contentful-paint"].numericValue,
          lcp: a["largest-contentful-paint"].numericValue,
          tbt: a["total-blocking-time"].numericValue,
          cls: a["cumulative-layout-shift"].numericValue,
          si: a["speed-index"].numericValue,
          tti: a["interactive"].numericValue,
          bytes: a["total-byte-weight"].numericValue,
          unusedJs: a["unused-javascript"]?.details?.overallSavingsBytes ?? 0,
          bootup: a["bootup-time"]?.numericValue ?? 0,
        });
      }
      if (results.length === 0) continue;
      const m = (k) => median(results.map((x) => x[k]));
      rows.push({
        ff,
        route,
        n: results.length,
        perf: m("perf"),
        a11y: m("a11y"),
        bp: m("bp"),
        seo: m("seo"),
        fcp: m("fcp"),
        lcp: m("lcp"),
        tbt: m("tbt"),
        cls: m("cls"),
        si: m("si"),
        tti: m("tti"),
        kb: m("bytes") / 1024,
        unusedKb: m("unusedJs") / 1024,
        bootup: m("bootup"),
        perfAll: results.map((x) => x.perf),
      });
      console.log(
        `${ff.padEnd(8)} ${route.padEnd(30)} perf ${m("perf")} (${results.map((x) => x.perf).join("/")}) a11y ${m("a11y")} bp ${m("bp")} seo ${m("seo")} | FCP ${m("fcp").toFixed(0)} LCP ${m("lcp").toFixed(0)} TBT ${m("tbt").toFixed(0)} CLS ${m("cls").toFixed(3)} SI ${m("si").toFixed(0)}`,
      );
    }
  }
  const env = `${platform()} ${release()}, ${cpus()[0]?.model.trim()} x${cpus().length}, ${(totalmem() / 2 ** 30).toFixed(1)} GB RAM, Node ${process.version}, browser: ${chromePath ?? "system Chrome"}`;
  const md = [
    `# Lighthouse results: ${label}`,
    "",
    `Lighthouse ${lhVersion} (pinned in package.json), production build served by \`next start\` on localhost, default Lighthouse throttling (mobile: simulated slow 4G + 4x CPU; desktop: desktop preset). **Median of ${RUNS} runs** per cell; the three raw performance scores are shown to expose variance.`,
    "",
    `Environment: ${env}`,
    `Date: ${new Date().toISOString()}`,
    "",
    "| Form | Route | Perf (runs) | A11y | Best practices | SEO | FCP ms | LCP ms | TBT ms | CLS | Speed Index ms | TTI ms | Transfer KB | Unused JS KB |",
    "|---|---|---|---|---|---|---|---|---|---|---|---|---|---|",
    ...rows.map(
      (r) =>
        `| ${r.ff} | \`${r.route}\` | **${r.perf}** (${r.perfAll.join("/")}) | ${r.a11y} | ${r.bp} | ${r.seo} | ${r.fcp.toFixed(0)} | ${r.lcp.toFixed(0)} | ${r.tbt.toFixed(0)} | ${r.cls.toFixed(3)} | ${r.si.toFixed(0)} | ${r.tti.toFixed(0)} | ${r.kb.toFixed(0)} | ${r.unusedKb.toFixed(0)} |`,
    ),
    "",
  ].join("\n");
  writeFileSync(join(root, "docs", "perf", `${label}.md`), md);
  console.log(`\nWrote docs/perf/${label}.md`);
} finally {
  server.kill();
}
process.exit(exitCode);

// Fails if a route's INITIAL JavaScript (the scripts its server-rendered HTML references)
// exceeds its budget. Run after `npm run build`:  npm run perf:budget
// Sizes are gzip level 6 of the emitted chunks: an estimate of transfer size, comparable
// run to run on the same build tool, not a substitute for Lighthouse (`npm run perf`).
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

// Budgets in KB (gzip), measured 2026-11-08 after the optimisation work (docs/perf, ADR 0007):
//   no-experiment routes: ~182 KB (React + Next runtime are ~150 KB of that)
//   routes that mount an experiment: ~214 KB (the schema library, ~30 KB, is needed there)
// Headroom is deliberately small so growth is noticed. Override with PERF_BUDGET_KB.
const PLAIN_BUDGET_KB = Number(process.env.PERF_BUDGET_KB ?? 195);
const EXPERIMENT_BUDGET_KB = Number(process.env.PERF_BUDGET_KB ?? 225);
const budgetFor = (route) =>
  route.startsWith("/experiments/") || route === "/" ? EXPERIMENT_BUDGET_KB : PLAIN_BUDGET_KB;
const ROUTES = {
  "/": "index.html",
  "/explore": "explore.html",
  "/experiments/algorithm-arena": "experiments/algorithm-arena.html",
  ...(existsSync(join(".next", "server", "app", "experiments", "neural-network.html"))
    ? { "/experiments/neural-network": "experiments/neural-network.html" }
    : {}),
};
// Routes that have no experiment must not ship the schema library at all.
const NO_ZOD = new Set(["/explore"]);

let failed = false;
for (const [route, file] of Object.entries(ROUTES)) {
  const htmlPath = join(".next", "server", "app", file);
  if (!existsSync(htmlPath)) {
    console.error(`missing ${htmlPath}: run \`npm run build\` first`);
    process.exit(2);
  }
  const html = readFileSync(htmlPath, "utf8");
  const srcs = [
    ...new Set([...html.matchAll(/(?:src|href)="(\/_next\/static\/[^"]+\.js)"/g)].map((m) => m[1])),
  ];
  let total = 0;
  let zod = false;
  for (const s of srcs) {
    const f = join(".next", s.replace("/_next/", ""));
    if (!existsSync(f)) continue;
    const buf = readFileSync(f);
    total += gzipSync(buf, { level: 6 }).length;
    if (buf.includes("ZodError")) zod = true;
  }
  const kb = total / 1024;
  const budget = budgetFor(route);
  const over = kb > budget;
  const badZod = NO_ZOD.has(route) && zod;
  if (over || badZod) failed = true;
  console.log(
    `${over || badZod ? "FAIL" : "ok  "} ${route.padEnd(32)} ${kb.toFixed(1).padStart(6)} KB gz initial JS (budget ${budget})` +
      (badZod ? "  <- ships Zod but has no experiment" : ""),
  );
}
process.exit(failed ? 1 : 0);

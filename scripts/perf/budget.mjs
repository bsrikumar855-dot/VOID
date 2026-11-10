// Fails if a route's INITIAL JavaScript (the scripts its server-rendered HTML references)
// exceeds its budget. Run after `npm run build`:  npm run perf:budget
// Sizes are gzip level 6 of the emitted chunks: an estimate of transfer size, comparable
// run to run on the same build tool, not a substitute for Lighthouse (`npm run perf`).
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

// Budgets in KB (gzip), measured 2026-11-08 after the optimisation work (docs/perf, ADR 0007):
//   no-experiment routes: ~182 KB (React + Next runtime are ~150 KB of that)
//   routes that mount an experiment: ~210 KB (the schema library, ~30 KB, is needed there)
// Headroom is deliberately small so growth is noticed. Override with PERF_BUDGET_KB.
const PLAIN_BUDGET_KB = Number(process.env.PERF_BUDGET_KB ?? 195);
const EXPERIMENT_BUDGET_KB = Number(process.env.PERF_BUDGET_KB ?? 225);
const budgetFor = (route) =>
  route.startsWith("/experiments/") || route === "/" ? EXPERIMENT_BUDGET_KB : PLAIN_BUDGET_KB;
// Experiment routes come from the folders in src/experiments (the folder name is the slug, see
// CONTRIBUTING.md), so a new experiment is budgeted without editing this file, and a missing
// build output for one fails loudly instead of being skipped.
const experimentSlugs = readdirSync(join("src", "experiments"))
  .filter((d) => existsSync(join("src", "experiments", d, "manifest.ts")))
  .sort();
if (experimentSlugs.length === 0) {
  console.error("no experiments found under src/experiments");
  process.exit(2);
}
const ROUTES = {
  "/": "index.html",
  "/explore": "explore.html",
  ...Object.fromEntries(experimentSlugs.map((s) => [`/experiments/${s}`, `experiments/${s}.html`])),
};
// Everything not on a checked route's initial load (lazy experiment views, other routes) is
// tracked as one number so a bloated lazy view cannot pass unnoticed. KB gzip; measured 16.4 on
// 2026-11-10 (two experiments) plus headroom. Raise it deliberately, with a reason in the PR, when
// an experiment legitimately needs more (a WebGL experiment will).
const LAZY_BUDGET_KB = Number(process.env.PERF_LAZY_BUDGET_KB ?? 40);
// Routes that have no experiment must not ship the schema library at all.
const NO_ZOD = new Set(["/explore"]);

/** Every emitted client chunk under .next/static (relative to .next). */
function allChunks(dir = join(".next", "static")) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...allChunks(p));
    else if (name.endsWith(".js")) out.push(p);
  }
  return out;
}

let failed = false;
const initialFiles = new Set();
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
    if (!existsSync(f)) {
      console.error(`${route}: HTML references ${s} but the file is missing`);
      process.exit(2);
    }
    initialFiles.add(f);
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

// Positive control: the "no Zod on /explore" check above only means something if the marker
// string exists in at least one emitted chunk.
const chunks = allChunks();
if (!chunks.some((f) => readFileSync(f).includes("ZodError"))) {
  console.error(
    'control failed: "ZodError" appears in no chunk, so the no-Zod guard proves nothing',
  );
  process.exit(2);
}
let lazy = 0;
for (const f of chunks)
  if (!initialFiles.has(f)) lazy += gzipSync(readFileSync(f), { level: 6 }).length;
const lazyKb = lazy / 1024;
const lazyOver = lazyKb > LAZY_BUDGET_KB;
if (lazyOver) failed = true;
console.log(
  `${lazyOver ? "FAIL" : "ok  "} ${"(all other JS: lazy views, other routes)".padEnd(32)} ${lazyKb.toFixed(1).padStart(6)} KB gz (budget ${LAZY_BUDGET_KB})`,
);
process.exit(failed ? 1 : 0);

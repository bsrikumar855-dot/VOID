import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Architecture boundaries (ADR 0002 D6). Proven by tests/integration/lint-boundaries.test.ts.
const experimentImportPatterns = [
  {
    group: ["@/engine/*", "!@/engine/public"],
    message: "Experiments may import only from @/engine/public.",
  },
  {
    group: ["@/experiments/*"],
    message: "Experiments must not import other experiments; share code through the engine.",
  },
  {
    group: ["@/registry", "@/registry/*", "@/app/*", "@/components/*"],
    message: "Experiments must not depend on the app shell or the registry.",
  },
];

const coreOnlyBans = [
  { name: "react", message: "core/ must be framework-free." },
  { name: "react-dom", message: "core/ must be framework-free." },
  { name: "next", message: "core/ must be framework-free." },
];

const boundaryRules = [
  {
    files: ["src/experiments/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { patterns: experimentImportPatterns }],
    },
  },
  {
    files: ["src/experiments/**/core/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: coreOnlyBans,
          patterns: [
            ...experimentImportPatterns,
            {
              group: ["next/*", "react/*", "react-dom/*"],
              message: "core/ must be framework-free.",
            },
          ],
        },
      ],
      "no-restricted-globals": [
        "error",
        ...[
          "window",
          "document",
          "navigator",
          "localStorage",
          "performance",
          "Date",
          "requestAnimationFrame",
          "setTimeout",
          "setInterval",
        ].map((name) => ({
          name,
          message: "core/ must be pure and deterministic (no DOM, clocks or timers).",
        })),
      ],
      "no-restricted-properties": [
        "error",
        {
          object: "Math",
          property: "random",
          message: "core/ must use the seeded PRNG, not Math.random.",
        },
      ],
    },
  },
  {
    files: ["src/engine/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/experiments/*", "@/registry", "@/registry/*"],
              message: "The engine must not depend on experiments or the registry.",
            },
          ],
        },
      ],
    },
  },
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...boundaryRules,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored third-party skill files (see docs/decisions); not project source.
    ".claude/**",
  ]),
]);

export default eslintConfig;

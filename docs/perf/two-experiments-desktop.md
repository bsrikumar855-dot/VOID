# Lighthouse results: two-experiments-desktop

Lighthouse 13.6.0 (pinned in package.json), production build served by `next start` on localhost, default Lighthouse throttling (mobile: simulated slow 4G + 4x CPU; desktop: desktop preset). **Median of 3 runs** per cell; the three raw performance scores are shown to expose variance.

Environment: win32 10.0.26200, AMD Ryzen 7 4800H with Radeon Graphics x16, 15.4 GB RAM, Node v24.13.1, browser: C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe
Date: 2026-11-08T13:37:34.435Z

| Form | Route | Perf (runs) | A11y | Best practices | SEO | FCP ms | LCP ms | TBT ms | CLS | Speed Index ms | TTI ms | Transfer KB | Unused JS KB |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| desktop | `/` | **100** (100/100/100) | 100 | 100 | 100 | 223 | 223 | 0 | 0.005 | 240 | 223 | 281 | 49 |
| desktop | `/explore` | **100** (100/100/100) | 100 | 100 | 100 | 216 | 216 | 0 | 0.000 | 216 | 216 | 279 | 61 |
| desktop | `/experiments/algorithm-arena` | **100** (100/100/100) | 100 | 100 | 100 | 214 | 214 | 0 | 0.057 | 291 | 214 | 279 | 48 |
| desktop | `/experiments/neural-network` | **100** (100/100/100) | 100 | 100 | 100 | 212 | 212 | 0 | 0.020 | 212 | 212 | 281 | 48 |

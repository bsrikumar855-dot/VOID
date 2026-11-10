# Lighthouse results: three-experiments-desktop

Lighthouse 13.6.0 (pinned in package.json), production build served by `next start` on localhost, default Lighthouse throttling (mobile: simulated slow 4G + 4x CPU; desktop: desktop preset). **Median of 3 runs** per cell; the three raw performance scores are shown to expose variance.

Environment: win32 10.0.26200, AMD Ryzen 7 4800H with Radeon Graphics x16, 15.4 GB RAM, Node v24.13.1, browser: C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe
Date: 2026-11-10T16:20:59.889Z

| Form | Route | Perf (runs) | A11y | Best practices | SEO | FCP ms | LCP ms | TBT ms | CLS | Speed Index ms | TTI ms | Transfer KB | Unused JS KB |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| desktop | `/` | **100** (100/100/100) | 100 | 100 | 100 | 219 | 219 | 0 | 0.005 | 239 | 219 | 283 | 49 |
| desktop | `/explore` | **100** (100/100/100) | 100 | 100 | 100 | 215 | 215 | 0 | 0.000 | 215 | 215 | 285 | 61 |
| desktop | `/experiments/algorithm-arena` | **100** (100/100/100) | 100 | 100 | 100 | 215 | 215 | 0 | 0.057 | 306 | 215 | 281 | 48 |
| desktop | `/experiments/neural-network` | **100** (100/100/100) | 100 | 100 | 100 | 217 | 217 | 0 | 0.021 | 217 | 217 | 283 | 48 |
| desktop | `/experiments/glitch-lab` | **100** (100/100/100) | 100 | 100 | 100 | 218 | 218 | 0 | 0.059 | 221 | 218 | 283 | 48 |

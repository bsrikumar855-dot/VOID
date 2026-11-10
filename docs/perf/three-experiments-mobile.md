# Lighthouse results: three-experiments-mobile

Lighthouse 13.6.0 (pinned in package.json), production build served by `next start` on localhost, default Lighthouse throttling (mobile: simulated slow 4G + 4x CPU; desktop: desktop preset). **Median of 5 runs** per cell; the three raw performance scores are shown to expose variance.

Environment: win32 10.0.26200, AMD Ryzen 7 4800H with Radeon Graphics x16, 15.4 GB RAM, Node v24.13.1, browser: C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe
Date: 2026-11-10T16:17:02.426Z

| Form | Route | Perf (runs) | A11y | Best practices | SEO | FCP ms | LCP ms | TBT ms | CLS | Speed Index ms | TTI ms | Transfer KB | Unused JS KB |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mobile | `/` | **100** (73/100/100/100/100) | 100 | 100 | 100 | 767 | 767 | 83 | 0.000 | 767 | 2737 | 283 | 49 |
| mobile | `/explore` | **100** (100/100/100/100/100) | 100 | 100 | 100 | 763 | 763 | 72 | 0.000 | 763 | 2541 | 285 | 61 |
| mobile | `/experiments/algorithm-arena` | **100** (100/100/100/100/100) | 100 | 100 | 100 | 763 | 763 | 76 | 0.000 | 976 | 2728 | 281 | 48 |
| mobile | `/experiments/neural-network` | **100** (100/100/100/99/100) | 100 | 100 | 100 | 763 | 763 | 90 | 0.000 | 763 | 2734 | 283 | 48 |
| mobile | `/experiments/glitch-lab` | **100** (100/100/100/100/100) | 100 | 100 | 100 | 764 | 764 | 79 | 0.002 | 764 | 2728 | 283 | 48 |

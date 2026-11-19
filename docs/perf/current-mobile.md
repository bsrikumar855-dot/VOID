# Lighthouse results: current-mobile

Lighthouse 13.6.0 (pinned in package.json), production build served by `next start` on localhost, default Lighthouse throttling (mobile: simulated slow 4G + 4x CPU; desktop: desktop preset). **Median of 5 runs** per cell; the three raw performance scores are shown to expose variance.

Environment: win32 10.0.26200, AMD Ryzen 7 4800H with Radeon Graphics x16, 15.4 GB RAM, Node v24.13.1, browser: C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe
Date: 2026-11-19T14:19:34.325Z

| Form | Route | Perf (runs) | A11y | Best practices | SEO | FCP ms | LCP ms | TBT ms | CLS | Speed Index ms | TTI ms | Transfer KB | Unused JS KB |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mobile | `/` | **100** (100/100/100/100/100) | 100 | 100 | 100 | 766 | 766 | 46 | 0.000 | 766 | 2989 | 369 | 49 |
| mobile | `/explore` | **100** (100/100/100/100/100) | 100 | 100 | 100 | 764 | 764 | 70 | 0.000 | 764 | 2389 | 273 | 61 |
| mobile | `/experiments/algorithm-arena` | **100** (100/100/100/100/100) | 100 | 100 | 100 | 763 | 763 | 83 | 0.000 | 968 | 2732 | 270 | 48 |
| mobile | `/experiments/neural-network` | **99** (99/99/99/100/99) | 100 | 100 | 100 | 763 | 763 | 97 | 0.000 | 763 | 2749 | 272 | 48 |
| mobile | `/experiments/glitch-lab` | **100** (100/100/100/100/100) | 100 | 100 | 100 | 762 | 762 | 82 | 0.002 | 762 | 2728 | 271 | 48 |

# Lighthouse results: two-experiments-mobile

Lighthouse 13.6.0 (pinned in package.json), production build served by `next start` on localhost, default Lighthouse throttling (mobile: simulated slow 4G + 4x CPU; desktop: desktop preset). **Median of 5 runs** per cell; the three raw performance scores are shown to expose variance.

Environment: win32 10.0.26200, AMD Ryzen 7 4800H with Radeon Graphics x16, 15.4 GB RAM, Node v24.13.1, browser: C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe
Date: 2026-11-08T13:34:21.681Z

| Form | Route | Perf (runs) | A11y | Best practices | SEO | FCP ms | LCP ms | TBT ms | CLS | Speed Index ms | TTI ms | Transfer KB | Unused JS KB |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mobile | `/` | **100** (100/99/100/100/100) | 100 | 100 | 100 | 765 | 765 | 76 | 0.000 | 765 | 2729 | 281 | 49 |
| mobile | `/explore` | **100** (100/100/100/100/100) | 100 | 100 | 100 | 763 | 763 | 72 | 0.000 | 763 | 2542 | 279 | 61 |
| mobile | `/experiments/algorithm-arena` | **100** (100/100/100/100/100) | 100 | 100 | 100 | 762 | 762 | 74 | 0.000 | 974 | 2720 | 279 | 48 |
| mobile | `/experiments/neural-network` | **100** (100/100/100/100/100) | 100 | 100 | 100 | 760 | 760 | 81 | 0.000 | 760 | 2723 | 281 | 48 |

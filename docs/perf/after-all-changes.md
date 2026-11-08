# Lighthouse results: after

Lighthouse 13.6.0 (pinned in package.json), production build served by `next start` on localhost, default Lighthouse throttling (mobile: simulated slow 4G + 4x CPU; desktop: desktop preset). **Median of 3 runs** per cell; the three raw performance scores are shown to expose variance.

Environment: win32 10.0.26200, AMD Ryzen 7 4800H with Radeon Graphics x16, 15.4 GB RAM, Node v24.13.1, browser: C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe
Date: 2026-11-08T12:57:56.437Z

| Form | Route | Perf (runs) | A11y | Best practices | SEO | FCP ms | LCP ms | TBT ms | CLS | Speed Index ms | TTI ms | Transfer KB | Unused JS KB |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mobile | `/` | **93** (97/93/92) | 100 | 100 | 100 | 883 | 883 | 322 | 0.000 | 883 | 3677 | 297 | 47 |
| mobile | `/explore` | **100** (100/100/100) | 100 | 100 | 100 | 830 | 830 | 84 | 0.000 | 830 | 2826 | 260 | 28 |
| mobile | `/experiments/algorithm-arena` | **99** (99/97/100) | 100 | 100 | 100 | 842 | 842 | 138 | 0.000 | 1075 | 3386 | 293 | 47 |
| desktop | `/` | **100** (100/100/100) | 100 | 100 | 100 | 246 | 246 | 0 | 0.005 | 307 | 246 | 297 | 47 |
| desktop | `/explore` | **100** (100/100/100) | 100 | 100 | 100 | 230 | 230 | 0 | 0.000 | 230 | 230 | 260 | 28 |
| desktop | `/experiments/algorithm-arena` | **100** (100/100/100) | 100 | 100 | 100 | 233 | 233 | 0 | 0.057 | 375 | 233 | 293 | 47 |

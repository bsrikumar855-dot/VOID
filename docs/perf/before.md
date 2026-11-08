# Lighthouse results: before

Lighthouse 13.6.0 (pinned in package.json), production build served by `next start` on localhost, default Lighthouse throttling (mobile: simulated slow 4G + 4x CPU; desktop: desktop preset). **Median of 3 runs** per cell; the three raw performance scores are shown to expose variance.

Environment: win32 10.0.26200, AMD Ryzen 7 4800H with Radeon Graphics x16, 15.4 GB RAM, Node v24.13.1, browser: C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe
Date: 2026-11-08T12:45:25.141Z

| Form | Route | Perf (runs) | A11y | Best practices | SEO | FCP ms | LCP ms | TBT ms | CLS | Speed Index ms | TTI ms | Transfer KB | Unused JS KB |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mobile | `/` | **99** (99/100/99) | 100 | 96 | 100 | 775 | 775 | 94 | 0.000 | 778 | 2867 | 283 | 48 |
| mobile | `/explore` | **100** (100/99/100) | 100 | 100 | 100 | 772 | 772 | 68 | 0.000 | 772 | 2826 | 282 | 59 |
| mobile | `/experiments/algorithm-arena` | **99** (99/99/98) | 100 | 96 | 100 | 773 | 773 | 113 | 0.000 | 1106 | 2975 | 281 | 47 |
| desktop | `/` | **100** (100/100/100) | 100 | 96 | 100 | 219 | 219 | 0 | 0.005 | 274 | 219 | 283 | 48 |
| desktop | `/explore` | **100** (100/100/100) | 100 | 100 | 100 | 217 | 217 | 0 | 0.000 | 217 | 217 | 282 | 59 |
| desktop | `/experiments/algorithm-arena` | **100** (100/100/100) | 100 | 96 | 100 | 221 | 221 | 0 | 0.057 | 346 | 221 | 281 | 47 |

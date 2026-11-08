# Lighthouse results: ab-static-host

Lighthouse 13.6.0 (pinned in package.json), production build served by `next start` on localhost, default Lighthouse throttling (mobile: simulated slow 4G + 4x CPU; desktop: desktop preset). **Median of 5 runs** per cell; the three raw performance scores are shown to expose variance.

Environment: win32 10.0.26200, AMD Ryzen 7 4800H with Radeon Graphics x16, 15.4 GB RAM, Node v24.13.1, browser: C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe
Date: 2026-11-08T13:06:43.521Z

| Form | Route | Perf (runs) | A11y | Best practices | SEO | FCP ms | LCP ms | TBT ms | CLS | Speed Index ms | TTI ms | Transfer KB | Unused JS KB |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mobile | `/` | **100** (96/100/100/99/100) | 100 | 100 | 100 | 768 | 768 | 65 | 0.000 | 768 | 2829 | 284 | 49 |
| mobile | `/explore` | **100** (99/100/100/100/100) | 100 | 100 | 100 | 763 | 763 | 83 | 0.000 | 763 | 2554 | 284 | 60 |
| mobile | `/experiments/algorithm-arena` | **99** (99/99/99/99/99) | 100 | 100 | 100 | 766 | 766 | 101 | 0.000 | 1027 | 2759 | 283 | 48 |

# Lighthouse results: ab-no-inlinecss

Lighthouse 13.6.0 (pinned in package.json), production build served by `next start` on localhost, default Lighthouse throttling (mobile: simulated slow 4G + 4x CPU; desktop: desktop preset). **Median of 5 runs** per cell; the three raw performance scores are shown to expose variance.

Environment: win32 10.0.26200, AMD Ryzen 7 4800H with Radeon Graphics x16, 15.4 GB RAM, Node v24.13.1, browser: C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe
Date: 2026-11-08T13:01:18.979Z

| Form | Route | Perf (runs) | A11y | Best practices | SEO | FCP ms | LCP ms | TBT ms | CLS | Speed Index ms | TTI ms | Transfer KB | Unused JS KB |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mobile | `/` | **99** (97/99/100/99/99) | 100 | 100 | 100 | 773 | 773 | 139 | 0.000 | 773 | 3314 | 286 | 47 |
| mobile | `/explore` | **100** (100/100/100/100/100) | 100 | 100 | 100 | 766 | 766 | 41 | 0.000 | 766 | 2708 | 252 | 28 |

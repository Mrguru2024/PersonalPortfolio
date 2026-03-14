# Startup Funnel Integration — Audit

## Pages & Routes

| Route | Label | Action |
|-------|--------|--------|
| `/` | Home | **KEEP** |
| `/brand-growth` | Brand Growth hub | **KEEP** |
| `/free-growth-tools` | Free growth tools hub | **REVISE** — add Startup Growth Kit + Startup Website Score tool entries |
| `/digital-growth-audit` | Digital Growth Audit | **KEEP** |
| `/website-revenue-calculator` | Revenue calculator | **KEEP** — reuse in startup funnel (no duplicate) |
| `/website-performance-score` | Website performance score | **KEEP** |
| `/competitor-position-snapshot` | Competitor snapshot | **KEEP** |
| `/homepage-conversion-blueprint` | Homepage blueprint | **KEEP** |
| `/strategy-call` | Strategy session | **KEEP** |
| `/startup-mvp-development` | Startup MVP (who we serve) | **KEEP** — link to startup funnel where relevant |
| `/resources/*` | — | **MOVE** — new segment for startup resources |
| `/tools/*` | — | **MOVE** — new segment for startup website score tool |
| `/offers/*` | — | **MOVE** — new segment for startup offer |

## Components

| Component | Action |
|-----------|--------|
| `RecommendedNextStep` | **KEEP** — reuse for startup CTA |
| `RevenueLossCalculator` | **KEEP** — reused, not duplicated |
| `WebsiteScoreCard` | **KEEP** — existing; new `StartupWebsiteScoreCard` for founder-focused tool |
| `AuditRequestForm` / `StrategyCallForm` | **KEEP** |
| `PageSEO`, `Card`, `Button`, etc. | **KEEP** |

## Lead Magnets / Tools

| Tool | Path | Action |
|------|------|--------|
| Digital Growth Audit | `/digital-growth-audit` | **KEEP** |
| Revenue Calculator | `/website-revenue-calculator` | **KEEP** — linked from startup funnel |
| Website Performance Score | `/website-performance-score` | **KEEP** |
| Competitor Snapshot | `/competitor-position-snapshot` | **KEEP** |
| Homepage Blueprint | `/homepage-conversion-blueprint` | **KEEP** |
| Startup Website Score | `/tools/startup-website-score` | **MERGE** — new tool under existing tools section (free-growth-tools) |
| Startup Growth Kit | `/resources/startup-growth-kit` | **MERGE** — new resource, linked from Free tools / Startup MVP |

## API Routes

| Route | Action |
|-------|--------|
| `/api/audit`, `/api/strategy-call`, `/api/competitor-snapshot` | **KEEP** |
| No new API required for startup score (client-side score). | — |

## Navigation

| Location | Action |
|----------|--------|
| Header primaryNav | **KEEP** — no extra top-level item; startup flows from Free tools |
| Header whoWeServeSubmenu (Startup MVP) | **KEEP** — optional REVISE: add "Startup growth kit" link or leave as-is |
| Footer GROWTH_LINKS / WHO_WE_SERVE_LINKS | **KEEP** — optional link to startup kit |
| Free growth tools page | **REVISE** — add Startup Growth Kit card + Startup Website Score tool card |

## Funnel Flow (Target)

1. **Startup Growth Kit** (`/resources/startup-growth-kit`) — educational entry
2. **Startup Website Score** (`/tools/startup-website-score`) — tool
3. **Revenue Calculator** (`/website-revenue-calculator`) — existing, linked
4. **Startup Action Plan** (`/resources/startup-action-plan`) — practical steps
5. **Startup Growth System Offer** (`/offers/startup-growth-system`) — $249–$399 offer

No duplicate tools. Revenue calculator is reused.

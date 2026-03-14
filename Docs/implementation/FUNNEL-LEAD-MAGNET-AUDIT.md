# Funnel & Lead Magnet Audit — $100M Leads Implementation

## Routes (app directory)

| Route | Classification | Notes |
|-------|----------------|--------|
| `/` | KEEP | Home; hero, sections, CTAs |
| `/audit` | REVISE → redirect to `/digital-growth-audit` | Current audit page; make canonical under /digital-growth-audit |
| `/digital-growth-audit` | BUILD | New primary lead magnet page (hero, 3 reviews, form) |
| `/free-growth-tools` | KEEP | Lead magnet hub |
| `/competitor-position-snapshot` | KEEP | Lead magnet |
| `/homepage-conversion-blueprint` | KEEP | Lead magnet |
| `/services` | KEEP | Add calculator + audit CTAs |
| `/contact`, `/strategy-call`, `/call-confirmation` | KEEP | Contact flow |
| `/about`, `/results`, `/brand-growth` | KEEP | Core funnel |
| `/partners/*` | KEEP | Partner pages |
| `/assessment`, `/assessment/results` | KEEP | Project scoping (different from lead magnets) |
| `/blog`, `/blog/[slug]` | KEEP | Content |
| `/projects/[id]` | KEEP | Portfolio |
| `/resume`, `/faq`, `/recommendations` | KEEP | Supporting |
| `/contractor-systems`, `/local-business-growth`, `/startup-mvp-development` | KEEP | Pathway pages |
| `/launch-your-brand`, `/rebrand-your-business`, `/marketing-assets` | KEEP | Service paths |
| Admin/dashboard/auth | KEEP | Not part of public funnel |

## Lead capture components

| Component | Classification | Notes |
|-----------|----------------|--------|
| AuditRequestForm | KEEP + MERGE | Use on /digital-growth-audit; same form, API /api/audit |
| StrategyCallForm | KEEP | Contact/call flow |
| RecommendedNextStep | KEEP | Bridge to paid offers |
| RevenueLossCalculator | BUILD | New component (Phase 3) |
| WebsiteScoreCard | BUILD | New component (Phase 5) |

## Navigation & footer

| Item | Classification | Notes |
|------|----------------|--------|
| Header primaryNav | REVISE | Add "Digital Growth Audit"; keep Free tools |
| Footer FOOTER_LINKS | REVISE | Add calculator link; audit → digital-growth-audit |
| Footer CTAs | KEEP | Primary audit, secondary call |

## Duplicates / consolidation

- **/audit vs /digital-growth-audit**: One canonical lead magnet page at /digital-growth-audit; /audit redirects.
- **CTA sections**: Use reusable CTASection or inline; avoid duplicate copy.
- **Service descriptions**: PREMIUM_OFFERS in funnel-content is single source; no duplicate service blocks.

## Dead / unused

- None removed in this pass; audit only.

## API

| Endpoint | Classification | Notes |
|----------|----------------|--------|
| POST /api/audit | KEEP | Used by AuditRequestForm / digital-growth-audit form |
| POST /api/strategy-call | KEEP | Call request |
| POST /api/competitor-snapshot | KEEP | Snapshot lead capture |

## Paid offers (funnel-content)

| Offer | Classification | Notes |
|-------|----------------|--------|
| Website Optimization System | KEEP | Bridge from calculator + score |
| Brand + Website System | KEEP | Bridge from audit + blueprint |
| Business Growth System | KEEP | Bridge from full audit |

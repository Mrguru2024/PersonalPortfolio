# Lead Magnet Stack — Phase 1 Audit

## Routes

| Route | Status | Notes |
|-------|--------|--------|
| `/audit` | **KEEP** | Digital Growth Audit; hero, cards, AuditRequestForm, CTA. |
| `/assessment`, `/assessment/results` | **KEEP** | Project scoping wizard + results; different intent from lead magnets. |
| `/strategy-call` | **KEEP** | StrategyCallForm, confirmation flow. |
| `/call-confirmation` | **KEEP** | Post-call confirmation. |
| `/contact` | **KEEP** | Contact + StrategyCallForm. |
| `/website-revenue-loss-calculator` | **MISSING** | Not in codebase. Add as placeholder on hub; link to audit or “coming soon.” |
| `/website-performance-score` | **MISSING** | Not in codebase. Same as above. |
| `/competitor-position-snapshot` | **BUILD** | New guided assessment + result view. |
| `/homepage-conversion-blueprint` | **BUILD** | New content + checklist + CTA. |
| `/free-growth-tools` or `/resources` | **BUILD** | Lead magnet hub; 5 cards. |

## Form & API

| Item | Status | Notes |
|------|--------|--------|
| `AuditRequestForm` | **KEEP** | react-hook-form + zod, POST /api/audit. |
| `StrategyCallForm` | **KEEP** | Same pattern, POST /api/strategy-call. |
| POST `/api/audit` | **KEEP** | Normalizes body, calls portfolioController.submitContactForm; reuse for new lead captures with subject/message. |
| POST `/api/strategy-call` | **KEEP** | Same pattern. |
| New snapshot submission | **REUSE** | POST /api/audit with subject e.g. “Competitor Position Snapshot” and structured message, or thin POST /api/competitor-snapshot that forwards to same contact pipeline. |

## Reusable Patterns

| Pattern | Status | Use for |
|---------|--------|---------|
| Page layout | **KEEP** | container, py-10 sm:py-14, hero (icon + h1 + subtext), sections, Card, Button CTAs. |
| `funnel-content.ts` | **KEEP + REVISE** | CHALLENGE_OPTIONS, STAGE_OPTIONS, etc.; add industry/market options for snapshot if needed. |
| Card + CardContent | **KEEP** | All lead magnet cards and result panels. |
| Form (Form, FormField, Input, Textarea, Select) | **KEEP** | Snapshot form. |
| PREMIUM_OFFERS | **KEEP** | Bridge to Website Optimization, Brand+Website, Business Growth. |

## Components to Add (no duplication)

- **Lead magnet hub** – Single page with 5 cards (Audit, Revenue Calculator, Performance Score, Snapshot, Blueprint).
- **Competitor snapshot** – Form (business name, URL, industry, city, 1–3 competitors, main service) → structured result (4 sections) + disclaimer + CTAs.
- **Homepage Blueprint** – Content page: hero, blueprint overview, “what most get wrong,” “why it matters,” self-check checklist, CTA.
- **RecommendedNextStep** – Small section component: “Recommended next step” + one offer card + CTA (reusable on audit, snapshot, blueprint, hub).

## Classification Summary

- **KEEP:** /audit, /assessment, /strategy-call, /contact, AuditRequestForm, StrategyCallForm, /api/audit, /api/strategy-call, existing layout/Card/form patterns, funnel-content, PREMIUM_OFFERS.
- **BUILD:** /competitor-position-snapshot, /homepage-conversion-blueprint, /free-growth-tools, RecommendedNextStep, snapshot API (thin wrapper or reuse /api/audit).
- **ADD (placeholder):** Revenue Loss Calculator and Website Performance Score as hub cards + “coming soon” or “Get your free audit” CTA until full tools exist.

## Navigation / Integration

- **Header:** Add “Free Growth Tools” (or “Resources”) under Services or as main nav item linking to /free-growth-tools.
- **Footer:** Add “Free Growth Tools” link; keep “Free audit” and “Book a call.”
- **Homepage:** Highlight Audit + one other (Blueprint or hub link).
- **Services:** Highlight Audit + Homepage Blueprint.
- **Results:** Highlight Competitor Snapshot.
- **About:** Optional hub or audit CTA.

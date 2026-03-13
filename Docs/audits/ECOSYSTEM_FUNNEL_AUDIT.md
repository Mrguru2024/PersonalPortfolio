# Ascendra Ecosystem Funnel — Phase 1 Audit Report

**Date:** March 2025  
**Scope:** Premium 3-partner funnel (Ascendra Technologies, Macon Designs, Style Studio Branding) — audit only; implementation follows in Phase 2.

**Status (March 2026):** Phase 2 implemented. All ecosystem routes exist: `/brand-growth`, `/launch-your-brand`, `/rebrand-your-business`, `/marketing-assets`, `/strategy-call`, `/call-confirmation`, and `/partners/*`. Home is funnel-led; nav has Brand Growth, Services dropdown, Who we serve dropdown, and Book a call. Strategy-call form includes Main Need and project goals; call-confirmation has "What to expect" reassurance. Partner pages use light brand accents (Macon amber, Style Studio red, Ascendra primary).

---

## 1. Required ecosystem routes (all created)

| URL | Purpose |
|-----|---------|
| `/brand-growth` | Master Funnel Hub — path selector, 3 pillars, process, CTAs |
| `/launch-your-brand` | Funnel A — new business launch |
| `/rebrand-your-business` | Funnel B — rebrand & website |
| `/marketing-assets` | Funnel C — Style Studio–led marketing assets |
| `/strategy-call` | Strategy call form → `/call-confirmation` |
| `/call-confirmation` | Thank-you + prep checklist |
| `/partners/macon-designs` | Partner authority — Denishia, brand identity |
| `/partners/style-studio-branding` | Partner authority — Kristopher, production design |
| `/partners/ascendra-technologies` | Partner authority — Anthony, dev & automation |

---

## 2. CTA wiring (implemented)

| Page | Primary CTA | Secondary |
|------|-------------|-----------|
| `/brand-growth` | Start Your Brand Growth Plan (path selector) | Book Strategy Call → `/strategy-call` |
| `/launch-your-brand` | Book Brand Launch Call → `/strategy-call` | Back to Brand Growth |
| `/rebrand-your-business` | Book Rebrand Strategy Call → `/strategy-call` | Back to Brand Growth |
| `/marketing-assets` | Start Marketing Upgrade → `/strategy-call` | Back to Brand Growth |
| `/strategy-call` | Submit + Schedule Call (form → `/call-confirmation`) | — |
| `/call-confirmation` | Back to Brand Growth | — |
| Partner pages | Book Strategy Call | Brand Growth → `/brand-growth` |

---

## 3. What to preserve

- All existing routes: home, `/audit`, contractor-systems, local-business-growth, startup-mvp-development, blog, assessment, contact, resume, auth, projects, admin.
- Existing CTAs (audit, contact) on persona landings; ecosystem is additive.
- `/api/contact`, `/api/audit`; strategy-call uses its own API or contact with type.

---

## 4. Phase 2 implementation order (completed)

1. Shared constants (`funnelCtas.ts`) — BRAND_GROWTH_PATH, STRATEGY_CALL_PATH, labels.
2. Strategy-call API and form schema.
3. Master Funnel Hub (`/brand-growth`).
4. Funnel paths: launch, rebrand, marketing-assets.
5. Strategy-call page and call-confirmation page.
6. Partner authority pages (macon-designs, style-studio-branding, ascendra-technologies).
7. Nav and footer (Brand Growth, Strategy Call, Services dropdown, Who we serve).
8. Optional home entry (funnel-led hero; primary CTA Brand Growth Plan).
9. SEO and content (PageSEO per page; blog CTAs to strategy call).

---

## 5. Component reuse

- **PageSEO** — all funnel and partner pages.
- **Button, Card, Badge** — CTAs, pillars, process.
- **Form, Input, Select** — strategy-call form (react-hook-form + zod).
- **Accordion** — FAQ on path pages (reusable FaqSection).
- **framer-motion** — hero and sections; reduced-motion respected.
- Root layout, FixedHeaderWrapper, SiteFooter — no new layout.

---

## 6. Funnel connection (no breaking changes)

- Traffic → `/brand-growth` (hub).
- Hub → path selector → launch / rebrand / marketing-assets.
- Path pages → `/strategy-call` → `/call-confirmation`.
- Partner pages → hub and strategy-call.
- Existing flows (audit, contact, contractor/local/startup) unchanged.

For full Phase 2 step-by-step plan, CTA matrix, and risk list, see repo history or the original audit snapshot. This document is the post-implementation summary.

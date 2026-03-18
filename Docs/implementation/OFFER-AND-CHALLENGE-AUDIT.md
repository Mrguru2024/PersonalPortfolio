# Offer Management + Paid Challenge Funnel — Audit & Implementation Plan

## A. Audit Summary

### What exists already

| Area | Location | Notes |
|------|----------|------|
| **Site offers** | `shared/schema.ts` → `siteOffers` | slug, name, metaTitle, metaDescription, sections (JSON). Admin: `app/admin/offers/`, `app/admin/offers/[slug]/edit`. API: GET/POST `/api/admin/offers`, GET/PUT `/api/admin/offers/[slug]`. |
| **Offer sections** | `app/lib/offerSections.ts` | Typed OfferHero, OfferPrice, OfferDeliverable, OfferCta, DEFAULT_OFFER_SECTIONS. |
| **Funnel content** | `funnelContent` table, `app/admin/funnel/` | Admin-editable funnel copy by slug. |
| **CRM** | `shared/crmSchema.ts` | crmAccounts, crmContacts, crmDeals, crmActivityLog, pipelineStage, status, tags, customFields (JSON). |
| **Lead capture** | `server/services/leadFromFormService.ts` | ensureCrmLeadFromFormSubmission(): get/create contact, attribution, scoring, segmentation. |
| **Strategy call / discovery** | `app/strategy-call/page.tsx`, `app/api/strategy-call/route.ts` | Form → portfolioController.submitContactForm → legacy contact + ensureCrmLeadFromFormSubmission. Discovery: `app/admin/crm/discovery/`, workspaces per contact. |
| **Growth diagnosis** | `lib/scoring.ts`, `lib/funnel-store.tsx`, `app/diagnosis/`, `app/results/`, `app/apply/` | Full stepper (brand, design, website, leads, automation), scoring, recommendation (Style Studio / Macon / Ascendra), growth_funnel_leads table, `/api/funnel/leads`. |
| **Payments** | Stripe | `server/services/stripeInvoiceService.ts`, `clientInvoices`, invoices for quotes. No generic “product checkout” yet. |
| **Email** | `server/services/emailService.ts` | Brevo; sendGrowthDiagnosisToUser, sendGrowthLeadToAdmin, sendNotification (contact, quote, etc.). |
| **Admin layout** | `app/admin/layout.tsx` | Protected, sidebar. Reuse for challenge leads and offer grading. |
| **Forms / UI** | React Hook Form, Zod, `@/components/ui/*`, Tailwind, Framer Motion | Reuse for challenge checkout, apply, and offer editor. |

### What can be reused

- **CRM**: Extend with tags (`challenge_lead`), source (`challenge`), and customFields (challengeStatus, diagnosisScore, recommendedBrandPath, qualificationSubmitted, readyForCall). No second CRM.
- **Discovery flow**: Challenge “Apply for strategy call” → same strategy-call form or API, with context (challenge + diagnosis) in notes/customFields so discovery prep sees it.
- **Growth diagnosis**: Reuse existing questions, scoring, and recommendation logic inside challenge flow (dashboard or post-completion).
- **Lead creation**: Reuse ensureCrmLeadFromFormSubmission (or equivalent) when registering for challenge; add challenge-specific fields in customFields and optional challenge_registrations table for progress.
- **Offer editing**: Extend existing admin offer edit with optional content grading (SEO, design readiness, copy clarity); store grades in offer or related table.

### What should be extended

- **site_offers**: Optional `grading` JSON for content-grade results (or separate `offer_content_grades` table).
- **LeadCustomFields** (`shared/leadCustomFields.ts`): Add challengeStatus, orderBumpPurchased, diagnosisScore, diagnosisBreakdown, recommendedBrandPath, qualificationSubmitted, readyForCall.
- **Storage/API**: New challenge registration + progress tables and APIs; extend admin CRM list/filter to show challenge leads and grades.

---

## B. Implementation Plan (build order)

1. **Schema**: Add `challenge_registrations`, `challenge_lesson_progress`; add optional `grading` to site_offers (or `offer_content_grades`); extend LeadCustomFields.
2. **Content grading**: Add `lib/contentGrading.ts` (SEO, design readiness, copy clarity); extend admin offer edit with “Grade content” and display; optional AI enhancement.
3. **Challenge config**: Add `lib/challenge/config.ts` (pricing, order bump, lesson titles, CTAs).
4. **Challenge landing**: `app/challenge/page.tsx` — hero, benefits, who it’s for, 5 days, pricing, order bump, FAQ, CTA.
5. **Checkout**: `app/challenge/checkout/page.tsx` + `app/api/challenge/register/route.ts` — collect participant info, order bump, create/update CRM contact (tag challenge_lead), create challenge_registration; payment-ready structure (Stripe placeholder if no product checkout).
6. **Welcome**: `app/challenge/welcome/page.tsx` — post-registration confirmation and link to dashboard.
7. **Dashboard**: `app/challenge/dashboard/page.tsx` — 5-day lessons, progress tracker, milestone CTA, link to diagnosis and apply.
8. **Progress API**: `app/api/challenge/progress/route.ts` — mark lesson complete, sync to challenge_lesson_progress and CRM customFields.
9. **Diagnosis in challenge**: Reuse existing diagnosis (link from dashboard or embed); on completion write diagnosis to contact customFields and challenge state.
10. **Apply**: `app/challenge/apply/page.tsx` + API — qualification form; update contact customFields and “ready for call”; CTA to strategy-call with context.
11. **Thank-you**: `app/challenge/thank-you/page.tsx` — confirmation and next steps.
12. **Admin**: Challenge leads list/filter on existing CRM (or lightweight `/admin/challenge/leads`), show challenge status, progress, diagnosis, recommended path; offer grading in offer edit.

---

## C. Files to create / modify

### New files

- `lib/contentGrading.ts` — content grading (SEO, design, copy).
- `lib/challenge/config.ts` — challenge pricing, lessons, order bump, CTAs.
- `app/lib/contentGrading.ts` — re-export for app.
- `app/lib/challenge/config.ts` — re-export for app.
- `app/challenge/page.tsx` — landing.
- `app/challenge/checkout/page.tsx` — registration form.
- `app/challenge/welcome/page.tsx` — onboarding confirmation.
- `app/challenge/dashboard/page.tsx` — lesson list + progress.
- `app/challenge/apply/page.tsx` — qualification form.
- `app/challenge/thank-you/page.tsx` — confirmation.
- `app/api/challenge/register/route.ts` — create registration + CRM contact.
- `app/api/challenge/progress/route.ts` — lesson completion (GET/POST).
- `app/api/challenge/apply/route.ts` — qualification submission.
- `app/api/admin/offers/[slug]/grade/route.ts` — run content grade and save to offer.
- `app/api/admin/challenge/leads/route.ts` — list challenge leads (admin).
- `app/admin/challenge/leads/page.tsx` — admin challenge leads list.
- `Docs/implementation/OFFER-AND-CHALLENGE-AUDIT.md` — this doc.

### Schema changes

- `shared/schema.ts`: Add `challenge_registrations`, `challenge_lesson_progress`; add `grading` JSON to site_offers if desired.
- `shared/leadCustomFields.ts`: Add challenge-related fields.

### Modified files

- `server/storage.ts` — challenge registration and progress CRUD; optional getSiteOffer with grading.
- `app/admin/offers/[slug]/edit/page.tsx` — “Grade content” button and grade display (optional).
- `app/admin/crm/page.tsx` or new `app/admin/challenge/leads/page.tsx` — filter/list challenge leads and show status, diagnosis, recommended path.

---

## D. Reused logic (no duplication)

- **CRM**: Single pipeline; challenge leads are contacts with source=challenge, tags include `challenge_lead`; challenge-specific data in customFields and optional challenge_registrations for progress.
- **Discovery**: Final CTA goes to existing strategy-call flow; challenge + diagnosis context stored in contact notes/customFields for discovery prep.
- **Growth diagnosis**: Same questions and scoring in `lib/scoring.ts`; used from challenge dashboard or post-completion; results written to contact customFields.
- **Email**: Existing Brevo helpers; add sendChallengeWelcome, sendChallengeLeadToAdmin, sendQualifiedChallengeLead if needed.
- **Forms**: Same React Hook Form + Zod + UI components as rest of site.

---

## E. Environment variables

- Existing: `BREVO_API_KEY`, `ADMIN_EMAIL`, `DATABASE_URL`, Stripe vars for invoices.
- Optional for content grading AI: `OPENAI_API_KEY` (already used elsewhere).
- Optional for challenge payment: `STRIPE_CHALLENGE_PRICE_ID` or similar when implementing real checkout.

---

## F. Migrations / schema changes

- **shared/schema.ts**: Added `OfferContentGrading` type and `grading` JSON column to `siteOffers`. Added `challengeRegistrations` and `challengeLessonProgress` tables with unique constraint on (registrationId, day). Run `npm run db:push` to apply.

---

## G. Setup instructions

1. Run `npm run db:push` after adding challenge tables and optional site_offers.grading.
2. Ensure Brevo and (if used) Stripe env vars are set.
3. Visit `/challenge` for landing; `/admin/offers` to edit offers and (if implemented) run content grading.

---

## H. Test steps

1. **Offers**: Edit an offer in admin, run “Grade content” (if implemented), confirm grades display.
2. **Challenge**: Open `/challenge` → checkout (no payment) → welcome → dashboard → complete a lesson → complete diagnosis → submit apply → thank-you.
3. **CRM**: In admin CRM (or challenge leads), confirm new contact with source=challenge, tags challenge_lead, customFields with challenge status and diagnosis.
4. **Discovery**: From challenge apply, open strategy-call; confirm contact has challenge/diagnosis context for discovery prep.

---

## I. Overlap prevention

- **Single CRM**: All challenge participants become (or update) crm_contacts; no separate “challenge CRM”.
- **Single discovery flow**: Strategy-call and discovery workspaces unchanged; challenge apply adds context to the same contact/deal.
- **Single diagnosis engine**: Same lib/scoring and funnel store used by both free diagnosis funnel and challenge; only storage of result differs (growth_funnel_leads vs contact customFields).
- **Offers**: Content grading extends existing site_offers admin; no duplicate offer system.

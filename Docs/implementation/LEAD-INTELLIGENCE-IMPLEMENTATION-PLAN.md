# Lead Intelligence & Workflow Automation — Implementation Plan

## Audit Summary (abbreviated)

- **Stack:** Next.js 16 (App Router), React 19, Drizzle ORM, PostgreSQL (Neon), Tailwind + shadcn/ui, Brevo email, custom session auth.
- **Reuse:** `crm_contacts` (has leadScore, intentLevel, source, tags, customFields), `visitor_activity` (eventType, leadId, sessionId, metadata with UTM), `contacts` (form submissions), admin dashboard/CRM, `useVisitorTracking`, `emailService`, `storage`, auth helpers.
- **Gaps:** No dedicated lifecycle/attribution columns on leads, no unified event enum for all funnel events, no rule-based scoring engine, no workflow trigger/action layer, no multi-step qualification form, audit/calculator not persisted to leads, no growth insights module.

## Architecture Decisions

1. **Lead model:** Extend `crm_contacts` with new columns (lifecycle_stage, last_activity_at, booked_call_at, website_url, utm_source, utm_medium, utm_campaign, referring_page, landing_page). Use existing `tags` for segment tags. Store rich qual fields (businessType, teamSize, pain points, goals, budget ranges) in `customFields` with a typed interface so we can add columns later if needed.
2. **Events:** Extend `visitor_activity.eventType` and `/api/track/visitor` to accept new event types (e.g. lead_magnet_download, pricing_view, calculator_complete, audit_complete, form_abandon, booking_click, booking_complete, etc.). Keep one table; add `component`/`section` in metadata.
3. **Scoring:** New `server/services/leadScoringService.ts` (or `app/lib/leadScoring.ts`) with rule-based points and bands (cold/warm/qualified/sales_ready). Update `crm_contacts.leadScore` and optionally write to a `lead_score_events` table for history.
4. **Segmentation:** New `app/lib/leadSegmentation.ts` (or server service) that computes tags from profile + behavior; called when lead is updated or on a schedule.
5. **Forms:** New multi-step qualification flow (new page + API) that creates/updates `crm_contacts` and `contacts`, tracks form_start/form_abandon/form_submit; reuse existing UI components.
6. **Audit tool:** New backend for audit submission (save to DB, link to lead, compute score band, return result); frontend already has audit request form — add a “score” result page or section.
7. **Revenue calculator:** Persist submission to DB, link to lead, trigger scoring event.
8. **Workflows:** Lightweight `server/services/workflowEngine.ts` with trigger types and action runners (update lead, send email, create task); invoked from API routes after relevant events.
9. **Admin:** Extend `admin/dashboard` or add `admin/leads-insights` with new widgets and filters; add growth insights API + admin section.

## Implementation Phases

| Phase | Description | Deliverables |
|-------|-------------|--------------|
| 1 | Data model & event tracking | Schema additions, extended track API and frontend event types, attribution on lead |
| 2 | Lead scoring & segmentation | Scoring service, segment service, wire into lead create/update and event handler |
| 3 | Multi-step qualification form | Form flow, API, progress save, event tracking |
| 4 | Audit tool backend & result | Audit API, score rules, result categories, attach to lead |
| 5 | Revenue calculator backend | Calculator API, persist result, attach to lead, event |
| 6 | Workflow engine | Trigger/action registry, run on lead_created, form_completed, etc. |
| 7 | Admin dashboard & insights | New metrics, filters, growth insights summaries |
| 8 | Security & validation | Zod schemas, rate limits, spam protection, error handling |

---

## Phase 1 — Data Model & Event Tracking (current)

- Add columns to `crm_contacts`: `website_url`, `lifecycle_stage`, `last_activity_at`, `booked_call_at`, `utm_source`, `utm_medium`, `utm_campaign`, `referring_page`, `landing_page`.
- Extend `visitor_activity` metadata to store `component`/`section` when provided.
- Extend allowed event types in `/api/track/visitor` and `useVisitorTracking`: e.g. lead_magnet_download, pricing_view, calculator_start, calculator_complete, audit_tool_start, audit_tool_complete, form_start, form_abandon, form_submit, booking_click, booking_complete, video_play, section_engagement, return_visit.
- When a contact is created from a form, create or update `crm_contacts` and set attribution (utm_*, referring_page, landing_page) from request body or visitor context.
- Document `customFields` shape for lead intelligence (businessType, teamSize, pain points, etc.) for use in forms and admin.

---

## Phase 2 — Lead scoring & segmentation (done)

- **server/services/leadScoringService.ts:** Rule-based points per event type (SCORING_RULES), score bands (cold/warm/qualified/sales_ready), `addScoreFromEvent(storage, leadId, eventType, metadata)` and `addScoreForServicePagesViewed`. Writes to `lead_score_events` and updates `crm_contacts.leadScore`, `lifecycleStage`, `intentLevel`, `lastActivityAt`.
- **server/services/leadSegmentationService.ts:** `computeSegmentTags(input)` from profile + recent events; `mergeSegmentTags(existing, computed)`. Tags: startup_founder, local_service_business, ecommerce, redesign_lead, funnel_lead, branding_plus_web, audit_interested, high_intent, low_intent, nurture_only, sales_ready.
- **server/services/leadFromFormService.ts:** `ensureCrmLeadFromFormSubmission(input)` — get or create CRM contact, set attribution, run form_submit scoring and segmentation, attach visitor if `visitorId` provided.
- **Contact form:** portfolioController.submitContactForm now calls ensureCrmLeadFromFormSubmission after createContact (with body.utm_*, referrer, landing_page, visitorId).
- **Track visitor API:** When `leadId` is present, calls `addScoreFromEvent` for the event type (including page_view for service pages).
- **Shared types:** `shared/leadTrackingTypes.ts`, `shared/leadCustomFields.ts`; app/lib re-exports for app code.

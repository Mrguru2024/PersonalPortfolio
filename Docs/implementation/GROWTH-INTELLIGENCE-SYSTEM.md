# Growth Intelligence System — Implementation Plan

**Purpose:** Production-ready analytics, attribution, experimentation, and optimization **inside** the existing Ascendra architecture. Used first by Ascendra internally; structured for reuse and monetization for client projects.

**Constraints:** Do NOT create a disconnected analytics app, duplicate CRM, or a separate funnel. Integrate as the tracking, attribution, experiment, optimization, and insight layer on top of existing funnel, CRM, and admin.

---

## 1. Current State (What Already Exists)

### Tracking & events
- **`visitor_activity`** (shared/crmSchema): `visitorId`, `leadId`, `sessionId`, `pageVisited`, `eventType`, `referrer`, device/geo, **metadata** (JSON with UTM, url, component, section).
- **`/api/track/visitor`**: Accepts `eventType`, `pageVisited`, `metadata` (UTM merged from client). Creates activity; when `leadId` present, calls `addScoreFromEvent`.
- **`useVisitorTracking`** (app/lib): Reads UTM from URL, sends page_view + custom events to `/api/track/visitor` with metadata (utm_*, url, component, section).
- **Lead tracking event types** (shared/leadTrackingTypes.ts): page_view, cta_click, form_start, form_submit, audit_tool_*, calculator_*, booking_*, etc.

### Attribution on leads
- **`crm_contacts`**: `utm_source`, `utm_medium`, `utm_campaign`, `referring_page`, `landing_page`, `source`.
- **`crm_deals`**: `source`, `campaign`, `medium`, `referring_page`, `landing_page`.
- **`leadFromFormService.ensureCrmLeadFromFormSubmission`**: Sets attribution from `attribution` (utm_*, referrer, landing_page, visitorId) on create/update; attaches visitor to lead.
- **Contact form** (portfolioController): Passes attribution (body.utm_*, referrer, landing_page, visitorId) into ensureCrmLeadFromFormSubmission.

### Admin & reporting
- **GET /api/admin/analytics/reports**: Filtered event report (date, eventType, page, device, country, UTM); uses `storage.getVisitorActivityFiltered`.
- **GET /api/admin/analytics/website**: Traffic and lead-magnet summary; uses visitor_activity.
- **Admin analytics page** (app/admin/analytics/page.tsx): Tabs for traffic, events, reports, demographics (GA4/Facebook when configured).
- **CRM lead profile**: Shows “Source & attribution” (utm_*, referring_page, landing_page).

### External analytics (server-side)
- **app/lib/analytics-providers.ts**: GA4 Data API (demographics), Facebook Insights; “use internal visitor_activity + UTM for attribution” when Vercel Analytics has no API.

### Gaps (to be filled by Growth Intelligence)
- No **aggregated attribution view**: “Which UTM/campaign/source drive the most leads and best lead quality?”
- No **A/B tests**: No experiment or variant model; no way to run tests on CTAs, headlines, offers.
- No **content/landing performance** view: “Which pages and content convert best?”
- No **client-side GA4 / PostHog / Meta Pixel** in the app (only server-side GA4 in analytics-providers).
- No **optimization layer**: No “underperforming CTA” or “winning variant” signals that influence the site or admin.

---

## 2. Growth Intelligence System — Layer Definition

The system is a **layer** that sits on top of and inside the current stack:

| Layer | Role | Reuses | Adds |
|-------|------|--------|------|
| **Tracking** | Capture events and UTM everywhere | visitor_activity, /api/track/visitor, useVisitorTracking | Ensure UTM + component/section on all key CTAs and forms; optional PostHog/GA4 client/Meta Pixel |
| **Attribution** | Tie traffic and campaigns to leads and outcomes | crm_contacts.utm_*, crm_deals, visitor_activity.metadata | Aggregation APIs and admin views: by source/campaign/page, with lead count and quality |
| **Experiment** | A/B tests on copy, CTA, offers | — | growth_experiments, growth_variants, growth_assignments; variant resolution (client or edge); results aggregation |
| **Optimization** | Use data to improve conversion | Scoring, segments, workflows | Insights: “best performing landing page”, “underperforming CTA”; optional auto-suggestions |
| **Insight** | Reporting and decisions | Admin analytics, CRM | Growth dashboard: attribution summary, experiment results, funnel health, lead quality by source |

---

## 3. Technical Stack (Aligned with Existing)

- **Existing:** Next.js 16 App Router, TypeScript, Drizzle ORM, PostgreSQL (Neon), Tailwind, React Hook Form, Brevo, @vercel/analytics.
- **No Prisma** (project uses Drizzle).
- **Introduce only when needed:**
  - **PostHog:** Product analytics + feature flags + A/B tests (optional; can run experiments in-app first with growth_experiments).
  - **GA4 client:** gtag or react-ga4 for acquisition/campaign analytics (optional; server-side GA4 already used for demographics).
  - **Meta Pixel + Conversions API:** For paid campaigns and attribution (optional).
- **Vercel-ready:** Use env vars for API keys; serverless-friendly patterns.

---

## 4. Unique Opportunities (Agency / Lead Gen)

1. **Lead quality by source** — Segment leads by utm_source / utm_campaign; report avg lead_score, conversion to deal, won rate. Surfaces which channels bring “good” leads, not just volume.
2. **Content and landing performance** — Which pages (and which sections) lead to form_submit / booking_click. Which offers (e.g. audit vs challenge) convert best.
3. **Funnel step conversion** — From first touch (page_view with UTM) to form_start → form_submit → lead → deal. Single funnel tied to CRM.
4. **Experiments on CTAs and offers** — A/B test headline, CTA text, or offer (e.g. “Free audit” vs “Growth diagnosis”); measure by conversion and lead quality.
5. **Attribution that influences routing** — Use “best source” and “best landing page” to suggest where to send paid traffic or which partner (Ascendra / Style Studio / Macon) to emphasize.
6. **Repeatable package** — Same schema and APIs can be white-labeled for client projects: same tracking layer, attribution, experiments, with client-specific goals and branding.

---

## 5. Implementation Phases

### Phase 1 — Attribution aggregation (no new dependencies)
- **Reuse:** visitor_activity, crm_contacts, crm_deals, existing UTM and event types.
- **Add:**
  - **GET /api/admin/growth-intelligence/attribution**  
    Aggregate by utm_source, utm_medium, utm_campaign (and optionally landing_page):  
    - Count of events (page_view, form_submit, cta_click).  
    - Count of leads (contacts) and deals created.  
    - Optional: avg lead_score, count of deals won.  
    - Date range and filters (same style as existing reports).
  - **Admin:** New section or tab under Analytics (or dashboard): “Attribution” with table/chart by source/campaign and lead/deal counts.
- **Outcome:** One place to see “which campaigns and sources drive leads and deals.”

### Phase 2 — Experiment schema and variant resolution
- **Add (shared schema):**
  - **growth_experiments** — id, key (e.g. `homepage_hero_cta`), name, status (draft | running | paused | ended), start_at, end_at, created_at.
  - **growth_variants** — id, experiment_id, key (e.g. `control`, `variant_a`), name, config (JSON: e.g. { "label": "Get audit", "href": "/audit" }).
  - **growth_assignments** — visitor_id or session_id, experiment_id, variant_id, assigned_at (for sticky assignment).
- **Add:**
  - **GET /api/growth-intelligence/variant?experiment=key** — Returns assigned variant for current visitor/session (cookie or header); creates assignment if none. Used by frontend to render CTA or headline.
  - **POST /api/track/visitor** — Already receives metadata; add optional `experiment_key`, `variant_key` so conversion events are tied to experiments.
- **Admin:** CRUD for experiments and variants; view results (conversion count per variant).
- **Outcome:** Run A/B tests on CTAs, headlines, or offers without PostHog (PostHog can be added later for more advanced features).

### Phase 3 — Content and landing performance
- **Reuse:** visitor_activity (pageVisited, eventType), metadata (section, component).
- **Add:**
  - **GET /api/admin/growth-intelligence/performance**  
    Aggregations: by page (path), by section/component: event counts (page_view, cta_click, form_submit), lead count, deal count. Optional: top converting pages, underperforming pages (high traffic, low conversion).
- **Admin:** “Content performance” or “Landing performance” view.
- **Outcome:** Data-driven decisions on which pages and content to optimize or promote.

### Phase 4 — Optional: PostHog, GA4 client, Meta Pixel
- **PostHog:** Install `posthog-js`; init in root layout (env: NEXT_PUBLIC_POSTHOG_*). Send key events (page_view, form_submit, cta_click) as PostHog events; use for product analytics and/or feature flags. Keep `/api/track/visitor` as source of truth for CRM tie-in; optionally send same events to PostHog for dashboards.
- **GA4 client:** Add gtag script and event calls for page_view and conversion events (e.g. form_submit, booking) so GA4 acquisition and campaigns reports are populated. Server-side GA4 (analytics-providers) remains for demographics.
- **Meta Pixel + CAPI:** Add Pixel script and Conversions API (server) for Meta ad attribution and optimization. Pass event_name and user data (hash) where permitted.
- **Outcome:** Industry-standard acquisition and campaign analytics alongside internal attribution.

### Phase 5 — Optimization and insights
- **Add:** “Insights” or “Recommendations” derived from attribution + performance: e.g. “Top 3 sources by lead quality,” “Pages with high traffic and low conversion,” “Winning variant for experiment X.”
- **Admin:** Growth dashboard or “Insights” tab that surfaces these; optional: link to CRM segments (e.g. “Leads from campaign Y”).
- **Outcome:** Actionable signals that influence where to invest and what to test next.

---

## 6. Integration Points (No Duplication)

- **Forms (contact, strategy call, audit, challenge, etc.):**  
  Already pass attribution (utm_*, referrer, landing_page, visitorId) where implemented. Ensure every form that creates a lead includes these (and visitorId from useVisitorTracking) so attribution is complete.
- **CTAs and key links:**  
  useVisitorTracking().track('cta_click', { component, section, pageVisited }). Ensure critical CTAs (audit, diagnosis, booking, challenge) send this so reports and experiments can attribute conversions.
- **CRM:**  
  Do not duplicate. Growth Intelligence reads from crm_contacts and crm_deals for attribution aggregates and lead quality; it does not create a second “lead” or “contact” store.
- **Funnel:**  
  Funnel steps (diagnosis, challenge, offer, checkout) remain as today. Growth Intelligence tracks behavior (events) and ties to leads when they convert; it does not replace funnel logic.
- **Admin:**  
  New routes and UI live under existing admin (e.g. /admin/analytics with new tabs, or /admin/growth-intelligence). Reuse auth (isAdmin), layout, and components.

---

## 7. File and Route Conventions

- **Schema:** New tables in `shared/crmSchema.ts` or `shared/growthIntelligenceSchema.ts` (exported from shared/schema.ts so Drizzle includes them).
- **Storage:** New methods in `server/storage.ts` (or a dedicated `server/growthIntelligenceStorage.ts` that uses db and is called from API routes).
- **API routes:** `app/api/admin/growth-intelligence/*` for admin-only aggregation and experiment CRUD; `app/api/growth-intelligence/variant` for public variant resolution (no auth).
- **Lib:** `app/lib/growth-intelligence/` or `lib/growth-intelligence/` for types, constants, and helpers (e.g. variant resolution, experiment key validation).
- **Admin UI:** New sections in `app/admin/analytics/page.tsx` or new `app/admin/growth-intelligence/page.tsx` with sub-routes for attribution, experiments, performance.

---

## 8. Success Criteria

- Traffic sources and UTM are accurately tracked and visible in admin.
- Every lead (contact) has attribution (utm_*, landing_page) where the conversion path provides it.
- Admin can see “which campaigns/sources drive leads and deals” in one place.
- A/B tests can be run on at least one surface (e.g. hero CTA) with results by variant.
- No duplicate CRM or funnel; all logic integrates with existing Ascendra flow.
- System is structured so it can later be packaged for client projects (env-driven, optional PostHog/GA4/Meta).

---

## 9. Next Steps (Immediate)

1. **Phase 1 (done):** Attribution aggregation API and schema/APIs for experiments.
   - Run `npm run db:push` to create tables: `growth_experiments`, `growth_variants`, `growth_assignments`.
   - **GET /api/admin/growth-intelligence/attribution** — returns leads/deals/won/avg lead score by UTM (query: `since`, `until`). Admin only.
   - **GET /api/growth-intelligence/variant?experiment=key&visitorId=...** — returns assigned variant (or assigns one); public.
2. **Phase 2 (next):** Add admin view for attribution (tab or page under Analytics) and CRUD for experiments/variants; wire one experiment (e.g. homepage CTA) as proof of concept.
3. Document where to add `track('cta_click', …)` and attribution on every lead-creating form for full coverage.

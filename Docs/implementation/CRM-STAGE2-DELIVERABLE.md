# CRM Stage 2 — Intelligence Layer Deliverable

## Overview

Stage 2 adds the **intelligence layer** for Ascendra Tech’s CRM: who the lead is, how good the opportunity is, what action should happen next, what research is missing, which segment/list they belong to, and which sources are strongest. No outbound sequences, no full AI provider integrations, no enterprise overbuild.

---

## Architecture Summary

### Services

- **`server/services/crmCompletenessService.ts`**  
  Computes profile completeness (0–100, label, missing fields) for:
  - Contact (name, email, phone, company, jobTitle, accountId, source, leadScore, etc.)
  - Account (name, website, industry, companySize, etc.)
  - Deal (title, value, pipelineStage, serviceInterest, primaryPainPoint, budgetRange, etc.)
  - Research profile (companySummary, websiteFindings, pain points, suggested fit, etc.)

- **`server/services/leadScoringService.ts`**  
  - `computeSuggestedLeadScore(signals)` — rule-based suggested score from currentLeadScore, hasPrimaryPainPoint, hasBudgetRange, hasResearch, pipelineStage, etc.

- **`server/services/crmFoundationService.ts`**  
  - **Source quality**: `SOURCE_QUALITY` tiers and `getSourceQualityScore(source)` for attribution weighting.
  - **AI fit**: `calculateAiFitScore(contact, account?)` — source quality, websiteUrl, phone, account/research signals.
  - **AI priority**: `calculateAiPriorityScore(deal, hasResearch?)` — source quality, research, value, stage.
  - **Next-best actions**: `generateNextBestActions(deal, opts?)` → `NextBestAction[]` with priority (high/medium/low); rules for account, pain point, budget, research, timeline, proposal, service interest, nurture; sorted and capped at 6.

### APIs

- **`GET /api/admin/crm/dashboard`**  
  Returns `topSources` and `topTags` (from `getCrmDashboardStats`) for dashboard insights.

- **`GET /api/admin/crm/deals`**  
  Query params: `source`, `urgencyLevel`, `sortBy` (value | score | expectedCloseAt | updatedAt), `sortOrder` (asc | desc). Filtering and sorting applied server-side.

- **`GET /api/admin/crm/insights/contact/[id]`**  
  Returns `contactCompleteness`, `researchCompleteness`, `aiFitScore`, `nextBestActions` (from primary deal or “Create opportunity” / “Add account” when none).

- **`GET /api/admin/crm/insights/deal/[id]`**  
  Returns `dealCompleteness`, `researchCompleteness`, `aiPriorityScore`, `nextBestActions`.

### Storage

- **`server/storage.ts`**  
  - `getCrmDashboardStats()` extended to return `topSources`, `topTags`.
  - `getCrmContactsBySavedListFilters()` applies `pipelineStage`, `lifecycleStage`, `tags`, `hasResearch` (and existing type/status/intentLevel/source).

### Schema

- **`shared/crmSchema.ts`**  
  - `crmSavedLists.filters` (JSON) extended with optional `pipelineStage`, `lifecycleStage`, `tags` (string[]), `hasResearch` (boolean). Backward compatible.

### UI

- **Dashboard** (`app/admin/crm/dashboard/page.tsx`): “Top sources” and “Top tags” cards; subtitle “CRM overview — contacts, accounts, pipeline, insights”.
- **Pipeline** (`app/admin/crm/pipeline/page.tsx`): Sort (value, score, expectedCloseAt, updatedAt) and filters (source, urgency); query params passed to deals API.
- **Saved lists** (`app/admin/crm/saved-lists/page.tsx`): “Create list” form with name and filters: type, status, intentLevel, source, pipelineStage, lifecycleStage, hasResearch, tags (comma-separated).
- **Contact detail** (`app/admin/crm/[id]/page.tsx`):
  - Fetches `/api/admin/crm/insights/contact/[id]`.
  - Profile completeness badge (score + label) and AI fit score in header.
  - Missing-data warnings (contact and research completeness missing fields).
  - “Next best actions” card with prioritized list from API (fallback to status-based suggestion if none).
  - “Source & attribution” card: source, UTM source/medium/campaign, referring page, landing page (when any present).

---

## Files Created

| Path | Purpose |
|------|--------|
| `server/services/crmCompletenessService.ts` | Contact, account, deal, and research completeness scoring and missing fields |
| `app/api/admin/crm/insights/contact/[id]/route.ts` | Contact insights: completeness, AI fit, next-best actions |
| `app/api/admin/crm/insights/deal/[id]/route.ts` | Deal insights: completeness, AI priority, next-best actions |
| `Docs/implementation/CRM-STAGE2-DELIVERABLE.md` | This deliverable document |

---

## Files Modified

| Path | Changes |
|------|--------|
| `shared/crmSchema.ts` | Extended saved-list filters: `pipelineStage`, `lifecycleStage`, `tags`, `hasResearch` |
| `server/storage.ts` | `getCrmDashboardStats()` → topSources, topTags; `getCrmContactsBySavedListFilters()` applies new filters |
| `server/services/leadScoringService.ts` | `computeSuggestedLeadScore(signals)` for rule-based suggested score |
| `server/services/crmFoundationService.ts` | Source quality, `calculateAiFitScore`, `calculateAiPriorityScore`, `generateNextBestActions` (priority, more rules, cap 6) |
| `app/api/admin/crm/dashboard/route.ts` | Fallback response includes `topSources: []`, `topTags: []` |
| `app/api/admin/crm/deals/route.ts` | GET: `source`, `urgencyLevel`, `sortBy`, `sortOrder` query params; filter and sort deals |
| `app/admin/crm/dashboard/page.tsx` | Top sources and top tags cards; subtitle update |
| `app/admin/crm/pipeline/page.tsx` | Sort/filter state and UI; deals fetched with query params |
| `app/admin/crm/saved-lists/page.tsx` | “Create list” form with full filter set (type, status, intent, source, pipelineStage, lifecycleStage, hasResearch, tags) |
| `app/admin/crm/[id]/page.tsx` | Insights query; profile completeness badge; missing-data warnings; next-best-actions card; source attribution card; CrmContact extended with attribution fields |

---

## DB Changes

- **None.** No new tables or columns. Only the **JSON shape** of `crm_saved_lists.filters` was extended (backward compatible; existing lists keep working).

---

## Test Checklist

- [ ] **Dashboard**: Load `/admin/crm/dashboard`; verify “Top sources” and “Top tags” cards show (or empty state).
- [ ] **Pipeline**: Load `/admin/crm/pipeline`; change sort (value, score, expected close, updated); change source/urgency filters; verify list updates.
- [ ] **Saved lists**: Create a new list with name and filters (e.g. pipelineStage, hasResearch, tags); save; open “View contacts” and confirm filtered list.
- [ ] **Contact detail**: Open a contact; verify profile completeness badge and AI fit (if API returns); verify “Missing data” and “Research profile incomplete” when applicable; verify “Next best actions” list; verify “Source & attribution” when UTM/referring/landing exist.
- [ ] **Insights API**: `GET /api/admin/crm/insights/contact/:id` and `GET /api/admin/crm/insights/deal/:id` return 200 with expected shape (completeness, scores, nextBestActions).
- [ ] **Deals API**: `GET /api/admin/crm/deals?sortBy=value&sortOrder=desc&source=website` returns filtered/sorted deals.
- [ ] **CRM list with saved list**: Select a saved list in CRM; confirm contact list is filtered by that list’s filters.

---

## Stage 3 Readiness Notes

- **Deal detail page**: Stage 2 exposes `GET /api/admin/crm/insights/deal/[id]`. A dedicated deal/opportunity detail page (e.g. `/admin/crm/deals/[id]`) can consume this for completeness, AI priority, next-best actions, and deal-level attribution (source, campaign, referringPage, landingPage on deal).
- **Research workflow**: Completeness and “needs research” are computed and shown on contact; account detail can add “Add research” CTA and research completeness badge using existing `getResearchCompleteness` and account/deal APIs.
- **Outbound sequences**: Explicitly out of Stage 2 scope; Stage 3 can add sequence enrollment and step execution on top of existing sequences infrastructure.
- **AI providers**: No new AI provider integrations in Stage 2; scoring and next-best actions are rule-based. Stage 3 can plug in optional LLM-based suggestions or enrichment.
- **Saved list edit/delete**: Currently create and view; Stage 3 can add edit filters and delete for saved lists.
- **Bulk actions**: No bulk “add to list” or “apply tag” in Stage 2; Stage 3 can add from contact list or pipeline.

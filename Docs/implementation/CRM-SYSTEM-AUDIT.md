# CRM & Lead Management — System Audit

**Date:** 2025-03  
**Scope:** Full repository scan for lead capture, admin CRM, schemas, auth, and funnel submissions.  
**Goal:** Classify existing assets (REUSE / REFACTOR / MERGE / MOVE / ARCHIVE) and define integration plan before implementation.

---

## 1. Database Schemas

| Asset | Location | Classification | Notes |
|-------|----------|----------------|-------|
| **contacts** | `shared/schema.ts` | **MERGE** | Legacy contact form submissions: name, email, phone, company, subject, message, projectType, budget, timeframe, newsletter, pricingEstimate, createdAt. Used by portfolioController.submitContactForm. No link to CRM. |
| **projectAssessments** | `shared/schema.ts` | **REUSE** | Rich lead data: name, email, phone, company, role, assessmentData (JSON), pricingBreakdown, status (pending/reviewed/contacted/archived), createdAt, updatedAt, deletedAt. Primary funnel for project quotes. |
| **crm_contacts** | `shared/crmSchema.ts` | **REUSE** | type, name, email, phone, company, jobTitle, industry, source, status, estimatedValue, notes, tags, customFields, contactId (FK to legacy), stripeCustomerId. Already used by /admin/crm. |
| **crm_deals** | `shared/crmSchema.ts` | **REUSE** | contactId, title, value, stage (qualification/proposal/negotiation/won/lost), expectedCloseAt, closedAt, notes. |
| **crm_activities** | `shared/crmSchema.ts` | **REUSE** | contactId, dealId, type, subject, body, createdAt. |
| **clientQuotes** | `shared/schema.ts` | **REUSE** | Links assessments to proposals (assessmentId, userId, quoteNumber, proposalData, totalAmount, status, viewToken). |
| **clientInvoices** | `shared/schema.ts` | **REUSE** | quoteId, userId, amount, status, etc. |
| **clientAnnouncements** | `shared/schema.ts` | **REUSE** | For client dashboard. |
| **clientFeedback** | `shared/schema.ts` | **REUSE** | userId, assessmentId, quoteId, subject, message, category, status, adminResponse. |
| **resumeRequests** | `shared/schema.ts` | **REUSE** | name, email, company, purpose, message, accessToken. Lead source. |
| **users** | `shared/schema.ts` | **REUSE** | role, permissions, isAdmin, adminApproved. For ownership and RBAC. |

**Recommendation:** Extend `crm_contacts` with optional fields (website, location, funnel entry, campaign, utm, budget range, timeline, readiness, lead score, owner, lastContactAt, nextFollowUpAt) rather than new tables. Keep `contacts` and `projectAssessments` as source systems; sync/upsert into `crm_contacts` on submission (MERGE strategy).

---

## 2. Lead Capture & Form Submission

| Source | API / Handler | Writes To | Classification | Notes |
|--------|----------------|-----------|-----------------|------|
| Contact form (site) | POST /api/contact → portfolioController.submitContactForm | **contacts** | **MERGE** | Add step: upsert or create CRM lead from contact (email/phone/company dedupe). |
| Strategy call | POST /api/strategy-call | **contacts** (via submitContactForm) | **MERGE** | Same: after saving contact, upsert crm_contact with source="strategy_call". |
| Digital growth audit | POST /api/audit | **contacts** (via submitContactForm) | **MERGE** | Upsert CRM lead, source="audit". |
| Competitor snapshot | POST /api/competitor-snapshot | **contacts** (via submitContactForm) | **MERGE** | Upsert CRM lead, source="competitor_snapshot". |
| Project assessment | POST /api/assessment | **projectAssessments** | **MERGE** | After insert assessment, upsert crm_contact (email/phone/company), link or store assessmentId in customFields/contactId. |
| Resume request | (assumed API) | **resumeRequests** | **MERGE** | If form exists, also create/update CRM lead. |
| Startup website score | StartupWebsiteScoreCard | None (client-only) | **REFACTOR** | Optional: add optional email capture + POST to new or existing “startup_score” endpoint → CRM. |

**Recommendation:** Introduce a shared `leadCapture` service (or extend portfolioController): on any contact/assessment/audit/strategy-call/competitor submission, call `ensureCrmLead(data)` which finds by email (or email+phone+company) and creates or updates `crm_contacts` and optionally creates a `crm_activities` entry (type: "form_submission", subject: source name).

---

## 3. Admin Routes & CRM UI

| Route | Exists | Classification | Notes |
|-------|--------|----------------|-------|
| /admin/crm | Yes | **REUSE** | Main CRM page: Contacts (list, add, edit, delete), Deals (by stage). Tabs: contacts, deals. Link to Personas. |
| /admin/crm/personas | Yes | **REUSE** | Personas & insights. |
| /admin/crm/leads | No | **MOVE** | Add as alias or tab: “Leads” view (filter type=lead) or redirect to /admin/crm?tab=contacts&type=lead. |
| /admin/crm/pipeline | No | **REFACTOR** | Extend current Deals tab into full pipeline (Kanban + table). Reuse existing deals API. |
| /admin/crm/tasks | No | **NEW** | New feature: tasks table + API (owner, due, type, leadId). |
| /admin/crm/communications | No | **REFACTOR** | Use existing crm_activities; add communications timeline on lead detail page. |
| /admin/crm/analytics | No | **NEW** | New dashboard page using existing data (leads by source, stage, counts). |
| /admin/crm/settings | No | **NEW** | Optional: pipeline stage names, default owner. |
| /admin/dashboard | Yes | **REUSE** | Fetches /api/admin/contacts (legacy), assessments, invoices, etc. Add CRM summary cards (new leads today, pipeline value). |

**Recommendation:** Keep /admin/crm as hub. Add sub-routes: /admin/crm/leads (filtered contacts), /admin/crm/pipeline (Kanban + table), /admin/crm/tasks, /admin/crm/analytics, /admin/crm/settings. Add /admin/crm/[id] for lead detail (overview, company, source, score, activities, notes, tasks).

---

## 4. APIs

| API | Exists | Classification | Notes |
|-----|--------|----------------|-------|
| GET/POST /api/admin/crm/contacts | Yes | **REUSE** | Filter by type. Add query params later: stage, source, owner. |
| GET/PATCH/DELETE /api/admin/crm/contacts/[id] | Yes | **REUSE** | Extend PATCH for new fields (website, location, funnel, score, owner, nextFollowUpAt, etc.). |
| GET/POST /api/admin/crm/deals | Yes | **REUSE** | GET returns deals with contact. Add PATCH for stage movement. |
| GET/PATCH/DELETE /api/admin/crm/deals/[id] | Yes | **REUSE** | Use for pipeline updates. |
| GET/POST /api/admin/crm/activities | Yes | **REUSE** | GET ?contactId=, POST body. Use for communications timeline. |
| GET /api/admin/contacts | Yes | **REUSE** | Legacy contact list (getAllContacts). Keep for “Form submissions” view or MERGE into CRM as source. |

**Recommendation:** Add GET /api/admin/crm/analytics (or /api/admin/crm/stats) for dashboard metrics (new leads today/week, by source, by stage, pipeline value). Add POST /api/admin/crm/contacts/from-contact and from-assessment if we want explicit “import” from legacy tables; otherwise do auto-sync on form submit.

---

## 5. Authentication & Authorization

| Asset | Location | Classification | Notes |
|-------|----------|----------------|-------|
| isAdmin(req) | auth-helpers | **REUSE** | Requires isAdmin && adminApproved. |
| isSuperUser(req) | auth-helpers | **REUSE** | role===developer or username 5epmgllc. |
| hasPermission(req, "crm") | auth-helpers | **REUSE** | For founder access to CRM. |
| Admin pages redirect | All /admin/* | **REUSE** | Redirect to /auth if !user or !admin. |

**Recommendation:** All CRM routes and UI remain admin-only. Use existing isAdmin or hasPermission("crm"). Add server-side checks on every CRM API. No new auth structures.

---

## 6. Storage Layer

| Method | Exists | Classification |
|--------|--------|----------------|
| createContact, getAllContacts, getContactById | Yes | **REUSE** |
| createCrmContact, updateCrmContact, deleteCrmContact, getCrmContacts, getCrmContactById | Yes | **REUSE** |
| getCrmContactsByEmails | Yes | **REUSE** (for dedupe) |
| getCrmDeals, createCrmDeal, updateCrmDeal, deleteCrmDeal | Yes | **REUSE** |
| getCrmActivities, createCrmActivity | Yes | **REUSE** |

**Recommendation:** Add: getCrmLeads(filters), getCrmPipelineStages(), and ensureCrmLeadFromContact(contact) / ensureCrmLeadFromAssessment(assessment) that upsert crm_contacts and optionally create activity. Extend crm_contacts schema (migration) for new fields; keep existing methods.

---

## 7. UI Components

| Component | Location | Classification |
|-----------|----------|-----------------|
| Card, CardHeader, CardTitle, CardContent, CardDescription | ui/card | **REUSE** |
| Button, Input, Label, Textarea | ui/* | **REUSE** |
| Tabs, TabsList, TabsTrigger, TabsContent | ui/tabs | **REUSE** |
| Dialog, Select, Badge | ui/* | **REUSE** |
| Table | ui/table | **REUSE** |
| Chart | ui/chart | **REUSE** (for analytics) |
| Calendar | ui/calendar | **REUSE** (for due dates) |

**Recommendation:** Build CRM pipeline (Kanban) and tables using existing Card, Button, Badge, Tabs, Table. No new design system.

---

## 8. Analytics & Dashboard

| Asset | Classification | Notes |
|-------|----------------|-------|
| Admin dashboard | **REUSE** | Already loads contacts, assessments, invoices, proposals. Add “CRM” summary block: new leads today, this week, by source, pipeline value. |
| Blog analytics | **REUSE** | Separate. No change. |
| Chart components | **REUSE** | Use for CRM analytics (leads by source, stage distribution). |

---

## 9. Email & Notifications

| Asset | Classification | Notes |
|-------|----------------|-------|
| emailService (e.g. sendNotification) | **REUSE** | Already used after assessment submit. No change for CRM; optional: notify owner on new lead. |

---

## 10. Funnel Entry Points (Summary)

- **Contact form** → contacts (then sync to CRM).
- **Strategy call** → contacts (then sync to CRM).
- **Audit request** → contacts (then sync to CRM).
- **Competitor snapshot** → contacts (then sync to CRM).
- **Project assessment** → projectAssessments (then sync to CRM).
- **Startup website score** → no backend yet (optional capture).
- **Resume request** → resumeRequests (optional sync to CRM).

---

## 11. Classification Summary

| Action | Items |
|--------|--------|
| **REUSE** | crm_contacts, crm_deals, crm_activities, all CRM APIs and storage methods, admin auth, /admin/crm and /admin/crm/personas, existing UI components, admin dashboard, chart. |
| **REFACTOR** | /admin/crm Deals tab → full Pipeline (Kanban + table); add Communications (activities) to lead detail; optional Startup website score capture. |
| **MERGE** | contact + strategy-call + audit + competitor-snapshot + assessment submissions → all create/update crm_contacts (single lead record, dedupe by email/phone/company). Legacy contacts and projectAssessments remain; add sync step. |
| **MOVE** | “Leads” as view or tab under /admin/crm (filter type=lead). |
| **ARCHIVE** | None. Keep all existing tables and APIs. |
| **NEW** | Pipeline stages (extended), lead detail page /admin/crm/[id], tasks (schema + API + UI), CRM analytics page, optional settings, leadCapture service. |

---

## 12. CRM Integration Plan (High Level)

1. **Schema extension**  
   Add to `crm_contacts`: website, location, funnelEntryPoint, campaign, referralSource, utmParams (json), serviceInterest, budgetRange, timeline, readiness, leadScore, lifecycleStage, pipelineStage, ownerId, lastContactAt, nextFollowUpAt, estimatedDealValue, recommendedService, probabilityToClose, internalNotes (or use notes), timestamps. Add `crm_tasks` table: leadId/contactId, type, title, dueDate, priority, ownerId, completedAt, notes.

2. **Lead capture integration**  
   In portfolioController.submitContactForm (and in POST /api/assessment), after saving to contacts or projectAssessments, call a new `leadCapture.ensureCrmLead(payload)` that: finds crm_contact by email (or email+phone+company); if not found creates one, if found updates (e.g. last source, status); sets source/funnelEntryPoint from context (contact form, strategy_call, audit, competitor_snapshot, assessment). Optionally create crm_activity type "form_submission".

3. **Admin CRM structure**  
   - /admin/crm → Keep; add “Pipeline” and “Analytics” to nav.  
   - /admin/crm/leads → List/filter leads (type=lead); reuse contacts list with filters.  
   - /admin/crm/pipeline → Kanban by pipeline stage + table view; reuse getCrmDeals + contacts.  
   - /admin/crm/[id] → Lead detail: overview, company, source, score, activities timeline, tasks, notes.  
   - /admin/crm/tasks → My tasks / team / overdue; new tasks API.  
   - /admin/crm/analytics → Cards + charts: new leads today/week, by source, by funnel, pipeline value, conversion, overdue follow-ups.  
   - /admin/crm/settings → Optional: stage names, defaults.

4. **Pipeline stages**  
   Define stages (New Lead, Needs Review, Qualified, Follow Up, Discovery Scheduled, Proposal, Negotiation, Won, Lost, Nurture). Store in crm_contacts.pipelineStage (and/or keep deals.stage). Kanban columns = stages; cards = leads or deals.

5. **Tasks**  
   New table crm_tasks; API CRUD; UI: task list and “Add task” on lead detail; views My Tasks / Overdue.

6. **Communications**  
   Use crm_activities; timeline on lead detail; “Log call/email/note” form.

7. **Security**  
   All CRM routes and APIs: isAdmin or hasPermission("crm"); sanitize inputs; no exposure to non-admin.

8. **UI**  
   Reuse Card, Table, Tabs, Button, Dialog, Badge, Select; add Kanban (drag-drop or click to move stage); keep layout consistent with existing admin pages.

---

## 13. Next Steps (Implementation Order)

1. Extend `crm_contacts` (and add `crm_tasks`) via migration; update shared/crmSchema and storage.  
2. Implement lead capture: ensureCrmLead in submitContactForm and in POST /api/assessment.  
3. Add /admin/crm/[id] lead detail page (overview, activities, notes, tasks).  
4. Extend /admin/crm pipeline: Kanban + table, stage movement.  
5. Add tasks API and /admin/crm/tasks page.  
6. Add /admin/crm/analytics with real metrics.  
7. Add filtering (source, stage, owner, score, etc.) and saved views.  
8. Optional: settings, team notes, ownership transfer.

---

*Audit complete. Proceed to implementation only after review and approval of this plan.*

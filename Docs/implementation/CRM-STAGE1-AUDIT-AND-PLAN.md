# CRM Stage 1 — Audit and Implementation Plan

## Step 1 — Audit Summary

### Framework and version
- **Next.js** (App Router), with Turbopack in dev. `package.json` uses `next` (version in lockfile).
- **React** (current).
- **TypeScript** throughout.

### Routing structure
- **App Router**: All routes under `app/`. Public: `app/(main)/`, tools, funnel, etc. Admin: `app/admin/`.

### Auth system
- **Custom session auth** (no NextAuth): `connect-pg-simple` session store in PostgreSQL.
- **Helpers**: `app/lib/auth-helpers.ts` — `getSessionUser(req)`, `isAdmin(req)`, `isSuperUser(req)`, `hasPermission(req, permission)`.
- **Users table**: `shared/schema.ts` — `users` with `id`, `username`, `password`, `email`, `isAdmin`, `adminApproved`, `role`, `permissions`, `full_name`, GitHub OAuth fields.
- Admin routes rely on `isAdmin`/`isSuperUser` in API handlers; no root middleware for `/admin`.

### Admin area
- **Existing**: `app/admin/` — dashboard, crm (list), crm/[id] (contact detail), crm/tasks, crm/sequences, crm/saved-lists, crm/personas, analytics, blog, newsletters, funnel, users, system, integrations, invoices, feedback, announcements, chat.
- **CRM today**: Contact list with type/status filters, deal list, saved lists, contact detail with timeline (activities, document events, comms), tasks, add note/activity, status update, business-card scan.

### Database and ORM
- **Drizzle ORM** with **PostgreSQL** (Neon serverless in production; local via WebSocket proxy).
- **Schema**: `shared/schema.ts` (users, contacts, projects, blog, etc.), `shared/crmSchema.ts` (crm_contacts, crm_deals, crm_activities, crm_tasks, visitor_activity, crm_alerts, lead_score_events, sequences, saved_lists).
- **Storage**: `server/storage.ts` — single `IStorage` implementation with all CRUD.

### Existing lead/contact forms
- Contact form → `POST /api/contact` → Express controller → `storage.createContact()` (legacy `contacts` table) and `ensureCrmLeadFromFormSubmission()` (CRM contact + attribution + scoring).
- Strategy call, audit request, assessment wizard exist; some write to `contacts` or `project_assessments`.

### Contact submission storage
- **Legacy**: `contacts` table (name, email, subject, message, phone, company, projectType, budget, etc.).
- **CRM**: `crm_contacts` — unified lead/client record with name, email, phone, company, jobTitle, industry, source, status, leadScore, intentLevel, lifecycleStage, tags, customFields, attribution (utm_*, referringPage, landingPage), lastActivityAt, bookedCallAt.

### Email integration
- **Brevo**: `server/services/emailService.ts` — sendNotification (contact, quote, etc.), transactional emails. Used for form notifications and workflows.

### Analytics / event tracking
- **Visitor tracking**: `app/lib/useVisitorTracking.ts`, `POST /api/track/visitor` → `visitor_activity` (eventType, pageVisited, leadId, sessionId, metadata with UTM).
- **Lead scoring**: `server/services/leadScoringService.ts` — event-based points, `lead_score_events`, lifecycle stages.
- **Segmentation**: `server/services/leadSegmentationService.ts` — tags from profile + behavior.

### UI system
- **Tailwind CSS**. **shadcn-style** components under `app/components/ui/`: Card, Button, Input, Label, Textarea, Select, Tabs, Badge, Dialog, DropdownMenu, Table, etc.
- **React Query** (`@tanstack/react-query`), `apiRequest` in `app/lib/queryClient.ts`.
- **Hooks**: `useAuth`, `useToast`. Design language: clean, card-based, badge for status.

### Gaps for Stage 1
- **No accounts/companies table** — only `company` text on contact.
- **Deals** are contact-only (no accountId); fewer qualification fields (no serviceInterest, painPoint, urgency, budgetRange, pipeline stage set, etc.).
- **Tasks** are contact-only (no relatedAccountId, relatedLeadId/dealId, assignedToUserId, taskType, status, aiSuggested).
- **Activities** are contact + optional dealId; no accountId, taskId, or createdByUserId; not a single unified activity log for all CRM events.
- **No research profiles** table.
- **Pipeline**: Deal stages are qualification | proposal | negotiation | won | lost; no new_lead, researching, nurture, etc.
- **Dashboard**: Current admin dashboard is assessment/contact/feedback focused; no CRM overview (contacts count, accounts, leads by stage, overdue tasks, activity, accounts needing research).
- **Contact model**: Missing firstName, lastName, fullName, notesSummary, ownerUserId, lastContactedAt, nextActionAt, aiFitScore; has leadScore, lifecycleStage, source, tags.

### Extension strategy (minimal disruption)
- **Extend** `crm_contacts` with optional new columns (firstName, lastName, notesSummary, ownerUserId, lastContactedAt, nextActionAt, aiFitScore, accountId).
- **Add** `crm_accounts` table. Link contacts to account via `accountId`.
- **Extend** `crm_deals` with accountId and lead/opportunity fields; add `pipeline_stage` (or alias `stage` to pipeline stages).
- **Extend** `crm_tasks` with relatedDealId, relatedAccountId, assignedToUserId, taskType, status, aiSuggested.
- **Add** `crm_activity_log` for unified timeline (contactId, accountId, leadId/dealId, taskId, type, title, content, createdByUserId).
- **Add** `crm_research_profiles` (accountId, contactId optional, summary fields).
- **Reuse** existing admin CRM pages; add Accounts list/detail, extend Dashboard, add Pipeline view and Opportunities list/detail; extend Contact/Lead detail with new fields and activity.
- **Reuse** auth (isAdmin), storage pattern, API route style, UI components.

---

## Stage 1 Implementation Plan

### Phase A — Data architecture
1. Add **crm_accounts** table (name, website, domain, industry, businessType, companySize, estimatedRevenueRange, location, serviceArea, currentWebsiteStatus, currentMarketingMaturity, growthPainPoints, leadSource, accountStatus, tags, notesSummary, ownerUserId, timestamps).
2. **crm_contacts**: Add accountId, firstName, lastName, notesSummary, ownerUserId, lastContactedAt, nextActionAt, aiFitScore. Keep `name` for backward compat (fullName = name or firstName + lastName).
3. **crm_deals** (leads/opportunities): Add accountId, serviceInterest, primaryPainPoint, businessGoal, urgencyLevel, budgetRange, confidenceLevel, lifecycleStage, pipelineStage, leadScore, aiPriorityScore, estimatedValue, estimatedCloseProbability, expectedCloseDate, source, campaign, medium, referringPage, landingPage, notesSummary. Keep existing stage/value/title for compat; use pipelineStage as canonical.
4. **crm_tasks**: Add relatedDealId, relatedAccountId, assignedToUserId, taskType, status, aiSuggested.
5. **crm_activity_log**: New table (contactId, accountId, leadId/dealId, taskId, type, title, content, metadata, createdByUserId, createdAt).
6. **crm_research_profiles**: New table (accountId, contactId optional, companySummary, websiteFindings, designUxNotes, messagingNotes, conversionNotes, seoVisibilityNotes, automationOpportunityNotes, technicalIssuesNotes, likelyPainPoints, suggestedServiceFit, suggestedOutreachAngle, aiGeneratedSummary, researchConfidence, timestamps).
7. **Pipeline stages**: Constant array; store in deal.pipelineStage (and optionally keep deal.stage in sync).

### Phase B — Storage and services
1. Storage: get/create/update/delete for accounts; get/create/update for research profiles; create/get for activity log; extend getCrmDeals (by accountId, pipelineStage), getCrmTasks (by dealId, accountId).
2. Services: `leadScoringService` (exists); add `calculateAiFitScore(contact)`, `calculateAiPriorityScore(lead)`, `generateResearchSummary(profile)` (stub), `generateNextBestActions(lead/contact)`, `logActivity(storage, payload)`.

### Phase C — API routes
1. Accounts: GET/POST /api/admin/crm/accounts, GET/PATCH/DELETE /api/admin/crm/accounts/[id].
2. Research: GET/POST /api/admin/crm/research-profiles, GET/PATCH /api/admin/crm/accounts/[id]/research (or research-profiles?accountId=).
3. Dashboard: GET /api/admin/crm/dashboard (counts, leads by stage, recent/overdue tasks, recent activity, accounts needing research).
4. Activity: POST /api/admin/crm/activity-log (create); timeline endpoints already use activities — extend to include activity_log.
5. Deals/leads: Extend existing deals API to support new fields and pipeline stages; GET /api/admin/crm/deals?pipelineStage=.

### Phase D — Admin UI
1. **Dashboard**: New or extend admin dashboard — CRM overview panel (totals, leads by stage, recent tasks, overdue, recent activity, accounts needing research).
2. **Contacts list/detail**: Extend with account link, new fields (firstName, lastName, owner, nextAction, aiFitScore); keep existing list/detail.
3. **Accounts**: New list page (search, filter, tags); new detail page (company info, contacts, leads, research profile, activity, tasks).
4. **Opportunities/Leads**: List page (deals with new fields, pipeline stage, score, value); detail page (qualification, contact/account, stage, scores, notes, tasks, research, next actions).
5. **Pipeline**: New page — stage columns with leads, company, contact, score, value, urgency, next action; stage update controls.
6. **Tasks**: Extend existing tasks page with deal/account link, taskType, status, aiSuggested.

### Phase E — Security and quality
- All new routes protected with existing `isAdmin(req)`.
- Validate inputs with Zod where new payloads.
- Activity logging on create/update for contact, account, lead, task, research.

---

## Pipeline stages (default)

- new_lead  
- researching  
- qualified  
- proposal_ready  
- follow_up  
- negotiation  
- won  
- lost  
- nurture  

---

# STAGE 1 DELIVERABLES (POST-IMPLEMENTATION)

## 1. STAGE 1 ARCHITECTURE SUMMARY

- **Schema:** Added `crm_accounts`; extended `crm_contacts` (accountId, firstName, lastName, notesSummary, ownerUserId, lastContactedAt, nextActionAt, aiFitScore); extended `crm_deals` (accountId, pipelineStage, serviceInterest, primaryPainPoint, businessGoal, urgencyLevel, budgetRange, confidenceLevel, lifecycleStage, leadScore, aiPriorityScore, estimatedCloseProbability, source, campaign, medium, referringPage, landingPage, notesSummary); extended `crm_tasks` (relatedDealId, relatedAccountId, assignedToUserId, taskType, status, aiSuggested); added `crm_activity_log` (unified timeline); added `crm_research_profiles`.
- **Storage:** getCrmAccounts, getCrmAccountById, create/update/deleteCrmAccount; getCrmContactsByAccountId; getCrmDeals(contactId?, accountId?, pipelineStage?); getCrmDashboardStats(); createCrmActivityLog, getCrmActivityLogByContactId/ByAccountId/ByDealId; getCrmResearchProfileByAccountId, getCrmResearchProfiles, create/updateCrmResearchProfile; getCrmTasks(…relatedDealId, relatedAccountId).
- **Services:** `server/services/crmFoundationService.ts` — calculateAiFitScore, calculateAiPriorityScore, generateNextBestActions, generateResearchSummary (stub), logActivity.
- **APIs:** GET/POST /api/admin/crm/accounts, GET/PATCH/DELETE /api/admin/crm/accounts/[id]; GET /api/admin/crm/dashboard; GET/POST /api/admin/crm/research-profiles, PATCH /api/admin/crm/research-profiles/[id]; GET/POST /api/admin/crm/activity-log. Extended: GET /api/admin/crm/contacts?accountId=; GET /api/admin/crm/deals?accountId=&pipelineStage=; POST deals/contacts with new fields.
- **Admin UI:** CRM Overview at /admin/crm/dashboard (totals, leads by stage, recent/overdue tasks, activity, accounts needing research); Accounts list /admin/crm/accounts, detail /admin/crm/accounts/[id], new /admin/crm/accounts/new; Pipeline /admin/crm/pipeline (stage columns). CRM main page nav updated with CRM Overview, Accounts, Pipeline links.

## 2. FILES CREATED

- `Docs/implementation/CRM-STAGE1-AUDIT-AND-PLAN.md`
- `app/lib/crm-pipeline-stages.ts`
- `server/services/crmFoundationService.ts`
- `app/api/admin/crm/accounts/route.ts`
- `app/api/admin/crm/accounts/[id]/route.ts`
- `app/api/admin/crm/dashboard/route.ts`
- `app/api/admin/crm/research-profiles/route.ts`
- `app/api/admin/crm/research-profiles/[id]/route.ts`
- `app/api/admin/crm/activity-log/route.ts`
- `app/admin/crm/dashboard/page.tsx`
- `app/admin/crm/accounts/page.tsx`
- `app/admin/crm/accounts/[id]/page.tsx`
- `app/admin/crm/accounts/new/page.tsx`
- `app/admin/crm/pipeline/page.tsx`

## 3. FILES MODIFIED

- `shared/crmSchema.ts` — crm_accounts, crm_activity_log, crm_research_profiles; new/updated columns on crm_contacts, crm_deals, crm_tasks.
- `server/storage.ts` — imports; IStorage + implementations for accounts, activity log, research profiles, dashboard stats; getCrmContactsByAccountId; getCrmDeals/getCrmDealById filters and account join; getCrmTasks filters.
- `app/api/admin/crm/contacts/route.ts` — GET ?accountId=; POST body firstName, lastName, accountId, notesSummary, ownerUserId.
- `app/api/admin/crm/deals/route.ts` — GET ?accountId=, ?pipelineStage=; POST body with pipeline and qualification fields.
- `app/admin/crm/page.tsx` — nav links: CRM Overview, Accounts, Pipeline.

## 4. DATABASE / MIGRATION STEPS

- Run `npm run db:push` to apply schema changes (new tables and columns). No manual SQL required if using Drizzle push.

## 5. ENVIRONMENT VARIABLES NEEDED

- No new env vars for Stage 1. Existing admin auth and DB config unchanged.

## 6. MANUAL TEST CHECKLIST

1. **Create account:** Log in as admin → CRM → Accounts → Add account → fill name (required), website, industry, notes → Create account → confirm redirect to account detail.
2. **Create contact:** CRM → Add contact → fill name, email; optionally link to account (accountId in API). Confirm contact appears in list.
3. **Create lead/deal:** Create a deal via API or existing flow; set pipelineStage (e.g. new_lead), accountId, contactId. Confirm deal appears in Pipeline page.
4. **Attach relationships:** On contact edit (or API PATCH), set accountId. On account detail, confirm linked contacts and deals.
5. **Add task:** CRM → Contact detail → Add task; or Tasks page. Optionally set relatedDealId/relatedAccountId via API.
6. **Add note/activity:** POST /api/admin/crm/activity-log with contactId or accountId or dealId, type "note", title, content. Confirm activity appears on contact timeline or account activity section (if wired).
7. **Update pipeline stage:** PATCH /api/admin/crm/deals/[id] with pipelineStage. Confirm Pipeline page shows lead in new column.
8. **View dashboard:** CRM → CRM Overview. Confirm totals (contacts, accounts, active leads), leads by stage, overdue tasks, recent activity, accounts needing research.
9. **Activity timeline:** Contact detail timeline uses existing activities; activity_log can be merged in a follow-up or shown on account/lead detail.
10. **Score generation:** AiFitScore and AiPriorityScore are computed in crmFoundationService; call from APIs or background when needed. Next best actions available via generateNextBestActions(deal, hasResearch).

## 7. STAGE 2 READINESS NOTES

Ready to build next:

- **Advanced analytics:** Dashboard stats and activity_log support trend queries and funnel metrics.
- **Research automation:** Research profile schema and generateResearchSummary stub ready for LLM or rules.
- **AI guidance expansion:** calculateAiFitScore, calculateAiPriorityScore, generateNextBestActions are rule-based; swap or add LLM calls in same service.
- **Workflow automation:** Triggers on contact/account/lead create or stage change can call logActivity and existing email/notification paths.
- **Outreach sequences:** Existing sequences and enrollments; link to pipeline stage or segment.
- **Imports:** Bulk import contacts/accounts via CSV using createCrmContact/createCrmAccount and optional logActivity.
- **Dashboards with more intelligence:** getCrmDashboardStats can be extended with conversion rates, source breakdown, and AI-generated summaries from activity and research data.

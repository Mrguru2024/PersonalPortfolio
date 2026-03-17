# CRM Stage 3 — AI Guidance + Recommendation Engine — Deliverable

## 1. Stage 3 Architecture Summary

- **Provider abstraction**: `ICrmAiProvider` in `server/services/ai/crmAiProvider.ts` with `RuleBasedAIProvider` producing all structured outputs from CRM data (no external API). Ready for an optional `LLMProvider` later.
- **Guidance service**: `server/services/crmAiGuidanceService.ts` loads contact/account/deal/research context, calls the provider, persists to `crm_ai_guidance`, and logs activity (`ai_guidance_generated`, `ai_recommendation_accepted`, `ai_recommendation_dismissed`).
- **Persistence**: Table `crm_ai_guidance` stores outputs by `entityType` (contact | account | deal), `entityId`, `outputType`, `content` (JSON), `providerType` (rule | llm), `version`, `generatedAt`, `generatedBySystem`, `staleAt`.
- **APIs**: GET/POST guidance per contact and account; POST recommendation/accept (creates task, logs); POST recommendation/dismiss (logs only).
- **UI**: Lead detail page has an “AI Guidance” card (Generate/Refresh, collapsible Lead summary, Opportunity assessment, Qualification gaps, Next best actions with “Add task”, Discovery questions, Proposal prep, Risk warnings). Account detail has “AI Account Summary” with Generate/Refresh. Dashboard shows “Proposal ready” count and existing “Leads missing data” / “Accounts needing research”.
- **Activity**: Timeline includes `crm_activity_log` so “AI guidance generated” and “AI recommendation accepted” appear on the contact timeline.

## 2. Files Created

| File | Purpose |
|------|---------|
| `shared/crmAiGuidanceTypes.ts` | Structured output types (LeadSummaryOutput, AccountSummaryOutput, NextBestActionItem, DiscoveryQuestionsOutput, etc.) |
| `server/services/ai/crmAiProvider.ts` | ICrmAiProvider, RuleBasedAIProvider |
| `server/services/crmAiGuidanceService.ts` | generateAndPersistLeadGuidance, generateAndPersistAccountGuidance, getPersistedGuidance, context loaders |
| `app/api/admin/crm/guidance/contact/[id]/route.ts` | GET/POST guidance for contact |
| `app/api/admin/crm/guidance/account/[id]/route.ts` | GET/POST guidance for account |
| `app/api/admin/crm/guidance/recommendation/accept/route.ts` | POST accept → create task, log |
| `app/api/admin/crm/guidance/recommendation/dismiss/route.ts` | POST dismiss → log |
| `Docs/implementation/CRM-STAGE3-AUDIT-AND-PLAN.md` | Audit + implementation plan |
| `Docs/implementation/CRM-STAGE3-DELIVERABLE.md` | This deliverable |

## 3. Files Modified

| File | Changes |
|------|---------|
| `shared/crmSchema.ts` | Added `crm_ai_guidance` table |
| `server/storage.ts` | IStorage + DatabaseStorage: createCrmAiGuidance, getCrmAiGuidanceByEntity, getCrmAiGuidanceByEntityAndType, updateCrmAiGuidance; getCrmDashboardStats: proposalReadyCount |
| `server/services/crmFoundationService.ts` | ActivityLogType: ai_guidance_generated, ai_recommendation_accepted, ai_recommendation_dismissed |
| `app/api/admin/crm/dashboard/route.ts` | Fallback response includes proposalReadyCount: 0 |
| `app/api/admin/crm/contacts/[id]/timeline/route.ts` | Include getCrmActivityLogByContactId in timeline |
| `app/admin/crm/[id]/page.tsx` | Guidance query, generate mutation, accept recommendation mutation, AI Guidance card with collapsibles (lead summary, opportunity assessment, qualification gaps, next best actions with Add task, discovery, proposal prep, risk warnings) |
| `app/admin/crm/accounts/[id]/page.tsx` | Guidance query, generate mutation, AI Account Summary card |
| `app/admin/crm/dashboard/page.tsx` | DashboardStats.proposalReadyCount, “Proposal ready” card with link to pipeline |

## 4. DB Changes / Migrations

- **New table**: `crm_ai_guidance`  
  - Columns: id, entity_type, entity_id, output_type, content (json), provider_type, version, generated_at, generated_by_system, stale_at, created_at, updated_at.  
- **No change** to `crm_activity_log` schema; new `type` values used: `ai_guidance_generated`, `ai_recommendation_accepted`, `ai_recommendation_dismissed` (stored as text).

Run: `npm run db:push` to apply.

## 5. ENV Vars Needed

- None required for Stage 3. Rule-based provider uses only CRM data. Optional future LLM provider would use `OPENAI_API_KEY` (already used elsewhere in the project).

## 6. Manual Test Checklist

- [ ] **Generate lead summary**: Open a contact (lead) detail page → AI Guidance → “Generate guidance”. Confirm Lead summary, Opportunity assessment, Next best actions, Discovery questions, Proposal prep, Risk warnings appear; show “rule”-based.
- [ ] **Generate account summary**: Open an account detail page → “Generate” in AI Account Summary. Confirm business summary, website maturity, service fit appear.
- [ ] **Save AI outputs**: After generating, refresh the page; guidance should still be there (persisted).
- [ ] **Convert recommendation into task**: On lead detail, generate guidance → Next best actions → “Add task” on one item. Confirm a new task appears in Tasks and timeline shows “AI recommendation accepted”.
- [ ] **Generate discovery questions**: Covered by “Generate guidance” on lead; open Discovery questions collapsible and confirm list.
- [ ] **Generate proposal prep notes**: Covered by “Generate guidance”; open Proposal prep notes and confirm offer direction and assumptions.
- [ ] **Verify risk warnings**: Open Risk warnings collapsible; confirm at least one warning when data is missing (e.g. no budget).
- [ ] **Verify activity logging**: Generate guidance → check Timeline tab for “AI guidance generated”. Accept a recommendation → check for “AI recommendation accepted”.
- [ ] **Verify dashboard visibility**: CRM Dashboard shows “Proposal ready” count and “Leads missing data” / “Accounts needing research”.
- [ ] **Refresh guidance**: Click “Refresh guidance” on lead; confirm content updates and timestamp/provider unchanged (rule).

## 7. Stage 4 Readiness Notes

- **LLM provider**: Implement a second provider that implements `ICrmAiProvider`, calls OpenAI (or another API) with serialized context, parses responses into the same output types, and sets `providerType: "llm"`. The guidance service accepts an optional `provider` argument; the API can choose provider based on env (e.g. OPENAI_API_KEY).
- **Stale / refresh**: Optional “staleAt” and background job to regenerate guidance when deal/contact/account/research changes.
- **Dismissed recommendations**: Optional persistence of dismissed recommendation ids so they can be hidden in UI.
- **Discovery/Proposal standalone tools**: Optional dedicated “Discovery prep” and “Proposal prep” pages that call the same provider methods and display printable checklists.

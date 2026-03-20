# Internal Studio Phase 2 — schema & admin surfaces

## Apply database changes

```bash
npm run db:push
```

## New Drizzle tables (`shared/internalStudioSchema.ts`)

| Table | Purpose |
|-------|---------|
| `internal_audit_runs` | Audit executions; `client_safe_summary_json` for future client API (admin-only today). |
| `internal_audit_scores` | Per-category score, strength state, narrative, risk, priority. |
| `internal_audit_recommendations` | Action items + `related_paths` (repo paths). |
| `internal_content_campaigns` | Campaign grouping for CMS + calendar. |
| `internal_content_templates` | Reusable HTML shells (UI seed in later phase). |
| `internal_cms_documents` | Unified internal CMS (all content types, workflow + visibility). |
| `internal_editorial_calendar_entries` | Scheduled slots; `warnings_json`; DnD `sort_order`. |
| `internal_publish_logs` | Buffer-style publish attempts / scaffold logs. |
| `internal_content_edit_history` | Snapshots before document updates. |
| `internal_platform_adapters` | Adapter registry (auto-seeded: manual, blog, newsletter, social_placeholder). |

## Admin routes

- `/admin/internal-audit` — run + history + detail w/ filters.
- `/admin/content-studio/*` — library, calendar, campaigns, workflow.

## API (all `isAdmin`)

- `/api/admin/internal-audit/runs` GET/POST  
- `/api/admin/internal-audit/runs/[id]` GET (query: `categoryKey`, `path`)  
- `/api/admin/content-studio/documents` GET/POST  
- `/api/admin/content-studio/documents/[id]` GET/PATCH  
- `/api/admin/content-studio/campaigns` GET/POST  
- `/api/admin/content-studio/calendar` GET/POST  
- `/api/admin/content-studio/calendar/[id]` GET/PATCH  
- `/api/admin/content-studio/calendar/[id]/duplicate` POST  
- `/api/admin/content-studio/calendar/reorder` PATCH  
- `/api/admin/content-studio/adapters` GET  
- `/api/admin/content-studio/publish/manual` POST  
- `/api/admin/content-studio/publish-logs` GET  

## Dependencies added

- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` — calendar reorder.

## Next phase ideas

- Tokenized public resolve for audit summaries + calendar-linked shares.  
- Template UI + content blocks editor.  
- Real social adapters + OAuth.  
- Markdown side-by-side + version diff for edit history.  
- Wire “promote to blog/newsletter” from internal document.

# Growth OS Phase 1 — database schema

Apply with your usual Drizzle workflow:

```bash
npm run db:push
```

## New tables (`shared/growthOsSchema.ts`)

| Table | Purpose |
|-------|---------|
| `gos_module_registry` | Registered GOS modules + default `default_data_visibility` + `min_admin_access_role`. |
| `gos_entity_visibility_overrides` | Per-entity visibility override (`entity_type` + `entity_id` unique). |
| `gos_internal_notes` | Internal-only notes keyed by `resource_type` / `resource_id`. |
| `gos_client_safe_report_shares` | Hashed token + `summary_payload` (sanitized JSON) + optional `expires_at`. |
| `gos_access_audit_events` | Growth OS–scoped security audit (actions, optional `visibility_context`). |

## User permissions (`users.permissions` JSON)

New optional keys (super user only via **Admin → Users**):

- `growth_os` — reserved for granular Growth OS UI (phase 2+; phase 1 hub still requires full approved admin).
- `internal_team` — drives `INTERNAL_TEAM` access role in `shared/accessScope.ts` for future internal-only tools.

No migration required on `users` columns; only new tables + permission keys.

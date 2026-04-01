# Ascendra OS — Growth Engine (Phase 2)

Phase 2 layers **revenue, automation, and action** on top of Growth Intelligence (Phase 1). It does **not** duplicate behavior ingest, replay, or heatmaps.

## Audit — what was reused

- **Behavior ingest** (`POST /api/behavior/ingest`, `behaviorIngestService`): after events persist, **`evaluateLeadSignalsAfterIngest`** runs (async, non-blocking).
- **Brevo** (`sendBrevoTransactional`): optional sends for automation runs when `emailTo` + env keys are set.
- **Conversion Diagnostics** (`buildClientConversionDiagnostics`): merged **`phase2`** overlay (scores, revenue summary, ROI hint, predictive copy).
- **Funnel admin** (`/admin/funnel/*`): content editor unchanged; **visual canvas** at **`/admin/growth-engine/funnel-canvas`**; **path vs traffic** at **`/admin/growth-engine/funnel-overview`** (joins blueprint `path` to `behavior_events.metadata.page`).
- **Stripe**: **`invoice.paid`** webhooks call **`recordGrowthRevenueFromStripeInvoicePaid`** (idempotent on `stripe_invoice_id`) with CRM resolution matching the same rules as CRM activity logging (`metadata.crmContactId`, customer email, Stripe customer id, portal invoice user / recipient).

## Schema (`shared/growthEngineSchema.ts`)

| Table | Role |
|-------|------|
| `growth_revenue_events` | Attribution / manual revenue |
| `growth_lead_signals` | Near–real-time opportunity queue |
| `growth_automation_rules` + `growth_automation_runs` | Delayed actions (email stub, extensible) |
| `growth_campaign_costs` | Manual spend for ROI |
| `growth_call_events` | Call log + verification tag |
| `growth_knowledge_entries` | **Admin-only** learnings |
| `growth_funnel_blueprints` | DnD funnel step order (nodes/edges JSON) |

## APIs (admin)

- `GET /api/admin/growth-engine/overview`
- `GET/POST /api/admin/growth-engine/revenue-events`
- `GET /api/admin/growth-engine/lead-signals`, `PATCH /api/admin/growth-engine/lead-signals/[id]`
- `GET/POST /api/admin/growth-engine/automation-rules`
- `GET/POST /api/admin/growth-engine/campaign-costs`
- `GET/POST /api/admin/growth-engine/call-events`
- `GET/POST /api/admin/growth-engine/knowledge`
- `GET/PATCH /api/admin/growth-engine/funnel-blueprint?key=startup`

## Cron

- `GET /api/cron/growth-engine` — processes pending `growth_automation_runs` (Bearer `CRON_SECRET` in production). Configured in `vercel.json` every 5 minutes.

## Client surface

- **`ClientConversionDiagnostics.phase2`**: simplified revenue line, growth scores (0–100 heuristics), predictive nudges, benchmark language, persona/offer placeholders until tagging matures.

## Not built yet (explicit placeholders)

- Google Ads / Meta cost sync
- Dynamic call number pools + recording URLs
- SMS alerts
- Full stats engine for experiments
- Historical Stripe backfill beyond live `invoice.paid` webhooks (adapter-ready via `stripeInvoiceId`)

## Navigation

- Admin: **Growth Intelligence** subnav → **Growth engine**, or `/admin/growth-engine`.

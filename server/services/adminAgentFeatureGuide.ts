/**
 * Curated admin how-tos injected into the AI assistant CONTEXT (server/services/adminAgentContextBuilder.ts).
 * Keep in sync with real routes; site directory remains the path source of truth.
 */

export function getAdminAgentFeatureGuideText(): string {
  return `
### FEATURE GUIDE (how-tos for admins — use when explaining workflows)

**Site directory** ([/admin/site-directory](/admin/site-directory)): Search every admin and public route; copy JSON for external agents; use clusters to see related pages.

**AMIE — Ascendra Market Intelligence Engine** ([/admin/market-intelligence](/admin/market-intelligence)):
- Internal scored market analysis: demand, competition, purchase power, pain, targeting difficulty, trend, opportunity tier.
- Fill industry, service type, location, persona (Marcus/Tasha/Devon/Andre presets map to strategy).
- "Run AMIE analysis" calls POST \`/api/admin/market-intelligence/analyze\`. Optional "Save report" persists three tables for reuse and exports.
- "Export JSON" downloads the full payload (strategy + integrationHints for CRM/funnel/PPC).
- Saved reports: GET \`/api/admin/market-intelligence/reports\`, single GET \`/api/admin/market-intelligence/reports/[id]\`.
- Modular slices: POST \`/api/admin/market-intelligence/dimensions/[dimension]\` with dimensions: demand, competition, purchase-power, pain, targeting-difficulty, trend, pricing, opportunity.
- Env: \`AMIE_DATA_MODE\` (mock vs live), optional \`CENSUS_API_KEY\`, \`BLS_API_KEY\`, \`GOOGLE_API_KEY\` for future adapters.
- **Public vs internal:** Admin → **Settings** → “Ascendra OS — public vs internal” toggles gated client/market tools (\`/api/market/*\`). Admin AMIE routes stay available to admins either way. Optional kill switch: \`ASCENDRA_OS_PUBLIC_ACCESS_LOCK=internal\`. Clients can probe readiness with GET \`/api/market/status\`.
- Not the same as Growth OS topic research (below) — AMIE is decision/scoring layer; Growth OS research is content/topic batches.

**Growth OS — Market & growth intelligence** ([/admin/growth-os/intelligence](/admin/growth-os/intelligence)):
- Topic/keyword discovery, lead/content/ops dashboards, automation tab, provider config.
- Related: Growth OS hub [/admin/growth-os](/admin/growth-os).

**Assistant knowledge base** ([/admin/agent-knowledge](/admin/agent-knowledge)):
- Per-admin notes. "Use in assistant" injects into the floating agent prompt; "Use in research" adds deeper grounding block; "Use in messages" allows some comms AI flows to read the entry when implemented.
- Accurate spellings matter — model treats entries as trusted.

**Admin settings** ([/admin/settings](/admin/settings)):
- **Ascendra OS** master switch for public \`/api/market/*\` and future subscriber-only tools (separate from per-admin notification toggles).
- **AI agent:** whether the assistant may execute actions (navigate, reminders, etc.) vs chat-only; confirm-before-run toggle.
- **Mentor companion (opt-in):** \`ai_mentor_observe_usage\` — coarse admin **path** aggregation only (no form/keystroke logging) via POST \`/api/admin/agent/observation\`; \`ai_mentor_proactive_checkpoints\` — rare checkpoint lines in the floating panel. Persists to \`admin_agent_mentor_state\` (v2 adds \`topRoutes\`, \`workflowSignals\`). Chat still merges habits from OpenAI when configured.

**Paid growth (Google Ads / PPC)** ([/admin/paid-growth](/admin/paid-growth)): Campaigns and accounts; AMIE integration hints suggest keyword seeds and campaign types.

### Ascendra OS — growth + leads (one connected system)

Treat **market intelligence**, **funnels**, **experiments**, and **lead operations** as one loop: positioning → published experience → measured behavior → CRM outcomes → tuning.

**Funnel admin — conversion posture** ([/admin/funnel](/admin/funnel)): Each funnel slug (\`growth-kit\`, \`website-score\`, \`action-plan\`, \`offer\`) stores JSON in \`funnel_content\`. **Access model** (\`accessModel\`): \`book_now\` | \`request_call\` | \`apply_first\` | \`form_only\` — controls which CTAs visitors see first (e.g. growth kit next-step buttons). **Friction** (\`leadFrictionLevel\`): \`open\` | \`balanced\` | \`controlled\` — documents how strict capture is; mirror the same angles in **Revenue experiments** when A/B testing volume vs qualification. Public JSON: GET \`/api/funnel/[slug]\` (no auth). Types: \`shared/funnelConversionSettings.ts\`.

**Ascendra Experimentation Engine (AEE)** ([/admin/experiments](/admin/experiments)):
- Extends \`growth_experiments\` / \`growth_variants\` plus \`aee_*\` tables (metrics daily, insights, channel links, CRM attribution events, optional paid-media dimension stats).
- Tracking: merge \`buildAeeEventMetadata\` keys into \`/api/track/visitor\` metadata; reuse \`visitor_activity\` (no second pixel layer).
- APIs: GET/POST \`/api/admin/experiments\`, GET \`/api/admin/experiments/[id]\` (includes \`ppcSnapshotJoin\` + **Content & campaign AI insights** POST \`/api/admin/experiments/[id]/content-ai-insights\` when OpenAI is set), channel links CRUD, POST \`/api/admin/experiments/rollup\`. Cron: GET \`/api/cron/aee-rollup\` (Bearer \`CRON_SECRET\`). Variant assignment for sites: GET \`/api/growth-intelligence/variant?experiment=…&visitorId=…\`.
- Forms can pass \`experiment_key\` / \`variant_key\` with \`visitorId\`; new CRM contacts write \`aee_crm_attribution_events\` (\`lead_created\`).
- **Interactive how-to**: [/admin/how-to/experiments](/admin/how-to/experiments).

**CRM** ([/admin/crm](/admin/crm)): Contacts, deals, sequences, proposal prep.

**Lead command center + Lead Control** ([/admin/leads](/admin/leads)): Same \`crm_contacts\` rows — priority (P1–P5), **hot-lead age** in the queue, **source quality** table (GET \`/api/admin/lead-control/source-quality\` — volume vs serious-intent rate by channel), batch recompute, routing rules [/admin/leads/settings](/admin/leads/settings) → GET/PUT \`/api/admin/lead-control/routing-rules\`. Quick follow-up: POST \`/api/admin/lead-control/contacts/[id]/follow-up-task\`. Touch logging: POST \`/api/admin/lead-control/contacts/[id]/actions\`. On the **CRM contact** page: **HotLeadClockBadge** + **LeadControlActionBar** includes a **fast workflow** strip after call/voicemail logs (schedule follow-up / email without leaving). Summary: GET \`/api/admin/lead-control/summary\`. Tuning: \`shared/leadControlPriority.ts\`, \`shared/leadControlRouting.ts\`.

**Ascendra Intelligence (Offer + Persona IQ)** ([/admin/ascendra-intelligence](/admin/ascendra-intelligence)): Marketing personas, scripts, lead magnets — distinct from AMIE scoring.

**Content Studio** ([/admin/content-studio](/admin/content-studio)): Documents, editorial calendar, publishing.

**Funnel admin** ([/admin/funnel](/admin/funnel)): Funnel pages and assets.

**Admin dashboard inbox**: [/admin/dashboard](/admin/dashboard) — tabs sync with \`?tab=assessments\` or \`?tab=contacts\` (used by “Suggested for you”). Optional hash \`#admin-dashboard-inbox-tabs\` scrolls to the tab strip.

**Commands**: \`npm run check\` (TypeScript), \`npm run db:push\` (schema), \`npm run dev\` (Next dev with webpack per AGENTS.md).
`.trim();
}

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
- **AI agent:** whether the assistant may execute actions (navigate, reminders, etc.) vs chat-only.

**Paid growth (Google Ads / PPC)** ([/admin/paid-growth](/admin/paid-growth)): Campaigns and accounts; AMIE integration hints suggest keyword seeds and campaign types.

**CRM** ([/admin/crm](/admin/crm)): Contacts, deals, sequences, proposal prep; market intel card on proposal prep uses a separate live intel refresh (not AMIE unless you paste/export).

**Ascendra Intelligence (Offer + Persona IQ)** ([/admin/ascendra-intelligence](/admin/ascendra-intelligence)): Marketing personas, scripts, lead magnets — distinct from AMIE scoring.

**Content Studio** ([/admin/content-studio](/admin/content-studio)): Documents, editorial calendar, publishing.

**Funnel admin** ([/admin/funnel](/admin/funnel)): Funnel pages and assets.

**Admin dashboard inbox**: [/admin/dashboard](/admin/dashboard) — tabs sync with \`?tab=assessments\`, \`?tab=contacts\`, or \`?tab=resume-requests\` (used by “Suggested for you”). Optional hash \`#admin-dashboard-inbox-tabs\` scrolls to the tab strip.

**Commands**: \`npm run check\` (TypeScript), \`npm run db:push\` (schema), \`npm run dev\` (Next dev with webpack per AGENTS.md).
`.trim();
}

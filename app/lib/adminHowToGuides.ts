/**
 * Admin how-to content for /admin/how-to — keep routes aligned with app/lib/siteDirectory.ts.
 */
import type { LucideIcon } from "lucide-react";
import {
  Brain,
  CircleDollarSign,
  FlaskConical,
  LayoutDashboard,
  Link2,
  Mail,
  Map,
  Radar,
  Search,
  Settings,
  Sparkles,
  Video,
  FileEdit,
  Megaphone,
} from "lucide-react";

export type AdminHowToGuide = {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  /** Short context line for skimming */
  whenToUse: string;
  steps: string[];
  tips?: string[];
  related?: { label: string; href: string }[];
};

export const ADMIN_HOW_TO_GUIDES: AdminHowToGuide[] = [
  {
    id: "site-directory",
    title: "Find any admin or public page",
    description: "Search the live route map instead of guessing URLs.",
    href: "/admin/site-directory",
    icon: Map,
    whenToUse: "You know the topic—LTV, newsletter, Market Score—but not where it lives.",
    steps: [
      "Open **Pages & tools directory** (`/admin/site-directory`).",
      "Type a keyword (e.g. “sequence”, “AMIE”, “content studio”). Filter by **admin** vs **public** to shorten the list.",
      "Open **Consolidation clusters** when you want related routes grouped (helpful for overlapping features).",
      "Use **Copy JSON for AI** when you want an external assistant or script to consume the same route list the app uses (`GET /api/admin/site-directory` with optional `?q=` also works from an authenticated session).",
    ],
    tips: [
      "The floating assistant on admin screens also knows this directory—ask it where to go.",
    ],
    related: [
      { label: "Dashboard", href: "/admin/dashboard" },
      { label: "How-to (this page)", href: "/admin/how-to" },
    ],
  },
  {
    id: "crm-contact",
    title: "Work a lead or client in CRM",
    description: "One contact record ties together timeline, tasks, email, discovery, and proposals.",
    href: "/admin/crm",
    icon: Search,
    whenToUse: "You’re following up on a person or company and want one place for context.",
    steps: [
      "Start at **CRM home** (`/admin/crm`). Search or filter, then open a contact—URL pattern `/admin/crm/[id]` for that person’s **detail** page.",
      "On the contact: check **timeline**, **tasks**, playbooks, SMS/revenue-ops actions if enabled, and **Email Hub** shortcuts to compose.",
      "Use **Enrich contact** when you want structured fields refreshed; **Discovery workspace** / **Proposal prep** links jump to call prep and proposal flows with the contact id when you need them.",
      "For pipeline context, cross-check **Pipeline** (`/admin/crm/pipeline`) and **LTV** so revenue numbers match the deal story.",
    ],
    tips: [
      "If the contact email matches a community member, an **Ascendra Founder Network** snapshot can appear (community type, public profile link when visibility is public).",
    ],
    related: [
      { label: "Pipeline", href: "/admin/crm/pipeline" },
      { label: "Discovery inbox", href: "/admin/crm/discovery" },
      { label: "Proposal prep", href: "/admin/crm/proposal-prep" },
    ],
  },
  {
    id: "ltv",
    title: "LTV & revenue reports",
    description: "Roll up estimates and pipeline with filters—export when finance needs the sheet.",
    href: "/admin/crm/ltv",
    icon: CircleDollarSign,
    whenToUse: "You need lifetime value / rollups across deals and client estimates.",
    steps: [
      "Open **LTV & revenue reports** (`/admin/crm/ltv`).",
      "Set **date range**, **stages**, and any **scenario** inputs the page exposes (margins, expected value, etc.).",
      "Run the report, scan summaries and shortcuts back to contacts or pipeline.",
      "Use **CSV export** when you need Excel or to share outside the app.",
    ],
    tips: [
      "If a number looks off, verify the underlying **deals** and **contacts** before changing strategy.",
    ],
    related: [
      { label: "CRM dashboard", href: "/admin/crm/dashboard" },
      { label: "Pipeline", href: "/admin/crm/pipeline" },
    ],
  },
  {
    id: "discovery",
    title: "Discovery, Zoom prep, and proposal workflow",
    description: "Hub for call prep and handoff to proposal—ties to integrations and CRM.",
    href: "/admin/crm/discovery-tools",
    icon: Video,
    whenToUse: "Before or after sales calls; linking meetings to CRM context.",
    steps: [
      "Open **Discovery toolkit** (`/admin/crm/discovery-tools`) for the hub: workspaces, links to LTV, proposal prep, integrations.",
      "Use **Discovery inbox** (`/admin/crm/discovery`) for grouped workspaces; individual sessions use `/admin/crm/discovery/[id]` when you drill in.",
      "Connect calendar or meeting tools from **Connections & email** (`/admin/integrations`) when OAuth prompts appear.",
      "Jump to **Proposal prep** (`/admin/crm/proposal-prep`) when you’re ready to assemble a client-facing proposal from CRM context.",
    ],
    related: [
      { label: "Integrations", href: "/admin/integrations" },
      { label: "CRM home", href: "/admin/crm" },
    ],
  },
  {
    id: "amie",
    title: "Market intelligence (AMIE)",
    description: "Internal scored market analysis—strategy layer, not the same as Growth OS topic batches.",
    href: "/admin/market-intelligence",
    icon: Radar,
    whenToUse: "Positioning, campaign planning, or exporting structured market JSON for other tools.",
    steps: [
      "Open **Market intelligence** (`/admin/market-intelligence`). Enter industry, service type, location, and persona presets as the form asks.",
      "Run **AMIE analysis** (persists via admin APIs). Use **Save report** when you want it on file; **Export JSON** when you need the full payload (strategy + hints for CRM/funnel/PPC).",
      "Optional **dimension slices** hit `POST /api/admin/market-intelligence/dimensions/[dimension]` for demand, competition, purchase power, pain, targeting difficulty, trend, pricing, opportunity—use when you’re iterating one signal at a time.",
      "**Admin vs public tools:** AMIE admin routes stay available to approved admins. **Settings → Ascendra OS** controls gated **public** `/api/market/*` tools; optional env kill switch `ASCENDRA_OS_PUBLIC_ACCESS_LOCK=internal` forces them off regardless of the toggle.",
    ],
    tips: [
      "The public **Market Score** funnel (`/market-score`) captures leads; submissions can surface in CRM with relevant custom fields—trace back from the contact when needed.",
      "Data mode comes from env: `AMIE_DATA_MODE` (mock vs live) plus optional Census/BLS/Google keys—see `.env.example` and ENVIRONMENT-VARIABLES-GUIDE.",
    ],
    related: [
      { label: "Market Score (public)", href: "/market-score" },
      { label: "Admin settings", href: "/admin/settings" },
    ],
  },
  {
    id: "growth-os",
    title: "Growth OS hub & intelligence dashboard",
    description: "Market research rollups, automation, and links to revenue and internal audit tools.",
    href: "/admin/growth-os",
    icon: LayoutDashboard,
    whenToUse: "Weekly content/market ops, automation tabs, or navigating sub-hubs.",
    steps: [
      "Start at **Growth OS** (`/admin/growth-os`) for the shell and navigation to sub-areas.",
      "Open **Market research / intelligence** at `/admin/growth-os/intelligence` for topic dashboards, lead/content views, **Automation**, and provider configuration where present.",
      "Use related links to **Revenue ops**, **Scheduling**, or **Internal audit** (`/admin/internal-audit`) from the Growth OS navigation—paths are listed in the **site directory** if you lose context.",
    ],
    tips: [
      "Scheduled jobs in production (e.g. Growth OS digest, Content Studio publish) require `CRON_SECRET`; see `vercel.json` and AGENTS.md for cron paths.",
    ],
    related: [
      { label: "Intelligence dashboard", href: "/admin/growth-os/intelligence" },
      { label: "Paid growth", href: "/admin/paid-growth" },
    ],
  },
  {
    id: "content-studio",
    title: "Content Studio (documents, calendar, publishing)",
    description: "Editorial workflow plus social publish—often paired with Integrations.",
    href: "/admin/content-studio",
    icon: FileEdit,
    whenToUse: "Drafting posts, scheduling, or checking what published to which channel.",
    steps: [
      "Hub: **`/admin/content-studio`**. Branch to **Documents** (`/admin/content-studio/documents`), **Calendar** (`.../calendar`), **Campaigns**, **Post history / workflow** (`.../workflow`), or **Import/export** as needed.",
      "Schedule posts from the calendar/editor UI; production publishing can run on Vercel cron `/api/cron/content-studio-publish` (about every 10 minutes) when configured.",
      "Connect **LinkedIn, Facebook/Page, Threads, X** (and related Meta apps) from **Connections & email** (`/admin/integrations`)—Content Studio reuses those OAuth connections and env fallbacks documented there.",
    ],
    tips: [
      "Facebook Page env fallbacks (`FACEBOOK_ACCESS_TOKEN`, `FACEBOOK_PAGE_ID`) are documented in `.env.example`; prefer stored integration tokens from the admin UI when available.",
    ],
    related: [
      { label: "Integrations", href: "/admin/integrations" },
      { label: "Communications", href: "/admin/communications" },
    ],
  },
  {
    id: "email-hub",
    title: "Email Hub (compose, inbox, CRM touchpoints)",
    description: "Transactional and campaign email flows tied to Brevo and CRM.",
    href: "/admin/email-hub",
    icon: Mail,
    whenToUse: "Sending from a contact context or managing mail-centric workflows.",
    steps: [
      "Landing: **`/admin/email-hub`** with paths like **`/admin/email-hub/inbox`** when inbox features are enabled.",
      "From a **CRM contact**, use quick actions or **Email Hub compose** links (`/admin/email-hub/compose?contactId=...`) so merge fields and tracking stay anchored to the right person.",
      "For **sequences**, use **CRM → Email sequences** (`/admin/crm/sequences`)—builder lives under `/admin/crm/sequences/new` and individual sequence routes as applicable.",
    ],
    tips: [
      "Brevo webhooks and verified senders are covered in ENVIRONMENT-VARIABLES-GUIDE—without a working API key and sender, tests in Integrations will fail predictably.",
    ],
    related: [
      { label: "CRM home", href: "/admin/crm" },
      { label: "Newsletters", href: "/admin/newsletters" },
    ],
  },
  {
    id: "integrations",
    title: "Connections, tests, and social OAuth",
    description: "Single place to confirm email, calendar, and social channels before relying on automations.",
    href: "/admin/integrations",
    icon: Link2,
    whenToUse: "Something “won’t connect” or before turning on Content Studio publish.",
    steps: [
      "Open **Connections & email** (`/admin/integrations`). Review each provider block.",
      "Run **Test** actions where the UI offers them; read the status messages—they map to server checks (e.g. `FACEBOOK_APP_ID` / secret for Meta surfaces).",
      "Wire **Brevo** (or documented mail provider) before sequences, broadcasts, and some CRM emails matter.",
      "Social blocks feed **Content Studio**; complete OAuth for each network you need. Super-admins may also use **Live site settings** (`/admin/deployment-env`) for Vercel env management—separate from OAuth but related to production fixes.",
    ],
    related: [
      { label: "Content Studio", href: "/admin/content-studio" },
      { label: "Email Hub", href: "/admin/email-hub" },
    ],
  },
  {
    id: "settings",
    title: "Admin settings (Ascendra OS & AI)",
    description: "Master switches for public market APIs and assistant behavior.",
    href: "/admin/settings",
    icon: Settings,
    whenToUse: "Turning public tools on/off or changing how aggressively the assistant can act.",
    steps: [
      "Go to **`/admin/settings`**.",
      "Find **Ascendra OS — public vs internal**: this gates subscriber-facing `/api/market/*` style tools for visitors while keeping admin AMIE routes available to approved admins (unless a deploy-wide env lock overrides).",
      "Adjust **AI agent** options: whether the assistant may **execute actions** (navigate, reminders, etc.) versus chat-only—pair with **Assistant knowledge** entries so the model has trusted facts.",
    ],
    related: [
      { label: "Assistant knowledge", href: "/admin/agent-knowledge" },
      { label: "Operator profile", href: "/admin/operator-profile" },
    ],
  },
  {
    id: "agent-knowledge",
    title: "Assistant knowledge base",
    description: "Short, factual snippets the mentor can use when flags are on.",
    href: "/admin/agent-knowledge",
    icon: Sparkles,
    whenToUse: "You want repeatable answers (“our refund rule”, “pitch URL”) without pasting each time.",
    steps: [
      "Open **`/admin/agent-knowledge`**. Add concise entries—prices, policies, URLs, positioning.",
      "Per entry, toggle **Use in assistant**, **Use in research**, **Use in messages** only where you intend that surface to read the text.",
      "Avoid secrets you wouldn’t put in an internal wiki; spelling counts—the model treats enabled entries as high trust.",
    ],
    related: [
      { label: "How-to overview", href: "/admin/how-to" },
      { label: "Settings", href: "/admin/settings" },
    ],
  },
  {
    id: "offer-persona-iq",
    title: "Offer + Persona IQ (marketing)",
    description: "Marketing personas and scripts—separate from CRM “sales segments”.",
    href: "/admin/ascendra-intelligence",
    icon: Brain,
    whenToUse: "Campaign messaging, lead magnets, and site offer alignment—not CRM firmographics.",
    steps: [
      "Hub: **`/admin/ascendra-intelligence`**. Sub-routes include **personas**, **scripts**, **lead magnets**, and **preview** under `/admin/ascendra-intelligence/...`.",
      "Do **not** confuse with **CRM → Sales segments** (`/admin/crm/personas`)—that list is built from deal/contact data for sales, not marketing IQ templates.",
      "Tie finished assets to **Funnel admin** (`/admin/funnel`) or **Site offers** (`/admin/offers`) when you’re shipping landing experiences.",
    ],
    related: [
      { label: "CRM personas (sales)", href: "/admin/crm/personas" },
      { label: "Funnel admin", href: "/admin/funnel" },
    ],
  },
  {
    id: "paid-growth",
    title: "Paid growth (Google Ads / PPC)",
    description: "Campaign tooling that can consume AMIE keyword hints when configured.",
    href: "/admin/paid-growth",
    icon: Megaphone,
    whenToUse: "Managing paid campaigns from the admin PPC surface.",
    steps: [
      "Open **`/admin/paid-growth`**. Connect accounts per on-screen instructions; env vars (`GOOGLE_ADS_*`, etc.) are documented in `.env.example` and the paid-growth module doc.",
      "When AMIE exports **integration hints**, you can seed keyword or campaign ideas—still verify in the ad platform before spending.",
    ],
    related: [
      { label: "Market intelligence", href: "/admin/market-intelligence" },
      { label: "Integrations", href: "/admin/integrations" },
    ],
  },
  {
    id: "experiments-ab-testing",
    title: "A/B testing & Revenue experiments (interactive)",
    description:
      "Step-by-step tour of the Ascendra Experimentation Engine: variants, rollups, calculator, channel links, and AI insights — with checklist, diagrams, and examples.",
    href: "/admin/how-to/experiments",
    icon: FlaskConical,
    whenToUse:
      "You want to run or read a test (landing, email, ads), understand what each experiment screen does, or onboard a teammate without guessing.",
    steps: [
      "Start with the **interactive tutorial** (`/admin/how-to/experiments`): tabs for walkthrough, screen map, scenarios, and glossary; optional **Listen** reads the full narrative.",
      "Concepts: experiments live in **`growth_experiments`** / **`growth_variants`**; daily totals surface on each detail page from **`aee_experiment_metrics_daily`** with **`dimension_key = total`**.",
      "Assignment for live sites: public **`GET /api/growth-intelligence/variant`** with **`experiment`** (key) **`visitorId`** (stable id) returns **`variantKey`** and **`config`** — wire your UI to that response.",
      "On **`/admin/experiments`**: workflow card, **two-proportion z-test** calculator (same math as `app/lib/aee/abTestMath.ts`), advanced panels, then the experiments table.",
      "On **`/admin/experiments/[id]`**: channel links (PPC/email/web), optional PPC snapshot block, **Optimization preview** (~20 visitors / first lead heuristic), **Content & campaign AI insights** (needs `OPENAI_API_KEY`; model must not invent metrics).",
      "Implement content changes in **Newsletters** or **Content Studio** after you decide what to ship — the tutorial links both.",
    ],
    tips: [
      "Users need **experiments** permission (or super-user) to open `/admin/experiments/*`; this how-to page is readable by any approved admin for training.",
      "Experiment **score** and **AI** summaries are previews — confirm revenue and lead quality in CRM before big budget moves.",
    ],
    related: [
      { label: "Experiments hub", href: "/admin/experiments" },
      { label: "New experiment", href: "/admin/experiments/new" },
      { label: "Content Studio", href: "/admin/content-studio" },
      { label: "Newsletters", href: "/admin/newsletters" },
    ],
  },
];

export function adminGuidePlainTextForSpeech(guide: AdminHowToGuide): string {
  const parts = [
    guide.title + ".",
    guide.description,
    "When to use: " + guide.whenToUse,
    ...guide.steps.map((s, i) => `Step ${i + 1}. ${stripMarkdownForSpeech(s)}`),
    ...(guide.tips?.length ? ["Tips.", ...guide.tips.map((t) => stripMarkdownForSpeech(t))] : []),
  ];
  return parts.join(" ");
}

export function stripMarkdownForSpeech(s: string): string {
  return s
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export function allGuidesPlainTextForSpeech(guides: AdminHowToGuide[]): string {
  return guides.map((g, idx) => `Guide ${idx + 1} of ${guides.length}. ${adminGuidePlainTextForSpeech(g)}`).join("\n\n");
}

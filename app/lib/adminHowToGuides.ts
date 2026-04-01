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
    title: "Find the right screen in seconds",
    description: "Use the built-in map of every tool instead of memorizing menus or URLs.",
    href: "/admin/site-directory",
    icon: Map,
    whenToUse: "You know what you need—CRM, email, reports—but aren’t sure which screen to open.",
    steps: [
      "Open **Pages & tools directory** from the admin sidebar (or the **Search all pages** button on this how-to page).",
      "Type what you’re looking for—examples: “newsletter”, “pipeline”, “content”, “market”. Narrow the list with the audience filters if you see them.",
      "Open **Consolidation clusters** when several similar tools show up together; pick the one that matches your job (sales vs marketing vs ops).",
      "Need to share the route list with a teammate or an outside assistant? Use **Copy JSON for AI** on that screen—it exports the same page index the product uses.",
    ],
    tips: [
      "The floating assistant on admin pages can also direct you—ask “where do I edit newsletters?” and it will point you to the right area.",
      "Favorite URLs in your browser for screens you open daily; the directory is there when you’re exploring something new.",
    ],
    related: [
      { label: "Open directory", href: "/admin/site-directory" },
      { label: "Dashboard", href: "/admin/dashboard" },
    ],
  },
  {
    id: "crm-contact",
    title: "Work a lead or client in CRM",
    description: "One profile holds timeline, tasks, email, discovery notes, and proposal prep—so nothing lives in a silo.",
    href: "/admin/crm",
    icon: Search,
    whenToUse: "You’re following up with a person or company and want full context in one place.",
    steps: [
      "Start at **CRM home**, search or filter, then open the contact. You’ll land on their detail view with everything tied to that record.",
      "Scan the **timeline** first—it shows recent activity and notes. Check **tasks** for what’s overdue or waiting on you.",
      "Use shortcuts to **Email Hub** or compose when you want mail tracked to this contact (merge fields stay linked correctly).",
      "When you’re prepping a call, open **Discovery** or **Proposal prep** from the contact or CRM menus so your notes and offer line up with this person.",
      "For deal health, glance at **Pipeline** and **LTV** so your story to the client matches your numbers.",
    ],
    tips: [
      "If the email matches someone in the founder community, you may see a small **network** snapshot—useful for warm intros, not a replacement for CRM consent.",
      "Add a task the moment you promise a follow-up; the timeline gets noisy fast without that discipline.",
    ],
    related: [
      { label: "CRM home", href: "/admin/crm" },
      { label: "Pipeline", href: "/admin/crm/pipeline" },
      { label: "Discovery inbox", href: "/admin/crm/discovery" },
    ],
  },
  {
    id: "ltv",
    title: "Revenue and lifetime value reports",
    description: "Roll up pipeline and client value with filters, then export when finance or leadership needs the spreadsheet.",
    href: "/admin/crm/ltv",
    icon: CircleDollarSign,
    whenToUse: "You need an estimate of customer value, stage rollups, or a clean export for a meeting.",
    steps: [
      "Open **LTV & revenue reports** from CRM.",
      "Choose the **date range** and any **stage** or scenario filters on the page—start wide, then narrow once numbers look right.",
      "Read the summary cards first; drill into line items or linked contacts if something surprises you.",
      "Use **CSV export** when you need Excel, a board deck, or to email finance.",
    ],
    tips: [
      "If a total looks wrong, verify a few source deals in **Pipeline** before changing strategy—bad data in means bad rollups out.",
      "Save a screenshot or export monthly so you can compare trend without re-running filters from memory.",
    ],
    related: [
      { label: "CRM dashboard", href: "/admin/crm/dashboard" },
      { label: "Pipeline", href: "/admin/crm/pipeline" },
    ],
  },
  {
    id: "discovery",
    title: "Discovery calls, Zoom prep, and proposals",
    description: "A single hub for call prep, meeting links, and handing off to a polished proposal.",
    href: "/admin/crm/discovery-tools",
    icon: Video,
    whenToUse: "Before or after sales conversations—especially when Zoom, calendar, and CRM need to stay in sync.",
    steps: [
      "Open **Discovery toolkit** for the overview: workspaces, shortcuts to LTV, proposal prep, and integrations.",
      "Use **Discovery inbox** to see grouped sessions; open an individual session when you want deep notes for one call.",
      "Connect calendar or meeting tools under **Connections & email** (Integrations) if prompted—this keeps meetings and CRM aligned.",
      "When you’re ready to build the client document, jump to **Proposal prep** so fields pull from the same contact you’ve been working.",
    ],
    tips: [
      "Draft three bullet outcomes before the call; drop them into discovery notes during the meeting so proposal prep is faster.",
      "If video fails, still log outcomes in the workspace so the team isn’t guessing later.",
    ],
    related: [
      { label: "Integrations", href: "/admin/integrations" },
      { label: "CRM home", href: "/admin/crm" },
    ],
  },
  {
    id: "amie",
    title: "Market intelligence (AMIE)",
    description: "Get a scored market snapshot—demand, competition, opportunity—plus exports you can reuse in campaigns or CRM.",
    href: "/admin/market-intelligence",
    icon: Radar,
    whenToUse: "Positioning a new offer, planning campaigns, or packaging insights for leadership.",
    steps: [
      "Open **Market intelligence** and fill in industry, what you sell, geography, and the persona preset that best fits your buyer.",
      "Run the analysis, then **save** when you want the report on file for later. Use **Export JSON** when another tool (or a vendor) needs the full structured output.",
      "Need to stress-test one angle (e.g. competition only)? Use the dimension tools on the page to refresh a slice without starting over.",
      "**Team-only vs public tools:** your admin intelligence stays available to approved operators. Customer-facing market quizzes on the website are controlled separately under **Settings → Ascendra OS** (and can be locked by hosting if needed).",
    ],
    tips: [
      "Treat AMIE as a strong draft: validate claims with a sample customer call before you bet big media budget.",
      "The public **Market Score** journey can feed leads into CRM—when a lead looks familiar, trace back from the contact record.",
    ],
    related: [
      { label: "Market Score (public page)", href: "/market-score" },
      { label: "Admin settings", href: "/admin/settings" },
    ],
  },
  {
    id: "growth-os",
    title: "Growth OS: research, automation, ops",
    description: "Your umbrella for marketing intelligence, automation, and links into revenue and audit tools.",
    href: "/admin/growth-os",
    icon: LayoutDashboard,
    whenToUse: "Weekly content rhythm, automation checks, or jumping between growth sub-hubs.",
    steps: [
      "Open **Growth OS**—this is the shell with navigation to the areas underneath.",
      "Visit **Market research / intelligence** for topic dashboards, leads, automation controls, and provider setup when shown.",
      "Use the in-app links to **Revenue ops**, **Scheduling**, or **Internal audit** without hunting through the whole admin tree.",
      "Lost? Open **Pages & tools directory** and search “growth” to see every related route in one list.",
    ],
    tips: [
      "If scheduled digests or publishing ever stall in production, confirm your host has cron jobs and secrets configured—your technical contact can verify from deployment docs.",
    ],
    related: [
      { label: "Intelligence dashboard", href: "/admin/growth-os/intelligence" },
      { label: "Paid growth", href: "/admin/paid-growth" },
    ],
  },
  {
    id: "content-studio",
    title: "Content Studio: plan, draft, and publish",
    description: "Editorial workspace for documents, calendars, and pushing posts to social—after Integrations are connected.",
    href: "/admin/content-studio",
    icon: FileEdit,
    whenToUse: "Scheduling social, drafting long-form, or reviewing what actually shipped to each channel.",
    steps: [
      "Start at **Content Studio** home, then branch to **Documents**, **Calendar**, **Campaigns**, **Workflow / history**, or **Import / export** depending on your task.",
      "Plan on the calendar, draft in documents, then schedule—the workflow page shows what’s pending vs live.",
      "For social networks, finish OAuth under **Connections & email** first; Content Studio reuses those connections.",
      "After scheduling, spot-check the live channel—platform APIs occasionally delay or reject a post; the workflow view helps you catch that quickly.",
    ],
    tips: [
      "Batch-create a month of ideas in Documents before you calendar—fewer context switches.",
      "Keep brand assets (logos, tone notes) in **Brand vault** or your shared drive and link them in briefs so writers stay consistent.",
    ],
    related: [
      { label: "Integrations", href: "/admin/integrations" },
      { label: "Communications", href: "/admin/communications" },
    ],
  },
  {
    id: "email-hub",
    title: "Email Hub: compose, inbox, sequences",
    description: "Send mail in context of a contact, manage inbox views, and tie into CRM sequences when enabled.",
    href: "/admin/email-hub",
    icon: Mail,
    whenToUse: "You’re emailing from a person’s profile or managing mail-centric follow-through.",
    steps: [
      "Landing page is **Email Hub**; open **Inbox** when your workspace uses inbox features.",
      "From a **CRM contact**, use **Compose** shortcuts so merge fields and tracking stay on the right person.",
      "For drip or nurture flows, build under **CRM → Email sequences**—start from **New sequence** and name each step for the team’s clarity.",
    ],
    tips: [
      "If test sends bounce, check Integrations for sender verification and API health before opening a ticket.",
      "Keep subject lines under ~55 characters for mobile previews; first sentence matters as much as the subject.",
    ],
    related: [
      { label: "CRM home", href: "/admin/crm" },
      { label: "Newsletters", href: "/admin/newsletters" },
    ],
  },
  {
    id: "integrations",
    title: "Connections: email, calendar, social",
    description: "Confirm each integration before you rely on automation, publishing, or meeting prep.",
    href: "/admin/integrations",
    icon: Link2,
    whenToUse: "Something won’t connect, or you’re onboarding before turning on Content Studio or sequences.",
    steps: [
      "Open **Connections & email** and walk provider blocks top to bottom.",
      "Use **Test** buttons where offered; read the message—most failures are missing credentials or incomplete OAuth.",
      "Finish **email provider** setup before sequences and broadcasts matter in production.",
      "Complete **social** OAuth for each network you publish to; Content Studio depends on these tokens.",
    ],
    tips: [
      "Take a screenshot of a green test for each provider—handy when troubleshooting weeks later.",
      "Platform super-admins may also have environment-level tools for production fixes; day-to-day operators usually stay in this Connections page.",
    ],
    related: [
      { label: "Content Studio", href: "/admin/content-studio" },
      { label: "Email Hub", href: "/admin/email-hub" },
    ],
  },
  {
    id: "settings",
    title: "Workspace & assistant settings",
    description: "Control public tool access, notifications, and how much the AI assistant can do on your behalf.",
    href: "/admin/settings",
    icon: Settings,
    whenToUse: "Turning customer-facing tools on or off, tuning the assistant, or adjusting read-aloud voices.",
    steps: [
      "Open **Admin settings** from your profile menu or sidebar.",
      "Under **Ascendra OS — public vs internal**, decide whether subscriber-facing market tools are available on the public site. Internal admin analysis stays available to approved staff unless hosting policy locks it.",
      "In **AI admin agent**, choose whether the assistant can **take actions** (open pages, reminders) or stay advisory-only. Turn on **confirm before actions** if you want a tap-to-approve step.",
      "Use **Read-aloud** on this screen to pick cloud voices (OpenAI / Gemini) or add extra voice names when providers release new options.",
    ],
    tips: [
      "Pair action-enabled assistant with **Assistant knowledge** entries for pricing and policy—garbage in, confident wrong answers out.",
      "After changing assistant permissions, reload a tab you already had open so floating UI picks up the new rules.",
    ],
    related: [
      { label: "Assistant knowledge", href: "/admin/agent-knowledge" },
      { label: "Operator profile", href: "/admin/operator-profile" },
    ],
  },
  {
    id: "agent-knowledge",
    title: "Assistant knowledge snippets",
    description: "Short, trusted facts the AI can quote when you turn on the right toggles.",
    href: "/admin/agent-knowledge",
    icon: Sparkles,
    whenToUse: "You’re tired of pasting the same refund policy, pricing, or positioning in every chat.",
    steps: [
      "Open **Assistant knowledge** and add bite-sized entries—think FAQ bullets, not essays.",
      "Per row, enable **assistant**, **research**, or **messages** only where that text should appear—narrow scope reduces confusion.",
      "Refresh entries when pricing or URLs change; stale snippets erode trust with the team and your leads.",
    ],
    tips: [
      "Never paste secrets (API keys, legal drafts) into knowledge—assume anything enabled might surface in a suggestion.",
      "Name entries clearly (“Refund policy — 2026”) so you can audit them quarterly.",
    ],
    related: [
      { label: "How-to overview", href: "/admin/how-to" },
      { label: "Settings", href: "/admin/settings" },
    ],
  },
  {
    id: "offer-persona-iq",
    title: "Marketing personas & offer messaging",
    description: "Campaign-facing personas and scripts—separate from CRM’s sales-segment lists.",
    href: "/admin/ascendra-intelligence",
    icon: Brain,
    whenToUse: "Crafting site copy, lead magnets, or ads—not when you’re tagging firms in CRM.",
    steps: [
      "Open **Ascendra intelligence** for personas, scripts, lead magnets, and previews.",
      "Do **not** confuse this with **CRM → Personas** under sales—that list is built from deal data for reps, not marketing templates here.",
      "When assets are ready, wire them into **Funnel** or **Site offers** so the public site reflects the improvement.",
    ],
    tips: [
      "One persona per primary campaign keeps messaging sharp; too many personas in one ad set dilutes results.",
      "Sync naming with sales (“SMB owner — marketing IQ”) so handoffs don’t talk past each other.",
    ],
    related: [
      { label: "CRM personas (sales)", href: "/admin/crm/personas" },
      { label: "Funnel admin", href: "/admin/funnel" },
    ],
  },
  {
    id: "paid-growth",
    title: "Paid growth (search & social ads)",
    description: "Operate campaigns from the admin PPC surface and fold in market hints when you export them.",
    href: "/admin/paid-growth",
    icon: Megaphone,
    whenToUse: "Buying traffic that must tie back to Ascendra reporting and proposals.",
    steps: [
      "Open **Paid growth** and connect the ad accounts the UI requests.",
      "Build or import campaigns following on-screen guardrails; keep naming consistent with your landing page experiments when relevant.",
      "When market research suggests keyword themes, vet them in the native ad editor before spending—hint lists are starting points, not approvals.",
    ],
    tips: [
      "Check conversion tracking weekly; a silent pixel hurts every downstream report.",
      "Small daily budgets while learning beat one large blast on unproven creative.",
    ],
    related: [
      { label: "Market intelligence", href: "/admin/market-intelligence" },
      { label: "Integrations", href: "/admin/integrations" },
    ],
  },
  {
    id: "experiments-ab-testing",
    title: "A/B tests & revenue experiments",
    description: "Interactive tutorial plus the live experiments workspace—variants, metrics, and safe rollouts.",
    href: "/admin/how-to/experiments",
    icon: FlaskConical,
    whenToUse: "You’re comparing landing pages, emails, or ads—or training a teammate without throwing them into blank screens.",
    steps: [
      "Start with the **step-by-step tutorial** linked from this card; it has tabs for walkthrough, screen map, scenarios, and a short glossary.",
      "In the product, open **Experiments** to see active tests. Each experiment lists variants; the detail page shows daily performance rollups.",
      "On live sites, visitor assignment calls the **growth intelligence variant** API so each person sees a consistent A or B experience.",
      "Use the built-in **calculator** on the list page when you want a quick statistical read without exporting to a sheet.",
      "AI summaries on a detail page are **assistive only**—confirm revenue and lead quality in CRM before big budget moves.",
      "Ship winning copy through **Newsletters** or **Content Studio** once you’ve picked a winner.",
    ],
    tips: [
      "Experiments require the right admin permission; this how-to page is readable to train anyone, but buttons may stay disabled for guests.",
      "Document the hypothesis in the experiment name (“Hero headline — clarity test Mar 26”)—future you will thank you.",
    ],
    related: [
      { label: "Experiments hub", href: "/admin/experiments" },
      { label: "New experiment", href: "/admin/experiments/new" },
      { label: "Content Studio", href: "/admin/content-studio" },
    ],
  },
];

export function adminGuidePlainTextForSpeech(guide: AdminHowToGuide): string {
  const parts = [
    guide.title + ".",
    guide.description,
    "When this guide helps: " + guide.whenToUse,
    ...guide.steps.map((s, i) => `Step ${i + 1}. ${stripMarkdownForSpeech(s)}`),
    ...(guide.tips?.length ? ["Tips for you.", ...guide.tips.map((t) => stripMarkdownForSpeech(t))] : []),
  ];
  return parts.join(" ");
}

export function stripMarkdownForSpeech(s: string): string {
  return s
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\(\/[^\s)]+\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function allGuidesPlainTextForSpeech(guides: AdminHowToGuide[]): string {
  return guides.map((g, idx) => `Guide ${idx + 1} of ${guides.length}. ${adminGuidePlainTextForSpeech(g)}`).join("\n\n");
}

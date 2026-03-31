/**
 * Machine- and human-readable map of app routes for admin search, AI agents, and IA audits.
 * Keep in sync when adding pages; optional `cluster` marks consolidation candidates.
 */

import {
  parseAdvancedSearchQuery,
  haystackMatchesParsedQuery,
  isParsedQueryEmpty,
  type ParsedAdvancedSearchQuery,
} from "./advancedSearchQuery";

export type SiteDirectoryAudience = "public" | "admin" | "client" | "token" | "super";

export interface SiteDirectoryEntry {
  path: string;
  title: string;
  category: string;
  audience: SiteDirectoryAudience;
  description: string;
  keywords: string[];
  /** Related routes (hubs, alternates, or admin editors). */
  relatedPaths?: string[];
  /** IA grouping: overlapping intent (diagnosis, scores, etc.). */
  cluster?: string;
  /** When cluster has multiple URLs, note merge/redirect ideas. */
  consolidateNote?: string;
}

function k(...words: string[]): string[] {
  return words;
}

/** All primary routes (static + common dynamic patterns). */
export const SITE_DIRECTORY_ENTRIES: SiteDirectoryEntry[] = [
  // —— Public: core marketing
  { path: "/", title: "Home", category: "Public · Marketing", audience: "public", description: "Main landing: hero, ecosystem, CTAs.", keywords: k("home", "landing"), cluster: "marketing-core" },
  { path: "/about", title: "About", category: "Public · Marketing", audience: "public", description: "Company story and team context.", keywords: k("about", "company"), relatedPaths: ["/brand-growth"] },
  { path: "/brand-growth", title: "Brand Growth hub", category: "Public · Marketing", audience: "public", description: "Ecosystem hub: Ascendra + partners, growth systems.", keywords: k("brand", "ecosystem", "hub"), cluster: "marketing-core" },
  { path: "/services", title: "Services", category: "Public · Marketing", audience: "public", description: "Service overview and positioning.", keywords: k("services", "what we do") },
  { path: "/faq", title: "FAQ", category: "Public · Marketing", audience: "public", description: "Frequently asked questions.", keywords: k("faq", "questions") },
  { path: "/contact", title: "Contact", category: "Public · Marketing", audience: "public", description: "Contact form and booking entry.", keywords: k("contact", "form"), relatedPaths: ["/strategy-call"] },
  { path: "/strategy-call", title: "Strategy call", category: "Public · Marketing", audience: "public", description: "Book a strategy / discovery call.", keywords: k("book", "call", "calendar", "meeting"), cluster: "conversion-primary", relatedPaths: ["/book"] },
  { path: "/book", title: "Book a time", category: "Public · Marketing", audience: "public", description: "Pick a meeting type, date, and time; email confirmation and reminders.", keywords: k("schedule", "calendar", "meeting", "book"), cluster: "conversion-primary", relatedPaths: ["/strategy-call"] },
  { path: "/call-confirmation", title: "Call confirmation", category: "Public · Marketing", audience: "public", description: "Post-booking confirmation.", keywords: k("call", "confirmed") },
  { path: "/thank-you", title: "Thank you", category: "Public · Marketing", audience: "public", description: "Generic thank-you after conversions.", keywords: k("thanks", "conversion") },

  // —— Public: lead magnets & tools (hub + satellites)
  { path: "/free-growth-tools", title: "Free growth tools (hub)", category: "Public · Tools", audience: "public", description: "Central index of calculators, scans, kits, audits.", keywords: k("tools", "free", "hub", "lead magnets"), cluster: "tools-hub", relatedPaths: ["/free-trial", "/digital-growth-audit", "/growth-diagnosis"] },
  { path: "/free-trial", title: "Free trial narrative", category: "Public · Tools", audience: "public", description: "Value-first trial positioning (call + audit story).", keywords: k("trial", "free trial"), cluster: "lead-entry", relatedPaths: ["/free-growth-tools"] },
  { path: "/digital-growth-audit", title: "Digital growth audit", category: "Public · Tools", audience: "public", description: "Human-positioned audit lead magnet.", keywords: k("audit", "growth audit"), cluster: "audit-lead-magnet", relatedPaths: ["/free-growth-tools"] },
  { path: "/ppc-lead-system", title: "PPC, CRM & lead conversion", category: "Public · Tools", audience: "public", description: "Lead magnet for prospecting, custom CRM, conversion, and paid ad management.", keywords: k("ppc", "ads", "crm", "leads", "prospecting", "conversion", "google ads", "meta ads"), cluster: "lead-entry", relatedPaths: ["/free-growth-tools", "/strategy-call", "/digital-growth-audit"] },
  { path: "/market-score", title: "Market Score (AMIE funnel)", category: "Public · Tools", audience: "public", description: "Free demand, competition, and purchase-power snapshot; CRM + Brevo nurture; full AMIE report on strategy call.", keywords: k("market score", "amie", "demand", "competition", "funnel", "lead magnet"), cluster: "tools-hub", relatedPaths: ["/free-growth-tools", "/strategy-call", "/admin/market-intelligence"] },
  { path: "/audit", title: "Audit (redirect)", category: "Public · Tools", audience: "public", description: "Legacy URL; redirects to /digital-growth-audit.", keywords: k("redirect", "audit"), cluster: "audit-lead-magnet", consolidateNote: "Already consolidated via redirect." },
  { path: "/journey", title: "Persona journey", category: "Public · Marketing", audience: "public", description: "Self-select business type and problem; routes to tailored lead magnets, services, and CTAs.", keywords: k("persona", "journey", "funnel", "path", "selector"), cluster: "marketing-core", relatedPaths: ["/diagnostics", "/digital-growth-audit", "/strategy-call", "/free-growth-tools"] },
  { path: "/diagnostics", title: "Diagnostics hub", category: "Public · Tools", audience: "public", description: "Choose automated scan, questionnaire, or full assessment.", keywords: k("diagnosis", "hub", "choose", "path"), cluster: "diagnostics-hub", relatedPaths: ["/growth-diagnosis", "/diagnosis", "/assessment", "/free-growth-tools", "/journey"] },
  { path: "/growth-diagnosis", title: "Website growth diagnosis (automated)", category: "Public · Tools", audience: "public", description: "Automated crawl/score style diagnosis experience.", keywords: k("diagnosis", "automated", "scan", "score"), cluster: "automated-diagnosis", relatedPaths: ["/free-growth-tools", "/diagnostics"] },
  { path: "/website-performance-score", title: "Website performance score", category: "Public · Tools", audience: "public", description: "Structured site score on clarity/trust/conversion.", keywords: k("score", "performance"), cluster: "site-scores", relatedPaths: ["/tools/startup-website-score", "/free-growth-tools"] },
  { path: "/tools/startup-website-score", title: "Startup website score", category: "Public · Tools", audience: "public", description: "Short quiz-style startup readiness score.", keywords: k("startup", "score", "quiz"), cluster: "site-scores", consolidateNote: "Same family as /website-performance-score; cross-link from hub." },
  { path: "/website-revenue-calculator", title: "Website revenue calculator", category: "Public · Tools", audience: "public", description: "Opportunity cost / revenue framing.", keywords: k("calculator", "revenue"), cluster: "calculators" },
  {
    path: "/growth-platform",
    title: "Growth System Platform (hub)",
    category: "Public · Tools",
    audience: "public",
    description:
      "DFY/DWY/DIY offer stack, job-based revenue impact calculator, three-step system preview, and links into recommendation + booking.",
    keywords: k("growth platform", "dfy", "dwy", "diy", "offers", "revenue calculator", "system"),
    cluster: "conversion-primary",
    relatedPaths: [
      "/growth-platform/recommendation",
      "/agreements/[token]",
      "/free-growth-tools",
      "/market-score",
      "/strategy-call",
      "/service-engagement",
      "/terms",
    ],
  },
  {
    path: "/growth-platform/recommendation",
    title: "Growth System — recommendation",
    category: "Public · Tools",
    audience: "public",
    description: "Closing view: inputs, tier suggestion, problems, revenue framing, legal acknowledgment before CTA.",
    keywords: k("recommendation", "closing", "offer", "system"),
    cluster: "conversion-primary",
    relatedPaths: ["/growth-platform", "/strategy-call", "/contact"],
  },
  {
    path: "/service-engagement",
    title: "Service engagement terms",
    category: "Public · Legal",
    audience: "public",
    description:
      "Educational engagement clauses: no guaranteed results, cooperation, ad spend, platform risk, payments, scope — not a generated contract.",
    keywords: k("engagement", "scope", "legal", "sow"),
    relatedPaths: ["/terms", "/growth-platform"],
  },
  {
    path: "/agreements/[token]",
    title: "Service agreement (sign)",
    category: "Public · Legal",
    audience: "public",
    description:
      "Token link: generated agreement HTML, typed legal name, optional drawn signature, consent checkboxes, audit digest; milestones billed via Stripe from admin.",
    keywords: k("agreement", "sign", "sow", "engagement"),
    relatedPaths: ["/terms", "/service-engagement", "/admin/growth-platform/agreements"],
  },
  { path: "/offer-audit", title: "Offer audit", category: "Public · Tools", audience: "public", description: "Lead-magnet offer valuation: score, diagnosis, strategic fixes, and CTA.", keywords: k("offer", "audit", "valuation", "lead magnet"), cluster: "calculators", relatedPaths: ["/offer-valuation", "/strategy-call"] },
  { path: "/competitor-position-snapshot", title: "Competitor snapshot", category: "Public · Tools", audience: "public", description: "Competitive positioning worksheet-style page.", keywords: k("competitor", "positioning") },
  { path: "/homepage-conversion-blueprint", title: "Homepage conversion blueprint", category: "Public · Tools", audience: "public", description: "Homepage structure / conversion blueprint.", keywords: k("homepage", "blueprint", "conversion") },
  { path: "/resources/startup-growth-kit", title: "Startup growth kit", category: "Public · Tools", audience: "public", description: "Educational kit resource.", keywords: k("startup", "kit", "resource"), cluster: "startup-funnel", relatedPaths: ["/admin/funnel/growth-kit"] },
  { path: "/resources/startup-action-plan", title: "Startup action plan", category: "Public · Tools", audience: "public", description: "Action plan resource page.", keywords: k("startup", "action plan"), cluster: "startup-funnel", relatedPaths: ["/admin/funnel/action-plan"] },
  { path: "/generate-images", title: "Generate images", category: "Public · Tools", audience: "public", description: "Image generation utility for visitors.", keywords: k("images", "ai", "generate") },

  // —— Public: interactive diagnosis funnel (questionnaire)
  { path: "/growth", title: "Growth landing", category: "Public · Diagnosis funnel", audience: "public", description: "Landing that pushes into /diagnosis questionnaire.", keywords: k("growth", "landing", "diagnosis intro"), cluster: "interactive-diagnosis", relatedPaths: ["/diagnosis"] },
  { path: "/diagnosis", title: "Growth diagnosis (questions)", category: "Public · Diagnosis funnel", audience: "public", description: "Multi-step self-serve questionnaire + scoring.", keywords: k("diagnosis", "questionnaire", "quiz"), cluster: "interactive-diagnosis", relatedPaths: ["/diagnostics"] },
  { path: "/diagnosis/results", title: "Diagnosis results", category: "Public · Diagnosis funnel", audience: "public", description: "Results after /diagnosis; partner recommendations.", keywords: k("results", "scores", "recommendation"), cluster: "interactive-diagnosis", relatedPaths: ["/diagnostics"] },

  // —— Public: other assessments / apply
  { path: "/assessment", title: "Growth assessment (full)", category: "Public · Assessment", audience: "public", description: "Full assessment flow (commercial / proposal path).", keywords: k("assessment", "pricing"), cluster: "paid-assessment", relatedPaths: ["/assessment/results", "/diagnostics"] },
  { path: "/assessment/results", title: "Assessment results", category: "Public · Assessment", audience: "public", description: "Assessment outcome and next steps.", keywords: k("assessment", "results") },
  { path: "/apply", title: "Apply", category: "Public · Assessment", audience: "public", description: "Application / growth plan CTA destination.", keywords: k("apply", "growth plan") },
  { path: "/recommendations", title: "Recommendations", category: "Public · Assessment", audience: "public", description: "Project recommendations experience.", keywords: k("recommendations", "projects") },

  // —— Public: ICP / service landers
  { path: "/launch-your-brand", title: "Launch your brand", category: "Public · ICP landers", audience: "public", description: "Offer landing: brand launch.", keywords: k("launch", "brand") },
  { path: "/rebrand-your-business", title: "Rebrand your business", category: "Public · ICP landers", audience: "public", description: "Offer landing: rebrand.", keywords: k("rebrand") },
  { path: "/marketing-assets", title: "Marketing assets", category: "Public · ICP landers", audience: "public", description: "Marketing assets offer.", keywords: k("marketing", "assets") },
  { path: "/contractor-systems", title: "Contractor systems", category: "Public · ICP landers", audience: "public", description: "ICP: contractors.", keywords: k("contractor") },
  { path: "/local-business-growth", title: "Local business growth", category: "Public · ICP landers", audience: "public", description: "ICP: local business.", keywords: k("local", "smb") },
  { path: "/startup-mvp-development", title: "Startup MVP", category: "Public · ICP landers", audience: "public", description: "ICP: startup MVP.", keywords: k("startup", "mvp") },
  { path: "/offers/startup-growth-system", title: "Startup growth system (offer page)", category: "Public · ICP landers", audience: "public", description: "Paid offer detail page.", keywords: k("offer", "startup", "system"), relatedPaths: ["/admin/offers/startup-growth-system/edit"] },

  // —— Public: content
  { path: "/blog", title: "Blog index", category: "Public · Content", audience: "public", description: "Blog listing.", keywords: k("blog", "articles") },
  { path: "/blog/[slug]", title: "Blog post", category: "Public · Content", audience: "public", description: "Dynamic blog article.", keywords: k("blog", "post") },
  { path: "/website-breakdowns", title: "Website breakdowns index", category: "Public · Content", audience: "public", description: "Breakdown series index.", keywords: k("breakdowns", "examples") },
  { path: "/website-breakdowns/[slug]", title: "Website breakdown article", category: "Public · Content", audience: "public", description: "Individual breakdown.", keywords: k("breakdown") },
  { path: "/updates", title: "Updates / changelog", category: "Public · Content", audience: "public", description: "Product or site updates feed page.", keywords: k("changelog", "updates") },

  // —— Public: community
  { path: "/Afn", title: "Community home", category: "Public · Community", audience: "public", description: "Community hub.", keywords: k("community", "forum") },
  { path: "/Afn/feed", title: "Community feed", category: "Public · Community", audience: "public", description: "Activity feed.", keywords: k("feed", "posts") },
  { path: "/Afn/members", title: "Members directory", category: "Public · Community", audience: "public", description: "Member list.", keywords: k("members") },
  { path: "/Afn/members/[username]", title: "Member profile", category: "Public · Community", audience: "public", description: "Public member profile.", keywords: k("profile", "member") },
  { path: "/Afn/post/[id]", title: "Community post", category: "Public · Community", audience: "public", description: "Single post thread.", keywords: k("post", "thread") },
  { path: "/Afn/resources", title: "Community resources", category: "Public · Community", audience: "public", description: "Resource library index.", keywords: k("resources") },
  { path: "/Afn/resources/[slug]", title: "Community resource", category: "Public · Community", audience: "public", description: "Single resource.", keywords: k("resource") },
  { path: "/Afn/inbox", title: "Messages inbox", category: "Public · Community", audience: "public", description: "Direct messages.", keywords: k("inbox", "dm") },
  { path: "/Afn/collab", title: "Collab", category: "Public · Community", audience: "public", description: "Collaboration board / listings.", keywords: k("collab") },
  { path: "/Afn/onboarding", title: "Community onboarding", category: "Public · Community", audience: "public", description: "New member onboarding.", keywords: k("onboarding") },
  { path: "/Afn/profile", title: "My community profile", category: "Public · Community", audience: "public", description: "Edit/view own profile.", keywords: k("profile", "settings") },
  { path: "/Afn/settings", title: "Community settings", category: "Public · Community", audience: "public", description: "Community-related settings.", keywords: k("settings") },

  // —— Public: challenge (paid)
  { path: "/challenge", title: "Challenge landing", category: "Public · Challenge", audience: "public", description: "Paid 5-day challenge marketing.", keywords: k("challenge", "paid") },
  { path: "/challenge/apply", title: "Challenge apply", category: "Public · Challenge", audience: "public", description: "Apply or start challenge flow.", keywords: k("challenge", "apply") },
  { path: "/challenge/checkout", title: "Challenge checkout", category: "Public · Challenge", audience: "public", description: "Stripe checkout for challenge.", keywords: k("checkout", "pay") },
  { path: "/challenge/dashboard", title: "Challenge dashboard", category: "Public · Challenge", audience: "public", description: "Participant dashboard.", keywords: k("challenge", "dashboard") },
  { path: "/challenge/welcome", title: "Challenge welcome", category: "Public · Challenge", audience: "public", description: "Post-purchase welcome.", keywords: k("welcome") },
  { path: "/challenge/thank-you", title: "Challenge thank you", category: "Public · Challenge", audience: "public", description: "Thank-you after purchase.", keywords: k("thanks") },

  // —— Public: auth & client portal
  { path: "/login", title: "Sign-in hub", category: "Public · Auth", audience: "public", description: "Pick client workspace, community account, or guidance if unsure; links to /portal and /auth.", keywords: k("login", "sign in", "hub"), relatedPaths: ["/portal", "/auth"] },
  { path: "/portal", title: "Client workspace sign-in", category: "Public · Auth", audience: "client", description: "Dedicated login for paying clients and project portal.", keywords: k("client", "portal", "workspace", "login"), relatedPaths: ["/dashboard", "/login"] },
  { path: "/portal/welcome", title: "Client workspace welcome", category: "Public · Auth", audience: "client", description: "Signed in but no linked client records; contact / sign out.", keywords: k("client", "portal", "welcome"), relatedPaths: ["/portal", "/contact"] },
  { path: "/auth", title: "Auth", category: "Public · Auth", audience: "public", description: "Auth shell / register login.", keywords: k("auth", "register") },
  { path: "/auth/forgot-password", title: "Forgot password", category: "Public · Auth", audience: "public", description: "Password reset request.", keywords: k("password", "reset") },
  { path: "/auth/reset-password", title: "Reset password", category: "Public · Auth", audience: "public", description: "Password reset form.", keywords: k("password") },
  { path: "/dashboard", title: "Client dashboard", category: "Public · Client portal", audience: "client", description: "Signed-in customer dashboard.", keywords: k("dashboard", "client"), relatedPaths: ["/growth-system", "/dashboard/ppc-results"] },
  {
    path: "/dashboard/ppc-results",
    title: "Advertising results (client)",
    category: "Public · Client portal",
    audience: "client",
    description:
      "Client-friendly PPC snapshot: qualified leads, booked calls, wins, and suggestions—with tooltips and plain-language help.",
    keywords: k("ppc", "ads", "results", "leads", "client portal", "paid advertising"),
    relatedPaths: ["/dashboard", "/growth-system"],
  },
  { path: "/growth-system", title: "Client growth system", category: "Public · Client portal", audience: "client", description: "Outcome-framed 3-step snapshot (diagnose → build → scale) for eligible portal clients; not a results guarantee.", keywords: k("growth", "client", "snapshot", "gos"), relatedPaths: ["/growth-system/diagnose", "/growth-system/build", "/growth-system/scale", "/growth-system/conversion-diagnostics", "/growth-system/improvements", "/growth-system/page-behavior", "/dashboard", "/growth-diagnosis"] },
  { path: "/growth-system/diagnose", title: "Client growth — Diagnose", category: "Public · Client portal", audience: "client", description: "Growth system focused on the Diagnose stage.", keywords: k("growth", "diagnose", "client"), relatedPaths: ["/growth-system"] },
  { path: "/growth-system/build", title: "Client growth — Build", category: "Public · Client portal", audience: "client", description: "Growth system focused on the Build stage.", keywords: k("growth", "build", "client"), relatedPaths: ["/growth-system"] },
  { path: "/growth-system/scale", title: "Client growth — Scale", category: "Public · Client portal", audience: "client", description: "Growth system focused on the Scale stage.", keywords: k("growth", "scale", "client"), relatedPaths: ["/growth-system"] },
  { path: "/growth-system/conversion-diagnostics", title: "Conversion Diagnostics (client)", category: "Public · Client portal", audience: "client", description: "Client-facing behavior and conversion snapshot (CRM-linked sessions); premium summary—not raw analytics noise.", keywords: k("conversion", "diagnostics", "client", "heatmap", "sessions"), relatedPaths: ["/growth-system", "/growth-system/improvements", "/growth-system/page-behavior", "/dashboard"] },
  { path: "/growth-system/improvements", title: "Client — Shared improvements", category: "Public · Client portal", audience: "client", description: "Insight tasks Ascendra operators share with the client’s CRM account (not the full internal queue).", keywords: k("tasks", "improvements", "client"), relatedPaths: ["/growth-system/conversion-diagnostics", "/growth-system"] },
  { path: "/growth-system/page-behavior", title: "Client — Page behavior detail", category: "Public · Client portal", audience: "client", description: "CRM-linked page summary (sessions, interactions, heatmap click counts); drill-down from Conversion Diagnostics.", keywords: k("page", "behavior", "heatmap", "client"), relatedPaths: ["/growth-system/conversion-diagnostics"] },
  { path: "/dashboard/proposals/[id]", title: "Proposal detail", category: "Public · Client portal", audience: "client", description: "View proposal in portal.", keywords: k("proposal", "client") },
  { path: "/offer-valuation", title: "Offer valuation engine", category: "Public · Client portal", audience: "client", description: "Internal/client valuation workspace with mode controls and CRM-connected outputs.", keywords: k("offer", "valuation", "engine", "diagnostic"), relatedPaths: ["/offer-audit", "/admin/dashboard"] },
  { path: "/projects/[id]", title: "Project detail", category: "Public · Client portal", audience: "client", description: "Client project view.", keywords: k("project") },

  // —— Token / special
  { path: "/proposal/view/[token]", title: "Proposal (token)", category: "Public · Token links", audience: "token", description: "Magic-link proposal view.", keywords: k("proposal", "token") },
  { path: "/gos/report/[token]", title: "GOS report (token)", category: "Public · Token links", audience: "token", description: "Shared Growth OS report.", keywords: k("gos", "report", "share") },

  // —— Legal / misc
  { path: "/privacy", title: "Privacy", category: "Public · Legal", audience: "public", description: "Privacy policy.", keywords: k("privacy", "legal") },
  { path: "/terms", title: "Terms", category: "Public · Legal", audience: "public", description: "Terms of service.", keywords: k("terms", "legal") },
  { path: "/data-deletion-request", title: "Data deletion", category: "Public · Legal", audience: "public", description: "GDPR-style deletion request.", keywords: k("privacy", "delete") },
  { path: "/partners/ascendra-technologies", title: "Partner: Ascendra", category: "Public · Partners", audience: "public", description: "Partner page.", keywords: k("partner") },
  { path: "/partners/macon-designs", title: "Partner: Macon Designs", category: "Public · Partners", audience: "public", description: "Partner page.", keywords: k("partner", "macon") },
  { path: "/partners/style-studio-branding", title: "Partner: Style Studio", category: "Public · Partners", audience: "public", description: "Partner page.", keywords: k("partner", "style studio") },

  // —— Admin: core
  { path: "/admin/dashboard", title: "Admin dashboard", category: "Admin · Core", audience: "admin", description: "Assessments, contacts, quick links, tours.", keywords: k("dashboard", "admin", "home") },
  { path: "/admin/settings", title: "Admin settings", category: "Admin · Core", audience: "admin", description: "Notifications, AI agent toggles, preferences.", keywords: k("settings", "preferences") },
  { path: "/admin/agent-knowledge", title: "Assistant knowledge base", category: "Admin · Core", audience: "admin", description: "Private notes and knowledge the AI assistant and optional flows may use when you enable each entry.", keywords: k("assistant", "knowledge", "notes", "agent", "ai") },
  { path: "/admin/operator-profile", title: "Operator profile", category: "Admin · Core", audience: "admin", description: "Operator positioning for AI/intelligence features.", keywords: k("operator", "profile") },
  { path: "/admin/reminders", title: "Reminders", category: "Admin · Core", audience: "admin", description: "Admin reminder tasks.", keywords: k("reminders", "tasks") },
  { path: "/admin/users", title: "User management", category: "Admin · Core", audience: "admin", description: "Approve users, permissions (super).", keywords: k("users", "permissions") },
  {
    path: "/admin/system",
    title: "System monitor",
    category: "Admin · Core",
    audience: "super",
    description:
      "Super-admin: SQL health counts, env checklist, unified live feed (memory + audit + visitors), persisted user_activity_log, in-memory error buffer.",
    keywords: k("system", "logs", "health", "monitor", "super"),
    relatedPaths: ["/api/admin/system/health", "/admin/deployment-env", "/admin/integrations"],
  },
  { path: "/admin/integrations", title: "Connections & email", category: "Admin · Core", audience: "admin", description: "See connected services, tests, and social sign-in (approved admin).", keywords: k("integrations", "email", "social") },
  { path: "/admin/deployment-env", title: "Live site settings (hosting)", category: "Admin · Core", audience: "super", description: "Super admin only: save Vercel env name/value pairs from the browser. Nav link visible only to super admins.", keywords: k("vercel", "hosting", "settings", "env"), relatedPaths: ["/admin/integrations"] },
  { path: "/admin/site-directory", title: "Pages & tools directory", category: "Admin · Core", audience: "admin", description: "Find any page by name or topic; open visitor or admin screens; optional JSON export for developers.", keywords: k("sitemap", "routes", "search", "ia", "directory", "pages"), relatedPaths: ["/api/admin/site-directory"] },
  { path: "/admin/how-to", title: "How-to & guides", category: "Admin · Core", audience: "admin", description: "Practical admin workflows (CRM, AMIE, Growth OS, Content Studio, integrations) with accurate routes; optional browser read-aloud on each guide.", keywords: k("how-to", "guide", "help", "ltv", "knowledge", "tutorial", "training", "documentation", "faq", "text to speech", "audio"), relatedPaths: ["/admin/site-directory", "/admin/agent-knowledge", "/admin/crm/ltv", "/admin/how-to/experiments"] },
  {
    path: "/admin/how-to/experiments",
    title: "How-to: A/B testing & experiments (interactive)",
    category: "Admin · Core",
    audience: "admin",
    description:
      "Interactive AEE tutorial: checklist, SVG data-flow diagram, screen map, scenario examples (landing, email, paid), variant API and glossary — aligned with growth_experiments and rollups.",
    keywords: k("a/b test", "experiments", "tutorial", "training", "aee", "optimization", "multivariate", "statistics"),
    relatedPaths: ["/admin/how-to", "/admin/experiments", "/admin/experiments/new"],
  },

  // —— Admin: CRM
  { path: "/admin/crm", title: "CRM home", category: "Admin · CRM", audience: "admin", description: "CRM overview and contacts entry.", keywords: k("crm", "contacts") },
  { path: "/admin/crm/dashboard", title: "CRM dashboard", category: "Admin · CRM", audience: "admin", description: "CRM metrics and summaries.", keywords: k("crm", "dashboard"), relatedPaths: ["/admin/crm/ltv"] },
  { path: "/admin/crm/ltv", title: "LTV & revenue reports", category: "Admin · CRM", audience: "admin", description: "Parameterized pipeline and client-estimate rollups, optional scenario inputs, CSV export.", keywords: k("ltv", "revenue", "pipeline", "crm", "lifetime value", "report"), relatedPaths: ["/admin/crm/pipeline", "/admin/crm", "/admin/how-to"] },
  { path: "/admin/crm/discovery-tools", title: "Discovery toolkit", category: "Admin · CRM", audience: "admin", description: "Hub for discovery workspaces, Zoom (connections), proposal prep, and LTV reports.", keywords: k("discovery", "zoom", "calls", "crm", "prep"), relatedPaths: ["/admin/crm/discovery", "/admin/integrations", "/admin/crm/ltv"] },
  { path: "/admin/crm/[id]", title: "CRM contact / lead detail", category: "Admin · CRM", audience: "admin", description: "Single contact profile.", keywords: k("contact", "lead", "crm") },
  { path: "/admin/crm/pipeline", title: "CRM pipeline", category: "Admin · CRM", audience: "admin", description: "Deal pipeline board.", keywords: k("pipeline", "deals") },
  { path: "/admin/crm/accounts", title: "CRM accounts", category: "Admin · CRM", audience: "admin", description: "Account list.", keywords: k("accounts", "companies") },
  { path: "/admin/crm/accounts/new", title: "New account", category: "Admin · CRM", audience: "admin", description: "Create account.", keywords: k("account", "new") },
  { path: "/admin/crm/accounts/[id]", title: "Account detail", category: "Admin · CRM", audience: "admin", description: "Account record.", keywords: k("account") },
  { path: "/admin/crm/tasks", title: "CRM tasks", category: "Admin · CRM", audience: "admin", description: "Task list.", keywords: k("tasks") },
  { path: "/admin/crm/sequences", title: "Email sequences", category: "Admin · CRM", audience: "admin", description: "Sequence builder/list.", keywords: k("sequences", "email") },
  { path: "/admin/crm/sequences/new", title: "New sequence", category: "Admin · CRM", audience: "admin", description: "Create sequence.", keywords: k("sequence", "new") },
  { path: "/admin/crm/import", title: "CRM import", category: "Admin · CRM", audience: "admin", description: "CSV import leads.", keywords: k("import", "csv") },
  { path: "/admin/crm/saved-lists", title: "Saved lists", category: "Admin · CRM", audience: "admin", description: "Segment saved lists.", keywords: k("lists", "segments") },
  { path: "/admin/crm/personas", title: "Sales segments & CRM insights", category: "Admin · CRM", audience: "admin", description: "Firmographics from contacts/deals—not Offer + Persona IQ marketing personas.", keywords: k("segments", "crm", "sales", "industry") },
  { path: "/admin/crm/discovery", title: "Discovery inbox", category: "Admin · CRM", audience: "admin", description: "Discovery workspaces: recent across CRM or filtered by contact.", keywords: k("discovery", "zoom", "prep"), relatedPaths: ["/admin/crm/discovery-tools"] },
  { path: "/admin/crm/discovery/[id]", title: "Discovery detail", category: "Admin · CRM", audience: "admin", description: "Single discovery record.", keywords: k("discovery") },
  { path: "/admin/crm/playbooks", title: "Playbooks", category: "Admin · CRM", audience: "admin", description: "Sales playbooks list.", keywords: k("playbooks") },
  { path: "/admin/crm/playbooks/new", title: "New playbook", category: "Admin · CRM", audience: "admin", description: "Create playbook.", keywords: k("playbook", "new") },
  { path: "/admin/crm/playbooks/[id]", title: "Playbook detail", category: "Admin · CRM", audience: "admin", description: "View playbook.", keywords: k("playbook") },
  { path: "/admin/crm/playbooks/[id]/edit", title: "Edit playbook", category: "Admin · CRM", audience: "admin", description: "Edit playbook.", keywords: k("playbook", "edit") },
  { path: "/admin/crm/proposal-prep", title: "Proposal prep", category: "Admin · CRM", audience: "admin", description: "Proposal preparation queue.", keywords: k("proposal", "prep") },
  { path: "/admin/crm/proposal-prep/[id]", title: "Proposal prep detail", category: "Admin · CRM", audience: "admin", description: "Single prep workspace.", keywords: k("proposal") },
  { path: "/admin/lead-intake", title: "Lead intake", category: "Admin · CRM", audience: "admin", description: "Inbound lead triage.", keywords: k("leads", "intake") },
  {
    path: "/admin/leads",
    title: "Lead command center",
    category: "Admin · CRM",
    audience: "admin",
    description: "Lead Control System: priority queue, first-touch stats, links to CRM — same contacts as CRM, no duplicate lead DB.",
    keywords: k("leads", "command", "inbound", "priority", "speed to lead", "spam", "qualification", "follow up"),
    relatedPaths: [
      "/admin/dashboard",
      "/admin/crm",
      "/admin/leads/settings",
      "/admin/lead-intake",
      "/admin/crm/tasks",
      "/admin/funnel",
      "/admin/scheduler",
      "/admin/paid-growth",
      "/admin/newsletters",
      "/admin/analytics",
      "/admin/experiments",
    ],
  },
  {
    path: "/admin/leads/settings",
    title: "Lead Control routing rules",
    category: "Admin · CRM",
    audience: "admin",
    description: "Org-wide Lead Control routing rules; first match sets crm_contacts.lead_routing_hint (CRM-backed, no parallel lead DB).",
    keywords: k("leads", "routing", "qualification", "book call", "lead control", "rules"),
    relatedPaths: ["/admin/leads", "/admin/crm"],
  },

  // —— Admin: content & comms
  {
    path: "/admin/email-hub",
    title: "Email Hub",
    category: "Admin · Communications",
    audience: "admin",
    description:
      "Founder/admin outbound workspace: compose, drafts, scheduled sends, templates, brand assets, Brevo webhooks. Subroutes: inbox (Gmail/Graph sync), compose, drafts, scheduled, sent, templates, assets, tracking, settings.",
    keywords: k("email", "hub", "brevo", "compose", "transactional", "templates", "inbox", "gmail"),
    relatedPaths: ["/admin/communications", "/admin/crm", "/admin/newsletters"],
  },
  {
    path: "/admin/email-hub/inbox",
    title: "Email Hub · Inbox",
    category: "Admin · Communications",
    audience: "admin",
    description: "Synced Gmail or Microsoft inbox: threads, read/unread, reply.",
    keywords: k("inbox", "gmail", "microsoft", "graph", "email hub"),
    relatedPaths: ["/admin/email-hub"],
  },
  { path: "/admin/blog", title: "Blog admin", category: "Admin · Content", audience: "admin", description: "Manage blog posts.", keywords: k("blog", "cms") },
  { path: "/admin/blog/analytics", title: "Blog analytics", category: "Admin · Content", audience: "admin", description: "Post analytics.", keywords: k("blog", "analytics") },
  { path: "/admin/newsletters", title: "Newsletters", category: "Admin · Content", audience: "admin", description: "Newsletter campaigns list.", keywords: k("newsletter", "email") },
  { path: "/admin/newsletters/create", title: "Create newsletter", category: "Admin · Content", audience: "admin", description: "Compose campaign.", keywords: k("newsletter", "create") },
  { path: "/admin/newsletters/[id]", title: "Newsletter editor", category: "Admin · Content", audience: "admin", description: "Edit/send campaign.", keywords: k("newsletter") },
  { path: "/admin/newsletters/subscribers", title: "Subscribers", category: "Admin · Content", audience: "admin", description: "List subscribers.", keywords: k("subscribers") },
  { path: "/admin/content-studio", title: "Content Studio hub", category: "Admin · Content", audience: "admin", description: "Documents, calendar, publishing.", keywords: k("content studio", "social") },
  { path: "/admin/content-studio/documents", title: "CS documents", category: "Admin · Content", audience: "admin", description: "Content documents list.", keywords: k("documents") },
  { path: "/admin/content-studio/documents/[id]", title: "CS document editor", category: "Admin · Content", audience: "admin", description: "Edit single document.", keywords: k("document", "editor") },
  { path: "/admin/content-studio/calendar", title: "CS calendar", category: "Admin · Content", audience: "admin", description: "Scheduled posts.", keywords: k("calendar", "schedule") },
  { path: "/admin/content-studio/strategy", title: "CS content strategy", category: "Admin · Content", audience: "admin", description: "Editorial pillars, checklists, brief builder; complements calendar strategy meta.", keywords: k("content strategy", "editorial", "calendar") },
  { path: "/admin/content-studio/campaigns", title: "CS campaigns", category: "Admin · Content", audience: "admin", description: "Campaign grouping.", keywords: k("campaigns") },
  { path: "/admin/content-studio/workflow", title: "Post history", category: "Admin · Content", audience: "admin", description: "Social publish log and channel list.", keywords: k("publish", "content studio") },
  { path: "/admin/content-studio/import-export", title: "CS import/export", category: "Admin · Content", audience: "admin", description: "Bulk import export.", keywords: k("import", "export") },

  // —— Admin: marketing intelligence
  { path: "/admin/ascendra-intelligence", title: "Offer + Persona IQ hub", category: "Admin · Marketing IQ", audience: "admin", description: "Personas, scripts, lead magnets, previews.", keywords: k("persona", "scripts", "lead magnet", "iq") },
  { path: "/admin/ascendra-intelligence/personas", title: "Marketing personas", category: "Admin · Marketing IQ", audience: "admin", description: "Target personas (not app users).", keywords: k("personas", "marketing") },
  { path: "/admin/ascendra-intelligence/personas/new", title: "New persona", category: "Admin · Marketing IQ", audience: "admin", description: "Create persona.", keywords: k("persona", "new") },
  { path: "/admin/ascendra-intelligence/personas/[id]", title: "Edit persona", category: "Admin · Marketing IQ", audience: "admin", description: "Persona detail.", keywords: k("persona") },
  { path: "/admin/ascendra-intelligence/scripts", title: "Outreach scripts", category: "Admin · Marketing IQ", audience: "admin", description: "Script templates by category.", keywords: k("scripts", "outreach") },
  { path: "/admin/ascendra-intelligence/scripts/new", title: "New script", category: "Admin · Marketing IQ", audience: "admin", description: "Create script template.", keywords: k("script", "new") },
  { path: "/admin/ascendra-intelligence/scripts/[id]", title: "Edit script", category: "Admin · Marketing IQ", audience: "admin", description: "Script editor.", keywords: k("script") },
  { path: "/admin/ascendra-intelligence/lead-magnets", title: "Lead magnets (IQ)", category: "Admin · Marketing IQ", audience: "admin", description: "Typed lead magnet definitions.", keywords: k("lead magnet") },
  { path: "/admin/ascendra-intelligence/lead-magnets/new", title: "New lead magnet", category: "Admin · Marketing IQ", audience: "admin", description: "Create magnet.", keywords: k("lead magnet", "new") },
  { path: "/admin/ascendra-intelligence/lead-magnets/[id]", title: "Edit lead magnet", category: "Admin · Marketing IQ", audience: "admin", description: "Magnet editor.", keywords: k("lead magnet") },
  { path: "/admin/ascendra-intelligence/preview", title: "IQ preview", category: "Admin · Marketing IQ", audience: "admin", description: "Preview composed offers/personas.", keywords: k("preview") },
  { path: "/admin/offer-engine", title: "Ascendra Offer Engine", category: "Admin · Marketing IQ", audience: "admin", description: "Offer & lead magnet templates, persona strategy, scoring, funnel alignment, copy blocks.", keywords: k("offer engine", "conversion", "lead magnet", "persona"), relatedPaths: ["/admin/ascendra-intelligence", "/admin/offers"] },
  { path: "/admin/offer-engine/offers", title: "Offer Engine — offers", category: "Admin · Marketing IQ", audience: "admin", description: "Offer template list.", keywords: k("offers", "templates") },
  { path: "/admin/offer-engine/offers/new", title: "Offer Engine — new offer", category: "Admin · Marketing IQ", audience: "admin", description: "Create offer template.", keywords: k("new offer") },
  { path: "/admin/offer-engine/offers/[id]", title: "Offer Engine — edit offer", category: "Admin · Marketing IQ", audience: "admin", description: "Tabbed offer editor (strategy, funnel, copy, score).", keywords: k("offer editor") },
  { path: "/admin/offer-engine/lead-magnets", title: "Offer Engine — lead magnets", category: "Admin · Marketing IQ", audience: "admin", description: "Lead magnet template list.", keywords: k("lead magnet", "templates") },
  { path: "/admin/offer-engine/lead-magnets/new", title: "Offer Engine — new lead magnet", category: "Admin · Marketing IQ", audience: "admin", description: "Create lead magnet template.", keywords: k("lead magnet", "new") },
  { path: "/admin/offer-engine/lead-magnets/[id]", title: "Offer Engine — edit lead magnet", category: "Admin · Marketing IQ", audience: "admin", description: "Lead magnet editor.", keywords: k("lead magnet") },
  { path: "/admin/offer-engine/personas", title: "Offer Engine — personas", category: "Admin · Marketing IQ", audience: "admin", description: "Persona strategy layer.", keywords: k("persona", "strategy") },
  { path: "/admin/offer-engine/personas/[id]", title: "Offer Engine — persona strategy", category: "Admin · Marketing IQ", audience: "admin", description: "Edit Offer Engine fields for one persona.", keywords: k("persona") },
  { path: "/admin/offer-engine/funnel-paths", title: "Offer Engine — funnel paths", category: "Admin · Marketing IQ", audience: "admin", description: "Saved funnel visualization paths.", keywords: k("funnel", "path") },
  { path: "/admin/offer-engine/analytics-hooks", title: "Offer Engine — analytics hooks", category: "Admin · Marketing IQ", audience: "admin", description: "Placeholder metric keys for future instrumentation.", keywords: k("analytics", "metrics") },
  { path: "/admin/offers", title: "Site offers list", category: "Admin · Marketing IQ", audience: "admin", description: "Editable site offer pages (e.g. startup growth system).", keywords: k("offers", "site offers", "pricing page") },
  { path: "/admin/offers/[slug]/edit", title: "Edit site offer", category: "Admin · Marketing IQ", audience: "admin", description: "CMS for offer sections + grading.", keywords: k("offer", "edit", "grade") },
  { path: "/admin/funnel", title: "Funnel admin hub", category: "Admin · Funnel", audience: "admin", description: "Links to funnel assets + offer.", keywords: k("funnel", "startup") },
  { path: "/admin/funnel/growth-kit", title: "Funnel: growth kit notes", category: "Admin · Funnel", audience: "admin", description: "Admin notes for startup kit.", keywords: k("growth kit", "funnel") },
  { path: "/admin/funnel/website-score", title: "Funnel: website score", category: "Admin · Funnel", audience: "admin", description: "Admin copy for score tool.", keywords: k("website score", "funnel") },
  { path: "/admin/funnel/action-plan", title: "Funnel: action plan", category: "Admin · Funnel", audience: "admin", description: "Admin notes action plan.", keywords: k("action plan") },
  { path: "/admin/funnel/offer", title: "Funnel: offer reference", category: "Admin · Funnel", audience: "admin", description: "Read-only offer summary + edit link.", keywords: k("offer", "funnel") },
  { path: "/admin/funnel/content-library", title: "Funnel content library", category: "Admin · Funnel", audience: "admin", description: "Uploaded funnel assets.", keywords: k("assets", "library") },
  { path: "/admin/funnel/[slug]/edit", title: "Edit funnel page", category: "Admin · Funnel", audience: "admin", description: "Dynamic funnel page editor.", keywords: k("funnel", "edit") },

  // —— Admin: growth products
  { path: "/admin/growth-os", title: "Growth OS hub", category: "Admin · Growth OS", audience: "admin", description: "Client Growth OS admin shell.", keywords: k("growth os", "gos") },
  {
    path: "/admin/scheduler",
    title: "Meetings & calendar",
    category: "Admin · Growth OS",
    audience: "admin",
    description: "Calendar views, appointment inbox, shareable booking pages, and routing tools.",
    keywords: k("scheduler", "calendar", "bookings", "appointments", "routing"),
    relatedPaths: ["/admin/scheduling", "/book"],
  },
  {
    path: "/admin/scheduling",
    title: "Booking & reminders setup",
    category: "Admin · Growth OS",
    audience: "admin",
    description: "Time zones, meeting types, availability, email templates, and public booking toggle (shared with Meetings & calendar).",
    keywords: k("scheduling", "calendar", "bookings", "availability", "email"),
    relatedPaths: ["/book", "/admin/scheduler", "/admin/scheduling/my-availability"],
  },
  {
    path: "/admin/growth-os/intelligence",
    title: "Market & growth intelligence",
    category: "Admin · Growth OS",
    audience: "admin",
    description: "Topic discovery, lead/content/ops rollups, automation.",
    keywords: k("intelligence", "market research", "research", "growth os", "automation"),
    relatedPaths: ["/admin/market-intelligence"],
  },
  {
    path: "/admin/market-intelligence",
    title: "AMIE — market intelligence",
    category: "Admin · Growth OS",
    audience: "admin",
    description:
      "Ascendra Market Intelligence Engine: scored demand, competition, economics, strategy, CRM/PPC/funnel hints.",
    keywords: k("amie", "market intelligence", "decision intelligence", "TAM", "competition", "persona"),
    relatedPaths: ["/admin/growth-os/intelligence", "/admin/paid-growth", "/admin/crm"],
  },
  { path: "/admin/growth-os/security", title: "GOS security", category: "Admin · Growth OS", audience: "admin", description: "Security settings for GOS.", keywords: k("security", "gos") },
  { path: "/admin/growth-os/shares", title: "GOS shares", category: "Admin · Growth OS", audience: "admin", description: "Shared reports/links.", keywords: k("shares", "tokens") },
  { path: "/admin/internal-audit", title: "Internal funnel audit", category: "Admin · Growth OS", audience: "admin", description: "Run internal audits.", keywords: k("audit", "internal") },
  { path: "/admin/internal-audit/[id]", title: "Internal audit run", category: "Admin · Growth OS", audience: "admin", description: "Single audit run detail.", keywords: k("audit", "run") },
  { path: "/admin/growth-diagnosis", title: "Growth diagnosis admin", category: "Admin · Growth OS", audience: "admin", description: "Review automated diagnosis submissions.", keywords: k("diagnosis", "admin", "reports") },

  // —— Admin: ops
  { path: "/admin/invoices", title: "Invoices", category: "Admin · Ops", audience: "admin", description: "Billing and invoices.", keywords: k("invoices", "stripe") },
  { path: "/admin/analytics", title: "Website analytics", category: "Admin · Ops", audience: "admin", description: "Site-wide analytics dashboard.", keywords: k("analytics", "traffic"), relatedPaths: ["/admin/behavior-intelligence"] },
  { path: "/admin/behavior-intelligence", title: "Ascendra Growth Intelligence", category: "Admin · Ops", audience: "admin", description: "Session intelligence: replay, heatmaps, surveys, friction, conversion diagnostics, insight tasks (extends visitor tracking).", keywords: k("behavior", "growth intelligence", "replay", "heatmap", "friction", "analytics", "conversion"), relatedPaths: ["/admin/growth-engine", "/admin/behavior-intelligence/conversion-diagnostics", "/admin/analytics", "/admin/storage-retention", "/admin/behavior-intelligence/visitors", "/admin/behavior-intelligence/watch", "/admin/behavior-intelligence/replays", "/admin/behavior-intelligence/insight-tasks"] },
  { path: "/admin/growth-engine", title: "Growth engine (Phase 2)", category: "Admin · Ops", audience: "admin", description: "Revenue attribution, lead signals, automations, ROI costs, calls, internal knowledge, funnel canvas — extends Growth Intelligence.", keywords: k("revenue", "roi", "automation", "alerts", "attribution", "funnel"), relatedPaths: ["/admin/behavior-intelligence", "/admin/growth-engine/revenue", "/admin/growth-engine/alerts", "/admin/growth-engine/funnel-overview", "/admin/growth-engine/funnel-canvas"] },
  { path: "/admin/growth-engine/funnel-overview", title: "Growth engine — Funnel overview", category: "Admin · Ops", audience: "admin", description: "Blueprint step paths joined to behavior event counts per path (metadata.page) over a rolling window.", keywords: k("funnel", "blueprint", "behavior", "conversion", "metrics"), relatedPaths: ["/admin/growth-engine/funnel-canvas", "/admin/growth-engine", "/admin/behavior-intelligence"] },
  { path: "/admin/behavior-intelligence/conversion-diagnostics", title: "Growth Intelligence — Conversion Diagnostics", category: "Admin · Ops", audience: "admin", description: "Operational conversion diagnostics, intent heuristics, friction rollups.", keywords: k("conversion", "diagnostics", "friction", "sessions"), relatedPaths: ["/admin/behavior-intelligence", "/admin/experiments"] },
  { path: "/admin/behavior-intelligence/insight-tasks", title: "Growth Intelligence — Insight tasks", category: "Admin · Ops", audience: "admin", description: "Tasks from insights; link to experiments and evidence.", keywords: k("tasks", "insights", "optimization"), relatedPaths: ["/admin/behavior-intelligence/conversion-diagnostics", "/admin/experiments"] },
  { path: "/admin/storage-retention", title: "Ascendra OS — Storage & retention", category: "Admin · Ops", audience: "admin", description: "90-day retention, trash, restore for behavior sessions and draft funnel assets.", keywords: k("retention", "storage", "purge", "restore", "replay") },
  { path: "/admin/behavior-intelligence/visitors", title: "Behavior Intelligence — Visitors", category: "Admin · Ops", audience: "admin", description: "Visitor log: sessions, replay, heatmap links, filters (hub API).", keywords: k("visitors", "sessions", "replay", "heatmap", "behavior") },
  { path: "/admin/behavior-intelligence/watch", title: "Behavior Intelligence — Watch targets", category: "Admin · Ops", audience: "admin", description: "Path, full URL, or Agency OS project targets; multi-project watch reports; OS metadata tags.", keywords: k("behavior", "heatmap", "replay", "watch", "agency os") },
  { path: "/admin/behavior-intelligence/replays", title: "Behavior Intelligence — Replays", category: "Admin · Ops", audience: "admin", description: "rrweb session replay viewer.", keywords: k("replay", "session"), relatedPaths: ["/admin/behavior-intelligence/visitors"] },
  { path: "/admin/behavior-intelligence/heatmaps", title: "Behavior Intelligence — Heatmaps", category: "Admin · Ops", audience: "admin", description: "Click heatmaps and interactive density overlay.", keywords: k("heatmap", "clicks"), relatedPaths: ["/admin/behavior-intelligence/visitors"] },
  { path: "/admin/behavior-intelligence/surveys", title: "Behavior Intelligence — Surveys", category: "Admin · Ops", audience: "admin", description: "Survey definitions and responses.", keywords: k("survey", "feedback") },
  { path: "/admin/behavior-intelligence/user-tests", title: "Behavior Intelligence — User tests", category: "Admin · Ops", audience: "admin", description: "Test campaigns and observations.", keywords: k("user test", "research") },
  { path: "/admin/behavior-intelligence/friction-reports", title: "Behavior Intelligence — Friction", category: "Admin · Ops", audience: "admin", description: "Aggregated friction reports.", keywords: k("friction", "conversion") },
  {
    path: "/admin/experiments",
    title: "Ascendra Experimentation Engine",
    category: "Admin · Ops",
    audience: "admin",
    description:
      "Unified A/B and multivariate tests with CRM + PPC closed-loop; extends growth_experiments and visitor_activity.",
    keywords: k("experiments", "a/b test", "attribution", "optimization", "aee"),
    relatedPaths: [
      "/admin/analytics",
      "/admin/crm",
      "/admin/paid-growth",
      "/admin/communications/analytics",
      "/admin/how-to/experiments",
    ],
  },
  { path: "/admin/experiments/new", title: "New experiment (AEE)", category: "Admin · Ops", audience: "admin", description: "Create experiment and variants.", keywords: k("experiments", "wizard") },
  { path: "/admin/experiments/reports", title: "Experiment reports (AEE)", category: "Admin · Ops", audience: "admin", description: "Cross-experiment reporting and export entry.", keywords: k("experiments", "reports") },
  { path: "/admin/experiments/patterns", title: "Content DNA (AEE)", category: "Admin · Ops", audience: "admin", description: "Winning patterns across tests and content.", keywords: k("experiments", "patterns", "content dna") },
  { path: "/admin/experiments/[id]", title: "Experiment detail (AEE)", category: "Admin · Ops", audience: "admin", description: "Single experiment metrics and recommendations.", keywords: k("experiments", "detail") },
  {
    path: "/admin/paid-growth",
    title: "Growth Engine — PPC & revenue",
    category: "Admin · Ops",
    audience: "admin",
    description:
      "Ascendra Growth Engine: readiness gates, campaign builder, lead quality, attribution-friendly UTMs, rules-based optimization — extends CRM and funnels without a duplicate ads stack.",
    keywords: k("ppc", "google ads", "meta ads", "paid growth", "cpql", "roas", "readiness", "optimization"),
    relatedPaths: ["/admin/crm", "/admin/funnel", "/admin/experiments", "/admin/leads", "/admin/growth-platform"],
  },
  {
    path: "/admin/growth-engine",
    title: "Growth engine (Phase 2 hub)",
    category: "Admin · Ops",
    audience: "admin",
    description:
      "Revenue events, lead signals, automations, ROI inputs, funnel canvas, and knowledge layer—built on Growth Intelligence behavior data.",
    keywords: k("growth engine", "phase 2", "attribution", "automations", "revenue signals", "funnel canvas"),
    relatedPaths: [
      "/admin/behavior-intelligence",
      "/admin/paid-growth",
      "/admin/growth-engine/revenue",
      "/admin/growth-engine/automations",
      "/admin/growth-engine/funnel-overview",
    ],
  },
  {
    path: "/admin/growth-platform",
    title: "Growth System Platform (admin)",
    category: "Admin · Ops",
    audience: "admin",
    description:
      "Admin view of DFY/DWY/DIY catalog (from shared stack) and PPC campaign models; links to public hub, offers JSON, CRM, and experiments.",
    keywords: k("growth platform", "offer stack", "dfy", "dwy", "diy", "catalog"),
    relatedPaths: [
      "/growth-platform",
      "/admin/growth-platform/agreements",
      "/admin/experiments",
      "/admin/offers",
      "/admin/leads",
      "/admin/paid-growth",
    ],
  },
  {
    path: "/admin/growth-platform/agreements",
    title: "Growth platform — service agreements",
    category: "Admin · Ops",
    audience: "admin",
    description:
      "Create generated service agreement HTML, milestones, public sign links; issue Stripe invoices per milestone (webhook marks paid). Persona pricing on parent page.",
    keywords: k("agreement", "esign", "stripe", "milestones", "sow"),
    relatedPaths: ["/admin/growth-platform", "/agreements/[token]", "/admin/behavior-intelligence/heatmaps"],
  },
  { path: "/admin/paid-growth/optimization", title: "PPC optimization (rules)", category: "Admin · Ops", audience: "admin", description: "Persisted recommendations from spend + lead-quality rules.", keywords: k("optimization", "ppc", "rules") },
  { path: "/admin/paid-growth/verification", title: "PPC lead verification queue", category: "Admin · Ops", audience: "admin", description: "Pending verification for paid-attributed CRM leads; ties to attribution sessions and billable events.", keywords: k("verification", "ppc", "leads", "queue") },
  { path: "/admin/paid-growth/billable-events", title: "PPC billable events", category: "Admin · Ops", audience: "admin", description: "Performance billing line items: approve, dispute, or reject before invoicing.", keywords: k("billing", "ppc", "billable", "events") },
  { path: "/admin/paid-growth/calls", title: "PPC tracked calls queue", category: "Admin · Ops", audience: "admin", description: "Manual call logging and verification until telephony webhooks connect.", keywords: k("calls", "ppc", "tracking", "verification") },
  { path: "/admin/paid-growth/billing", title: "PPC fulfillment & billing (internal)", category: "Admin · Ops", audience: "admin", description: "Internal retainers, setup fees, labor estimates, profitability notes for Ascendra PPC delivery.", keywords: k("billing", "retainer", "ppc", "internal") },
  { path: "/admin/paid-growth/campaigns/[id]/structure", title: "Campaign structure (ad groups)", category: "Admin · Ops", audience: "admin", description: "Ad groups, keywords, destinations, copy variants for a PPC campaign.", keywords: k("ad groups", "keywords", "ppc", "structure") },
  {
    path: "/api/admin/agent/sop-workflow",
    title: "Admin — merged Ascendra SOP workflow JSON",
    category: "Admin · Ops",
    audience: "admin",
    description:
      "GET returns structured delivery workflow (defaults + optional ASCENDRA_SOP_WORKFLOW_JSON) used to ground the floating AI assistant. Aligns to public Ascendra Technologies SOP PDF.",
    keywords: k("sop", "workflow", "ai", "assistant", "delivery", "agency"),
    relatedPaths: ["/admin/agency-os", "/admin/agent-knowledge"],
  },
  {
    path: "/api/admin/agent/refresh-context",
    title: "Admin — invalidate assistant site digest cache",
    category: "Admin · Ops",
    audience: "admin",
    description:
      "POST clears the in-memory admin agent CONTEXT so the next chat rebuild loads site directory digest + admin page metadata crawl from disk (no HTTP crawl).",
    keywords: k("assistant", "ai", "cache", "context", "rescan", "site map"),
    relatedPaths: ["/admin/settings", "/admin/site-directory"],
  },
  {
    path: "/admin/agency-os",
    title: "Agency Operating System",
    category: "Admin · Ops",
    audience: "admin",
    description:
      "HVD registry, internal delivery projects API, agency tasks with acceptance (accept/decline/clarify), and execution logs — ties build work to pipeline and revenue outcomes.",
    keywords: k("agency os", "hvd", "delivery", "tasks", "acceptance", "execution", "operations"),
    relatedPaths: [
      "/admin/agency-os/projects",
      "/admin/agency-os/hvd",
      "/admin/agency-os/tasks",
      "/admin/agency-os/sops",
      "/admin/agency-os/playbooks",
      "/admin/agency-os/training",
      "/admin/agency-os/roles",
      "/admin/crm",
      "/admin/growth-platform",
    ],
  },
  {
    path: "/admin/agency-os/projects",
    title: "Agency OS — Delivery projects",
    category: "Admin · Ops",
    audience: "admin",
    description: "List internal engagements; detail view for phases, milestones, and linked tasks.",
    keywords: k("agency", "projects", "milestones", "delivery", "hvd"),
    relatedPaths: ["/admin/agency-os/tasks", "/admin/agency-os/hvd"],
  },
  {
    path: "/admin/agency-os/hvd",
    title: "Agency OS — Value (HVD) registry",
    category: "Admin · Ops",
    audience: "admin",
    description: "High-Value Delivery categories; built-in seed + custom rows; validation on projects and tasks.",
    keywords: k("hvd", "value", "registry", "agency"),
    relatedPaths: ["/admin/agency-os", "/admin/agency-os/tasks", "/admin/agency-os/projects"],
  },
  {
    path: "/admin/agency-os/tasks",
    title: "Agency OS — Tasks & acceptance",
    category: "Admin · Ops",
    audience: "admin",
    description:
      "Internal tasks with pending acceptance; assignee-only acceptance by default; env AGENCY_OS_ADMIN_TASK_ACCEPTANCE=1 allows any approved admin to respond.",
    keywords: k("tasks", "acceptance", "agency", "delivery"),
    relatedPaths: ["/admin/agency-os", "/admin/agency-os/hvd", "/admin/agency-os/projects"],
  },
  {
    path: "/admin/agency-os/sops",
    title: "Agency OS — SOPs",
    category: "Admin · Ops",
    audience: "admin",
    description: "Standard operating procedures; CRUD via UI/API; optional execution role and HVD linkage.",
    keywords: k("sop", "procedures", "agency", "delivery"),
    relatedPaths: ["/admin/agency-os", "/admin/agency-os/roles"],
  },
  {
    path: "/admin/agency-os/playbooks",
    title: "Agency OS — Playbooks",
    category: "Admin · Ops",
    audience: "admin",
    description: "Step sequences for delivery; custom rows; built-ins are non-deletable.",
    keywords: k("playbook", "agency", "delivery"),
    relatedPaths: ["/admin/agency-os", "/admin/agency-os/hvd"],
  },
  {
    path: "/admin/agency-os/training",
    title: "Agency OS — Training modules",
    category: "Admin · Ops",
    audience: "admin",
    description: "Structured training content JSON; optional filters by role key or HVD slug.",
    keywords: k("training", "onboarding", "agency"),
    relatedPaths: ["/admin/agency-os", "/admin/agency-os/roles"],
  },
  {
    path: "/admin/agency-os/roles",
    title: "Agency OS — Execution roles",
    category: "Admin · Ops",
    audience: "admin",
    description: "Built-in and custom execution roles; map approved admins to role memberships.",
    keywords: k("roles", "raci", "agency", "delivery"),
    relatedPaths: ["/admin/agency-os/sops", "/admin/agency-os/training"],
  },
  { path: "/admin/announcements", title: "Project announcements", category: "Admin · Ops", audience: "admin", description: "Client-facing project updates.", keywords: k("announcements", "updates") },
  { path: "/admin/feedback", title: "Feedback inbox", category: "Admin · Ops", audience: "admin", description: "User feedback tickets.", keywords: k("feedback") },
  { path: "/admin/chat", title: "Admin chat", category: "Admin · Ops", audience: "admin", description: "Operator chat with clients.", keywords: k("chat", "support") },
  { path: "/admin/challenge/leads", title: "Challenge leads", category: "Admin · Ops", audience: "admin", description: "Challenge purchasers/leads.", keywords: k("challenge", "leads") },
];

/** Dedupe by path (first wins) — guards against edit mistakes in this file. */
function dedupeByPath(entries: SiteDirectoryEntry[]): SiteDirectoryEntry[] {
  const seen = new Set<string>();
  const out: SiteDirectoryEntry[] = [];
  for (const e of entries) {
    if (seen.has(e.path)) continue;
    seen.add(e.path);
    out.push(e);
  }
  return out;
}

export const SITE_DIRECTORY_ENTRIES_UNIQUE = dedupeByPath(SITE_DIRECTORY_ENTRIES);

function buildEntryHay(e: SiteDirectoryEntry): string {
  return [
    e.path,
    e.title,
    e.category,
    e.description,
    e.cluster ?? "",
    e.consolidateNote ?? "",
    ...(e.keywords ?? []),
    ...(e.relatedPaths ?? []),
  ].join(" ");
}

type SiteDirectorySearchRow = {
  entry: SiteDirectoryEntry;
  hay: string;
  titleL: string;
  pathL: string;
  descL: string;
  keywordsL: string;
};

let cachedSearchRows: SiteDirectorySearchRow[] | null = null;

function getSiteDirectorySearchRows(): SiteDirectorySearchRow[] {
  if (!cachedSearchRows) {
    cachedSearchRows = SITE_DIRECTORY_ENTRIES_UNIQUE.map((e) => {
      const hay = buildEntryHay(e);
      return {
        entry: e,
        hay: hay.toLowerCase(),
        titleL: e.title.toLowerCase(),
        pathL: e.path.toLowerCase(),
        descL: e.description.toLowerCase(),
        keywordsL: (e.keywords ?? []).join(" ").toLowerCase(),
      };
    });
  }
  return cachedSearchRows;
}

function scoreDirectoryRow(q: ParsedAdvancedSearchQuery, r: SiteDirectorySearchRow): number {
  let score = 0;
  for (const p of q.phrases) {
    const slugish = p.replace(/\s+/g, "-");
    const compact = p.replace(/\s+/g, "");
    if (r.titleL.includes(p)) score += 120;
    if (r.pathL.includes(slugish) || (compact.length > 2 && r.pathL.includes(compact))) score += 95;
    else if (r.pathL.includes(p)) score += 85;
    if (r.keywordsL.includes(p)) score += 72;
    if (r.descL.includes(p)) score += 42;
  }
  for (const t of q.tokens) {
    if (r.titleL === t) score += 55;
    else if (
      r.titleL.startsWith(`${t} `) ||
      r.titleL.endsWith(` ${t}`) ||
      r.titleL.includes(` ${t} `)
    ) {
      score += 38;
    } else if (r.titleL.includes(t)) score += 28;
    if (r.pathL.includes(t)) score += 16;
    if (r.keywordsL.includes(t)) score += 12;
    if (r.descL.includes(t)) score += 6;
  }
  return score;
}

/**
 * Filter site directory entries by advanced query (quoted phrases + tokens), sorted by relevance.
 * Precomputed haystacks keep repeated filtering fast on the client.
 */
export function searchSiteDirectory(query: string): SiteDirectoryEntry[] {
  const parsed = parseAdvancedSearchQuery(query);
  if (isParsedQueryEmpty(parsed)) return SITE_DIRECTORY_ENTRIES_UNIQUE;

  const rows = getSiteDirectorySearchRows();
  const scored: { entry: SiteDirectoryEntry; score: number }[] = [];
  for (const r of rows) {
    if (!haystackMatchesParsedQuery(r.hay, parsed)) continue;
    scored.push({ entry: r.entry, score: scoreDirectoryRow(parsed, r) });
  }
  scored.sort(
    (a, b) =>
      b.score - a.score ||
      a.entry.path.length - b.entry.path.length ||
      a.entry.title.localeCompare(b.entry.title),
  );
  return scored.map((s) => s.entry);
}

/** Top N matches for assistant hints (same ranking as searchSiteDirectory). */
export function topSiteDirectoryMatches(query: string, limit: number): SiteDirectoryEntry[] {
  const n = Math.min(20, Math.max(1, limit));
  return searchSiteDirectory(query).slice(0, n);
}

export function entriesByCluster(): Map<string, SiteDirectoryEntry[]> {
  const m = new Map<string, SiteDirectoryEntry[]>();
  for (const e of SITE_DIRECTORY_ENTRIES_UNIQUE) {
    if (!e.cluster) continue;
    const list = m.get(e.cluster) ?? [];
    list.push(e);
    m.set(e.cluster, list);
  }
  return m;
}

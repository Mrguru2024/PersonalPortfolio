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

export type SiteDirectoryAudience = "public" | "admin" | "client" | "token";

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
  { path: "/book", title: "Book a time (native)", category: "Public · Marketing", audience: "public", description: "Ascendra-hosted scheduling: pick type, date, time; confirmations and reminders.", keywords: k("schedule", "calendar", "meeting", "book"), cluster: "conversion-primary", relatedPaths: ["/strategy-call"] },
  { path: "/call-confirmation", title: "Call confirmation", category: "Public · Marketing", audience: "public", description: "Post-booking confirmation.", keywords: k("call", "confirmed") },
  { path: "/thank-you", title: "Thank you", category: "Public · Marketing", audience: "public", description: "Generic thank-you after conversions.", keywords: k("thanks", "conversion") },

  // —— Public: lead magnets & tools (hub + satellites)
  { path: "/free-growth-tools", title: "Free growth tools (hub)", category: "Public · Tools", audience: "public", description: "Central index of calculators, scans, kits, audits.", keywords: k("tools", "free", "hub", "lead magnets"), cluster: "tools-hub", relatedPaths: ["/free-trial", "/digital-growth-audit", "/growth-diagnosis"] },
  { path: "/free-trial", title: "Free trial narrative", category: "Public · Tools", audience: "public", description: "Value-first trial positioning (call + audit story).", keywords: k("trial", "free trial"), cluster: "lead-entry", relatedPaths: ["/free-growth-tools"] },
  { path: "/digital-growth-audit", title: "Digital growth audit", category: "Public · Tools", audience: "public", description: "Human-positioned audit lead magnet.", keywords: k("audit", "growth audit"), cluster: "audit-lead-magnet", relatedPaths: ["/free-growth-tools"] },
  { path: "/ppc-lead-system", title: "PPC, CRM & lead conversion", category: "Public · Tools", audience: "public", description: "Lead magnet for prospecting, custom CRM, conversion, and paid ad management.", keywords: k("ppc", "ads", "crm", "leads", "prospecting", "conversion", "google ads", "meta ads"), cluster: "lead-entry", relatedPaths: ["/free-growth-tools", "/strategy-call", "/digital-growth-audit"] },
  { path: "/audit", title: "Audit (redirect)", category: "Public · Tools", audience: "public", description: "Legacy URL; redirects to /digital-growth-audit.", keywords: k("redirect", "audit"), cluster: "audit-lead-magnet", consolidateNote: "Already consolidated via redirect." },
  { path: "/journey", title: "Persona journey", category: "Public · Marketing", audience: "public", description: "Self-select business type and problem; routes to tailored lead magnets, services, and CTAs.", keywords: k("persona", "journey", "funnel", "path", "selector"), cluster: "marketing-core", relatedPaths: ["/diagnostics", "/digital-growth-audit", "/strategy-call", "/free-growth-tools"] },
  { path: "/diagnostics", title: "Diagnostics hub", category: "Public · Tools", audience: "public", description: "Choose automated scan, questionnaire, or full assessment.", keywords: k("diagnosis", "hub", "choose", "path"), cluster: "diagnostics-hub", relatedPaths: ["/growth-diagnosis", "/diagnosis", "/assessment", "/free-growth-tools", "/journey"] },
  { path: "/growth-diagnosis", title: "Website growth diagnosis (automated)", category: "Public · Tools", audience: "public", description: "Automated crawl/score style diagnosis experience.", keywords: k("diagnosis", "automated", "scan", "score"), cluster: "automated-diagnosis", relatedPaths: ["/free-growth-tools", "/diagnostics"] },
  { path: "/website-performance-score", title: "Website performance score", category: "Public · Tools", audience: "public", description: "Structured site score on clarity/trust/conversion.", keywords: k("score", "performance"), cluster: "site-scores", relatedPaths: ["/tools/startup-website-score", "/free-growth-tools"] },
  { path: "/tools/startup-website-score", title: "Startup website score", category: "Public · Tools", audience: "public", description: "Short quiz-style startup readiness score.", keywords: k("startup", "score", "quiz"), cluster: "site-scores", consolidateNote: "Same family as /website-performance-score; cross-link from hub." },
  { path: "/website-revenue-calculator", title: "Website revenue calculator", category: "Public · Tools", audience: "public", description: "Opportunity cost / revenue framing.", keywords: k("calculator", "revenue"), cluster: "calculators" },
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
  { path: "/community", title: "Community home", category: "Public · Community", audience: "public", description: "Community hub.", keywords: k("community", "forum") },
  { path: "/community/feed", title: "Community feed", category: "Public · Community", audience: "public", description: "Activity feed.", keywords: k("feed", "posts") },
  { path: "/community/members", title: "Members directory", category: "Public · Community", audience: "public", description: "Member list.", keywords: k("members") },
  { path: "/community/members/[username]", title: "Member profile", category: "Public · Community", audience: "public", description: "Public member profile.", keywords: k("profile", "member") },
  { path: "/community/post/[id]", title: "Community post", category: "Public · Community", audience: "public", description: "Single post thread.", keywords: k("post", "thread") },
  { path: "/community/resources", title: "Community resources", category: "Public · Community", audience: "public", description: "Resource library index.", keywords: k("resources") },
  { path: "/community/resources/[slug]", title: "Community resource", category: "Public · Community", audience: "public", description: "Single resource.", keywords: k("resource") },
  { path: "/community/inbox", title: "Messages inbox", category: "Public · Community", audience: "public", description: "Direct messages.", keywords: k("inbox", "dm") },
  { path: "/community/collab", title: "Collab", category: "Public · Community", audience: "public", description: "Collaboration board / listings.", keywords: k("collab") },
  { path: "/community/onboarding", title: "Community onboarding", category: "Public · Community", audience: "public", description: "New member onboarding.", keywords: k("onboarding") },
  { path: "/community/profile", title: "My community profile", category: "Public · Community", audience: "public", description: "Edit/view own profile.", keywords: k("profile", "settings") },
  { path: "/community/settings", title: "Community settings", category: "Public · Community", audience: "public", description: "Community-related settings.", keywords: k("settings") },

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
  { path: "/dashboard", title: "Client dashboard", category: "Public · Client portal", audience: "client", description: "Signed-in customer dashboard.", keywords: k("dashboard", "client") },
  { path: "/dashboard/offer-valuation", title: "Client offer valuation", category: "Public · Client portal", audience: "client", description: "Client-facing offer valuation workspace (admin-controlled visibility).", keywords: k("offer valuation", "value equation", "offer score"), relatedPaths: ["/admin/offer-valuation"] },
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
  { path: "/resume", title: "Resume", category: "Public · Misc", audience: "public", description: "Resume request / download flow.", keywords: k("resume", "careers") },
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
  { path: "/admin/system", title: "System monitor", category: "Admin · Core", audience: "admin", description: "Health, logs, super-admin capture (super).", keywords: k("system", "logs", "health") },
  { path: "/admin/integrations", title: "Connections & email", category: "Admin · Core", audience: "admin", description: "See connected services, tests, and social sign-in (approved admin).", keywords: k("integrations", "email", "social") },
  { path: "/admin/deployment-env", title: "Live site settings (hosting)", category: "Admin · Core", audience: "admin", description: "Save name/value pairs on Vercel from the admin (site owner).", keywords: k("vercel", "hosting", "settings"), relatedPaths: ["/admin/integrations"] },
  { path: "/admin/site-directory", title: "Pages & tools directory", category: "Admin · Core", audience: "admin", description: "Find any page by name or topic; open visitor or admin screens; optional JSON export for developers.", keywords: k("sitemap", "routes", "search", "ia", "directory", "pages"), relatedPaths: ["/api/admin/site-directory"] },

  // —— Admin: CRM
  { path: "/admin/crm", title: "CRM home", category: "Admin · CRM", audience: "admin", description: "CRM overview and contacts entry.", keywords: k("crm", "contacts") },
  { path: "/admin/crm/dashboard", title: "CRM dashboard", category: "Admin · CRM", audience: "admin", description: "CRM metrics and summaries.", keywords: k("crm", "dashboard"), relatedPaths: ["/admin/crm/ltv"] },
  { path: "/admin/crm/ltv", title: "LTV & revenue snapshot", category: "Admin · CRM", audience: "admin", description: "Pipeline value, client LTV proxy from estimates, source rollups, workflow links.", keywords: k("ltv", "revenue", "pipeline", "crm", "lifetime value"), relatedPaths: ["/admin/crm/pipeline", "/admin/crm"] },
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
  { path: "/admin/crm/discovery", title: "Discovery inbox", category: "Admin · CRM", audience: "admin", description: "Discovery call prep queue.", keywords: k("discovery") },
  { path: "/admin/crm/discovery/[id]", title: "Discovery detail", category: "Admin · CRM", audience: "admin", description: "Single discovery record.", keywords: k("discovery") },
  { path: "/admin/crm/playbooks", title: "Playbooks", category: "Admin · CRM", audience: "admin", description: "Sales playbooks list.", keywords: k("playbooks") },
  { path: "/admin/crm/playbooks/new", title: "New playbook", category: "Admin · CRM", audience: "admin", description: "Create playbook.", keywords: k("playbook", "new") },
  { path: "/admin/crm/playbooks/[id]", title: "Playbook detail", category: "Admin · CRM", audience: "admin", description: "View playbook.", keywords: k("playbook") },
  { path: "/admin/crm/playbooks/[id]/edit", title: "Edit playbook", category: "Admin · CRM", audience: "admin", description: "Edit playbook.", keywords: k("playbook", "edit") },
  { path: "/admin/crm/proposal-prep", title: "Proposal prep", category: "Admin · CRM", audience: "admin", description: "Proposal preparation queue.", keywords: k("proposal", "prep") },
  { path: "/admin/crm/proposal-prep/[id]", title: "Proposal prep detail", category: "Admin · CRM", audience: "admin", description: "Single prep workspace.", keywords: k("proposal") },
  { path: "/admin/lead-intake", title: "Lead intake", category: "Admin · CRM", audience: "admin", description: "Inbound lead triage.", keywords: k("leads", "intake") },

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
  { path: "/admin/offers", title: "Site offers list", category: "Admin · Marketing IQ", audience: "admin", description: "Editable site offer pages (e.g. startup growth system).", keywords: k("offers", "site offers", "pricing page") },
  { path: "/admin/offers/[slug]/edit", title: "Edit site offer", category: "Admin · Marketing IQ", audience: "admin", description: "CMS for offer sections + grading.", keywords: k("offer", "edit", "grade") },
  { path: "/admin/offer-valuation", title: "Offer valuation engine", category: "Admin · Marketing IQ", audience: "admin", description: "Admin scoring and strategy engine for offer value diagnostics.", keywords: k("offer valuation", "score", "diagnosis", "value equation"), relatedPaths: ["/dashboard/offer-valuation"] },
  { path: "/admin/funnel", title: "Funnel admin hub", category: "Admin · Funnel", audience: "admin", description: "Links to funnel assets + offer.", keywords: k("funnel", "startup") },
  { path: "/admin/funnel/growth-kit", title: "Funnel: growth kit notes", category: "Admin · Funnel", audience: "admin", description: "Admin notes for startup kit.", keywords: k("growth kit", "funnel") },
  { path: "/admin/funnel/website-score", title: "Funnel: website score", category: "Admin · Funnel", audience: "admin", description: "Admin copy for score tool.", keywords: k("website score", "funnel") },
  { path: "/admin/funnel/action-plan", title: "Funnel: action plan", category: "Admin · Funnel", audience: "admin", description: "Admin notes action plan.", keywords: k("action plan") },
  { path: "/admin/funnel/offer", title: "Funnel: offer reference", category: "Admin · Funnel", audience: "admin", description: "Read-only offer summary + edit link.", keywords: k("offer", "funnel") },
  { path: "/admin/funnel/content-library", title: "Funnel content library", category: "Admin · Funnel", audience: "admin", description: "Uploaded funnel assets.", keywords: k("assets", "library") },
  { path: "/admin/funnel/[slug]/edit", title: "Edit funnel page", category: "Admin · Funnel", audience: "admin", description: "Dynamic funnel page editor.", keywords: k("funnel", "edit") },

  // —— Admin: growth products
  { path: "/admin/growth-os", title: "Growth OS hub", category: "Admin · Growth OS", audience: "admin", description: "Client Growth OS admin shell.", keywords: k("growth os", "gos") },
  { path: "/admin/scheduling", title: "Native scheduling", category: "Admin · Growth OS", audience: "admin", description: "Bookings, email templates, AI tools for /book.", keywords: k("scheduling", "calendar", "bookings"), relatedPaths: ["/book", "/admin/scheduling/my-availability"] },
  { path: "/admin/growth-os/intelligence", title: "GOS intelligence", category: "Admin · Growth OS", audience: "admin", description: "Intel dashboards/automation.", keywords: k("intelligence", "automation") },
  { path: "/admin/growth-os/security", title: "GOS security", category: "Admin · Growth OS", audience: "admin", description: "Security settings for GOS.", keywords: k("security", "gos") },
  { path: "/admin/growth-os/shares", title: "GOS shares", category: "Admin · Growth OS", audience: "admin", description: "Shared reports/links.", keywords: k("shares", "tokens") },
  { path: "/admin/internal-audit", title: "Internal funnel audit", category: "Admin · Growth OS", audience: "admin", description: "Run internal audits.", keywords: k("audit", "internal") },
  { path: "/admin/internal-audit/[id]", title: "Internal audit run", category: "Admin · Growth OS", audience: "admin", description: "Single audit run detail.", keywords: k("audit", "run") },
  { path: "/admin/growth-diagnosis", title: "Growth diagnosis admin", category: "Admin · Growth OS", audience: "admin", description: "Review automated diagnosis submissions.", keywords: k("diagnosis", "admin", "reports") },

  // —— Admin: ops
  { path: "/admin/invoices", title: "Invoices", category: "Admin · Ops", audience: "admin", description: "Billing and invoices.", keywords: k("invoices", "stripe") },
  { path: "/admin/analytics", title: "Website analytics", category: "Admin · Ops", audience: "admin", description: "Site-wide analytics dashboard.", keywords: k("analytics", "traffic") },
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

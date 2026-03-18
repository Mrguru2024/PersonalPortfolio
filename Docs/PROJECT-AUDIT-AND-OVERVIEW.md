# Project Audit & Overview — Ascendra Technologies

A single reference for **what exists** in the codebase: features, components, routes, APIs, data models, and services. Use this for onboarding, audits, and planning.

---

## 1. Project identity & tech stack

| Item | Details |
|------|--------|
| **Name** | Ascendra Technologies / Brand Growth ecosystem |
| **Type** | Full-stack portfolio, CMS, CRM, funnel & community platform |
| **Framework** | Next.js 16 (App Router), React 19 |
| **Styling** | Tailwind CSS |
| **Database** | PostgreSQL via Drizzle ORM (`@neondatabase/serverless`) |
| **Auth** | Session-based (connect-pg-simple), GitHub OAuth, admin approval |
| **Forms** | React Hook Form, Zod |
| **State** | React Query, Context (e.g. FunnelProvider, MobileNavContext) |
| **Motion** | Framer Motion (respects `prefers-reduced-motion`) |
| **Deployment** | Vercel-ready |

**Ecosystem positioning:** Three partners — **Ascendra Technologies** (web systems, automation, funnels), **Style Studio Branding** (brand strategy, positioning), **Macon Designs** (visual identity, creative execution). One site, unified funnel and routing.

---

## 2. Public-facing features & routes

### 2.1 Core marketing & conversion

| Route | Purpose |
|-------|--------|
| `/` | Home — funnel-led hero, growth diagnosis CTA, problem/authority/how-it-works, ecosystem pillars, blog preview, project examples, contact CTA |
| `/about` | About / ecosystem explanation |
| `/services` | Services overview |
| `/contact` | Contact form (→ CRM + Brevo) |
| `/faq` | FAQ |
| `/strategy-call` | Strategy call request form (→ CRM, discovery path) |
| `/call-confirmation` | Post–strategy-call thank-you |
| `/privacy`, `/terms` | Legal |
| `/data-deletion-request` | GDPR-style data deletion |

### 2.2 Partner & persona pages

| Route | Purpose |
|-------|--------|
| `/partners/ascendra-technologies` | Ascendra authority |
| `/partners/style-studio-branding` | Style Studio authority |
| `/partners/macon-designs` | Macon Designs authority |
| `/brand-growth` | Brand Growth hub (path selector, 3-pillar solution) |
| `/launch-your-brand`, `/rebrand-your-business`, `/marketing-assets` | Persona funnel landings |
| `/contractor-systems`, `/local-business-growth`, `/startup-mvp-development` | Persona landings with FAQ and CTAs |

### 2.3 Growth diagnosis funnel (free)

| Route | Purpose |
|-------|--------|
| `/diagnosis` | Multi-step growth diagnosis (Brand, Visual Identity, Website, Leads, Automation) — stepper UI, state in context + localStorage |
| `/results` | Growth score, bottleneck, Brand/Design/System breakdown, recommendation (Style Studio / Macon / Ascendra), CTA to apply |
| `/apply` | Qualification form (name, email, business, revenue, challenge, timeline, budget) → stored + Brevo user + admin email |
| `/thank-you` | Confirmation, next steps, “Book a strategy call” CTA |

### 2.4 Paid challenge funnel

| Route | Purpose |
|-------|--------|
| `/challenge` | Challenge landing — “Build Your Client-Generating Website System” 5-day paid challenge; hero, who it’s for, 5 days, pricing, order bump, FAQ |
| `/challenge/checkout` | Registration form (no payment yet); creates CRM contact + challenge_registration |
| `/challenge/welcome` | Post-registration confirmation, link to dashboard |
| `/challenge/dashboard` | 5-day lesson list, progress tracker, “Mark complete,” link to diagnosis and apply |
| `/challenge/apply` | Qualification form (goal, website status, lead gen problem, budget, timeline, implementation interest) → CRM customFields, readyForCall |
| `/challenge/thank-you` | Confirmation, CTA to strategy call |

### 2.5 Tools & assessments

| Route | Purpose |
|-------|--------|
| `/digital-growth-audit` | Digital growth audit request |
| `/website-revenue-calculator` | Revenue loss calculator |
| `/website-performance-score` | Website score tool |
| `/competitor-position-snapshot` | Competitor snapshot |
| `/tools/startup-website-score` | Startup website score |
| `/assessment` | Project assessment wizard (features, budget, etc.) |
| `/assessment/results` | Assessment results |
| `/growth-diagnosis` | Entry/gateway to growth diagnosis |
| `/growth` | Growth hub / diagnosis entry |
| `/free-growth-tools` | Index of free tools |
| `/recommendations` | Project recommendations |
| `/audit` | Audit-related page |

### 2.6 Content & resources

| Route | Purpose |
|-------|--------|
| `/blog` | Blog listing |
| `/blog/[slug]` | Blog post (with analytics, related, share) |
| `/offers/startup-growth-system` | Public offer page (from site_offers) |
| `/resources/startup-action-plan`, `/resources/startup-growth-kit` | Resource pages |
| `/updates` | Updates |
| `/resume` | Resume / resume request |

### 2.7 Community (AFN — Ascendra community)

| Route | Purpose |
|-------|--------|
| `/community` | Community hub |
| `/community/onboarding` | Onboarding |
| `/community/feed` | Feed |
| `/community/post/[id]` | Single post |
| `/community/members` | Members list |
| `/community/members/[username]` | Member profile |
| `/community/resources` | Resources list |
| `/community/resources/[slug]` | Resource detail |
| `/community/collab` | Collaboration |
| `/community/inbox` | Inbox / messages |
| `/community/profile` | Own profile |
| `/community/settings` | Settings |

### 2.8 Projects & proposals (client-facing)

| Route | Purpose |
|-------|--------|
| `/projects/[id]` | Project detail |
| `/proposal/view/[token]` | Proposal view by token |
| `/dashboard` | User dashboard |
| `/dashboard/proposals/[id]` | Proposal detail |

### 2.9 Auth & account

| Route | Purpose |
|-------|--------|
| `/auth` | Auth (login/register) |
| `/auth/forgot-password` | Forgot password |
| `/auth/reset-password` | Reset password |
| `/login` | Login |

---

## 3. Admin system

Admin routes are protected (admin-approved users). Main entry: `/admin/dashboard`.

### 3.1 Admin dashboard & nav

- **Dashboard** (`/admin/dashboard`) — Stats, contacts/assessments/resume requests, quick links (Invoices, Project updates, Feedback, Site offers, **Challenge leads**), password reset, reminders, guide tour, daily nudge.

### 3.2 CRM (single pipeline)

| Route | Purpose |
|-------|--------|
| `/admin/crm` | Contacts/leads list (filter, search, source, status) |
| `/admin/crm/[id]` | Lead detail — timeline, notes, status, pipeline, AI guidance, discovery link |
| `/admin/crm/accounts` | Accounts list |
| `/admin/crm/accounts/[id]` | Account detail |
| `/admin/crm/accounts/new` | New account |
| `/admin/crm/pipeline` | Pipeline view |
| `/admin/crm/tasks` | Tasks (overdue, incomplete) |
| `/admin/crm/dashboard` | CRM dashboard stats |
| `/admin/crm/discovery` | Discovery workspaces (by contact) |
| `/admin/crm/discovery/[id]` | Discovery workspace (call prep, notes, follow-up tasks) |
| `/admin/crm/proposal-prep` | Proposal prep list |
| `/admin/crm/proposal-prep/[id]` | Proposal prep workspace |
| `/admin/crm/playbooks` | Sales playbooks |
| `/admin/crm/playbooks/[id]`, `new`, `[id]/edit` | Playbook CRUD |
| `/admin/crm/personas` | Personas |
| `/admin/crm/sequences` | Sequences |
| `/admin/crm/sequences/new` | New sequence |
| `/admin/crm/saved-lists` | Saved lists |
| `/admin/crm/import` | Import contacts |

### 3.3 Challenge & offers

| Route | Purpose |
|-------|--------|
| `/admin/challenge/leads` | Challenge registrations list — status, order bump, diagnosis score, recommended path, qualification, link to CRM contact |
| `/admin/offers` | Site offers list |
| `/admin/offers/[slug]/edit` | Edit offer sections (hero, price, deliverables, CTA, graphics) + **Content grading** (SEO, design, copy) |

### 3.4 Funnel & growth diagnosis

| Route | Purpose |
|-------|--------|
| `/admin/funnel` | Funnel content list |
| `/admin/funnel/[slug]/edit` | Edit funnel content by slug |
| `/admin/funnel/offer`, `action-plan`, `website-score`, `growth-kit` | Funnel-specific admin |
| `/admin/growth-diagnosis` | Growth diagnosis reports (list, view, re-run, export) |

### 3.5 Blog & newsletters

| Route | Purpose |
|-------|--------|
| `/admin/blog` | Blog posts |
| `/admin/blog/analytics` | Blog analytics |
| `/admin/newsletters` | Newsletters |
| `/admin/newsletters/create`, `[id]`, `subscribers` | Newsletter CRUD, send, subscribers |

### 3.6 Other admin

| Route | Purpose |
|-------|--------|
| `/admin/users` | User management |
| `/admin/settings` | Admin settings (e.g. reminders) |
| `/admin/system` | System / health |
| `/admin/analytics` | Analytics (events, segments, export) |
| `/admin/invoices` | Client invoices (Stripe) |
| `/admin/announcements` | Client announcements |
| `/admin/feedback` | Feedback list |
| `/admin/reminders` | Admin reminders |
| `/admin/integrations` | Integrations status |
| `/admin/chat` | Admin chat |

---

## 4. API overview (grouped)

### 4.1 Auth & users

- `POST /api/login`, `POST /api/register`, `POST /api/logout`
- `GET/POST /api/auth/github`, `GET/POST /api/auth/google`
- `GET /api/admin/users/*`, `POST /api/admin/users/send-password-reset`, `GET/POST /api/admin/users/[id]/permissions`, `GET /api/admin/users/stats`

### 4.2 Contact & lead capture

- `POST /api/contact` — contact form
- `POST /api/strategy-call` — strategy call form (→ CRM)
- `POST /api/funnel/leads` — growth funnel apply (store + Brevo user + admin)
- `POST /api/leads` — alias for funnel leads

### 4.3 Challenge

- `POST /api/challenge/register` — create registration + CRM contact (tag challenge_lead)
- `GET/POST /api/challenge/progress` — lesson progress (get / mark day complete)
- `POST /api/challenge/apply` — qualification form (update contact customFields, readyForCall)
- `GET /api/admin/challenge/leads` — list challenge leads (admin)

### 4.4 Growth diagnosis

- `POST /api/growth-diagnosis/run` — run growth diagnosis (URL audit, persist report)
- Admin: `GET/POST /api/admin/growth-diagnosis/reports`, `[id]`, `[id]/export`

### 4.5 CRM (admin)

- Contacts: `GET/POST /api/admin/crm/contacts`, `GET/PATCH /api/admin/crm/contacts/[id]`, import
- Accounts: `GET/POST /api/admin/crm/accounts`, `[id]`
- Deals, tasks, activity-log, research-profiles, saved-lists, sequences, discovery, proposal-prep, workflows, alerts, insights (contact/deal), guidance (recommendation accept/dismiss), dashboard

### 4.6 Offers & funnel

- `GET /api/offers/[slug]` — public offer by slug
- `GET/POST /api/admin/offers`, `GET/PATCH /api/admin/offers/[slug]`, `POST /api/admin/offers/[slug]/grade` — list, create/update, **content grading**
- `GET/POST /api/admin/funnel/[slug]` — funnel content
- `GET/POST /api/funnel/[slug]` — public funnel content
- `POST /api/funnel/leads` — funnel lead capture

### 4.7 Assessment & proposals

- `GET/POST /api/assessment`, `GET /api/assessment/grade`, `GET /api/assessment/pricing`
- `GET/PATCH /api/assessment/[id]`, export, proposal, comparison, suggestions, create-proposal, status
- `GET/POST /api/admin/assessments`, `[id]`*
- Client: `GET /api/client/proposals`, `[id]`, `GET /api/client/quotes`, `GET /api/client/invoices`, feedback

### 4.8 Blog

- `GET /api/blog`, `GET /api/blog/[slug]`
- `GET/POST /api/blog/[slug]/analytics`, `analytics/click`
- Admin: `POST /api/admin/blog/ai/generate-tags`, `generate-image-prompt`

### 4.9 Newsletter

- `POST /api/newsletter/subscribe`
- Admin: newsletters CRUD, `[id]/send`, subscribers, `ai/generate-subject`, `ai/improve-content`

### 4.10 Community (AFN)

- Categories, members, profile, profile/settings, onboarding
- Posts (CRUD, reaction, view, saved, comments)
- Collab (collab posts, [id])
- Messages: threads, threads/[id]/messages
- Resources, resources/[slug]/view
- Report, notifications

### 4.11 Tracking & analytics

- `POST /api/track/email/open`
- Admin: `GET /api/admin/analytics/website`, `website/events`, `reports`, `export`
- `GET /api/admin/analytics/engagement` (CRM)

### 4.12 Other

- `GET /api/info`, `GET /api/changelog`
- `GET/POST /api/skills`, `POST /api/skill-endorsements`
- `GET /api/projects`
- `POST /api/competitor-snapshot`, `POST /api/audit`
- Admin: reminders, push (subscribe, vapid-public-key), feedback, resume-requests, integrations/status, system/health, system/activity, agent

---

## 5. Data models (schema)

### 5.1 Core (shared/schema.ts)

- **users** — Auth, admin, roles, GitHub OAuth, password reset
- **session** — Session store
- **funnelContent** — Admin-editable funnel copy by slug
- **siteOffers** — Offers (slug, name, metaTitle, metaDescription, sections, **grading**)
- **challengeRegistrations** — Paid challenge (contactId, email, fullName, status, orderBumpPurchased, etc.)
- **challengeLessonProgress** — Per-day completion (registrationId, day 1–5)
- **businessGoalPresets** — Reminder/goal presets
- **adminReminders** — Admin reminders (dismiss/snoozed/done)
- **adminSettings** — Key-value settings
- **projects** — Portfolio projects
- **projectAssessments** — Assessment submissions
- **skills**, **skillEndorsements**
- **contacts** — Legacy contact form submissions
- **resumeRequests**
- **blogPosts**, **blogPostContributions**, **blogComments**
- **adminChatMessages**, **adminChatReadCursor**
- **userActivityLog**, **pushSubscriptions**
- **growthFunnelLeads** — Diagnosis + apply form (answers, scores, recommendation, form fields)
- **growthDiagnosisReports** — Persisted URL-audit reports (reportId, url, reportPayload, scores)
- **clientQuotes**, **clientInvoices** — Quotes and Stripe invoices
- **clientAnnouncements**, **clientFeedback**

### 5.2 CRM (shared/crmSchema.ts)

- **crmAccounts** — Companies/accounts
- **crmContacts** — Leads/contacts (source, status, tags, customFields, leadScore, intentLevel, lifecycle, attribution, Stripe customer, etc.)
- **crmDeals** — Deals (contactId, pipelineStage, value, serviceInterest, etc.)
- **crmActivities** — Legacy activities
- **crmActivityLog** — Unified activity log
- **communicationEvents** — Email engagement
- **documentEvents**, **documentEventLog** — Document/proposal views
- **visitorActivity** — Visitor tracking
- **crmAlerts**, **leadScoreEvents**
- **crmTasks** — Tasks linked to contacts/deals
- **crmSequences**, **crmSequenceEnrollments**
- **crmSavedLists** — Saved filters/lists
- **crmResearchProfiles** — Research on accounts
- **crmAiGuidance** — Persisted AI guidance (summary, next actions, discovery questions, etc.)
- **crmWorkflowExecutions**
- **crmDiscoveryWorkspaces** — Discovery call prep
- **crmProposalPrepWorkspaces** — Proposal prep
- **crmSalesPlaybooks** — Playbooks (qualification, discovery, proposal, follow-up)

### 5.3 Newsletter (shared/newsletterSchema.ts)

- **newsletterSubscribers**, **newsletters**, **newsletterSends**

### 5.4 Community / AFN (shared/afnSchema.ts)

- **afnProfiles**, **afnProfileSettings**, **afnMemberTags**, **afnProfileMemberTags**
- **afnDiscussionCategories**, **afnDiscussionPosts**, **afnDiscussionPostTags**, **afnDiscussionComments**, **afnDiscussionReactions**, **afnSavedPosts**
- **afnCollaborationPosts**
- **afnMessageThreads**, **afnMessageThreadParticipants**, **afnMessages**
- **afnResources**, **afnUserResourceViews**
- **afnLeadSignals**, **afnNotifications**, **afnModerationReports**

### 5.5 Blog analytics (shared/blogAnalyticsSchema.ts)

- **blogPostViews**

### 5.6 Lead custom fields (shared/leadCustomFields.ts)

Typed **customFields** on contacts: businessType, pain points, goals, attribution, **challengeStatus**, **orderBumpPurchased**, **diagnosisScore**, **recommendedBrandPath**, **qualificationSubmitted**, **readyForCall**, qualification form fields (mainGoal, websiteStatus, leadGenProblem, budgetRange, timeline, implementationInterest, notes).

---

## 6. Backend services (server/services)

| Service | Role |
|---------|------|
| **emailService** | Brevo — contact, quote, resume, growth diagnosis to user, growth lead to admin, challenge welcome (if added), notifications |
| **leadFromFormService** | ensureCrmLeadFromFormSubmission — get/create contact, attribution, scoring, segmentation |
| **leadScoringService** | addScoreFromEvent, lead score updates |
| **leadSegmentationService** | computeSegmentTags, mergeSegmentTags |
| **crmFoundationService** | AI fit score, priority score, next best actions, research summary (stub), logActivity |
| **crmCompletenessService** | Contact/account/deal/research completeness |
| **crmAiGuidanceService** | Generate and persist AI guidance (summary, discovery questions, proposal prep, etc.) |
| **crmAiProvider** | Rule-based (and optional LLM) AI provider for CRM |
| **discoveryWorkspaceService** | Discovery workspace CRUD |
| **discoveryQuestions** | Default + AI discovery questions |
| **proposalPrepService** | Proposal prep workspace CRUD |
| **stripeInvoiceService** | Stripe invoices for client quotes |
| **proposalService** | Proposals, quotes |
| **pricingService** | Pricing logic |
| **reminderEngineService** | Generate admin reminders from goals and state |
| **reminderAIService** | AI-assisted reminders |
| **adminAgentService** | Admin agent widget / nudge |
| **playbookAIService** | Playbook AI |
| **recommendationService** | Recommendations |
| **aiAssistanceService** | General AI assistance |
| **blogAIService**, **newsletterAIService** | Blog/newsletter AI (tags, subject, content) |
| **imageGenerationService**, **autoImageService** | Image generation |
| **imageOptimization** | Image optimization |
| **githubService** | GitHub integration |
| **pushNotificationService** | Push subscriptions (VAPID) |
| **smsService** | SMS (optional) |
| **budgetComparisonService** | Budget comparison for assessments |
| **workflows** (engine, conditions, actions, staleCheck, registry) | CRM workflows (e.g. stale check) |

---

## 7. Key UI components

- **Layout / nav:** `Header`, `FixedHeaderWrapper`, `SiteFooter`, `MobileBottomNav`, `ScrollProgress`
- **UI primitives:** `components/ui/*` — button, card, input, textarea, select, checkbox, dialog, tabs, dropdown, progress, etc. (shadcn-style)
- **Motion:** `SectionReveal`, `SectionRevealStagger`, `AnimatedCard`, `SpotlightCard`, `MagneticButton`, `HeroMotion`, `ProcessExplorer`, `StickyStorySection`, `SectionConnector`, `StatsStrip`, `BeforeAfterToggle`
- **Funnel:** `StrategyCallForm`, `AuditRequestForm`, `RecommendedNextStep`, `WebsiteScoreCard`, `StartupWebsiteScoreCard`, `RevenueLossCalculator`
- **Growth diagnosis:** `ScoreHero`, `CategoryScores`, `BlockersAndQuickWins`, `PerformanceScoreCard`, `AccuracyNotice`, `PremiumUpsell`
- **Authority:** `InsightsFromEcosystem`, `InsightCard`, `LeadMagnetCTA`
- **Blog:** `Breadcrumbs`, `RelatedPosts`, `ShareArticle`, `ClickTracker`, `BlogPostFormatter`, `EnhancedStructuredData`
- **Assessment:** `ProjectAssessmentWizard`, `ProposalDocument`, `DragDropFeatureSelector`, `BudgetComparison`, `AIAssistant`
- **Admin:** `AdminRemindersCard`, `AdminDailyNudge`, `AdminGuideTour`, `AdminGlobalTips`, `AdminPlatformTips`, `AdminAgentWidget`, `ImagePicker`
- **Community:** `CommunityShell`
- **Other:** `ThemeToggle`, `PwaRegistration`, `SEO`/`StructuredData`, `SEOPanel`, `ViewModeToggle`, `TrackedCtaLink`

---

## 8. Integrations

| Integration | Use |
|-------------|-----|
| **Brevo** | Transactional email (contact, strategy call, growth diagnosis, lead notifications) — `BREVO_API_KEY`, `ADMIN_EMAIL` |
| **Stripe** | Client invoices (quotes → invoices) — Stripe env vars |
| **GitHub OAuth** | Login — `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` |
| **OpenAI** | Optional — blog/newsletter AI, image generation, CRM AI, playbooks — `OPENAI_API_KEY` |
| **Neon PostgreSQL** | Database — `DATABASE_URL` |
| **Google Analytics** | Optional — `NEXT_PUBLIC_GA_MEASUREMENT_ID` |
| **VAPID** | Push notifications — admin push keys |

---

## 9. Documentation (Docs/)

- **AGENTS.md** (root) — Cursor/agent instructions, dev server, DB, gotchas
- **README.md** — Project summary, tech stack, structure, development, Docs index
- **Docs/implementation/** — Implementation plans and audits (e.g. CRM Stage 3, Offer & Challenge audit)
- **Docs/audits**, **Docs/deployment**, **Docs/reference**, **Docs/archive** — Per README

---

## 10. Quick reference — “Where is X?”

| Need | Location |
|------|----------|
| Growth diagnosis questions & scoring | `lib/scoring.ts`, `lib/funnel-store.tsx` |
| Challenge config (pricing, lessons) | `lib/challenge/config.ts` |
| Offer content grading | `lib/contentGrading.ts`; API `POST /api/admin/offers/[slug]/grade` |
| CRM contact create/update from forms | `server/services/leadFromFormService.ts` |
| Lead custom fields (incl. challenge) | `shared/leadCustomFields.ts` |
| Strategy call → CRM | `app/api/strategy-call/route.ts` → portfolioController.submitContactForm → ensureCrmLeadFromFormSubmission |
| Discovery call prep | `app/admin/crm/discovery/`, `server/services/crm/discoveryWorkspaceService.ts` |
| AI guidance for CRM | `server/services/crmAiGuidanceService.ts`, `server/services/ai/crmAiProvider.ts` |
| Brevo send | `server/services/emailService.ts` |
| Funnel state (diagnosis) | Context in `lib/funnel-store.tsx` (and app re-export), localStorage key `growth_funnel_state` |

---

*Last updated from codebase scan. Use this as the single audit/overview for “what’s present” in the project.*

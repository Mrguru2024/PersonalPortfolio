# Ascendra OS — Feature inventory & pricing framework

Use this document to continue pricing, packaging, or go-to-market work (e.g. in ChatGPT). It is derived from the codebase route map (`app/lib/siteDirectory.ts`), admin navigation, and related product surfaces.

---

## How to use this for pricing (framework)

| Factor | What to do in practice |
|--------|-------------------------|
| **Profitability** | For each bucket, estimate **gross margin**: (price − direct labor − tools/APIs − allocatable ops) ÷ price. High-touch (PPC, AMIE reports, agreements) needs **minimum monthly** or **hourly floors** so margin doesn’t disappear. |
| **Market location** | **US local SMB** often buys on **monthly retainer + clear scope**. **National / higher ACV** can absorb **platform + success** bundles. **Rural / price-sensitive** → stronger **DIY / DWY** tiers; **coastal / competitive metros** → **DFY + performance** positioning. |
| **Competition** | You are not selling “a website”—you’re selling **Ascendra OS**: CRM + lead control + content + email + scheduling + paid growth + experiments + market intel + agency OS + **first-party behavior intelligence**. Price **above single-point tools** (schedulers-only, CRM-only) but **below** rebuilding a full enterprise stack; anchor to **replacement cost** of HubSpot + Hotjar-class + agency PM. |
| **Market climate** | **Soft economy**: emphasize **efficiency** (lead quality, LTV reports, experiments, diagnostics)—package **smaller entry** + optional upsells. **Expansion**: sell **DFY + platform** and **outcome narratives** (Market Score, Growth OS, PPC engine). |
| **Value** | Tie price to **observable outcomes**: booked calls, CPL/CPQL, pipeline velocity, time-to-first-response, content throughput, **conversion diagnostics** (behavior-linked). Use **value conversation** in sales: “what is one extra qualified lead/month worth?” |

### Pricing shapes that fit this codebase

1. **Tiered platform access** (per seat / per brand): client portal + Growth System + Conversion Diagnostics + optional community.
2. **Implementation / DFY**: websites, funnels, integrations—**fixed phases** aligned to Agency OS milestones + agreements.
3. **Ongoing retainers**: PPC, content studio, email hub, CRM ops—**scope + unit caps** (billable events exist in paid growth).
4. **Usage / data**: behavior storage, AMIE depth, experiment volume—**overage** after included volumes (matches retention + cron thinking).

---

## A. Public marketing & conversion (acquisition surface)

| Feature area | What exists (representative) | Pricing path |
|--------------|------------------------------|--------------|
| **Core marketing** | Home, about, services, FAQ, contact, strategy call / book, thank-you, legal, partner pages, brand-growth hub | Usually **not line-itemed**—**CAC** recovered through **downstream services**. Optional “**launch package**” if you resell a new site. |
| **ICP landers** | Launch brand, rebrand, marketing assets, contractor, local business, startup MVP, startup growth system offer | **Packs** by vertical; price by **page depth + CRO + tracking**; higher in **high-CPL niches** (legal, med-spa, home services metros). |
| **Lead magnet hub & tools** | Free growth tools hub, free-trial narrative, digital audit, PPC/CRM magnet, **Market Score (AMIE funnel)**, persona journey, diagnostics hub, automated growth diagnosis, website scores, revenue calculator, competitor snapshot, homepage blueprint, offer-audit funnel, resources (kits / action plan), image generation utility | **Free–freemium** for top-of-funnel; **paid “deep reports”** or **strategy call** upsell; **Market Score** can be **low ticket** or **call prerequisite** depending on sales motion. |

---

## B. Diagnosis, assessment & qualification (data + sales enablement)

| Feature area | What exists | Pricing path |
|--------------|-------------|--------------|
| **Interactive diagnosis** | `/growth`, `/diagnosis`, results, `/assessment`, results, `/apply`, `/recommendations` | **Bundled into discovery** or **paid assessment** ($$–$$$) when you deliver narrative + call; use to **qualify** so sales time isn’t wasted. |
| **Public growth diagnosis engine** | `/growth-diagnosis` (automated crawl/score style) | **Low ticket** or **lead qualifier**; upsell **human interpretation**. |
| **Growth platform** | Hub + recommendation flow + engagement terms copy | **Entry product** (DIY/DWY/DFY framing already in product); price by **tier + access to operator time**. |

---

## C. Commerce, legal & delivery contracts

| Feature area | What exists | Pricing path |
|--------------|-------------|--------------|
| **Paid challenge** | Landing, apply, checkout (Stripe), welcome, dashboard, thank-you | **Fixed price + order bump**; margin from **group delivery**; don’t underprice if you include support. |
| **Service agreements** | Token-based sign, milestones, Stripe milestones (admin + public `/agreements/[token]`) | **Attach to DFY deals**; milestone billing = **cash flow aligned to delivery**; price **risk reduction** (legal clarity, scope). |

---

## D. Content, authority & organic

| Feature area | What exists | Pricing path |
|--------------|-------------|--------------|
| **Blog & breakdowns** | Blog index/posts, website breakdowns series, updates/changelog | **Organic**; monetize via **CTAs**; optional **“content subscription”** for clients. |
| **Resources** | Startup kit / action plan pages | **Lead gen** or **client-only** uplock. |

---

## E. Community (AFN — Ascendra Founder Network)

| Feature area | What exists | Pricing path |
|--------------|-------------|--------------|
| **Community product** | Hub, feed, posts, members & profiles, resources, inbox/DM, collab, onboarding, profile, settings (`/Afn/...`; public aliases `/community`, `/afn` via `proxy.ts`) | **Membership**: monthly/annual; **tier by access** (events, introductions, resources). Margin improves with **async** community vs 1:1. |
| **Admin community ops** | Live access, scoring (admin surfaces) | **Internal cost center** or **upsell** “priority visibility / featured” for sponsors. |

---

## F. Client portal & client-facing OS

| Feature area | What exists | Pricing path |
|--------------|-------------|--------------|
| **Account & workspace** | Login hub, portal, auth, dashboard | Include in **any paid engagement**; don’t give away **full OS** without **retainer or implementation fee**. |
| **Commercial workspace** | Invoices, proposals, projects, announcements | **Expected** in retainer; reduces admin overhead (**value = transparency + fewer “where’s my invoice?” emails**). |
| **Growth System (client)** | Diagnose / Build / Scale snapshot (`/growth-system/...`) | **Client success tier**: include in **mid+ retainer**; for **low tier**, **summary-only** refresh quarterly. |
| **Conversion Diagnostics + behavior (client)** | Conversion diagnostics (**CRM-linked**), shared improvements, page behavior drill-downs, PPC results page | **Premium differentiator** vs typical agencies: price as **“Insight tier”** (% of retainer or **add-on**). Ties directly to **conversion value**. |
| **Offer valuation (client-facing engine)** | `/offer-valuation` workspace | **Workshop / sprint** pricing or bundled in **positioning engagements**. |

---

## G. Ascendra OS — admin (operator) capabilities

Sell as **“the machine”** behind delivery—not necessarily each as a separate SKU; each has **cost-to-serve** and **differentiation value**.

### G1. Core admin & platform

| Feature area | What exists | Pricing path |
|--------------|-------------|--------------|
| **Admin home & ops** | Dashboard, settings (AI agent, notifications, audience preview), operator profile, reminders | **Overhead** covered by **retainer**; enterprise clients may pay **dedicated workspace**. |
| **Knowledge & enablement** | Agent knowledge base, how-to guides (+ interactive experiments tutorial), site directory, assistant context refresh | **Internal efficiency**; optional **white-label “playbook portal”** fee for **multi-location** clients. |
| **Access & security** | Users/permissions, system monitor, deployment env (super), integrations hub | **Enterprise** deals: **setup fee** for SSO-grade workflows if you extend; today = **cost of professionalism**. |

### G2. CRM, pipeline & revenue intelligence

| Feature area | What exists | Pricing path |
|--------------|-------------|--------------|
| **CRM** | Contacts, accounts, pipeline, tasks, sequences, import, saved lists, personas (sales segments), discovery + proposal prep, playbooks | **Core retainer** component; **per-seat** if you multi-tenant white-label. |
| **LTV & reports** | `/admin/crm/ltv` parameterized rollups, CSV | **Finance + strategy upsell** for clients who care about **unit economics**. |
| **Lead intake & Lead command center** | Intake, priority queue, Lead Control routing rules | **High value in competitive markets**—price **faster SLAs** (e.g. “under 5 min first touch”) as a **tier**. |

### G3. Communications & content operations

| Feature area | What exists | Pricing path |
|--------------|-------------|--------------|
| **Email Hub** | Compose, drafts, scheduled, templates, tracking, inbox sync (Gmail/Microsoft), settings | **Replace** part of a VA or separate ESP bill—charge **platform + send volume** or **hours included**. |
| **Newsletters & subscribers** | Campaigns, subscribers | **Add-on** for **nurture**. |
| **Blog CMS + blog analytics** | Admin blog, analytics | Often **bundled** in content retainer **per post/month**. |
| **Content Studio** | Documents, calendar, strategy, campaigns, workflow/publish log, import/export, social publishing (cron) | **Content retainer** tiers by **posts/week** + **channels**; in slow organic markets sell **efficient repurposing**. |
| **Communications** | Campaigns, designs, analytics | **Enterprise** or operator-heavy; cross-sell with **experiments** + **paid growth**. |
| **Brand temp vault** | Asset storage workflow | **Small monthly** or included in **brand engagements**. |

### G4. Marketing intelligence & offers

| Feature area | What exists | Pricing path |
|--------------|-------------|--------------|
| **Offer + Persona IQ** | Personas, scripts, lead magnets, preview | **Strategy sprint** ($$–$$$) or part of **onboarding**. |
| **Ascendra Offer Engine** | Offers, lead magnets, persona strategy, funnel paths, analytics hooks | **IP multiplier**—**configuration workshops** + **ongoing optimization**. |
| **Site offers CMS** | Editable offer pages with grading | **Included** in web care or **paid per major offer** launch. |
| **Funnel admin** | Funnel library, growth kit / score / action plan / offer notes, content library | **Implementation** line items per funnel asset. |

### G5. Growth OS, scheduling & market intelligence

| Feature area | What exists | Pricing path |
|--------------|-------------|--------------|
| **Meetings & calendar + booking setup** | Scheduler, scheduling, public `/book`, booking pages, routing | **Bundle** into **ops package** or **free** with retainer to reduce friction. |
| **AMIE (Market intelligence)** | Admin market intelligence engine; CRM/funnel ties | **Report fee** or **included in strategy** tier; strong for **new markets / expansions**. |
| **Growth OS intelligence** | Topic discovery, rollups, automation (admin) | **Intelligence subscription** for clients who want **monthly briefs**. |
| **GOS security & shares** | Token/shared reports (`/gos/report/[token]`) | **Enterprise** reporting story. |
| **Internal funnel audit** | Crawl/audit runs | **Productized audit** ($$) with clear deliverable. |
| **Growth diagnosis admin** | Review automated submissions | Monetized via **diagnostic product** on public side. |

### G6. Analytics, behavior & optimization (first-party)

| Feature area | What exists | Pricing path |
|--------------|-------------|--------------|
| **Website analytics (admin)** | Site-wide dashboard | **Table stakes** on retainer if you **interpret** for clients. |
| **Ascendra Growth Intelligence** | Visitors hub, watch targets/reports, replays (rrweb), heatmaps, surveys, user tests, friction reports, conversion diagnostics, insight tasks, experiment links, storage/retention | **Monthly “Insight” add-on** scaled by **sessions/storage**; strong where **CRO** wins ad spend. |
| **Ascendra Experimentation Engine (AEE)** | Experiments, variants, patterns/reports, CRM/PPC loops | **% of spend** or **fixed test sprints**; in down markets sell **fewer, higher-quality tests**. |
| **Visitor/track APIs** | `visitor_activity`, behavior ingest, watch-config | Recover via **platform fee** (infra COGS). |

### G7. Paid growth (PPC / performance engine)

| Feature area | What exists | Pricing path |
|--------------|-------------|--------------|
| **Paid growth admin** | Readiness, campaigns, structure, lead quality, optimization rules, verification queue, billable events, tracked calls, internal billing notes | **% of spend** ($$k min) **or** **flat + performance bonus**; **billable events** align to **qualified outcomes**. Differentiate with **CRM + experiments + intel** in one OS. |

### G8. Growth platform (admin) & service agreements

| Feature area | What exists | Pricing path |
|--------------|-------------|--------------|
| **Growth platform catalog (admin)** | DFY/DWY/DIY views, links to CRM/experiments | Internal **sales configurator**; optional client-facing **stack builder**. |
| **Agreements + milestones** | Generated agreements, Stripe milestones | **Implementation deposits**; legal/scope clarity. |

### G9. Agency Operating System (delivery)

| Feature area | What exists | Pricing path |
|--------------|-------------|--------------|
| **Agency OS** | HVD registry, delivery projects, tasks **with acceptance**, SOPs, playbooks, training modules, execution roles | **Margin engine for scale**: DFY priced with **milestones** matching phases; utilization ↑ → **higher effective rate**. |

### G10. Operations & support surfaces

| Feature area | What exists | Pricing path |
|--------------|-------------|--------------|
| **Invoices** | Stripe-backed billing | Standard AR. |
| **Chat** | Admin–client chat | **Support tier** (SLA); avoid unlimited on low plans. |
| **Feedback inbox** | Tickets | Same as support. |
| **Challenge leads admin** | Registrants | Tied to **challenge** pricing. |
| **Announcements** | Client project updates | **Premium** tier signal. |

---

## H. Infrastructure (cost + moat — rarely sold standalone)

- **PostgreSQL / Drizzle**, sessions, crons (growth-os, content publish, brand vault, email, market nurture, AEE rollup, behavior friction, storage retention).
- **Auth** (session, GitHub OAuth, approvals).
- **Integrations**: Brevo, Stripe, DocuSign, Google/Meta ads-related paths, Zoom, Facebook SDK, etc.
- **Edge `proxy.ts`**: rate limiting (e.g. admin API), `/community` and `/afn` rewrites to `/Afn`.
- **AI assistant / read-aloud** (where enabled).

**Pricing implication:** include a **platform fee** (even small) in recurring plans so **SaaS-like COGS** stay covered.

---

## Summary: clear path without leaving money on the table

1. Map every client contract to **2–4 buckets**: **Platform access**, **Delivery (DFY)**, **Performance (PPC)**, **Intelligence (AMIE + behavior + experiments)**.
2. Set **floors** using **cost-to-serve** (especially PPC + custom analytics + AMIE depth).
3. Adjust **list price** by **geo + vertical CPC + competition**; use **tiered SLAs** not endless discounting.
4. In **soft climates**, lead with **diagnostics + lead quality + efficiency**; in **hot climates**, lead with **speed + full OS + outcomes**.
5. Reserve **Conversion Diagnostics / Growth Intelligence** for **mid+ plans**—renewsals and proof of value.

---

## Optional next step for ChatGPT

Paste the following prompt after this file:

> Using `Docs/ASCENDRA-FEATURE-INVENTORY-AND-PRICING-FRAMEWORK.md`, build a **Good / Better / Best** pricing matrix for **[local SMB | national | mixed]** with typical retainer range **[X–Y]** and optional ad spend band **[Z]**. Map each tier to **included features** from sections A–H and list **3 upsells** with rationale.

---

*Source: codebase route inventory and architecture; canonical community URLs are `/Afn` (aliases `/community`, `/afn`).*

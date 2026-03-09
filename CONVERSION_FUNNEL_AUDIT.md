# Ascendra.tech Conversion Funnel Audit

**Date:** March 2025  
**Goal:** Support 2+ new client projects per month via a clear lead-generation funnel for Atlanta personas.

---

## 1. Existing Routes

| Route | Purpose |
|-------|--------|
| `/` | Home (sections: Hero, Services, FreeSiteAuditPromo, Announcements, Projects, About, Skills, Blog, Contact) |
| `/audit` | **Conversion page** – Free Website Growth Audit form; submits to `/api/audit` |
| `/contractor-systems` | **Landing** – Contractor & trades persona (exists, strong) |
| `/blog` | Blog hub (exists) |
| `/blog/[slug]` | Blog post (exists) |
| `/assessment` | Interactive project assessment (different funnel) |
| `/assessment/results` | Assessment results |
| `/faq`, `/resume`, `/auth`, `/projects/[id]`, `/proposal/view/[token]`, `/recommendations`, `/updates`, `/generate-images` | Supporting pages |
| `/admin/*`, `/dashboard/*` | Admin/dashboard (unchanged) |

**API:** `/api/audit` (POST) exists and forwards to contact flow with subject "Website Growth Audit Request".

---

## 2. Existing Funnel Elements

- **Landing:** `/contractor-systems` – persona-focused, problem/solution/process/FAQ/final CTA; CTAs point to `/audit` and `/#contact`.
- **Conversion page:** `/audit` – form with industry (trades), revenue, challenge, timeline; success state links to "Book a Strategy Call" and back to contractor-systems.
- **Blog hub:** `/blog` – list and search; no audit CTA strip.
- **Home:** Hero has "See My Work" / "Start a Project" and a small contractors CTA linking to `/contractor-systems`. FreeSiteAuditPromo has "FREE Site Audit" but primary button goes to contractor-systems; secondary "Other: claim free audit" scrolls to contact (not `/audit`).
- **Nav:** Home, For Contractors, Projects, About, Skills, Blog, Contact (no direct Audit link). Off-home: Home, For Contractors, Blog, Resume, AI Images.
- **No site-wide footer** in layout.

---

## 3. Missing Funnel Elements

- **Landing pages:** `/local-business-growth` (e.g. healthcare, local services) and `/startup-mvp-development` do not exist.
- **Hero:** Does not use conversion headline ("Build Digital Systems That Turn Website Visitors Into Revenue") or subheadline; primary CTA is not "Get Your Free Website Growth Audit" → `/audit`.
- **Problem Awareness:** No dedicated section with pain points (sites that don’t generate leads, no automation, weak SEO, slow mobile) and bridge: "Most businesses do not have a design problem. They have a system problem."
- **Solutions:** Services section is capability-based (e.g. Custom Web Apps, E-commerce); not framed as outcomes (Lead Generation Systems, Conversion-Focused Websites, Startup/MVP Development) with audit CTA.
- **Authority:** No clear "full-stack development partner, automation system builder, revenue-focused web architect" block on home.
- **Blog:** Home blog section and blog hub lack a clear "Get Your Free Website Growth Audit" CTA; blog posts have no standard audit CTA.
- **Contact:** Emphasizes "Start Interactive Assessment" and "Request a Quote"; no primary "Get Your Free Website Growth Audit" or "Book a Strategy Call" as funnel CTAs.
- **Nav:** No "Audit" link; no links to local-business or startup-MVP landings.
- **Footer:** No global footer with primary/secondary CTAs.

---

## 4. Recommended Enhancements (Safe Implementation)

1. **Create two new landing pages** (do not rename or remove existing routes):
   - `/local-business-growth` – professional, trust-focused (healthcare, professional services).
   - `/startup-mvp-development` – modern SaaS/startup angle (MVP, scalable architecture).

2. **Homepage UX flow:**
   - **Hero:** Headline "Build Digital Systems That Turn Website Visitors Into Revenue"; subheadline as specified; primary CTA "Get Your Free Website Growth Audit" → `/audit`; secondary "Book a Strategy Call" → `#contact`.
   - **Problem Awareness:** Add section (or strengthen FreeSiteAuditPromo) with pain points and bridge message; CTA to `/audit`.
   - **Solutions:** Reframe Services intro and/or add outcome bullets (Lead Gen Systems, Conversion-Focused Websites, Startup/MVP); CTA to `/audit`.
   - **Authority:** Add short Authority block (full-stack partner, automation, revenue-focused) and/or fold into About.
   - **Blog section:** Add CTA strip "Get Your Free Website Growth Audit" → `/audit` (and "Book a Strategy Call" → `#contact`).
   - **Final CTA:** Ensure a clear audit CTA above or in Contact.

3. **CTA strategy (reuse existing Button/Link):**
   - Primary: "Get Your Free Website Growth Audit" → `/audit`.
   - Secondary: "Book a Strategy Call" → `/#contact`.
   - Use consistently on hero, mid-page, landing pages, blog section, blog hub, and footer.

4. **Navigation:** Add "Audit" → `/audit`; add "Local Business" → `/local-business-growth`, "Startup MVP" → `/startup-mvp-development` (or group under a dropdown if preferred). Keep existing links.

5. **Blog:** Add audit CTA on blog hub and in blog section on home; optionally add CTA block to blog post template.

6. **Contact section:** Add prominent "Get Your Free Website Growth Audit" and "Book a Strategy Call" alongside existing assessment/quote.

7. **Footer:** Add a minimal site footer with Audit + Book a Strategy Call + key links (no duplicate nav).

8. **Personas:** Ensure `targetPersonas` (or shared CTA constants) use primary CTA text and `/audit` for the main funnel; keep contractor landing as entry from "For Contractors."

9. **Technical:** Keep existing Next.js App Router, no new heavy dependencies; ensure SEO metadata and internal links to `/audit` and new landings; avoid duplicate structured data.

---

## 5. Implementation Order

1. Add shared CTA constants and update `targetPersonas` for audit-focused funnel.
2. Create `/local-business-growth` and `/startup-mvp-development` (reuse contractor-systems structure, persona-specific copy and visuals).
3. Update Hero (headline, subheadline, primary/secondary CTAs).
4. Add Problem Awareness section and/or enhance FreeSiteAuditPromo.
5. Enhance Services (outcomes + audit CTA) and add Authority messaging.
6. Add Audit (and optional landing) links to Header.
7. Add audit CTA to Blog section and blog hub; add to Contact section.
8. Add site footer with primary/secondary CTAs.
9. Optionally add audit CTA to blog post page template.

All changes preserve existing routes, layout, and behavior; no deletions of current pages or sections except where explicitly refocused (e.g. hero copy).

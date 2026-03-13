# Ascendra Ecosystem Funnel — Implementation Instructions

This document turns the **ECOSYSTEM_WIREFRAME_AND_COPY_SYSTEM.md** and **ECOSYSTEM_FUNNEL_AUDIT.md** into actionable steps. Follow in order. All work is **enhancement** of existing pages and sitewide elements—no new routes, no breaking changes.

---

## Source Documents

- **ECOSYSTEM_WIREFRAME_AND_COPY_SYSTEM.md** — Page-by-page wireframes, copy direction, section order, CTAs, trust elements, reusable modules.
- **ECOSYSTEM_FUNNEL_AUDIT.md** — Routes, layouts, CTAs, forms, components; what exists and what to preserve.

---

## Safety Rules (Do Not Skip)

1. **Do not** create duplicate routes or new URLs for the nine funnel pages; they already exist.
2. **Do not** rename or remove existing routes (e.g. keep `/audit`, `/#contact`, contractor/local/startup pages as-is).
3. **Do not** remove or break existing CTAs for the audit/contractor funnel; ecosystem CTAs are additive.
4. **Reuse** existing components: `PageSEO`, `Card`, `Button`, `Badge`, `Form`, `Input`, `Select`, `Accordion`, motion from `framer-motion`, `SectionAmbient` (optional).
5. **Use** existing layout: root `app/layout.tsx`, `FixedHeaderWrapper`, `SiteFooter`; no new layout files.
6. **Keep** section spacing and responsive patterns already in use (e.g. `py-10 fold:py-12 xs:py-16 sm:py-20 md:py-24`, `min-w-0`, `break-words` where needed).

---

## CTA Constants (Sitewide)

**File:** `app/lib/funnelCtas.ts`

- Ensure these exist and are used consistently:
  - **Primary (ecosystem):** `ECOSYSTEM_CTA_STRATEGY_CALL` = "Book Strategy Call" → `/strategy-call`
  - **Secondary (hub):** `ECOSYSTEM_CTA_HUB` or equivalent = "Start Your Brand Growth Plan" → `#paths` or path selector on `/brand-growth`
  - Path-specific: "Book Brand Launch Call", "Book Rebrand Strategy Call", "Start Marketing Upgrade" → `/strategy-call`
- Do not remove: `PRIMARY_CTA` (Free Audit), `SECONDARY_CTA`, `AUDIT_PATH`, `BOOK_CALL_HREF` (existing funnel).

---

## Navigation and Footer

**Files:** `app/components/Header.tsx`, `app/components/SiteFooter.tsx`

- **Header:** Ensure "Brand Growth" links to `/brand-growth` and "Strategy Call" (or a clear path to it) is available where appropriate. Do not remove existing nav items (Home, Audit, For Contractors, Local Business, Startup MVP, Blog, etc.).
- **Footer:** Ensure links include Brand Growth (`/brand-growth`) and Strategy Call (`/strategy-call`). Keep existing Free Audit and Contact links.

---

## Phase 1 — Sitewide and Hub

### Step 1.1 — Hub: Add “Why This Integrated Model Works Better” (optional section)

**File:** `app/brand-growth/page.tsx`

- **Action:** Add a section between **Path selector** (id="paths") and **Transformation** (or merge with Transformation if you prefer fewer sections).
- **Headline:** "Why One Coordinated Team Beats Three Separate Vendors"
- **Content:** 4–5 short bullets or two short paragraphs: alignment, no handoff chaos, one strategy, consistent quality.
- **Component:** Use existing `Card` + `CardContent`; list with checkmarks or simple list. Same container/section classes as other sections (`section`, `container`, `max-w-3xl` or `max-w-4xl`).
- **UX:** Optional; can be skipped and merged into “What Changes When Your Brand Is Aligned” if space is tight.

### Step 1.2 — Hub: Verify section order and copy

**File:** `app/brand-growth/page.tsx`

- **Section order must be:** 1. Hero → 2. Problem → 3. Solution (3 pillars) → 4. Process → 5. Path selector → 6. [Optional: Why integrated model] → 7. Transformation → 8. Consultation CTA.
- **Hero:** Headline one of: "Build a Brand That Actually Converts Customers" / "One Team. Brand, Web, and Marketing—Aligned." / "Your Business Deserves Visuals That Match Your Value." Subhead: "Brand strategy, websites, and marketing visuals—built together by one coordinated team."
- **Primary CTA (hero):** "Start Your Brand Growth Plan" → `#paths`. **Secondary CTA (hero):** "Book Strategy Call" → `/strategy-call`.
- **Final CTA:** Headline "Ready to build a brand that matches your vision?" Copy: "Book a strategy call. We'll listen to your goals, clarify the right path, and outline next steps—no pressure, no obligation." **Primary CTA:** "Book Strategy Call" → `/strategy-call`. Under button: "Strategy call · No obligation · Clear next steps."
- **Trust:** Badge in hero: "One coordinated team · Brand · Web · Marketing" (or equivalent). Ensure pillar cards link to `/partners/macon-designs`, `/partners/style-studio-branding`, `/partners/ascendra-technologies` with "Meet the team" (or similar) link.

---

## Phase 2 — Path Pages (Launch, Rebrand, Marketing-Assets)

### Step 2.1 — Launch: Add “Who This Is Best For” and “One Team, One Launch”

**File:** `app/launch-your-brand/page.tsx`

- **After “The Process” section, add:**
  - **Section: Who This Is Best For**  
    Headline: "Who This Is Best For". Copy: New entrepreneurs, founders launching a product or service, businesses that don’t yet have a professional brand or site. Use 3–4 bullets or one short paragraph. Use `Card` + list or single paragraph; same spacing as other sections.
  - **Section: One Team, One Launch** (optional; can be one short paragraph)  
    Headline: "One Team, One Launch". Copy: Brand, website, and launch assets aligned from the start—no handoffs, no mismatched styles. One short paragraph in a `Card` or simple block.

### Step 2.2 — Launch: Add FAQ section

**File:** `app/launch-your-brand/page.tsx`

- **Before the final CTA section, add:** A section with headline "Frequently Asked Questions".
- **Use:** `Accordion` (from `@/components/ui/accordion`) with 3–5 Q&A pairs. Suggested questions:
  - How long does a typical launch project take?
  - Do I need to have a business name and idea ready?
  - What if I only need a logo right now?
  - How do I get started?
- **Answers:** 2–4 sentences each; one answer can end with "Book a call to get a timeline for your situation" (link to `/strategy-call`). Wrap accordion in existing `Card` pattern if desired (see contractor-systems FAQ).

### Step 2.3 — Rebrand: Add “Signs You’ve Outgrown Your Brand”

**File:** `app/rebrand-your-business/page.tsx`

- **After hero, before or as part of “Why Rebrand Now?”:** Add or refine a list under headline "Signs You've Outgrown Your Brand".
- **Bullets (4–5):** Logo feels dated; website doesn’t reflect your offer; marketing materials don’t match; you’re embarrassed to send people to your site; you’ve expanded but your look hasn’t. Use `Card` + `CardContent` and a `<ul>` with short bullets; same styling as problem lists on other pages.

### Step 2.4 — Rebrand: Add “What’s Included” and “What This Does for Your Business”

**File:** `app/rebrand-your-business/page.tsx`

- **What’s Included:** Headline "What's Included". Content: Brand redesign (logo, colors, typography, guidelines); website rebuild (modern, conversion-focused); updated marketing visuals (ads, social, promotional assets). Use list with checkmarks or 3 small cards.
- **What This Does for Your Business:** Headline "What This Does for Your Business". Content: 4 outcomes—credibility that matches your offer; a site that converts; consistent look across touchpoints; confidence when you send clients to your brand. Use checkmarks or icons in one card/list.

### Step 2.5 — Rebrand: Add FAQ section

**File:** `app/rebrand-your-business/page.tsx`

- **Before final CTA:** Add "Common Questions" section with `Accordion`. Suggested questions:
  - How long does a rebrand take?
  - Can we keep our name and just refresh the look?
  - Do you work with businesses outside [region]?
  - What if we only need a website refresh?
- **Answers:** Concise; direct to strategy call for scope. Use same accordion/card pattern as launch.

### Step 2.6 — Marketing-assets: Add “Why Weak Marketing Visuals Cost You Trust and Sales”

**File:** `app/marketing-assets/page.tsx`

- **After hero:** Add or refine a problem section. Headline: "Why Weak Marketing Visuals Cost You Trust and Sales". Copy: 3–4 short points—inconsistent ads and social; DIY graphics that look amateur; campaigns that don’t match your brand; lost credibility when assets don’t hold up. Use one `Card` with a short list.

### Step 2.7 — Marketing-assets: Add “Production-Ready Assets That Perform” (Style Studio / Kristopher)

**File:** `app/marketing-assets/page.tsx`

- **After “What We Create”:** Add section headline "Production-Ready Assets That Perform". Copy: Style Studio Branding specializes in production design—assets that are on-brand, print- and digital-ready, and built for real campaigns. Led by Kristopher Williams, production artist with 12+ years across design, production, and marketing. Include a link: "Meet Kristopher" or "Style Studio Branding" → `/partners/style-studio-branding`. Use a short bio block or quote-style card.

### Step 2.8 — Marketing-assets: Add “When to Bring In a Production Partner” and “How It Works”

**File:** `app/marketing-assets/page.tsx`

- **When to Bring In a Production Partner:** Headline "When to Bring In a Production Partner". 4–5 scenarios: product launch; rebrand rollout; ongoing social content; paid ad campaigns; events or trade shows; packaging refresh. One line each; list or small cards.
- **How It Works:** Headline "How It Works". 3–4 steps: Brief & brand alignment → Concepts or templates → Production-ready files → Revisions and delivery. Numbered steps; same pattern as process blocks on other pages.

---

## Phase 3 — Strategy-Call and Call-Confirmation

### Step 3.1 — Strategy-call: Add “What This Call Is For” and “Who This Is Best For”

**File:** `app/strategy-call/page.tsx`

- **Above or beside the form card:** Add one card or two short blocks:
  - **What This Call Is For:** Headline "What This Call Is For". 3–4 bullets: understand your goals; clarify whether you need launch, rebrand, or marketing assets; outline a path and next steps; answer your questions. No sales pitch—discovery and direction.
  - **Who This Is Best For:** Headline "Who This Is Best For". Growth-ready business owners; anyone considering a brand refresh, new website, or stronger marketing assets; businesses looking for a coordinated team. One short paragraph or 3 bullets. These can be merged into a single card with two subsections to keep the page minimal.

### Step 3.2 — Strategy-call: Add expectation setting

**File:** `app/strategy-call/page.tsx`

- **Under the submit button or inside the form card:** Add one line: "We'll respond within 24–48 hours to schedule your call." This sets timeline expectation and reduces post-submit anxiety.

### Step 3.3 — Call-confirmation: Add “What Happens Next”

**File:** `app/call-confirmation/page.tsx`

- **After the confirmation hero (You’re on the list):** Add section headline "What Happens Next". Copy: 3 steps—(1) We’ll email you within 24–48 hours to find a time. (2) You’ll get a calendar link or a few options. (3) We’ll have a short call to discuss your goals and next steps. Use numbered list or simple timeline; same spacing as other sections.

### Step 3.4 — Call-confirmation: Add optional “Meet the Team” video section and reassurance

**File:** `app/call-confirmation/page.tsx`

- **Optional: Meet the Team:** Headline "Optional: Meet the Team". Copy: "If you'd like, we can send a short intro video so you know what to expect. Otherwise we'll keep the call focused and low-pressure." Use a placeholder for video embed or "Video coming soon" if no video yet; or omit the embed and keep only the copy.
- **Reassurance:** Add one short line at bottom (or under prep checklist): "Your goals, our approach, and clear next steps—no pressure." Optional: one line on "coordinated team" or "brand, web, and marketing" if it fits tone.

---

## Phase 4 — Partner Pages (Macon, Style Studio, Ascendra)

### Step 4.1 — Macon Designs: Add “About Denishia” and “Design Philosophy”

**File:** `app/partners/macon-designs/page.tsx`

- **About Denishia:** Add section headline "About Denishia". Copy: Founder of Macon Designs. BA in Visual Communications. 10+ years of experience. Focus: brand identity, professional design assets, cohesive visuals, strategic design support. One short paragraph weaving in these points. Use a bio block (e.g. `Card` or simple div); optional headshot placeholder.
- **Design Philosophy:** Headline "Design Philosophy". Copy: 3–4 points—brand as system, not just logo; visuals that build trust and recognition; design that supports growth and positioning; consistency across touchpoints. Short bullets or one paragraph in a `Card` or list.

### Step 4.2 — Macon Designs: Add “Portfolio / Selected Work” and “Why Brand Systems Matter”

**File:** `app/partners/macon-designs/page.tsx`

- **Selected Work or Portfolio:** Headline "Selected Work" or "Portfolio". If no case studies yet, use placeholder copy: "Portfolio and case studies can be integrated here. Macon Designs works as the brand identity pillar of the ecosystem." Use a grid or list placeholder; add real projects when ready.
- **Why Brand Systems Matter:** Headline "Why Brand Systems Matter". Copy: Logo and colors alone aren’t enough; guidelines and systems keep your brand consistent and credible; when your project needs strategy and identity, we connect you with the right path. One short paragraph in a `Card` or block.

### Step 4.3 — Style Studio Branding: Add “About Kristopher” and “Who We Work With”

**File:** `app/partners/style-studio-branding/page.tsx`

- **About Kristopher:** Add section headline "About Kristopher". Copy: Highly motivated and innovative Production Artist. 12+ years of experience across design, production, and marketing. Work supporting brands such as Payscape Advisors, DiversiTech, JustChair, and Osaic. Expertise in print production, packaging design, digital marketing materials, promotional graphics, adapting assets across multiple formats. Strengths: collaboration, creative problem-solving, reliability, detail, production-ready execution. One to two short paragraphs. Use bio block; optional headshot.
- **Who We Work With:** Headline "Who We Work With". Copy: B2B and B2C brands; product companies; service businesses; campaigns and launches; events and trade shows. Short list or paragraph. Use list or `Card`.

### Step 4.4 — Style Studio Branding: Add “Why Production-Ready Assets Matter”

**File:** `app/partners/style-studio-branding/page.tsx`

- **Why Production-Ready Assets Matter:** Headline "Why Production-Ready Assets Matter". Copy: Assets that are on-brand, print- and digital-ready, and built for real campaigns reduce rework and elevate trust; Style Studio aligns with Macon (identity) and Ascendra (web) when you need the full system. One short paragraph in a `Card`.

### Step 4.5 — Ascendra Technologies: Add “About Anthony” and “More Than a Pretty Website”

**File:** `app/partners/ascendra-technologies/page.tsx`

- **About Anthony:** Add section headline "About Anthony". Copy: Founder of Ascendra. Role: technical and systems partner for the ecosystem. Mission: help businesses grow through websites that convert, automation that saves time, and systems that scale. One short paragraph. Use bio block; optional headshot.
- **More Than a Pretty Website:** Headline "More Than a Pretty Website". Copy: Sites that capture leads, follow up, and support your process; automation that reduces manual work; systems that grow with you. One short paragraph in a `Card` or block.

### Step 4.6 — Ascendra Technologies: Add “System-Oriented Approach”

**File:** `app/partners/ascendra-technologies/page.tsx`

- **System-Oriented Approach:** Headline "System-Oriented Approach". Copy: Websites and tools as part of a growth system—aligned with brand (Macon) and marketing assets (Style Studio) when clients need the full ecosystem. One short paragraph in a `Card`.

---

## Phase 5 — Copy and Visual Consistency Pass

### Step 5.1 — Apply tone and hierarchy

- **Tone (all funnel pages):** Premium, clear, strategic, authentic, growth-focused. Short sentences; concrete outcomes; no jargon without explainer. Avoid fluffy adjectives and generic agency speak.
- **Hierarchy:** One H1 per page (hero only). H2 for each major section. Use existing `PageSEO` for title/description; keep canonical paths as-is.
- **Cards:** One idea per card; title + short body; no long paragraphs inside cards. Use existing `Card`, `CardHeader`, `CardTitle`, `CardContent`; add `break-words` and `min-w-0` where needed for responsiveness.

### Step 5.2 — Section spacing and rhythm

- Use consistent section classes: e.g. `py-10 fold:py-12 xs:py-16 sm:py-20 md:py-24` for sections; alternate `bg-muted/30 dark:bg-muted/10` for every other section where appropriate.
- Constrain content width: `max-w-3xl` for text-heavy sections, `max-w-4xl` for grids. Use `container mx-auto px-3 fold:px-4 sm:px-4 md:px-6 min-w-0` pattern already in use.
- Ensure all new sections are responsive: `min-w-0`, `break-words` on text, `overflow-hidden` on cards where needed (see existing ecosystem pages).

### Step 5.3 — Internal links check

- **Hub:** Hero CTAs → `#paths` and `/strategy-call`. Pillar cards → `/partners/macon-designs`, `/partners/style-studio-branding`, `/partners/ascendra-technologies`. Path selector → `/launch-your-brand`, `/rebrand-your-business`, `/marketing-assets`. Final CTA → `/strategy-call`.
- **Path pages:** Primary CTA → `/strategy-call`. Secondary CTA → `/brand-growth`. Marketing-assets: add link to `/partners/style-studio-branding` in Style Studio block.
- **Partner pages:** Primary CTA → `/strategy-call`. Secondary CTA → `/brand-growth` (Style Studio can also offer link to `/marketing-assets`).
- **Strategy-call:** Secondary CTA → `/brand-growth`. Success → redirect to `/call-confirmation`.
- **Call-confirmation:** Single CTA → `/brand-growth`.

---

## Reusable Modules (Reference)

When adding sections, prefer these patterns so they can be reused or extracted later:

- **Hero block:** Headline + subhead + primary CTA + optional secondary CTA + optional badge.
- **Problem block:** H2 + 4–5 bullets or short paragraph + optional “See the solution” CTA.
- **Solution block:** H2 + optional subhead + 3–4 cards (icon + title + short copy) + optional links.
- **Process block:** H2 + 3–4 numbered steps (title + one-line description).
- **Path selector:** H2 + subhead + 3 buttons/cards (label + description + href).
- **FAQ block:** H2 + Accordion with 3–5 Q&A pairs.
- **CTA block:** H2 + one sentence + primary button + optional secondary link + optional reassurance line.
- **Proof/transformation block:** H2 + 4–5 outcome bullets with checkmarks.

Use existing `Card`, `Button`, `Badge`, `Accordion`, and motion from `framer-motion`; no new component library.

---

## Completion Checklist

- [ ] Sitewide: CTA constants and nav/footer match wireframe doc; existing audit/contact flows unchanged.
- [ ] Hub: Section order correct; optional “Why integrated model” added or merged; hero and final CTA copy and links verified.
- [ ] Launch: “Who this is best for,” “One team one launch,” and FAQ added; CTAs and links verified.
- [ ] Rebrand: “Signs you’ve outgrown,” “What’s included,” “What this does for your business,” and FAQ added; CTAs verified.
- [ ] Marketing-assets: Problem section, Style Studio/Kristopher block, use cases, and “How it works” added; link to partner page verified.
- [ ] Strategy-call: “What this call is for,” “Who this is best for,” and “We’ll respond within 24–48 hours” added.
- [ ] Call-confirmation: “What happens next,” optional video/reassurance added.
- [ ] Macon: About Denishia, Design philosophy, Portfolio placeholder, Why brand systems matter added.
- [ ] Style Studio: About Kristopher, Who we work with, Why production-ready assets matter added.
- [ ] Ascendra: About Anthony, More than a pretty website, System-oriented approach added.
- [ ] Copy and visual pass: Tone, hierarchy, spacing, and internal links verified across all nine pages.

---

**End of implementation instructions.** Work through phases in order; use **ECOSYSTEM_WIREFRAME_AND_COPY_SYSTEM.md** for full copy options and **ECOSYSTEM_FUNNEL_AUDIT.md** for technical context. Do not create new routes or remove existing functionality.

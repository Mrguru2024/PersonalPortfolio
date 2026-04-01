# Public trust & assurance — audit & implementation (2026-03)

## STEP 1 — Audit summary

### Homepage (`/` via `route-modules/Home.tsx`, `HeroSection`)

| Area | Finding |
|------|---------|
| Hero | Strong visually; copy read as general “brand + website” agency, not **systems + visibility**. |
| Outcome framework | Solid; home `realValue` bullet three was generic “scale” language. |
| Redundancy | Section **`#about`** repeated the same “coordinated brand/design/tech” message already covered in Before/After and ecosystem blocks. |
| How it works | Framed as questionnaire steps; missed **Diagnose → Prioritize → Build/refine** narrative requested for system positioning. |
| Ecosystem | Accurate but didn’t state **accountability / measurable refinement** in one line. |

### Services (`/services`)

| Area | Finding |
|------|---------|
| Positioning | Clear tier cards; lacked a short **expectations** strip before deep scanning offers. |
| Offer bullets | Feature-ish lines (“Clarity and structure improvements”) vs **outcome-first**. |

### Growth platform (`/growth-platform`)

| Area | Finding |
|------|---------|
| Header | Already system-oriented; benefited from one **value-first** reassurance under CTAs (without echoing Core Guarantee box). |
| 3-step preview | Paragraph repeated “not a legal guarantee” while a **Core Guarantee** section exists below → **redundant**. |

### Lead magnet hub (`/free-growth-tools`)

| Area | Finding |
|------|---------|
| Intro | Fine; missing one **low-friction / no-fluff** line for opt-in psychology. |
| Copy typo | “A honest” in outcome framework preset. |

### Digital Growth Audit (`/digital-growth-audit`)

| Area | Finding |
|------|---------|
| Form zone | Two prose blocks before form; could merge + add **what happens after request** without a new giant section. |

### Booking (`/book/[slug]` + `SchedulingBookFlow`)

| Area | Finding |
|------|---------|
| Reassurance | Thin: generic email line only; **fit + agenda** missing for final conversion step. |

### Strategy call (`/strategy-call`)

| Area | Finding |
|------|---------|
| Cards | Good intent; “No pitch” slightly generic; **what happens next** belonged above the long form. |
| Footer | 24–48h line overlapped with new expectation copy—replaced with **fit honesty** line. |

### Contact (`/contact` → `ContactBookingSection` + `StrategyCallForm`)

| Area | Finding |
|------|---------|
| Form | No **privacy / use of data** microcopy under submit. |

---

## STEP 2 — Content strategy (what stayed / merged / removed)

- **Kept:** Outcome landing framework pattern, Core Guarantee on growth platform, ecosystem storytelling, diagnosis CTAs.
- **Removed:** Duplicate homepage `#about` block.
- **Merged:** Digital audit intro + expectation into tighter copy + `WhatToExpectList`.
- **Rewrote:** Hero headline/subline; services offer “includes”; home “How it works” steps; growth platform 3-step intro (dropped duplicate guarantee disclaimer); audit typo “taxxing”; free tools “A honest” → “An honest”.
- **Embedded trust:** Tiered microcopy in `app/lib/embeddedAssuranceCopy.ts` + `EmbeddedAssurance` components (**no** repeated same line across page types).

---

## STEP 3 — Files touched

| File | Change |
|------|--------|
| `app/lib/embeddedAssuranceCopy.ts` | **New** — tiered assurance strings + expectation lists. |
| `app/components/marketing/EmbeddedAssurance/index.tsx` | **New** — `CTAReassuranceLine`, `WhatToExpectList`. |
| `app/sections/HeroSection.tsx` | System-forward hero + home CTA reassurance. |
| `app/route-modules/Home.tsx` | Removed redundant section; Diagnose/Prioritize/Build steps; ecosystem line. |
| `app/lib/funnel-content.ts` | Outcome-first `PREMIUM_OFFERS` bullets. |
| `app/lib/landingPageOutcomeFramework.ts` | Home `realValue` bullets; typo fixes. |
| `app/services/page.tsx` | Expectation list + service-tier reassurance. |
| `app/growth-platform/page.tsx` | Header reassurance; shorter 3-step copy. |
| `app/free-growth-tools/page.tsx` | Intro tighten + lead-magnet reassurance. |
| `app/digital-growth-audit/page.tsx` | Merged intro + `WhatToExpectList`. |
| `app/components/funnel/AuditRequestForm.tsx` | Submit microcopy. |
| `app/components/funnel/StrategyCallForm.tsx` | Contact form submit microcopy. |
| `app/strategy-call/page.tsx` | Expectations block; refined cards; footer line. |
| `app/components/scheduling/SchedulingBookFlow/index.tsx` | Booking expectations + confirm microcopy. |
| `app/book/[slug]/page.tsx` | Removed duplicate top line (handled in flow). |

---

## STEP 4 — Conversion QA checklist

- [x] Homepage trust: **subtle** (hero + one line under CTAs, ecosystem sentence, steps reframed).
- [x] Landing / services: **clearer** expectations without a “guarantees wall.”
- [x] Lead magnets: **value + safety** (tools hub + audit form footers).
- [x] Booking: **strongest** layer (`WhatToExpectList` + confirm line).
- [x] Duplicate homepage block **removed**.
- [x] Growth platform: **less** repetitive disclaimer language vs Core Guarantee block.

---

## STEP 5 — Why this should convert better

1. **First visit:** Hero now reads as **systems + visibility**, not generic creative shop.
2. **Friction:** Expectation lists reduce **ambiguity cost** right before high-commitment actions (audit, book, strategy form).
3. **Credibility:** Honest-fit language (“we’ll tell you directly”) is **high-trust, low-hype**—matches Ascendra positioning.
4. **Length:** Removed a redundant section; added compact patterns instead of long new bands.
5. **SEO / structure:** Heading hierarchy unchanged; copy edits remain crawlable text (no image-only trust).

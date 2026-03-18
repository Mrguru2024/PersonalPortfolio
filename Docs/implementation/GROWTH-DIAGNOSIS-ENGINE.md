# Ascendra Growth Diagnosis Engine

## Overview

The **Growth Diagnosis Engine** is a premium automated website audit and growth diagnosis system. It crawls a business website, runs deterministic rule checks, verifies findings against extracted evidence, and produces a transparent scoring report with a strong upsell path to human audits.

**User-facing positioning:** Website Growth Diagnosis, Conversion & Visibility Audit, Growth Readiness Score, Website Performance & Lead Flow Audit.

**Route:** `/growth-diagnosis`

---

## Architecture

### File map

```
app/
  growth-diagnosis/
    layout.tsx          # Metadata, SEO
    page.tsx            # Entry form, loading, results (single-page flow)
  components/
    growth-diagnosis/
      ScoreHero.tsx           # Overall score + grade label + gauge
      PerformanceScoreCard.tsx # Website Performance Score
      StartupScoreCard.tsx     # Startup Website Score
      BlockersAndQuickWins.tsx # Top blockers + quick wins cards
      CategoryScores.tsx       # Accordion of category scores
      AccuracyNotice.tsx       # Client-facing accuracy disclaimer
      PremiumUpsell.tsx        # CTA to human audit / strategy call
  api/
    growth-diagnosis/
      run/
        route.ts        # POST — run audit (crawl, extract, rules, verify, score)

app/lib/
  growth-diagnosis/
    types.ts            # AuditRequest, ExtractedPage, AuditIssue, AuditReport, etc.
    constants.ts        # BUSINESS_TYPES, PRIMARY_GOALS, CATEGORY_LABELS, weights, accuracy copy
    extract.ts          # HTML parsing (node-html-parser), extractFromHtml(), getDefaultUrlsToCrawl()
    rules.ts            # Deterministic rule checks, runRules(), rulesToIssues()
    verification.ts     # verifyRuleEvidence(), verifyIssues(), getVerificationSummary()
    scoring.ts          # computeCategoryScores(), weightedOverall(), Website/Startup scores, buildSummary()
    demo-report.ts      # buildDemoReport() for demo mode or fallback
    narrative.ts       # buildEvidenceNarrative(), buildNarrativeParagraph() — evidence-based only
  api/
    admin/
      growth-diagnosis/
        reports/
          route.ts     # GET list (admin), query: limit, email, url
          [id]/
            route.ts   # GET single report + diagnostics (admin)
            export/
              route.ts # GET export?format=json|text (admin)
shared/
  schema.ts            # growthDiagnosisReports table
```

### Data flow

1. **Entry:** User enters URL, optional business type, goal, email; can enable demo mode.
2. **POST /api/growth-diagnosis/run:**  
   - If `demoMode` or no URL: return `buildDemoReport()`.  
   - Else: fetch homepage + key paths (contact, about, services, etc.), parse HTML, extract structured data per page.
3. **Rules:** `runRules(pages)` returns a list of `RuleResult` (passed/failed, category, severity, title, description, evidence, impact, recommendation).
4. **Verification:** Each issue is checked against extracted evidence; status set to `verified` | `partial` | `low_confidence`. Internal only.
5. **Scoring:**  
   - Category scores from verified issues (penalties by severity).  
   - **Website Performance Score:** weighted mix of performance, SEO, mobile, accessibility, conversion, content.  
   - **Startup Website Score:** weighted mix of conversion, trust, content, SEO, mobile, performance.  
   - Overall **Growth Readiness Score:** weighted average of all categories (configurable weights).
6. **Report:** Summary (overall, grade tier, top blockers, quick wins), category scores, both major scores, issues list. Returned as JSON; client shows results UI.
7. **Persistence:** Every completed run is inserted into `growth_diagnosis_reports`. Admin can list, view diagnostics, and export (JSON or text narrative).
8. **Profile-based scoring:** When `request.businessType` is set, `buildSummary()` uses `getWeightsForProfile()` (local_service/skilled_trades → PROFILE_WEIGHTS_LOCAL; startup_saas/agency → PROFILE_WEIGHTS_STARTUP).

---

## Scoring system

### Category scores

- **Performance** — load/structure, usability (viewport, basic performance signals).
- **SEO Foundations** — title, meta description, H1, internal links, schema.
- **Conversion Readiness** — CTA presence, forms, phone/email links.
- **Mobile Experience** — viewport, mobile-friendly signals.
- **Trust & Authority** — trust signals, testimonials/reviews.
- **Content Clarity** — word count, thin content.
- **Accessibility Basics** — image alt text.
- **Local Visibility** — location relevance (for local profiles).

Each category score is 0–100. Issues in that category apply severity penalties (critical/high/medium/low). No issue in category ⇒ 100.

### Weights (configurable)

- **Default overall:** `DEFAULT_WEIGHTS` in `constants.ts` (e.g. conversion_readiness 0.18, trust_authority 0.15). Used for Growth Readiness Score.
- **Website Performance Score:** `WEBSITE_PERFORMANCE_WEIGHTS` — emphasis on performance, SEO, mobile, accessibility, conversion, content.
- **Startup Website Score:** `STARTUP_WEBSITE_WEIGHTS` — emphasis on conversion, trust, content; less on pure performance.

Weights are in `app/lib/growth-diagnosis/constants.ts`. **Profile-based weights** are implemented: `getWeightsForProfile(profile)` returns `PROFILE_WEIGHTS_LOCAL` (local_service, skilled_trades), `PROFILE_WEIGHTS_STARTUP` (startup_saas, agency), or default. Overall Growth Readiness Score uses these when `request.businessType` is set.

### Grade tiers

- 90–100: Strong Growth Position  
- 75–89: Healthy but Leaking Opportunities  
- 60–74: Needs Improvement  
- 40–59: Growth Friction Present  
- 0–39: Critical Lead Flow Problems  

Internal formulas and weight tables are not exposed in the UI.

---

## Website Performance Score vs Startup Website Score

- **Website Performance Score** answers: *“How strong is this website from a performance and usability standpoint?”*  
  Focus: load/performance, mobile responsiveness, accessibility basics, SEO foundation, navigation, page structure, CTA visibility.

- **Startup Website Score** answers: *“How ready is this website to help a startup attract interest, trust, signups, or early traction?”*  
  Focus: value proposition clarity, differentiation, trust/authority, onboarding clarity, conversion flow, demo/waitlist/signup readiness, pricing clarity, founder/company credibility.

Both use the same underlying category scores but different weight sets. Both are shown in the results hero and influence recommendations.

---

## Verification layer

- **Purpose:** Reduce false positives and ensure findings are backed by extracted evidence.
- **Flow:** For each rule result → `verifyRuleEvidence(issue, pages)` checks that the cited evidence (e.g. “H1 count: 0”) matches the actual extracted data. Status: `verified` | `partial` | `failed`.
- **Client impact:** Findings with low confidence can be softened in copy (e.g. “may be limiting results”). Raw verification status is not shown to users.
- **Extending:** Add new checks in `verification.ts` for new rule IDs; keep evidence checks aligned with `rules.ts` and `extract.ts`.

---

## Audit rules (MVP)

Implemented in `rules.ts`:

- Title missing/weak  
- Meta description missing/weak  
- H1 missing / multiple H1s  
- CTA missing or weak (homepage)  
- Form missing on contact/quote/book pages  
- Trust signals missing (homepage)  
- Thin content (word count)  
- Viewport meta missing  
- Images missing alt text  
- Schema missing  
- Phone not clickable (tel: link)  
- Weak internal linking  

New rules: add a new block in `runRules()` that pushes a `RuleResult`; then add a matching check in `verification.ts` if needed.

---

## Copy and refinements

- **Where to adjust copy:**  
  - Entry/goals: `constants.ts` (BUSINESS_TYPES, PRIMARY_GOALS).  
  - Accuracy notice: `ACCURACY_NOTICE_VARIANTS` in `constants.ts`.  
  - Grade labels: `GRADE_TIERS` in `constants.ts`.  
  - Rule messages: `rules.ts` (title, description, evidence, impact, recommendation).
- **Tone:** Plain English, helpful, not harsh or robotic. No internal jargon (e.g. “LLM”, “vector”, “heuristic”) in user-facing text.

---

## Premium upsell

- **Component:** `PremiumUpsell.tsx` — CTA to “Request your audit” (`/digital-growth-audit`) and “Book a call” (`/strategy-call`).
- **Logic:** Score bands (low / mid / high) choose different headline and description (urgency vs optimization vs advanced opportunities). See `getUpsellCopy(overallScore)` in the component.
- **Integration:** Human audit flow uses existing `/digital-growth-audit` and `/strategy-call`; no new backend required.

---

## Demo mode

- **When:** `demoMode: true` in request body, or user checks “Use demo mode” (or crawl fails and API falls back to demo).
- **Data:** `buildDemoReport(request)` in `demo-report.ts` returns a full `AuditReport` with sample scores, issues, blockers, and quick wins. URL in request is preserved in the report.

---

## Report export and persistence

- **Persistence:** Every completed run (non-demo) is stored in `growth_diagnosis_reports` (id, reportId, url, email, businessType, primaryGoal, requestPayload, reportPayload, status, pagesAnalyzed, overallScore, createdAt). Insert happens in POST `/api/growth-diagnosis/run`; on insert failure the API still returns the report.
- **Admin export:** GET `/api/admin/growth-diagnosis/reports/[id]/export?format=json|text` — JSON (full report) or plain text (evidence-based narrative). PDF can be added later (e.g. client-side library or server-side render).

---

## Admin monitoring and fix controls

- **Route:** `/admin/growth-diagnosis` (admin only). Linked from System monitor (`/admin/system`).
- **List:** GET `/api/admin/growth-diagnosis/reports?limit=50&email=&url=` — filter by email or URL substring.
- **Detail:** GET `/api/admin/growth-diagnosis/reports/[id]` — full report payload plus **diagnostics**: verification counts (verified / partial / lowConfidence / total), reportId, pagesAnalyzed, overallScore.
- **Export:** GET `/api/admin/growth-diagnosis/reports/[id]/export?format=json|text` — download as JSON (full report) or plain text (evidence-based narrative).
- **Re-run:** Admin can open “Re-run this URL” which links to `/growth-diagnosis?url=...` so the form is pre-filled; user clicks Start diagnosis again.
- **Fix controls:** No server-side “fix” actions; diagnostics help admins see verification health. Future: optional “re-verify” or “hide finding” flags per report.

## Evidence-based narrative (Phase 2)

- **Module:** `app/lib/growth-diagnosis/narrative.ts`.
- **buildEvidenceNarrative(report):** Returns sections (title + body) summarizing overall score, findings count, verification counts, top blockers, quick wins, and performance/readiness scores. All text is derived from report data only.
- **buildNarrativeParagraph(report):** Single string for email or export. Used by admin export `?format=text`.
- No LLM; no invented content. Add an optional AI layer later that only references verified findings.

## Next steps for refining accuracy

1. **Rules:** Add more rules (e.g. slow-loading hints if performance API available, clearer startup signals).  
2. **Verification:** For each new rule, add or extend `verifyRuleEvidence()` so only evidence-backed findings get `verified`.  
3. **Weights:** Tune `DEFAULT_WEIGHTS` and profile-specific weights (e.g. `local_service`, `startup_saas`) in `constants.ts`.  
4. **Crawl:** Expand `getDefaultUrlsToCrawl()` or discover links from homepage; respect robots.txt and rate limits.  
5. **AI layer (Phase 2):** After rules and verification, add an optional step that interprets findings into narrative summaries, referencing only extracted/verified evidence.

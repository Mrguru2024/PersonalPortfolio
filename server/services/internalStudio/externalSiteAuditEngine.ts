/**
 * Heuristic funnel / lead-alignment style audit by crawling public HTML from a client site.
 * Complements runLeadAlignmentEngine (monolith + DB). Does not access Ascendra's database for their metrics.
 */

import { parse } from "node-html-parser";
import {
  LEAD_AUDIT_CATEGORY_KEYS,
  type LeadAuditCategoryResult,
  type LeadAuditEvidenceItem,
  type LeadAuditRecommendationDraft,
  type ImplPriority,
  type StrengthState,
} from "@/lib/internal-audit/leadAuditCategories";
import { assertPublicHttpsOriginForAudit } from "@/lib/internal-audit/publicHttpsOrigin";

function ev(check: string, passed: boolean, proof: string): LeadAuditEvidenceItem {
  return { check, passed, proof };
}

function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function stateFromScore(score: number): StrengthState {
  if (score >= 72) return "strength";
  if (score >= 45) return "mixed";
  return "weakness";
}

function priorityFromScore(score: number): ImplPriority {
  if (score < 40) return "p0";
  if (score < 55) return "p1";
  if (score < 70) return "p2";
  return "p3";
}

function rec(
  title: string,
  detail: string,
  paths: string[],
  priority: ImplPriority,
): LeadAuditRecommendationDraft {
  return { title, detail, relatedPaths: paths, priority };
}

const CTA_RE =
  /\b(get started|start free|book (a |your )?call|schedule|contact us|request (a )?demo|sign up|signup|subscribe|download|try free|buy now|join|apply now)\b/i;

const LEAD_MAGNET_RE = /\b(ebook|whitepaper|guide|playbook|checklist|template|pdf|download|free tool|resource)\b/i;

const COMMON_PATHS = ["/", "/contact", "/contact-us", "/pricing", "/about", "/services", "/book", "/demo"];

async function fetchHtmlPage(url: string): Promise<{ finalUrl: string; html: string; status: number } | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 14_000);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: {
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "User-Agent": "Mozilla/5.0 (compatible; AscendraFunnelAudit/1.0)",
      },
      signal: ctrl.signal,
    });
    const ct = res.headers.get("content-type") ?? "";
    if (!res.ok || !ct.includes("text/html")) return null;
    const html = await res.text();
    if (html.length > 950_000) return null;
    return { finalUrl: res.url || url, html, status: res.status };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function analyzePage(html: string, pageUrl: string) {
  const root = parse(html, { lowerCaseTagName: true });
  const bodyText = root.text.toLowerCase();
  const htmlLower = html.toLowerCase();

  const forms = root.querySelectorAll("form");
  let emailInputs = 0;
  let telInputs = 0;
  for (const f of forms) {
    emailInputs += f.querySelectorAll('input[type="email"], input[name*="email" i]').length;
    telInputs += f.querySelectorAll('input[type="tel"], input[name*="phone" i]').length;
  }

  const scriptSrcs = root
    .querySelectorAll("script[src]")
    .map((s) => (s.getAttribute("src") ?? "").trim())
    .filter(Boolean);

  const anchors = root.querySelectorAll("a[href]");
  let ctaLinks = 0;
  for (const a of anchors) {
    const t = (a.text ?? "").trim();
    if (t && CTA_RE.test(t)) ctaLinks += 1;
  }

  const buttons = root.querySelectorAll('button, [role="button"], input[type="submit"]');
  let ctaButtons = 0;
  for (const b of buttons) {
    const t = (b.text ?? b.getAttribute("value") ?? "").trim();
    if (t && CTA_RE.test(t)) ctaButtons += 1;
  }

  let pdfLinks = 0;
  for (const a of anchors) {
    const href = (a.getAttribute("href") ?? "").toLowerCase();
    if (href.includes(".pdf") || /download/i.test(a.text ?? "")) pdfLinks += 1;
  }

  const h1s = root.querySelectorAll("h1");
  const navLinks = root.querySelectorAll("nav a[href], header a[href]").length;

  const hasChat =
    htmlLower.includes("intercom") ||
    htmlLower.includes("crisp.chat") ||
    htmlLower.includes("drift.com") ||
    htmlLower.includes("hubspot") && htmlLower.includes("messages");

  return {
    pageUrl,
    title: root.querySelector("title")?.text?.trim() ?? "",
    h1Count: h1s.length,
    formCount: forms.length,
    emailInputs,
    telInputs,
    scriptSrcs,
    bodyText,
    htmlLower,
    ctaLinks,
    ctaButtons,
    pdfLinks,
    navLinks,
    hasChat,
    leadMagnetLanguage: LEAD_MAGNET_RE.test(bodyText),
  };
}

export type ExternalAuditDbSnapshot = {
  auditKind: "external_site";
  baseUrl: string;
  fetchedUrls: string[];
  pagesSucceeded: number;
};

export async function runExternalSiteAuditEngine(rawUrl: string): Promise<{
  categories: LeadAuditCategoryResult[];
  dbSnapshot: ExternalAuditDbSnapshot;
}> {
  const baseUrl = assertPublicHttpsOriginForAudit(rawUrl);
  const fetched: { finalUrl: string; html: string }[] = [];
  const tried = new Set<string>();

  for (const p of COMMON_PATHS) {
    const u = new URL(p, baseUrl).toString();
    if (tried.has(u)) continue;
    tried.add(u);
    const got = await fetchHtmlPage(u);
    if (got) {
      fetched.push({ finalUrl: got.finalUrl, html: got.html });
    }
    if (fetched.length >= 6) break;
  }

  if (fetched.length === 0) {
    throw new Error(
      `Could not load public HTML from ${baseUrl}. The site may block automated requests, require different paths, or be unreachable.`,
    );
  }

  const analyses = fetched.map((f) => analyzePage(f.html, f.finalUrl));
  const urls = [...new Set(analyses.map((a) => a.pageUrl))];

  const totalForms = analyses.reduce((n, a) => n + a.formCount, 0);
  const totalEmail = analyses.reduce((n, a) => n + a.emailInputs, 0);
  const totalTel = analyses.reduce((n, a) => n + a.telInputs, 0);
  const totalCta = analyses.reduce((n, a) => n + a.ctaLinks + a.ctaButtons, 0);
  const totalPdf = analyses.reduce((n, a) => n + a.pdfLinks, 0);
  const anyH1 = analyses.some((a) => a.h1Count > 0);
  const singlePrimaryH1 = analyses.some((a) => a.h1Count === 1);
  const navLinks = Math.max(...analyses.map((a) => a.navLinks), 0);
  const hasChat = analyses.some((a) => a.hasChat);
  const leadMagnetSignals = analyses.filter((a) => a.leadMagnetLanguage).length;

  const scriptBlob = analyses
    .flatMap((a) => a.scriptSrcs)
    .join(" ")
    .toLowerCase();
  const inlineBlob = analyses.map((a) => a.htmlLower).join("\n");

  const hasGtm = scriptBlob.includes("googletagmanager") || inlineBlob.includes("gtag(");
  const hasGa = scriptBlob.includes("google-analytics") || inlineBlob.includes("analytics.js");
  const hasPlausible = scriptBlob.includes("plausible.io");
  const hasFbq = inlineBlob.includes("fbevents.js") || inlineBlob.includes("fbq(");
  const hasSegment = scriptBlob.includes("segment.com") || scriptBlob.includes("segment.io");

  const dbSnapshot: ExternalAuditDbSnapshot = {
    auditKind: "external_site",
    baseUrl,
    fetchedUrls: urls,
    pagesSucceeded: fetched.length,
  };

  const results: LeadAuditCategoryResult[] = [];

  for (const key of LEAD_AUDIT_CATEGORY_KEYS) {
    const recs: LeadAuditRecommendationDraft[] = [];
    const evidence: LeadAuditEvidenceItem[] = [];
    let score = 50;
    let why = "";
    let risk = "";

    switch (key) {
      case "traffic_sources": {
        evidence.push(
          ev(
            "Public traffic data visible on site",
            false,
            "Traffic mix cannot be verified from a static HTML crawl — use their analytics tooling.",
          ),
        );
        score = 42;
        recs.push(
          rec(
            "Confirm acquisition channels in their analytics",
            "Ask which paid, organic, referral, and owned channels drive leads; align landing pages to those sources.",
            urls.slice(0, 2),
            "p2",
          ),
        );
        why = "Acquisition health depends on channel mix; HTML alone cannot prove traffic quality.";
        risk = "Without channel clarity, CRO work may optimize the wrong entry points.";
        break;
      }
      case "lead_capture": {
        evidence.push(
          ev(
            "Forms detected",
            totalForms > 0,
            `Found ${totalForms} form(s) across ${fetched.length} page(s) crawled.`,
          ),
        );
        evidence.push(
          ev(
            "Email capture fields",
            totalEmail > 0,
            totalEmail > 0
              ? `${totalEmail} email-style input(s) across pages.`
              : "No obvious email inputs on crawled pages.",
          ),
        );
        if (totalForms > 0) score += 12;
        if (totalEmail > 0) score += 18;
        if (totalTel > 0) score += 8;
        if (totalForms === 0) {
          recs.push(
            rec(
              "Add at least one lead capture path",
              "Primary site should expose a form, calendar embed, or clear email capture on key pages.",
              urls,
              "p0",
            ),
          );
        }
        why = "Lead capture turns attention into pipeline — weak capture caps every downstream system.";
        risk = "Invisible or missing forms lose buyers who were ready to raise their hand.";
        break;
      }
      case "offer_positioning": {
        const titles = analyses.map((a) => a.title).filter(Boolean);
        evidence.push(
          ev(
            "Page titles present",
            titles.length > 0,
            titles.length ? `Sample titles: ${titles.slice(0, 2).join(" · ")}` : "Missing <title> on crawled pages.",
          ),
        );
        const offerish =
          analyses.some((a) => /\b(pricing|plans|book|demo|services|agency|consult)\b/i.test(a.bodyText)) ||
          urls.some((u) => /pricing|services|book|demo/i.test(u));
        evidence.push(
          ev(
            "Commercial / offer language",
            offerish,
            offerish
              ? "Found pricing, services, booking, or demo language in visible text or URLs."
              : "Limited commercial language on crawled pages.",
          ),
        );
        if (offerish) score += 22;
        if (titles.length) score += 10;
        if (!offerish) {
          recs.push(
            rec(
              "Sharpen the primary offer on the homepage",
              "Make one flagship outcome obvious above the fold (who it is for + what they get).",
              [urls[0] ?? baseUrl],
              "p1",
            ),
          );
        }
        why = "Visitors should quickly understand what you sell and who it is for.";
        risk = "Vague positioning lengthens sales cycles and attracts poor-fit leads.";
        break;
      }
      case "lead_management": {
        evidence.push(
          ev(
            "CRM / pipeline visibility",
            false,
            "CRM usage cannot be inferred from public pages — confirm separately with the client.",
          ),
        );
        score = 38;
        recs.push(
          rec(
            "Map handoffs from form to CRM",
            "Ensure every capture route creates a contact with source, page URL, and consent where required.",
            urls.slice(0, 1),
            "p2",
          ),
        );
        why = "Structured follow-up depends on CRM discipline, not on what the marketing site exposes.";
        risk = "Leaks between marketing capture and sales follow-up waste ad spend.";
        break;
      }
      case "content_strategy_alignment": {
        const blogHints =
          urls.some((u) => /blog|insights|resources|articles/i.test(u)) ||
          analyses.some((a) => /blog|article|insights/i.test(a.bodyText));
        evidence.push(
          ev(
            "Blog / resources signals",
            blogHints,
            blogHints
              ? "URLs or copy suggest a blog or resources section."
              : "No strong blog/resources signals on crawled paths.",
          ),
        );
        if (blogHints) score += 20;
        score += singlePrimaryH1 ? 12 : anyH1 ? 6 : 0;
        evidence.push(
          ev(
            "Heading structure (H1)",
            anyH1,
            anyH1
              ? singlePrimaryH1
                ? "At least one page uses a single H1 (good for focus)."
                : "Multiple or missing H1s on some pages — review hierarchy."
              : "No H1 detected on crawled pages.",
          ),
        );
        why = "Content and funnel pages should tell one coherent story per page.";
        risk = "Inconsistent messaging between ads, landing pages, and site copy confuses ICPs.";
        break;
      }
      case "follow_up_systems": {
        evidence.push(
          ev(
            "Live chat / messaging widget",
            hasChat,
            hasChat
              ? "Detected third-party chat or messaging hints in HTML."
              : "No common chat widgets detected on crawled pages.",
          ),
        );
        evidence.push(
          ev(
            "Email capture for nurture",
            totalEmail > 0,
            totalEmail > 0 ? "Email fields present — can support newsletter or nurture." : "No email fields found.",
          ),
        );
        if (hasChat) score += 18;
        if (totalEmail > 0) score += 12;
        recs.push(
          rec(
            "Define post-capture sequence",
            "After submit, confirm thank-you page, expectations, and first follow-up within 24h.",
            urls.slice(0, 2),
            "p2",
          ),
        );
        why = "Speed and clarity of follow-up determine conversion from interest to conversation.";
        risk = "Silent forms and slow responses train prospects to disengage.";
        break;
      }
      case "analytics_growth_intelligence": {
        evidence.push(ev("Google Tag Manager / gtag", hasGtm || hasGa, hasGtm || hasGa ? "Found GTM/gtag/analytics hints." : "No GTM/gtag detected."));
        evidence.push(ev("Plausible", hasPlausible, hasPlausible ? "Plausible script reference found." : "No Plausible detected."));
        evidence.push(ev("Meta Pixel", hasFbq, hasFbq ? "Meta / Facebook pixel hints in page." : "No Meta pixel detected."));
        evidence.push(ev("Segment", hasSegment, hasSegment ? "Segment loader detected." : "No Segment detected."));
        let s = 35;
        if (hasGtm || hasGa) s += 22;
        if (hasPlausible) s += 18;
        if (hasFbq) s += 12;
        if (hasSegment) s += 12;
        score = s;
        if (!hasGtm && !hasGa && !hasPlausible) {
          recs.push(
            rec(
              "Install privacy-conscious analytics",
              "Use at least one production analytics stack and verify key events (lead, purchase, signup).",
              [urls[0] ?? baseUrl],
              "p1",
            ),
          );
        }
        why = "Measurement is required to learn which pages and campaigns actually produce pipeline.";
        risk = "No analytics means you cannot defend budget or prioritize fixes.";
        break;
      }
      case "cta_visibility_density": {
        evidence.push(
          ev(
            "CTA-style links or buttons",
            totalCta > 0,
            totalCta > 0
              ? `Found ${totalCta} CTA-style control(s) across crawled pages.`
              : "Few obvious CTAs in button/link text on crawled pages.",
          ),
        );
        score = 40 + Math.min(35, totalCta * 4);
        recs.push(
          rec(
            "One primary CTA per key section",
            "Reduce competing actions above the fold; repeat the same next step in hero and mid-page.",
            urls.slice(0, 3),
            "p2",
          ),
        );
        why = "Clear CTAs convert attention; clutter and vague labels hurt conversion.";
        risk = "Buried or competing CTAs cap performance even with strong traffic.";
        break;
      }
      case "funnel_clarity": {
        evidence.push(
          ev(
            "Primary navigation depth",
            navLinks >= 4,
            navLinks > 0 ? `About ${navLinks} nav/header links sampled.` : "Limited header navigation links found.",
          ),
        );
        evidence.push(
          ev(
            "Single focused H1 (any page)",
            singlePrimaryH1,
            singlePrimaryH1 ? "At least one page uses one H1." : "Review H1 usage for a clear page promise.",
          ),
        );
        score = 45 + (navLinks >= 6 ? 15 : navLinks >= 3 ? 8 : 0) + (singlePrimaryH1 ? 12 : anyH1 ? 5 : 0);
        why = "Visitors should always understand where they are and the next step for their stage.";
        risk = "Unclear journeys increase bounce and depress lead quality.";
        break;
      }
      case "lead_magnet_readiness": {
        evidence.push(
          ev(
            "Lead-magnet language",
            leadMagnetSignals > 0,
            leadMagnetSignals > 0
              ? "Copy suggests guides, downloads, or resources."
              : "Limited lead-magnet language on crawled pages.",
          ),
        );
        evidence.push(
          ev(
            "PDF or download links",
            totalPdf > 0,
            totalPdf > 0 ? `${totalPdf} download/PDF-style link(s) found.` : "No obvious PDF/download links.",
          ),
        );
        score = 42 + (leadMagnetSignals > 0 ? 15 : 0) + (totalPdf > 0 ? 18 : 0);
        if (totalPdf === 0 && leadMagnetSignals === 0) {
          recs.push(
            rec(
              "Add a tangible lead magnet",
              "Offer one focused asset aligned to the ICP and gate it with a short form.",
              urls.slice(0, 2),
              "p2",
            ),
          );
        }
        why = "Strong magnets accelerate trust and list growth when the promise is specific.";
        risk = "Generic “contact us” is weaker than a clear, valuable exchange.";
        break;
      }
      default:
        break;
    }

    score = clampScore(score);
    const strengthState = stateFromScore(score);
    const implementationPriority = priorityFromScore(score);

    results.push({
      categoryKey: key,
      score,
      strengthState,
      whyItMatters: why,
      risk,
      implementationPriority,
      recommendations: recs,
      evidence,
    });
  }

  return { categories: results, dbSnapshot };
}

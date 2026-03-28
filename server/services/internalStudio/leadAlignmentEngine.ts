import { existsSync } from "fs";
import { join } from "path";
import { db } from "@server/db";
import { count, eq } from "drizzle-orm";
import {
  growthExperiments,
  visitorActivity,
  crmContacts,
  funnelContentAssets,
  siteOffers,
  blogPosts,
} from "@shared/schema";
import {
  LEAD_AUDIT_CATEGORY_KEYS,
  type LeadAuditCategoryResult,
  type LeadAuditEvidenceItem,
  type LeadAuditRecommendationDraft,
  type ImplPriority,
  type StrengthState,
} from "@/lib/internal-audit/leadAuditCategories";
import { CRITICAL_APP_PATHS } from "@/lib/internal-audit/leadAlignmentManifest";

function fileOk(rel: string): boolean {
  try {
    return existsSync(join(process.cwd(), rel.replace(/\//g, "/")));
  } catch {
    return false;
  }
}

function pathProof(rel: string, ok: boolean): string {
  return ok ? `Present in repo: ${rel}` : `Not found at: ${rel}`;
}

function ev(check: string, passed: boolean, proof: string): LeadAuditEvidenceItem {
  return { check, passed, proof };
}

async function safeCountTable(table: object): Promise<number> {
  try {
    const [row] = await db.select({ n: count() }).from(table as typeof growthExperiments);
    return Number(row?.n ?? 0);
  } catch {
    return -1;
  }
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

export interface LeadAlignmentDbSnapshot {
  growthExperiments: number;
  visitorActivity: number;
  crmContacts: number;
  funnelContentAssets: number;
  siteOffers: number;
  publishedBlogPosts: number;
}

/**
 * Rerunnable heuristic audit against this repo + live DB signals.
 */
export async function runLeadAlignmentEngine(_projectKey: string): Promise<{
  categories: LeadAuditCategoryResult[];
  dbSnapshot: LeadAlignmentDbSnapshot;
}> {
  const expCount = await safeCountTable(growthExperiments);
  const visitCount = await safeCountTable(visitorActivity);
  const contactCount = await safeCountTable(crmContacts);
  const assetCount = await safeCountTable(funnelContentAssets);
  let offersCount = 0;
  let publishedPosts = 0;
  try {
    const [o] = await db.select({ n: count() }).from(siteOffers);
    offersCount = Number(o?.n ?? 0);
  } catch {
    offersCount = -1;
  }
  try {
    const [p] = await db
      .select({ n: count() })
      .from(blogPosts)
      .where(eq(blogPosts.isPublished, true));
    publishedPosts = Number(p?.n ?? 0);
  } catch {
    publishedPosts = -1;
  }

  const dbSnapshot: LeadAlignmentDbSnapshot = {
    growthExperiments: expCount,
    visitorActivity: visitCount,
    crmContacts: contactCount,
    funnelContentAssets: assetCount,
    siteOffers: offersCount,
    publishedBlogPosts: publishedPosts,
  };

  const results: LeadAuditCategoryResult[] = [];

  for (const key of LEAD_AUDIT_CATEGORY_KEYS) {
    const recs: LeadAuditRecommendationDraft[] = [];
    const evidence: LeadAuditEvidenceItem[] = [];
    let score = 55;
    let why = "";
    let risk = "";

    switch (key) {
      case "traffic_sources": {
        const blogOk = fileOk(CRITICAL_APP_PATHS.blogRoute);
        evidence.push(
          ev(
            "Growth experiments (DB)",
            expCount > 0,
            expCount < 0
              ? "Table growth_experiments: query failed (check DB connection)."
              : `Table growth_experiments: ${expCount} row(s).`,
          ),
        );
        if (expCount > 0) score += 15;
        if (expCount === 0) {
          recs.push(
            rec(
              "Define growth experiments",
              "Add running experiments for key CTAs and landing pages.",
              ["shared/crmSchema.ts", "app/api/growth-intelligence/variant/route.ts"],
              "p2",
            ),
          );
        }
        evidence.push(
          ev("Blog API route file", blogOk, pathProof(CRITICAL_APP_PATHS.blogRoute, blogOk)),
        );
        if (blogOk) score += 10;
        evidence.push(
          ev(
            "Published blog posts (DB)",
            publishedPosts > 0,
            publishedPosts < 0
              ? "Table blog_posts (published): query failed."
              : `Published posts in blog_posts: ${publishedPosts}.`,
          ),
        );
        if (publishedPosts > 0) score += 10;
        if (publishedPosts >= 0 && publishedPosts === 0) {
          recs.push(
            rec(
              "Publish authority content",
              "Blog and organic pages support long-term traffic; ship at least one pillar post.",
              ["app/blog", "app/admin/blog"],
              "p2",
            ),
          );
        }
        why = "Diversified acquisition reduces reliance on a single channel and feeds the CRM consistently.";
        risk = "Without measurable traffic sources, funnel metrics are meaningless.";
        break;
      }
      case "lead_capture": {
        const funnelLead = fileOk(CRITICAL_APP_PATHS.funnelLeadApi);
        const leadsAlias = fileOk(CRITICAL_APP_PATHS.leadsAliasApi);
        const strategy = fileOk(CRITICAL_APP_PATHS.strategyCall);
        const assessment = fileOk("app/api/assessment/route.ts");
        evidence.push(ev("Funnel leads API", funnelLead, pathProof(CRITICAL_APP_PATHS.funnelLeadApi, funnelLead)));
        evidence.push(ev("Leads alias API", leadsAlias, pathProof(CRITICAL_APP_PATHS.leadsAliasApi, leadsAlias)));
        evidence.push(ev("Strategy call API", strategy, pathProof(CRITICAL_APP_PATHS.strategyCall, strategy)));
        evidence.push(ev("Assessment API", assessment, pathProof("app/api/assessment/route.ts", assessment)));
        if (funnelLead) score += 12;
        if (leadsAlias) score += 8;
        if (strategy) score += 10;
        if (assessment) score += 8;
        if (!funnelLead) {
          recs.push(
            rec(
              "Restore funnel lead API",
              "Primary quiz/lead capture path appears missing.",
              [CRITICAL_APP_PATHS.funnelLeadApi],
              "p0",
            ),
          );
        }
        why = "Lead capture is the bridge between attention and pipeline — every serious funnel needs multiple capture paths.";
        risk = "Leaks here silently cap revenue regardless of traffic quality.";
        break;
      }
      case "offer_positioning": {
        const offersAdmin = fileOk(CRITICAL_APP_PATHS.siteOffersAdmin);
        evidence.push(
          ev("Site offers admin API", offersAdmin, pathProof(CRITICAL_APP_PATHS.siteOffersAdmin, offersAdmin)),
        );
        evidence.push(
          ev(
            "Offers in database",
            offersCount > 0,
            offersCount < 0
              ? "Table site_offers: query failed."
              : `Table site_offers: ${offersCount} row(s).`,
          ),
        );
        if (offersAdmin) score += 15;
        if (offersCount > 0) score += 20;
        if (offersCount === 0) {
          recs.push(
            rec(
              "Define at least one flagship offer in site_offers",
              "Align hero, pricing, and CRM stages to a clear commercial offer.",
              ["app/admin/offers", "shared/schema.ts"],
              "p1",
            ),
          );
        }
        why = "Clear offers make CTAs, sales conversations, and content coherent.";
        risk = "Weak positioning produces unqualified leads and long sales cycles.";
        break;
      }
      case "lead_management": {
        const contactsApi = fileOk(CRITICAL_APP_PATHS.crmContactsApi);
        const dealsApi = fileOk("app/api/admin/crm/deals/route.ts");
        evidence.push(
          ev("CRM contacts API", contactsApi, pathProof(CRITICAL_APP_PATHS.crmContactsApi, contactsApi)),
        );
        evidence.push(ev("CRM deals API", dealsApi, pathProof("app/api/admin/crm/deals/route.ts", dealsApi)));
        evidence.push(
          ev(
            "CRM contacts (DB)",
            contactCount > 5,
            contactCount < 0
              ? "Table crm_contacts: query failed."
              : `Table crm_contacts: ${contactCount} row(s) (threshold for “active pipeline” signal: >5).`,
          ),
        );
        if (contactsApi) score += 20;
        if (dealsApi) score += 10;
        if (contactCount > 5) score += 15;
        if (contactCount >= 0 && contactCount === 0) {
          recs.push(
            rec(
              "Import or generate CRM contacts",
              "Empty CRM limits follow-up and reporting value.",
              ["app/admin/crm/import"],
              "p2",
            ),
          );
        }
        why = "Structured lead management turns responses into revenue.";
        risk = "Without CRM discipline, paid and organic leads decay.";
        break;
      }
      case "content_strategy_alignment": {
        const funnelSlug = fileOk("app/api/funnel/[slug]/route.ts");
        const funnelAdmin = fileOk("app/admin/funnel/page.tsx");
        evidence.push(
          ev("Funnel slug API", funnelSlug, pathProof("app/api/funnel/[slug]/route.ts", funnelSlug)),
        );
        evidence.push(ev("Funnel admin UI", funnelAdmin, pathProof("app/admin/funnel/page.tsx", funnelAdmin)));
        evidence.push(
          ev(
            "Published posts for content depth",
            publishedPosts >= 3,
            publishedPosts < 0
              ? "Could not count published posts."
              : `Published posts: ${publishedPosts} (target ≥3 for this signal).`,
          ),
        );
        if (funnelSlug) score += 15;
        if (funnelAdmin) score += 15;
        if (publishedPosts >= 3) score += 15;
        why = "Editorial and funnel copy must reinforce the same narrative and next steps.";
        risk = "Misaligned content confuses ICPs and splits attribution.";
        break;
      }
      case "follow_up_systems": {
        const seq = fileOk(CRITICAL_APP_PATHS.crmSequencesApi);
        const tasks = fileOk("app/api/admin/crm/tasks/route.ts");
        const reminders = fileOk("app/api/admin/reminders/route.ts");
        evidence.push(ev("CRM sequences API", seq, pathProof(CRITICAL_APP_PATHS.crmSequencesApi, seq)));
        evidence.push(ev("CRM tasks API", tasks, pathProof("app/api/admin/crm/tasks/route.ts", tasks)));
        evidence.push(ev("Reminders API", reminders, pathProof("app/api/admin/reminders/route.ts", reminders)));
        if (seq) score += 20;
        if (tasks) score += 15;
        if (reminders) score += 10;
        recs.push(
          rec(
            "Review sequence coverage",
            "Map enrollments to funnel stages and ensure tasks exist for hot leads.",
            ["app/admin/crm/sequences", "app/admin/crm/tasks"],
            "p2",
          ),
        );
        why = "Follow-up systems compound the value of every captured lead.";
        risk = "No sequences = leads go cold within days.";
        break;
      }
      case "analytics_growth_intelligence": {
        const analytics = fileOk(CRITICAL_APP_PATHS.adminAnalytics);
        const variant = fileOk(CRITICAL_APP_PATHS.growthIntelVariant);
        evidence.push(
          ev("Admin analytics API", analytics, pathProof(CRITICAL_APP_PATHS.adminAnalytics, analytics)),
        );
        evidence.push(
          ev(
            "Growth intelligence variant API",
            variant,
            pathProof(CRITICAL_APP_PATHS.growthIntelVariant, variant),
          ),
        );
        evidence.push(
          ev(
            "Visitor activity events (DB)",
            visitCount > 20,
            visitCount < 0
              ? "Table visitor_activity: query failed."
              : `Table visitor_activity: ${visitCount} row(s) (threshold for “meaningful volume”: >20).`,
          ),
        );
        if (analytics) score += 15;
        if (variant) score += 15;
        if (visitCount > 20) score += 20;
        if (visitCount >= 0 && visitCount === 0) {
          recs.push(
            rec(
              "Instrument visitor_activity",
              "Ensure client tracking posts meaningful events from key pages.",
              ["server/services/leadScoringService.ts"],
              "p1",
            ),
          );
        }
        why = "Measurement closes the loop between creative, spend, and pipeline.";
        risk = "Flying blind wastes budget and hides conversion leaks.";
        break;
      }
      case "cta_visibility_density": {
        const ctas = fileOk(CRITICAL_APP_PATHS.funnelCtas);
        const home = fileOk("app/route-modules/Home.tsx");
        evidence.push(ev("Shared funnel CTAs module", ctas, pathProof(CRITICAL_APP_PATHS.funnelCtas, ctas)));
        evidence.push(ev("Home page module", home, pathProof("app/route-modules/Home.tsx", home)));
        if (ctas) score += 25;
        if (home) score += 15;
        recs.push(
          rec(
            "Audit CTA hierarchy per persona page",
            "One primary CTA per section; remove competing actions above the fold.",
            [CRITICAL_APP_PATHS.funnelCtas, "app/route-modules/Home.tsx"],
            "p2",
          ),
        );
        why = "CTA density must balance clarity with optionality — too many choices reduce conversions.";
        risk = "Buried or competing CTAs silently cap conversion rates.";
        break;
      }
      case "funnel_clarity": {
        const freeTools = fileOk(CRITICAL_APP_PATHS.freeGrowthTools);
        const kit = fileOk("app/resources/startup-growth-kit/page.tsx");
        const diagnosis = fileOk(CRITICAL_APP_PATHS.growthDiagnosis);
        evidence.push(
          ev("Free growth tools page", freeTools, pathProof(CRITICAL_APP_PATHS.freeGrowthTools, freeTools)),
        );
        evidence.push(
          ev("Startup growth kit page", kit, pathProof("app/resources/startup-growth-kit/page.tsx", kit)),
        );
        evidence.push(
          ev("Growth diagnosis route", diagnosis, pathProof(CRITICAL_APP_PATHS.growthDiagnosis, diagnosis)),
        );
        if (freeTools) score += 15;
        if (kit) score += 15;
        if (diagnosis) score += 15;
        why = "Visitors should always know the next step for their stage.";
        risk = "Unclear funnels increase bounce and depress lead quality.";
        break;
      }
      case "lead_magnet_readiness": {
        const assetsApi = fileOk(CRITICAL_APP_PATHS.funnelContentAssets);
        evidence.push(
          ev("Funnel content assets API", assetsApi, pathProof(CRITICAL_APP_PATHS.funnelContentAssets, assetsApi)),
        );
        evidence.push(
          ev(
            "Funnel content assets (DB)",
            assetCount > 0,
            assetCount < 0
              ? "Table funnel_content_assets: query failed."
              : `Table funnel_content_assets: ${assetCount} row(s).`,
          ),
        );
        if (assetsApi) score += 20;
        if (assetCount > 0) score += 25;
        if (assetCount >= 0 && assetCount === 0) {
          recs.push(
            rec(
              "Upload and publish lead magnets",
              "Use Admin → Funnel → Content Library and attach placements.",
              ["app/admin/funnel/content-library", CRITICAL_APP_PATHS.funnelContentAssets],
              "p1",
            ),
          );
        }
        why = "Lead magnets accelerate trust and list growth when tied to a single promise.";
        risk = "Thin magnets attract freebie seekers, not buyers.";
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

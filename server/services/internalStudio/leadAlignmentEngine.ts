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

/**
 * Rerunnable heuristic audit against this repo + live DB signals.
 */
export async function runLeadAlignmentEngine(_projectKey: string): Promise<LeadAuditCategoryResult[]> {
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

  const results: LeadAuditCategoryResult[] = [];

  for (const key of LEAD_AUDIT_CATEGORY_KEYS) {
    const recs: LeadAuditRecommendationDraft[] = [];
    let score = 55;
    let why = "";
    let risk = "";

    switch (key) {
      case "traffic_sources": {
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
        if (fileOk(CRITICAL_APP_PATHS.blogRoute)) score += 10;
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
        if (fileOk(CRITICAL_APP_PATHS.funnelLeadApi)) score += 12;
        if (fileOk(CRITICAL_APP_PATHS.leadsAliasApi)) score += 8;
        if (fileOk(CRITICAL_APP_PATHS.strategyCall)) score += 10;
        if (fileOk("app/api/assessment/route.ts")) score += 8;
        if (!fileOk(CRITICAL_APP_PATHS.funnelLeadApi)) {
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
        if (fileOk(CRITICAL_APP_PATHS.siteOffersAdmin)) score += 15;
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
        if (fileOk(CRITICAL_APP_PATHS.crmContactsApi)) score += 20;
        if (fileOk("app/api/admin/crm/deals/route.ts")) score += 10;
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
        if (fileOk("app/api/funnel/[slug]/route.ts")) score += 15;
        if (fileOk("app/admin/funnel/page.tsx")) score += 15;
        if (publishedPosts >= 3) score += 15;
        why = "Editorial and funnel copy must reinforce the same narrative and next steps.";
        risk = "Misaligned content confuses ICPs and splits attribution.";
        break;
      }
      case "follow_up_systems": {
        if (fileOk(CRITICAL_APP_PATHS.crmSequencesApi)) score += 20;
        if (fileOk("app/api/admin/crm/tasks/route.ts")) score += 15;
        if (fileOk("app/api/admin/reminders/route.ts")) score += 10;
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
        if (fileOk(CRITICAL_APP_PATHS.adminAnalytics)) score += 15;
        if (fileOk(CRITICAL_APP_PATHS.growthIntelVariant)) score += 15;
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
        if (fileOk(CRITICAL_APP_PATHS.funnelCtas)) score += 25;
        if (fileOk("app/pages/Home.tsx")) score += 15;
        recs.push(
          rec(
            "Audit CTA hierarchy per persona page",
            "One primary CTA per section; remove competing actions above the fold.",
            [CRITICAL_APP_PATHS.funnelCtas, "app/pages/Home.tsx"],
            "p2",
          ),
        );
        why = "CTA density must balance clarity with optionality — too many choices reduce conversions.";
        risk = "Buried or competing CTAs silently cap conversion rates.";
        break;
      }
      case "funnel_clarity": {
        if (fileOk(CRITICAL_APP_PATHS.freeGrowthTools)) score += 15;
        if (fileOk("app/resources/startup-growth-kit/page.tsx")) score += 15;
        if (fileOk(CRITICAL_APP_PATHS.growthDiagnosis)) score += 15;
        why = "Visitors should always know the next step for their stage.";
        risk = "Unclear funnels increase bounce and depress lead quality.";
        break;
      }
      case "lead_magnet_readiness": {
        if (fileOk(CRITICAL_APP_PATHS.funnelContentAssets)) score += 20;
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
    });
  }

  return results;
}

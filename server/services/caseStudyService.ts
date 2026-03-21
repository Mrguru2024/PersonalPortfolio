import { and, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { db } from "@server/db";
import { caseStudies, type CaseStudy, type CaseStudyBlock, type CaseStudySectionContent } from "@shared/schema";
import {
  CASE_STUDY_PUBLISH_STATES,
  DEFAULT_CASE_STUDY_DRAFTS,
  computeCaseStudyCompleteness,
  emptyCaseStudySections,
  generateCaseStudyFormats,
  slugifyCaseStudy,
  type CaseStudyPersona,
  type CaseStudySystem,
} from "@/lib/revenue-system/caseStudy";

type PublishState = (typeof CASE_STUDY_PUBLISH_STATES)[number];

function normalizePublishState(value: string | null | undefined): PublishState {
  if (value && CASE_STUDY_PUBLISH_STATES.includes(value as PublishState)) {
    return value as PublishState;
  }
  return "draft";
}

function normalizeSections(value: unknown): CaseStudySectionContent {
  if (!value || typeof value !== "object") return emptyCaseStudySections();
  const source = value as Record<string, unknown>;
  const base = emptyCaseStudySections();
  return {
    hero: typeof source.hero === "string" ? source.hero : base.hero,
    overview: typeof source.overview === "string" ? source.overview : base.overview,
    problem: typeof source.problem === "string" ? source.problem : base.problem,
    diagnosis: typeof source.diagnosis === "string" ? source.diagnosis : base.diagnosis,
    solution: typeof source.solution === "string" ? source.solution : base.solution,
    results: typeof source.results === "string" ? source.results : base.results,
    visualProof: typeof source.visualProof === "string" ? source.visualProof : base.visualProof,
    takeaways: typeof source.takeaways === "string" ? source.takeaways : base.takeaways,
    cta: typeof source.cta === "string" ? source.cta : base.cta,
  };
}

function normalizeBlocks(value: unknown): CaseStudyBlock[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry) => entry && typeof entry === "object")
    .map((entry) => entry as CaseStudyBlock);
}

function normalizeSlug(slug: string, title: string): string {
  const normalized = slugifyCaseStudy(slug || title);
  return normalized || `case-study-${Date.now()}`;
}

export async function ensureSeedCaseStudies(): Promise<void> {
  const existing = await db.select({ id: caseStudies.id }).from(caseStudies).limit(1);
  if (existing.length > 0) return;

  for (const draft of DEFAULT_CASE_STUDY_DRAFTS) {
    const formats = generateCaseStudyFormats({
      title: draft.title,
      summary: draft.summary,
      sections: draft.sections,
      ctaLabel: draft.ctaLabel,
      ctaHref: draft.ctaHref,
    });
    const completenessScore = computeCaseStudyCompleteness({
      sections: draft.sections,
      blocks: [],
      ctaLabel: draft.ctaLabel,
      ctaHref: draft.ctaHref,
    });
    await db.insert(caseStudies).values({
      slug: draft.slug,
      title: draft.title,
      subtitle: draft.subtitle,
      summary: draft.summary,
      persona: draft.persona,
      recommendedSystem: draft.recommendedSystem,
      publishState: "draft",
      featured: false,
      sections: draft.sections,
      blocks: [],
      formats,
      completenessScore,
      ctaLabel: draft.ctaLabel,
      ctaHref: draft.ctaHref,
      metaTitle: draft.title,
      metaDescription: draft.summary,
      noIndex: true,
      updatedAt: new Date(),
    });
  }
}

export async function listCaseStudies(options?: {
  search?: string;
  persona?: string;
  system?: string;
  states?: string[];
  includeNonPublished?: boolean;
}) {
  const conditions = [];
  if (options?.search) {
    const q = `%${options.search.trim()}%`;
    conditions.push(
      or(ilike(caseStudies.title, q), ilike(caseStudies.summary, q), ilike(caseStudies.slug, q)),
    );
  }
  if (options?.persona) {
    conditions.push(eq(caseStudies.persona, options.persona));
  }
  if (options?.system) {
    conditions.push(eq(caseStudies.recommendedSystem, options.system));
  }
  if (options?.states && options.states.length > 0) {
    conditions.push(inArray(caseStudies.publishState, options.states));
  } else if (!options?.includeNonPublished) {
    conditions.push(eq(caseStudies.publishState, "published"));
  }

  return db
    .select()
    .from(caseStudies)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(caseStudies.featured), desc(caseStudies.publishedAt), desc(caseStudies.updatedAt));
}

export async function getCaseStudyBySlug(
  slug: string,
  options?: { includePreview?: boolean },
): Promise<CaseStudy | undefined> {
  const rows = await db
    .select()
    .from(caseStudies)
    .where(eq(caseStudies.slug, slug))
    .limit(1);
  const row = rows[0];
  if (!row) return undefined;
  if (row.publishState === "published") return row;
  if (row.publishState === "preview" && options?.includePreview) return row;
  if (options?.includePreview && row.publishState === "draft") return row;
  return undefined;
}

export async function getCaseStudyById(id: number): Promise<CaseStudy | undefined> {
  const rows = await db.select().from(caseStudies).where(eq(caseStudies.id, id)).limit(1);
  return rows[0];
}

export async function createCaseStudy(input: {
  title: string;
  slug?: string;
  subtitle?: string;
  summary?: string;
  persona?: string;
  recommendedSystem?: string;
  publishState?: string;
  featured?: boolean;
  sections?: unknown;
  blocks?: unknown;
  ctaLabel?: string | null;
  ctaHref?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogImage?: string | null;
  noIndex?: boolean;
  createdByUserId?: number | null;
}) {
  const sections = normalizeSections(input.sections);
  const blocks = normalizeBlocks(input.blocks);
  const slug = normalizeSlug(input.slug ?? "", input.title);
  const publishState = normalizePublishState(input.publishState);
  const formats = generateCaseStudyFormats({
    title: input.title,
    summary: input.summary ?? "",
    sections,
    ctaLabel: input.ctaLabel ?? undefined,
    ctaHref: input.ctaHref ?? undefined,
  });
  const completenessScore = computeCaseStudyCompleteness({
    sections,
    blocks,
    ctaLabel: input.ctaLabel,
    ctaHref: input.ctaHref,
  });

  const [row] = await db
    .insert(caseStudies)
    .values({
      slug,
      title: input.title,
      subtitle: input.subtitle ?? null,
      summary: input.summary ?? "",
      persona: (input.persona as CaseStudyPersona) ?? "operators",
      recommendedSystem: (input.recommendedSystem as CaseStudySystem) ?? "revenue_system",
      publishState,
      featured: input.featured ?? false,
      sections,
      blocks,
      formats,
      completenessScore,
      ctaLabel: input.ctaLabel ?? null,
      ctaHref: input.ctaHref ?? null,
      metaTitle: input.metaTitle ?? null,
      metaDescription: input.metaDescription ?? null,
      ogImage: input.ogImage ?? null,
      noIndex: input.noIndex ?? publishState !== "published",
      createdByUserId: input.createdByUserId ?? null,
      updatedByUserId: input.createdByUserId ?? null,
      publishedAt: publishState === "published" ? new Date() : null,
      archivedAt: publishState === "archived" ? new Date() : null,
      updatedAt: new Date(),
    })
    .returning();
  return row;
}

export async function updateCaseStudy(
  id: number,
  input: Partial<{
    title: string;
    slug: string;
    subtitle: string | null;
    summary: string;
    persona: string;
    recommendedSystem: string;
    publishState: string;
    featured: boolean;
    sections: unknown;
    blocks: unknown;
    formats: unknown;
    ctaLabel: string | null;
    ctaHref: string | null;
    metaTitle: string | null;
    metaDescription: string | null;
    ogImage: string | null;
    noIndex: boolean;
    updatedByUserId: number | null;
  }>,
) {
  const existing = await getCaseStudyById(id);
  if (!existing) return undefined;

  const sections =
    input.sections !== undefined
      ? normalizeSections(input.sections)
      : normalizeSections(existing.sections);
  const blocks = input.blocks !== undefined ? normalizeBlocks(input.blocks) : normalizeBlocks(existing.blocks);
  const title = input.title ?? existing.title;
  const summary = input.summary ?? existing.summary ?? "";
  const publishState = normalizePublishState(input.publishState ?? existing.publishState);
  const ctaLabel = input.ctaLabel ?? existing.ctaLabel ?? null;
  const ctaHref = input.ctaHref ?? existing.ctaHref ?? null;
  const formats =
    input.formats && typeof input.formats === "object"
      ? (input.formats as Record<string, unknown>)
      : generateCaseStudyFormats({
          title,
          summary,
          sections,
          ctaLabel,
          ctaHref,
        });

  const completenessScore = computeCaseStudyCompleteness({
    sections,
    blocks,
    ctaLabel,
    ctaHref,
  });

  const [row] = await db
    .update(caseStudies)
    .set({
      title,
      slug: normalizeSlug(input.slug ?? existing.slug, title),
      subtitle: input.subtitle ?? existing.subtitle ?? null,
      summary,
      persona: input.persona ?? existing.persona,
      recommendedSystem: input.recommendedSystem ?? existing.recommendedSystem,
      publishState,
      featured: input.featured ?? existing.featured,
      sections,
      blocks,
      formats,
      completenessScore,
      ctaLabel,
      ctaHref,
      metaTitle: input.metaTitle ?? existing.metaTitle ?? null,
      metaDescription: input.metaDescription ?? existing.metaDescription ?? null,
      ogImage: input.ogImage ?? existing.ogImage ?? null,
      noIndex: input.noIndex ?? (publishState !== "published"),
      updatedByUserId: input.updatedByUserId ?? existing.updatedByUserId ?? null,
      publishedAt:
        publishState === "published"
          ? existing.publishedAt ?? new Date()
          : publishState === "archived"
            ? null
            : existing.publishedAt,
      archivedAt: publishState === "archived" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(caseStudies.id, id))
    .returning();
  return row;
}

export interface CaseStudyAiInput {
  action:
    | "generate_draft"
    | "improve_section"
    | "rewrite_sales"
    | "generate_social"
    | "generate_email"
    | "generate_proposal"
    | "generate_formats";
  title: string;
  summary?: string;
  persona?: string;
  system?: string;
  sectionKey?: keyof CaseStudySectionContent;
  sectionContent?: string;
  sections?: unknown;
  ctaLabel?: string;
  ctaHref?: string;
}

function buildDraftSection(
  title: string,
  summary: string,
  persona: string,
  system: string,
): CaseStudySectionContent {
  return {
    hero: `${title}\n${summary || "Documenting the system shift and revenue impact."}`,
    overview: `Persona: ${persona}. System focus: ${system}. This case study captures baseline constraints and measurable outcomes.`,
    problem: "The client had growth friction caused by disconnected lead capture, inconsistent follow-up, and weak conversion proof.",
    diagnosis:
      "Audit identified bottlenecks in visibility, trust, and operational handoff. Revenue leakage was traced to system gaps, not only traffic volume.",
    solution:
      "A connected system was implemented across acquisition, capture, follow-up, and proof delivery with clear ownership and measurable checkpoints.",
    results:
      "Conversion reliability improved, lead response became faster, and qualified pipeline quality increased with clearer messaging and stronger proof.",
    visualProof:
      "Include before/after snapshots of pipeline stages, conversion rates, and response times to validate the narrative.",
    takeaways:
      "Growth became predictable when strategy and execution were linked through one operating system instead of isolated tactics.",
    cta: "Book Strategy Call",
  };
}

export function runCaseStudyAiAction(input: CaseStudyAiInput) {
  const title = input.title.trim() || "Case Study";
  const summary = (input.summary ?? "").trim();

  if (input.action === "generate_draft") {
    const sections = buildDraftSection(
      title,
      summary,
      input.persona ?? "operators",
      input.system ?? "revenue_system",
    );
    return { sections };
  }

  if (input.action === "improve_section") {
    const source = (input.sectionContent ?? "").trim();
    const improved =
      source.length > 0
        ? `${source}\n\nImproved framing: tie this section to measurable business impact and timeline clarity.`
        : "Start with baseline context, identify root cause, and quantify impact after implementation.";
    return { content: improved };
  }

  if (input.action === "rewrite_sales") {
    const source = (input.sectionContent ?? "").trim();
    return {
      content:
        source.length > 0
          ? `${source}\n\nSales rewrite: connect each change to lost-revenue recovery and a next-step CTA.`
          : "Revenue leak identified. System deployed. Pipeline stabilized. Next step: implement the same framework in your business.",
    };
  }

  if (input.action === "generate_social") {
    return {
      content: `Case Study: ${title}\n${summary || "System improvements turned inconsistent growth into a repeatable pipeline."}\nRun your diagnostic: /revenue-diagnostic`,
    };
  }

  if (input.action === "generate_email") {
    return {
      content: `Subject: ${title}\n\n${summary || "Quick proof of system-led revenue gains."}\n\nSee how we diagnosed the bottlenecks, implemented a connected system, and improved outcomes.\n\nBook strategy call: /strategy-call`,
    };
  }

  if (input.action === "generate_proposal") {
    return {
      content: `Proof snippet — ${title}\n\nProblem: Revenue leakage from disconnected systems.\nApproach: Diagnose bottlenecks, implement coordinated growth system.\nOutcome: More reliable conversion and stronger pipeline quality.`,
    };
  }

  const sections = normalizeSections(input.sections);
  return {
    formats: generateCaseStudyFormats({
      title,
      summary,
      sections,
      ctaLabel: input.ctaLabel,
      ctaHref: input.ctaHref,
    }),
  };
}

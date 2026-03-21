import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCaseStudyBySlug, listCaseStudies, ensureSeedCaseStudies } from "@server/services/caseStudyService";
import type { CaseStudy } from "@shared/schema";
import { CaseStudyDetailClient } from "./CaseStudyDetailClient";

interface Params {
  slug: string;
}

interface SearchParams {
  preview?: string;
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  await ensureSeedCaseStudies();
  const { slug } = await params;
  const sp = await searchParams;
  const preview = sp.preview === "1";
  const row = await getCaseStudyBySlug(slug, { includePreview: preview });
  if (!row) {
    return {
      title: "Case Study Not Found | Ascendra Technologies",
      robots: { index: false, follow: false },
    };
  }
  const title = row.metaTitle || row.title;
  const description = row.metaDescription || row.summary || row.sections?.overview || "";
  const noIndex = row.noIndex || row.publishState !== "published";
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: row.ogImage ? [row.ogImage] : undefined,
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
    },
  };
}

export default async function CaseStudySlugPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  await ensureSeedCaseStudies();
  const { slug } = await params;
  const sp = await searchParams;
  const preview = sp.preview === "1";
  const caseStudy = await getCaseStudyBySlug(slug, { includePreview: preview });
  if (!caseStudy) notFound();

  const relatedCandidates = await listCaseStudies({
    includeNonPublished: preview,
    persona: caseStudy.persona,
  });
  const related = relatedCandidates
    .filter((entry) => entry.slug !== caseStudy.slug)
    .slice(0, 3)
    .map((entry) => ({
      id: entry.id,
      slug: entry.slug,
      title: entry.title,
      summary: entry.summary,
    }));

  return <CaseStudyDetailClient caseStudy={caseStudy as CaseStudy} related={related} />;
}

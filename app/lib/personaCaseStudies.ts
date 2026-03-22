import { projects, type Project } from "@/lib/data";
import {
  MACON_PROJECTS,
  STYLE_STUDIO_PROJECTS,
  type EcosystemPartnerProject,
} from "@/lib/ecosystemProjects";

/**
 * Maps persona `caseStudyRefs` (project `id` from `projects` in data.ts) to portfolio entries.
 * Unknown ids are skipped so CMS drift does not break the UI.
 */
export function resolvePersonaCaseStudyProjects(refs: string[] | undefined): Project[] {
  if (!refs?.length) return [];
  const byId = new Map(projects.map((p) => [p.id, p]));
  return refs.map((id) => byId.get(id)).filter((p): p is Project => p != null);
}

export function projectCaseStudyPath(projectId: string): string {
  return `/projects/${encodeURIComponent(projectId)}`;
}

/** Deterministic hash so the same journey id always picks the same rotated portfolio (SSR-safe). */
export function journeyIdHash(journeyId: string): number {
  let h = 0;
  for (let i = 0; i < journeyId.length; i++) {
    h = (h * 31 + journeyId.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** Ascendra builds for rotated spotlights (persona journeys, lead magnet strips, etc.). */
export const ASCENDRA_SPOTLIGHT_FALLBACK_IDS: readonly string[] = [
  "the-unauthorized-author",
  "stackzen",
  "keycode-help",
  "ssi-met-repairs",
  "portfolio-website",
  "web-development-services",
  "gatherly",
];

export interface PersonaEcosystemSpotlight {
  ascendra: Project;
  macon: EcosystemPartnerProject;
  styleStudio: EcosystemPartnerProject;
  /** Extra Ascendra case studies from `caseStudyRefs` after the primary spotlight (for “also see”). */
  ascendraMore: Project[];
}

/**
 * One portfolio highlight per ecosystem pillar, rotated by `journeyId` so each persona path surfaces
 * different Macon / Style Studio (and fallback Ascendra) examples while keeping picks stable per URL.
 */
export function getPersonaEcosystemSpotlight(
  journeyId: string,
  caseStudyRefs: string[] | undefined,
): PersonaEcosystemSpotlight {
  const h = journeyIdHash(journeyId);
  const resolved = resolvePersonaCaseStudyProjects(caseStudyRefs);
  const byId = new Map(projects.map((p) => [p.id, p]));

  const fallbackId = ASCENDRA_SPOTLIGHT_FALLBACK_IDS[h % ASCENDRA_SPOTLIGHT_FALLBACK_IDS.length];
  const primaryAscendra =
    resolved[0] ?? (fallbackId ? byId.get(fallbackId) : undefined) ?? projects[0]!;

  const ascendraMore = resolved.slice(1);

  return {
    ascendra: primaryAscendra,
    macon: MACON_PROJECTS[h % MACON_PROJECTS.length]!,
    styleStudio: STYLE_STUDIO_PROJECTS[(h + 5) % STYLE_STUDIO_PROJECTS.length]!,
    ascendraMore,
  };
}

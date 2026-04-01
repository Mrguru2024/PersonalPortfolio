import { projects, type Project } from "@/lib/data";
import {
  MACON_PROJECTS,
  STYLE_STUDIO_PROJECTS,
  type EcosystemPartnerProject,
} from "@/lib/ecosystemProjects";
import {
  ASCENDRA_SPOTLIGHT_FALLBACK_IDS,
  journeyIdHash,
} from "@/lib/personaCaseStudies";

/** Lead magnet / funnel pages that show the Related work ecosystem strip. */
export const LEAD_MAGNET_RELATED_WORK_KEYS = [
  "digital-growth-audit",
  "ppc-lead-system",
  "revenue-calculator",
  "website-performance-score",
  "competitor-snapshot",
  "homepage-blueprint",
  "growth-diagnosis",
  "free-growth-tools",
  "free-trial",
  "strategy-call",
  "brand-growth",
  "growth-landing",
  "startup-growth-kit",
  "startup-action-plan",
  "startup-website-score",
  "startup-growth-system",
  "market-score",
] as const;

export type LeadMagnetRelatedWorkKey = (typeof LEAD_MAGNET_RELATED_WORK_KEYS)[number];

function byIds<T extends { id: string }>(list: T[], ids: string[]): T[] {
  const map = new Map(list.map((p) => [p.id, p]));
  return ids.map((id) => map.get(id)).filter((p): p is T => p != null);
}

/** Two distinct rotation indices; if the pool has one item, returns a single index twice (caller dedupes). */
function twoRotationIndices(length: number, h: number, stride: number): [number, number] {
  if (length <= 0) return [0, 0];
  const i0 = h % length;
  if (length === 1) return [0, 0];
  let i1 = (h + stride) % length;
  if (i1 === i0) i1 = (i0 + 1) % length;
  return [i0, i1];
}

function pickRotatedPartnerProjects<T>(
  items: readonly T[],
  h: number,
  stride: number,
): T[] {
  const [i0, i1] = twoRotationIndices(items.length, h, stride);
  if (items.length === 0) return [];
  if (items.length === 1) return [items[0]!];
  return [items[i0]!, items[i1]!];
}

function pickRotatedAscendraProjects(h: number): Project[] {
  const pool = ASCENDRA_SPOTLIGHT_FALLBACK_IDS;
  const [i0, i1] = twoRotationIndices(pool.length, h, 4);
  const ids = pool.length === 1 ? [pool[0]!] : [pool[i0]!, pool[i1]!];
  const resolved = byIds(projects, ids);
  if (resolved.length > 0) return resolved;
  return projects[0] ? [projects[0]] : [];
}

export interface LeadMagnetRelatedWorkBundle {
  ascendra: Project[];
  macon: EcosystemPartnerProject[];
  styleStudio: EcosystemPartnerProject[];
}

/**
 * Two examples per pillar, rotated deterministically by `key` so each tool page shows different
 * portfolio depth over time while staying stable per URL (SSR-safe).
 */
export function resolveLeadMagnetRelatedWork(key: LeadMagnetRelatedWorkKey): LeadMagnetRelatedWorkBundle {
  const h = journeyIdHash(`lead-magnet:${key}`);
  return {
    ascendra: pickRotatedAscendraProjects(h),
    macon: pickRotatedPartnerProjects(MACON_PROJECTS, h, 2),
    styleStudio: pickRotatedPartnerProjects(STYLE_STUDIO_PROJECTS, h, 5),
  };
}

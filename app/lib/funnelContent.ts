import { storage } from "@server/storage";

export type FunnelContentData = Record<string, unknown> | null;

/**
 * Get stored funnel content by slug (for use in server components or API).
 * Returns null if not found.
 */
export async function getFunnelContent(slug: string): Promise<FunnelContentData> {
  const row = await storage.getFunnelContent(slug);
  return row?.data ?? null;
}

export const FUNNEL_SLUGS = ["growth-kit", "website-score", "action-plan", "offer"] as const;
export type FunnelSlug = (typeof FUNNEL_SLUGS)[number];

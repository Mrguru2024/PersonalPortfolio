import { storage } from "@server/storage";
import type { FunnelContentData } from "@/lib/funnelContent";

/**
 * Get stored funnel content by slug (server only).
 * Returns null if not found.
 */
export async function getFunnelContent(slug: string): Promise<FunnelContentData> {
  try {
    const row = await storage.getFunnelContent(slug);
    return row?.data ?? null;
  } catch {
    // Marketing pages should still render with built-in defaults when DB is unavailable at build/runtime.
    return null;
  }
}

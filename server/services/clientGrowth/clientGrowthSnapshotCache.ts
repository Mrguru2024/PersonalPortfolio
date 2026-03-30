import { db } from "@server/db";
import { clientGrowthSnapshots } from "@shared/schema";
import { clientGrowthSnapshotSchema, type ClientGrowthSnapshot } from "@shared/clientGrowthSnapshot";
import { eq } from "drizzle-orm";

function cacheTtlMs(): number {
  const raw = Number(process.env.CLIENT_GROWTH_SNAPSHOT_CACHE_TTL_SEC ?? 45);
  const sec = Number.isFinite(raw) && raw > 0 ? Math.min(300, Math.max(5, raw)) : 45;
  return sec * 1000;
}

export async function getCachedClientGrowthSnapshot(userId: number): Promise<ClientGrowthSnapshot | null> {
  const [row] = await db
    .select()
    .from(clientGrowthSnapshots)
    .where(eq(clientGrowthSnapshots.userId, userId))
    .limit(1);
  if (!row?.snapshotJson) return null;
  const computedAt = row.computedAt ? new Date(row.computedAt).getTime() : 0;
  if (Date.now() - computedAt > cacheTtlMs()) return null;
  const parsed = clientGrowthSnapshotSchema.safeParse(row.snapshotJson);
  return parsed.success ? parsed.data : null;
}

export async function upsertClientGrowthSnapshotCache(userId: number, snapshot: ClientGrowthSnapshot): Promise<void> {
  const now = new Date();
  await db
    .insert(clientGrowthSnapshots)
    .values({
      userId,
      snapshotJson: snapshot as unknown as Record<string, unknown>,
      computedAt: now,
    })
    .onConflictDoUpdate({
      target: clientGrowthSnapshots.userId,
      set: {
        snapshotJson: snapshot as unknown as Record<string, unknown>,
        computedAt: now,
      },
    });
}

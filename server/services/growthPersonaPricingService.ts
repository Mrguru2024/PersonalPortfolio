import { db } from "@server/db";
import { growthPersonaOfferPricing } from "@shared/schema";
import { asc, eq } from "drizzle-orm";

export async function listGrowthPersonaOfferPricing() {
  return db.select().from(growthPersonaOfferPricing).orderBy(asc(growthPersonaOfferPricing.personaKey));
}

export async function upsertGrowthPersonaOfferPricing(input: {
  personaKey: string;
  label?: string | null;
  dfySetupMultiplier: number;
  dfyMonthlyMultiplier: number;
  dwyProgramMultiplier: number;
}) {
  const key = input.personaKey.trim().toLowerCase();
  if (!key) throw new Error("personaKey required");
  const clamp = (n: number) => (Number.isFinite(n) && n > 0 ? Math.min(5, Math.max(0.25, n)) : 1);
  const existing = await db
    .select()
    .from(growthPersonaOfferPricing)
    .where(eq(growthPersonaOfferPricing.personaKey, key))
    .limit(1);
  if (existing[0]) {
    const [row] = await db
      .update(growthPersonaOfferPricing)
      .set({
        label: input.label?.trim() || null,
        dfySetupMultiplier: clamp(input.dfySetupMultiplier),
        dfyMonthlyMultiplier: clamp(input.dfyMonthlyMultiplier),
        dwyProgramMultiplier: clamp(input.dwyProgramMultiplier),
        updatedAt: new Date(),
      })
      .where(eq(growthPersonaOfferPricing.id, existing[0].id))
      .returning();
    return row;
  }
  const [row] = await db
    .insert(growthPersonaOfferPricing)
    .values({
      personaKey: key,
      label: input.label?.trim() || null,
      dfySetupMultiplier: clamp(input.dfySetupMultiplier),
      dfyMonthlyMultiplier: clamp(input.dfyMonthlyMultiplier),
      dwyProgramMultiplier: clamp(input.dwyProgramMultiplier),
    })
    .returning();
  return row;
}

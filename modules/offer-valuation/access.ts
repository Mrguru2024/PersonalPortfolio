import { and, eq } from "drizzle-orm";
import { db } from "@server/db";
import {
  OFFER_VALUATION_CLIENT_EXPERIENCE_MODES,
  gosEntityVisibilityOverrides,
  offerValuationModuleSettings,
  type OfferValuationClientExperienceMode,
} from "@shared/schema";
import type { DataVisibilityTier, SessionUserLike } from "@shared/accessScope";
import {
  logGosAccessEvent,
  upsertEntityVisibilityOverride,
} from "@server/services/growthOsFoundationService";
import {
  OFFER_VALUATION_DEFAULT_MODE,
  OFFER_VALUATION_DEFAULT_VISIBILITY,
  OFFER_VALUATION_ENTITY_ID,
  OFFER_VALUATION_ENTITY_TYPE,
} from "./constants";

export interface OfferValuationAccessSettings {
  visibility: DataVisibilityTier;
  makeAvailableToClient: boolean;
  clientExperienceMode: OfferValuationClientExperienceMode;
}

function parseClientExperienceMode(
  raw: string | null | undefined,
): OfferValuationClientExperienceMode {
  if (
    raw &&
    OFFER_VALUATION_CLIENT_EXPERIENCE_MODES.includes(
      raw as OfferValuationClientExperienceMode,
    )
  ) {
    return raw as OfferValuationClientExperienceMode;
  }
  return OFFER_VALUATION_DEFAULT_MODE;
}

export async function getOfferValuationAccessSettings(): Promise<OfferValuationAccessSettings> {
  const [visibilityRow] = await db
    .select()
    .from(gosEntityVisibilityOverrides)
    .where(
      and(
        eq(gosEntityVisibilityOverrides.entityType, OFFER_VALUATION_ENTITY_TYPE),
        eq(gosEntityVisibilityOverrides.entityId, OFFER_VALUATION_ENTITY_ID),
      ),
    )
    .limit(1);

  const visibility = (visibilityRow?.visibility ??
    OFFER_VALUATION_DEFAULT_VISIBILITY) as DataVisibilityTier;
  const makeAvailableToClient =
    visibility === "client_visible" || visibility === "public_visible";

  const [settingsRow] = await db
    .select()
    .from(offerValuationModuleSettings)
    .where(eq(offerValuationModuleSettings.settingsKey, "default"))
    .limit(1);

  return {
    visibility,
    makeAvailableToClient,
    clientExperienceMode: parseClientExperienceMode(settingsRow?.clientExperienceMode),
  };
}

export async function updateOfferValuationAccessSettings(input: {
  makeAvailableToClient?: boolean;
  clientExperienceMode?: OfferValuationClientExperienceMode;
  updatedByUserId: number | null;
}): Promise<OfferValuationAccessSettings> {
  if (input.makeAvailableToClient !== undefined) {
    const visibility: DataVisibilityTier = input.makeAvailableToClient
      ? "client_visible"
      : "internal_only";

    await upsertEntityVisibilityOverride({
      entityType: OFFER_VALUATION_ENTITY_TYPE,
      entityId: OFFER_VALUATION_ENTITY_ID,
      visibility,
      updatedByUserId: input.updatedByUserId,
    });

    await logGosAccessEvent({
      actorUserId: input.updatedByUserId,
      action: "offer_valuation_client_visibility_updated",
      resourceType: OFFER_VALUATION_ENTITY_TYPE,
      resourceId: OFFER_VALUATION_ENTITY_ID,
      visibilityContext: visibility,
      metadata: { makeAvailableToClient: input.makeAvailableToClient },
    });
  }

  if (input.clientExperienceMode !== undefined) {
    const now = new Date();
    await db
      .insert(offerValuationModuleSettings)
      .values({
        settingsKey: "default",
        clientExperienceMode: input.clientExperienceMode,
        updatedByUserId: input.updatedByUserId,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: offerValuationModuleSettings.settingsKey,
        set: {
          clientExperienceMode: input.clientExperienceMode,
          updatedByUserId: input.updatedByUserId,
          updatedAt: now,
        },
      });
  }

  return getOfferValuationAccessSettings();
}

export function isApprovedAdminUser(user: SessionUserLike | null | undefined): boolean {
  return Boolean(user?.isAdmin && user?.adminApproved);
}

export function canAccessOfferValuationEngine(
  user: SessionUserLike | null | undefined,
  settings: OfferValuationAccessSettings,
): boolean {
  if (!user) return false;
  if (isApprovedAdminUser(user) || user?.isSuperUser === true) return true;
  return settings.makeAvailableToClient;
}

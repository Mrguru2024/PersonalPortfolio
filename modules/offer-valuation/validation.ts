import { z } from "zod";
import { OFFER_VALUATION_CLIENT_EXPERIENCE_MODES } from "@shared/schema";

export const offerValuationInputSchema = z.object({
  persona: z.string().trim().min(1).max(200),
  offerName: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).optional().nullable(),
  dreamOutcomeScore: z.number().int().min(1).max(10),
  likelihoodScore: z.number().int().min(1).max(10),
  timeDelayScore: z.number().int().min(1).max(10),
  effortScore: z.number().int().min(1).max(10),
});

export const offerValuationCreateSchema = offerValuationInputSchema.extend({
  userId: z.number().int().positive().optional(),
});

export const offerValuationPatchSchema = offerValuationInputSchema.partial();

export const offerValuationSettingsPatchSchema = z
  .object({
    makeAvailableToClient: z.boolean().optional(),
    clientExperienceMode: z
      .enum(OFFER_VALUATION_CLIENT_EXPERIENCE_MODES)
      .optional(),
  })
  .refine(
    (data) =>
      data.makeAvailableToClient !== undefined ||
      data.clientExperienceMode !== undefined,
    { message: "At least one field is required" },
  );

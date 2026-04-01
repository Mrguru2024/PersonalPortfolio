import { z } from "zod";

export const behaviorIngestPayloadSchema = z.object({
  sessionId: z.string().min(8).max(128),
  userId: z.string().max(128).optional(),
  businessId: z.string().max(128).optional(),
  crmContactId: z.number().int().positive().optional(),
  device: z.string().max(64).optional(),
  url: z.string().max(2048).optional(),
  utm: z.record(z.string(), z.unknown()).optional(),
  converted: z.boolean().optional(),
  optOut: z.boolean().optional(),
  events: z
    .array(
      z.object({
        eventType: z.string().max(64),
        eventData: z.record(z.string(), z.unknown()).optional(),
        timestamp: z.number().optional(),
      }),
    )
    .max(200)
    .default([]),
  replaySegments: z
    .array(
      z.object({
        seq: z.number().int().nonnegative(),
        events: z.array(z.unknown()).max(4000),
      }),
    )
    .max(15)
    .optional(),
  heatmapPoints: z
    .array(
      z.object({
        page: z.string().max(2048),
        x: z.number().int(),
        y: z.number().int(),
        viewportW: z.number().int().optional(),
        viewportH: z.number().int().optional(),
        eventType: z.string().max(32),
      }),
    )
    .max(400)
    .optional(),
  surveyResponses: z
    .array(
      z.object({
        surveyId: z.number().int().positive(),
        response: z.string().max(4000),
      }),
    )
    .max(20)
    .optional(),
});

export type BehaviorIngestPayload = z.infer<typeof behaviorIngestPayloadSchema>;

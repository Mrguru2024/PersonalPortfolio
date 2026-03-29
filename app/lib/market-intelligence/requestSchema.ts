import { z } from "zod";

export const amieMarketBodySchema = z.object({
  projectKey: z.string().max(120).optional(),
  industry: z.string().min(1).max(200),
  serviceType: z.string().min(1).max(200),
  location: z.string().min(1).max(200),
  persona: z.string().min(1).max(200),
  save: z.boolean().optional(),
  skipCache: z.boolean().optional(),
});

export type AmieMarketBody = z.infer<typeof amieMarketBodySchema>;

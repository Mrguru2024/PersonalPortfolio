import { z } from "zod";

const conditionSchema = z
  .object({
    intentIncludes: z.array(z.string()).optional(),
    statusIn: z.array(z.string()).optional(),
    lifecycleStageIn: z.array(z.string()).optional(),
    minLeadScore: z.number().optional(),
    maxLeadScore: z.number().optional(),
    hasBookedCall: z.boolean().optional(),
    tagIncludes: z.array(z.string()).optional(),
    sourceIncludes: z.array(z.string()).optional(),
  })
  .strict();

export const leadControlRoutingRuleSchema = z.object({
  id: z.string().min(1).max(80),
  enabled: z.boolean(),
  label: z.string().max(120).optional(),
  hint: z.string().min(1).max(64),
  if: conditionSchema.default({}),
});

export const leadControlOrgConfigPutSchema = z.object({
  routingRules: z.array(leadControlRoutingRuleSchema).max(40),
});

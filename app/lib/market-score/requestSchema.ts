import { z } from "zod";

const trimmed = z.string().trim();

export const marketScoreFunnelBodySchema = z.object({
  name: trimmed.min(1, "Name is required").max(200),
  email: trimmed.email("Valid email required").max(320),
  phone: trimmed.max(40).optional().nullable(),
  company: trimmed.max(200).optional().nullable(),
  industry: trimmed.min(1, "Industry is required").max(200),
  serviceType: trimmed.min(1, "Service or offer is required").max(200),
  location: trimmed.min(1, "Market or location is required").max(200),
  persona: trimmed.min(1, "Persona is required").max(400),
  monthlyRevenue: trimmed.max(120).optional().nullable(),
  timeline: trimmed.max(120).optional().nullable(),
  goal: trimmed.max(500).optional().nullable(),
  /** Honeypot — must be empty */
  websiteUrl: trimmed.max(200).optional().nullable(),
  visitorId: trimmed.max(120).optional().nullable(),
  attribution: z
    .object({
      utm_source: trimmed.max(200).optional().nullable(),
      utm_medium: trimmed.max(200).optional().nullable(),
      utm_campaign: trimmed.max(200).optional().nullable(),
      utm_term: trimmed.max(200).optional().nullable(),
      utm_content: trimmed.max(200).optional().nullable(),
      gclid: trimmed.max(512).optional().nullable(),
      referrer: trimmed.max(2000).optional().nullable(),
      landing_page: trimmed.max(500).optional().nullable(),
    })
    .optional()
    .nullable(),
});

export type MarketScoreFunnelBody = z.infer<typeof marketScoreFunnelBodySchema>;

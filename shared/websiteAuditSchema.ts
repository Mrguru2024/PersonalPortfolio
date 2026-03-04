import { z } from "zod";

export const WEBSITE_BUSINESS_TYPES = [
  "local-service",
  "ecommerce",
  "saas",
  "lead-generation",
  "portfolio",
  "content-publisher",
  "nonprofit",
  "other",
] as const;

export const AUDIT_PRIMARY_GOALS = [
  "Increase qualified traffic",
  "Improve conversion rate",
  "Improve Core Web Vitals and speed",
  "Fix technical SEO issues",
  "Improve mobile UX",
  "Improve accessibility compliance",
  "Improve lead quality",
  "Increase online sales",
] as const;

export const AUDIT_CONVERSION_ACTIONS = [
  "Contact form submissions",
  "Phone calls",
  "Booked consultations",
  "Product purchases",
  "Demo requests",
  "Newsletter signups",
  "Free trial signups",
  "Resource downloads",
] as const;

export const TRACKING_TOOLS = [
  "Google Analytics 4",
  "Google Search Console",
  "Google Tag Manager",
  "Hotjar / MS Clarity",
  "Meta Pixel",
  "LinkedIn Insight Tag",
  "Call tracking platform",
  "Other",
] as const;

export const AD_PLATFORMS = [
  "Google Ads",
  "Meta Ads",
  "LinkedIn Ads",
  "TikTok Ads",
  "Microsoft Ads",
  "Other",
] as const;

export const CONTACT_METHODS = ["email", "phone", "zoom"] as const;

export const AUDIT_TIMELINES = [
  "asap",
  "this-week",
  "within-2-weeks",
  "this-month",
  "flexible",
] as const;

export const CMS_OPTIONS = [
  "wordpress",
  "shopify",
  "webflow",
  "wix",
  "squarespace",
  "custom",
  "unknown",
] as const;

export const websiteAuditSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Enter a valid email address."),
  phone: z.string().optional(),
  company: z.string().optional(),
  role: z.string().optional(),
  websiteUrl: z.string().url("Enter a valid website URL, including https://"),
  businessType: z.enum(WEBSITE_BUSINESS_TYPES),
  targetAudience: z
    .string()
    .min(10, "Please add at least 10 characters for target audience."),
  topChallenges: z
    .string()
    .min(20, "Please describe your top challenges in at least 20 characters."),
  primaryGoals: z
    .array(z.string())
    .min(1, "Select at least one primary audit goal."),
  primaryConversionActions: z
    .array(z.string())
    .min(1, "Select at least one conversion action."),
  priorityPages: z
    .array(z.string())
    .min(1, "Add at least one priority page for the audit."),
  competitors: z.array(z.string()).optional(),
  targetLocations: z.string().optional(),
  focusKeywords: z.array(z.string()).optional(),
  cmsPlatform: z.enum(CMS_OPTIONS).optional(),
  customStackDetails: z.string().optional(),
  trackingTools: z.array(z.string()).optional(),
  hasAnalyticsAccess: z.boolean().default(false),
  hasSearchConsoleAccess: z.boolean().default(false),
  runningAds: z.boolean().default(false),
  adPlatforms: z.array(z.string()).optional(),
  monthlySessions: z.string().optional(),
  currentConversionRate: z.string().optional(),
  canProvideReadOnlyAccess: z.boolean().default(false),
  preferredTimeline: z.enum(AUDIT_TIMELINES),
  preferredContactMethod: z.enum(CONTACT_METHODS),
  additionalContext: z.string().optional(),
  newsletter: z.boolean().default(false),
  consent: z
    .boolean()
    .refine((v) => v === true, "You must agree before submitting."),
});

export type WebsiteAuditSubmission = z.infer<typeof websiteAuditSchema>;

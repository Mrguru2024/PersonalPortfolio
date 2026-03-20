/**
 * Curated paths relative to repo root for static checks (Ascendra monolith).
 * Update when major funnel / API surfaces move.
 */
export const CRITICAL_APP_PATHS = {
  funnelLeadApi: "app/api/funnel/leads/route.ts",
  leadsAliasApi: "app/api/leads/route.ts",
  growthDiagnosis: "app/growth-diagnosis",
  freeGrowthTools: "app/free-growth-tools/page.tsx",
  funnelCtas: "app/lib/funnelCtas.ts",
  crmContactsApi: "app/api/admin/crm/contacts/route.ts",
  crmSequencesApi: "app/api/admin/crm/sequences/route.ts",
  adminAnalytics: "app/api/admin/analytics/reports/route.ts",
  growthIntelVariant: "app/api/growth-intelligence/variant/route.ts",
  funnelContentAssets: "app/api/admin/funnel-content-assets/route.ts",
  newsletterSubscribe: "app/api/newsletter/subscribe/route.ts",
  strategyCall: "app/api/strategy-call/route.ts",
  siteOffersAdmin: "app/api/admin/offers/route.ts",
  blogRoute: "app/api/blog/route.ts",
  visitorActivityTable: "shared/crmSchema.ts",
} as const;

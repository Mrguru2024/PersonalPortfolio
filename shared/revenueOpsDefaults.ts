import type { RevenueOpsOperatingCostLine } from "./crmSchema";

/**
 * Example monthly operating model (USD cents). Replace in Revenue ops settings with your real run-rate.
 */
export const REVENUE_OPS_DEFAULT_OPERATING_COST_LINES: RevenueOpsOperatingCostLine[] = [
  {
    key: "infra_hosting",
    label: "Hosting, DB, edge, DNS (e.g. Vercel, Neon, domains)",
    monthlyCents: 150_00,
    notes: "Built-in Ascendra stack footprint",
  },
  {
    key: "productivity",
    label: "Productivity & comms (email, meetings, docs)",
    monthlyCents: 60_00,
  },
  {
    key: "go_to_market_tools",
    label: "GTM tools (ads interfaces, analytics, SEO)",
    monthlyCents: 250_00,
  },
  {
    key: "apis_usage",
    label: "APIs & usage (LLM, SMS, maps, media)",
    monthlyCents: 400_00,
    notes: "Scales with volume — adjust monthly from vendor dashboards",
  },
  {
    key: "payments_fees",
    label: "Payments & payout fees (Stripe est.)",
    monthlyCents: 75_00,
    notes: "Rough placeholder; true-up from Stripe reports",
  },
  {
    key: "contractor_delivery",
    label: "Contractor / delivery capacity (avg)",
    monthlyCents: 6_000_00,
    notes: "Largest variable for project shops — set from actual subcontractor agreements",
  },
  {
    key: "professional",
    label: "Accounting, legal, insurance (amortized)",
    monthlyCents: 450_00,
  },
  {
    key: "contingency",
    label: "Contingency / buffer",
    monthlyCents: 500_00,
  },
];

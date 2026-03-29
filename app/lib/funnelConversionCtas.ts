/**
 * Map funnel **access model** to CTA ordering for startup resource funnels.
 * Paths are canonical site routes from `funnelCtas`.
 */
import type { FunnelAccessModel } from "@shared/funnelConversionSettings";
import {
  BOOK_CALL_HREF,
  PROJECT_GROWTH_ASSESSMENT_PATH,
  REVENUE_CALCULATOR_PATH,
  STARTUP_ACTION_PLAN_PATH,
  STARTUP_WEBSITE_SCORE_PATH,
  STRATEGY_CALL_PATH,
} from "@/lib/funnelCtas";

export type FunnelCtaItem = { href: string; label: string; variant: "default" | "outline" };

const SCORE: FunnelCtaItem = {
  href: STARTUP_WEBSITE_SCORE_PATH,
  label: "Get your startup website score",
  variant: "default",
};
const REVENUE: FunnelCtaItem = {
  href: REVENUE_CALCULATOR_PATH,
  label: "Estimate revenue opportunity",
  variant: "outline",
};
const PLAN: FunnelCtaItem = {
  href: STARTUP_ACTION_PLAN_PATH,
  label: "View startup action plan",
  variant: "outline",
};
const BOOK: FunnelCtaItem = {
  href: STRATEGY_CALL_PATH || BOOK_CALL_HREF,
  label: "Book a strategy call",
  variant: "default",
};
const REQUEST_CALL: FunnelCtaItem = {
  href: STRATEGY_CALL_PATH || BOOK_CALL_HREF,
  label: "Request a call",
  variant: "default",
};
const APPLY: FunnelCtaItem = {
  href: PROJECT_GROWTH_ASSESSMENT_PATH,
  label: "Start application",
  variant: "default",
};

/** Next-step button row for the growth-kit resource page. */
export function growthKitNextStepCtas(accessModel: FunnelAccessModel): FunnelCtaItem[] {
  switch (accessModel) {
    case "book_now":
      return [
        { ...BOOK, variant: "default" },
        { ...SCORE, variant: "outline" },
        { ...PLAN, variant: "outline" },
      ];
    case "request_call":
      return [
        { ...REQUEST_CALL, variant: "default" },
        { ...SCORE, variant: "outline" },
        { ...PLAN, variant: "outline" },
      ];
    case "apply_first":
      return [
        { ...APPLY, variant: "default" },
        { ...SCORE, variant: "outline" },
        { ...REVENUE, variant: "outline" },
      ];
    case "form_only":
      return [
        { ...SCORE, variant: "default" },
        { ...PLAN, variant: "outline" },
        { ...REVENUE, variant: "outline" },
      ];
    default:
      return [SCORE, REVENUE, PLAN];
  }
}

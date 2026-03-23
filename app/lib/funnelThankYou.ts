/**
 * Canonical thank-you URLs for lead magnets and funnels.
 * Use `?form=<id>` so Google Ads / GTM can target stable conversion URLs.
 */

export const THANK_YOU_PATH = "/thank-you";

/** Session keys — set right before `router.push` to thank-you; read once on thank-you then cleared. */
export const THANK_YOU_SESSION = {
  bookingManageHref: "ascendra_ty_booking_manage_href",
  bookingEmailSent: "ascendra_ty_booking_email_sent",
  resumeDownloadUrl: "ascendra_ty_resume_download_url",
} as const;

export function funnelThankYouUrl(formId: string): string {
  return `${THANK_YOU_PATH}?form=${encodeURIComponent(formId)}`;
}

/** Prep checklist (formerly on `/call-confirmation`) — shown when `form=strategy_call_landing`. */
export const STRATEGY_CALL_PREP_CHECKLIST = [
  "Current website (if you have one) — we'll take a quick look",
  "Branding examples you like or current logo/colors",
  "Your main goals (launch, rebrand, more leads, etc.)",
  "Rough timeline or urgency",
] as const;

export type ThankYouFormId =
  | "digital_growth_audit"
  | "strategy_call_contact"
  | "strategy_call_landing"
  | "competitor_snapshot"
  | "growth_plan_apply"
  | "ppc_lead_consultation"
  | "native_booking"
  | "resume_request"
  | "data_deletion"
  | "default";

export function normalizeThankYouFormId(raw: string | null): ThankYouFormId {
  if (!raw) return "default";
  const allowed: ThankYouFormId[] = [
    "digital_growth_audit",
    "strategy_call_contact",
    "strategy_call_landing",
    "competitor_snapshot",
    "growth_plan_apply",
    "ppc_lead_consultation",
    "native_booking",
    "resume_request",
    "data_deletion",
  ];
  return (allowed.includes(raw as ThankYouFormId) ? raw : "default") as ThankYouFormId;
}

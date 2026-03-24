/**
 * Google Ads (gtag) + dataLayer hooks for the Offer Audit / Valuation funnel.
 * Set optional NEXT_PUBLIC_GOOGLE_ADS_SEND_TO_* to full values: AW-123456789/LabelName
 * Or set NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL with NEXT_PUBLIC_GOOGLE_ADS_ID for submit/lead fallback.
 */

export type OfferValuationConversionAction =
  | "offer_audit_started"
  | "offer_audit_submitted"
  | "lead_created"
  | "strategy_call_clicked";

function buildIdLabelSendTo(): string | null {
  const idRaw = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim();
  const label = process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL?.trim();
  if (!idRaw || !label) return null;
  const id = /^AW-/i.test(idRaw) ? idRaw : `AW-${idRaw}`;
  return `${id}/${label}`;
}

function readSendToForAction(action: OfferValuationConversionAction): string | null {
  const e = process.env;
  const map: Record<OfferValuationConversionAction, string | undefined> = {
    offer_audit_started: e.NEXT_PUBLIC_GOOGLE_ADS_SEND_TO_OFFER_AUDIT_STARTED,
    offer_audit_submitted: e.NEXT_PUBLIC_GOOGLE_ADS_SEND_TO_OFFER_AUDIT_SUBMITTED,
    lead_created: e.NEXT_PUBLIC_GOOGLE_ADS_SEND_TO_LEAD_CREATED,
    strategy_call_clicked: e.NEXT_PUBLIC_GOOGLE_ADS_SEND_TO_STRATEGY_CALL,
  };
  const direct = map[action]?.trim();
  if (direct) return direct;

  if (action === "offer_audit_submitted" || action === "lead_created") {
    return buildIdLabelSendTo();
  }
  return null;
}

/**
 * Push a named event for GTM, and fire a Google Ads conversion when send_to is configured.
 * Safe to call from client components only.
 */
export function fireOfferValuationConversion(
  action: OfferValuationConversionAction,
  extra?: Record<string, string | number | boolean | null | undefined>,
): void {
  if (typeof window === "undefined") return;

  const w = window as Window & {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  };

  w.dataLayer = w.dataLayer ?? [];
  w.dataLayer.push({
    event: action,
    ...extra,
  });

  const sendTo = readSendToForAction(action);
  if (sendTo && typeof w.gtag === "function") {
    w.gtag("event", "conversion", { send_to: sendTo });
  }
}

/**
 * Google Ads (gtag) + dataLayer hooks for the Offer Audit / Valuation funnel.
 * Set optional NEXT_PUBLIC_GOOGLE_ADS_SEND_TO_* to full values: AW-123456789/LabelName
 * Or NEXT_PUBLIC_GOOGLE_ADS_CV_* label-only vars with NEXT_PUBLIC_GOOGLE_ADS_ID for any action.
 * Or NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL + NEXT_PUBLIC_GOOGLE_ADS_ID for submit/lead fallback only.
 */

export type OfferValuationConversionAction =
  | "offer_audit_started"
  | "offer_audit_submitted"
  | "lead_created"
  | "strategy_call_clicked";

function normalizeAdsId(idRaw: string): string | null {
  const t = idRaw.trim();
  if (!t) return null;
  return /^AW-/i.test(t) ? t : `AW-${t}`;
}

function sendToFromIdAndLabel(label: string | undefined): string | null {
  const id = normalizeAdsId(process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ?? "");
  const l = label?.trim();
  if (!id || !l) return null;
  return `${id}/${l}`;
}

/** Full send_to from Google Ads (AW-xxx/Label) or label-only env paired with NEXT_PUBLIC_GOOGLE_ADS_ID. */
function buildIdLabelSendTo(): string | null {
  return sendToFromIdAndLabel(process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL);
}

const CV_LABELS: Record<OfferValuationConversionAction, string | undefined> = {
  offer_audit_started: process.env.NEXT_PUBLIC_GOOGLE_ADS_CV_OFFER_AUDIT_STARTED,
  offer_audit_submitted: process.env.NEXT_PUBLIC_GOOGLE_ADS_CV_OFFER_AUDIT_SUBMITTED,
  lead_created: process.env.NEXT_PUBLIC_GOOGLE_ADS_CV_LEAD_CREATED,
  strategy_call_clicked: process.env.NEXT_PUBLIC_GOOGLE_ADS_CV_STRATEGY_CALL,
};

function readSendToForAction(action: OfferValuationConversionAction): string | null {
  const e = process.env;
  const map: Record<OfferValuationConversionAction, string | undefined> = {
    offer_audit_started: e.NEXT_PUBLIC_GOOGLE_ADS_SEND_TO_OFFER_AUDIT_STARTED,
    offer_audit_submitted: e.NEXT_PUBLIC_GOOGLE_ADS_SEND_TO_OFFER_AUDIT_SUBMITTED,
    lead_created: e.NEXT_PUBLIC_GOOGLE_ADS_SEND_TO_LEAD_CREATED,
    strategy_call_clicked:
      e.NEXT_PUBLIC_GOOGLE_ADS_SEND_TO_STRATEGY_CALL ?? e.NEXT_PUBLIC_GOOGLE_ADS_SEND_TO_STRATEGY_CALL_CLICKED,
  };
  const direct = map[action]?.trim();
  if (direct) return direct;

  const fromCv = sendToFromIdAndLabel(CV_LABELS[action]);
  if (fromCv) return fromCv;

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

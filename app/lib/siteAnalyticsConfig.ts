const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "G-5FTCQF2JH4";
export const gaEnabled = GA_MEASUREMENT_ID.length > 0;

const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim() ?? "AW-11419169823";
export const googleAdsEnabled = /^AW-\d+$/i.test(GOOGLE_ADS_ID);

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID?.trim() ?? "";
export const gtmEnabled = /^GTM-[A-Z0-9]+$/i.test(GTM_ID);

export const gtagSnippetEnabled = gaEnabled || googleAdsEnabled;
export const gtagJsQueryId = gaEnabled ? GA_MEASUREMENT_ID : GOOGLE_ADS_ID;

export const GTM_ID_FOR_SCRIPTS = GTM_ID;

export function gtagInitScriptContent(): string {
  let s =
    "window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());";
  if (gaEnabled) {
    s += `gtag('config','${GA_MEASUREMENT_ID}');`;
  }
  if (googleAdsEnabled) {
    s += `gtag('config','${GOOGLE_ADS_ID}');`;
  }
  return s;
}

export function siteUsesAnalytics(): boolean {
  return gtmEnabled || gtagSnippetEnabled;
}

/** For `<noscript>` iframe; avoids duplicating GTM id validation in the root layout. */
export function getGtmNoscriptId(): string | null {
  return gtmEnabled ? GTM_ID : null;
}

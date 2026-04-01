"use client";

import Script from "next/script";
import {
  GTM_ID_FOR_SCRIPTS,
  gtagInitScriptContent,
  gtagJsQueryId,
  gtagSnippetEnabled,
  gtmEnabled,
} from "../lib/siteAnalyticsConfig";

/**
 * GTM bootstrap uses `beforeInteractive` so the container and dataLayer start as early as Next allows (closer to
 * classic `<head>` GTM) — better attribution for very fast bounces. GA4 / direct gtag stay on `afterInteractive`
 * to keep main-thread work lighter around first paint (Web Vitals trade-off). If you rely on GTM alone, you can
 * leave GA env empty to avoid loading gtag twice.
 */
export function SiteAnalyticsScripts() {
  return (
    <>
      {gtmEnabled ? (
        <Script
          id="gtm-bootstrap"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID_FOR_SCRIPTS}');`,
          }}
        />
      ) : null}
      {gtagSnippetEnabled ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gtagJsQueryId)}`}
            strategy="afterInteractive"
          />
          <Script
            id="gtag-inline"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{ __html: gtagInitScriptContent() }}
          />
        </>
      ) : null}
    </>
  );
}

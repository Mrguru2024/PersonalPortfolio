import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import FixedHeaderWrapper from "./components/FixedHeaderWrapper";
import { TrialBanner } from "./components/TrialBanner";
import ScrollProgress from "./components/ScrollProgress";
import SiteFooter from "./components/SiteFooter";
import MobileBottomNav from "./components/MobileBottomNav";
import { MobileNavProvider } from "./contexts/MobileNavContext";
import { getSiteOriginForMetadata } from "./lib/siteUrl";
import { COMPANY_NAME, COMPANY_ADDRESS, COMPANY_PHONE_E164 } from "./lib/company";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "G-5FTCQF2JH4";
const gaEnabled = GA_MEASUREMENT_ID.length > 0;

/** Google Ads / conversion tag (gtag destination). Set empty to disable. */
const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim() ?? "AW-18034342914";
const googleAdsEnabled = /^AW-\d+$/i.test(GOOGLE_ADS_ID);

/** Google Tag Manager container (public id). Must look like GTM-XXXXXXX. */
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID?.trim() ?? "";
const gtmEnabled = /^GTM-[A-Z0-9]+$/i.test(GTM_ID);

/** One shared gtag.js loader + inline init (GA4 and/or Google Ads — never duplicate the snippet). */
const gtagSnippetEnabled = gaEnabled || googleAdsEnabled;
const gtagJsQueryId = gaEnabled ? GA_MEASUREMENT_ID : GOOGLE_ADS_ID;

function gtagInitScriptContent(): string {
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

/** Absolute base URL (with https://) so manifest, OG, metadataBase, and schema resolve correctly. */
const baseUrl = getSiteOriginForMetadata();

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: COMPANY_NAME,
  url: baseUrl,
  telephone: COMPANY_PHONE_E164,
  address: {
    "@type": "PostalAddress",
    streetAddress: COMPANY_ADDRESS.street,
    addressLocality: COMPANY_ADDRESS.city,
    addressRegion: COMPANY_ADDRESS.region,
    postalCode: COMPANY_ADDRESS.postalCode,
    addressCountry: "US",
  },
  logo: `${baseUrl}/ascendra-logo.svg`,
};

const defaultTitle = "Ascendra Technologies | Brand Growth, Strategy & Marketing";
const defaultDescription =
  "Ascendra Technologies helps you build a brand that converts—strategy, websites, and marketing from one coordinated team. Launch, rebrand, or scale with clarity.";

export const metadata: Metadata = {
  metadataBase: new URL(`${baseUrl}/`),
  title: defaultTitle,
  description: defaultDescription,
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: COMPANY_NAME,
    title: defaultTitle,
    description: defaultDescription,
    images: [
      {
        url: "/og-ascendra.png",
        width: 1200,
        height: 630,
        alt: `${COMPANY_NAME} — logo and tagline; brand strategy, web, and marketing`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
    images: ["/og-ascendra.png"],
  },
  // PWA: install as app on mobile; standalone display and offline-capable
  manifest: `${baseUrl}/manifest.json`,
  appleWebApp: {
    capable: true,
    title: "Ascendra",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F5F5" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1142" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="overflow-x-hidden">
      <head>
        {/* Google Tag Manager — high in <head> per Google */}
        {gtmEnabled && (
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`,
            }}
          />
        )}
        {/* Google tag (gtag.js) — GA4 + Google Ads in one loader; disable either via env */}
        {gtagSnippetEnabled && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gtagJsQueryId)}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: gtagInitScriptContent(),
              }}
            />
          </>
        )}
      </head>
      {/* suppressHydrationWarning: only affects this node; extension attrs on descendants are handled via suppressHydrationWarning on ui/Button and Header <button>s (fdprocessedid, etc.). */}
      <body
        className="relative min-h-[100dvh] min-h-screen bg-background font-sans antialiased w-full max-w-full overflow-x-hidden"
        suppressHydrationWarning
      >
        {gtmEnabled && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(GTM_ID)}`}
              height={0}
              width={0}
              style={{ display: "none", visibility: "hidden" }}
              title="Google Tag Manager"
            />
          </noscript>
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        {/* Full-page backdrop: vertical hero wash + corner/edge ambient glow (theme-aware) */}
        <div
          className="page-backdrop-root fixed inset-0 -z-10 pointer-events-none overflow-hidden"
          aria-hidden
        >
          <div className="hero-page-gradient absolute inset-0" />
          <div className="page-edge-ambient absolute inset-0" />
        </div>
        <div className="flex min-h-[100dvh] min-h-screen w-full max-w-full min-w-0 flex-col overflow-x-hidden">
          <Providers>
            <MobileNavProvider>
              {/* Scroll progress bar (hidden when prefers-reduced-motion) */}
              <ScrollProgress />
              {/* Logo + nav: fixed at top; hides when scrolling down, shows when scrolling up or at top */}
              <FixedHeaderWrapper />
              <TrialBanner />
              <main className="relative w-full min-w-0 max-w-full flex-1 overflow-x-hidden pt-[158px] fold:pt-[178px] sm:pt-[200px] md:pt-[220px] lg:pt-[240px] pb-[calc(56px+env(safe-area-inset-bottom,0px)+32px)] lg:pb-[max(1rem,env(safe-area-inset-bottom))]">
                {children}
              </main>
              {/* Fixed bottom nav on mobile/tablet for app-like UX; hidden on lg+ */}
              <MobileBottomNav />
              <SiteFooter />
            </MobileNavProvider>
          </Providers>
        </div>
      </body>
    </html>
  );
}

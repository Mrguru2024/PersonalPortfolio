import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { Providers } from "./providers";
import FixedHeaderWrapper from "./components/FixedHeaderWrapper";
import { TrialBanner } from "./components/TrialBanner";
import ScrollProgress from "./components/ScrollProgress";
import SiteFooter from "./components/SiteFooter";
import MobileBottomNav from "./components/MobileBottomNav";
import { SiteMain } from "./components/SiteMain";
import { MobileNavProvider } from "./contexts/MobileNavContext";
import { FacebookJsSdk } from "./components/FacebookJsSdk";
import { SiteAnalyticsScripts } from "./components/SiteAnalyticsScripts";
import { getGtmNoscriptId, siteUsesAnalytics } from "./lib/siteAnalyticsConfig";
import { getSiteOriginForMetadata } from "./lib/siteUrl";
import { COMPANY_NAME, COMPANY_ADDRESS, COMPANY_PHONE_E164 } from "./lib/company";
import { isAscendraPublicBehaviorTrackingEnabled } from "./lib/behaviorTrackingConfig";
import { AscendraBehaviorRootGate } from "./components/tracking/AscendraBehaviorRootGate";
import { LOCALE_COOKIE, normalizeLocale } from "./lib/i18n/constants";

/** Numeric Meta App ID only — enables FB.init client SDK (Login / xfbml / AppEvents). */
const FACEBOOK_APP_ID_FOR_SDK =
  process.env.NEXT_PUBLIC_FACEBOOK_APP_ID?.trim() || process.env.FACEBOOK_APP_ID?.trim() || "";
const FACEBOOK_GRAPH_API_VERSION =
  process.env.NEXT_PUBLIC_FACEBOOK_GRAPH_VERSION?.trim() || "v21.0";
const facebookSdkEnabled = /^\d+$/.test(FACEBOOK_APP_ID_FOR_SDK);

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

/** Site-level entity for Google (pairs with Organization). */
const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: COMPANY_NAME,
  url: baseUrl,
  description: defaultDescription,
  publisher: {
    "@type": "Organization",
    name: COMPANY_NAME,
    url: baseUrl,
  },
};

export const metadata: Metadata = {
  metadataBase: new URL(`${baseUrl}/`),
  title: defaultTitle,
  description: defaultDescription,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const initialLocale = normalizeLocale(cookieStore.get(LOCALE_COOKIE)?.value);
  const gtmNoscriptId = getGtmNoscriptId();
  return (
    <html lang={initialLocale === "es" ? "es" : "en"} suppressHydrationWarning className="overflow-x-hidden">
      <head>
        {siteUsesAnalytics() ? (
          <>
            <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />
            <link rel="dns-prefetch" href="https://www.google-analytics.com" />
          </>
        ) : null}
        {/** Session replay / heatmaps: `AscendraBehaviorRootGate` + `/api/behavior/ingest` (see `behaviorTrackingConfig`). */}
      </head>
      {/* suppressHydrationWarning: only affects this node; extension attrs on descendants are handled via suppressHydrationWarning on ui/Button and Header <button>s (fdprocessedid, etc.). */}
      <body
        className="relative min-h-[100dvh] min-h-screen bg-background font-sans antialiased w-full max-w-full overflow-x-hidden"
        suppressHydrationWarning
      >
        <SiteAnalyticsScripts />
        {gtmNoscriptId ? (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(gtmNoscriptId)}`}
              height={0}
              width={0}
              style={{ display: "none", visibility: "hidden" }}
              title="Google Tag Manager"
            />
          </noscript>
        ) : null}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        {/* Full-page backdrop: vertical hero wash + corner/edge ambient glow (theme-aware) */}
        <div
          className="page-backdrop-root fixed inset-0 -z-10 pointer-events-none overflow-hidden"
          aria-hidden
        >
          <div className="hero-page-gradient absolute inset-0" />
          <div className="page-edge-ambient absolute inset-0" />
        </div>
        {facebookSdkEnabled && (
          <>
            <div id="fb-root" className="sr-only" aria-hidden />
            <FacebookJsSdk appId={FACEBOOK_APP_ID_FOR_SDK} graphVersion={FACEBOOK_GRAPH_API_VERSION} />
          </>
        )}
        <div className="flex min-h-[100dvh] min-h-screen w-full max-w-full min-w-0 flex-col overflow-x-hidden">
          <Providers initialLocale={initialLocale}>
            <MobileNavProvider>
              <AscendraBehaviorRootGate enabled={isAscendraPublicBehaviorTrackingEnabled()} />
              {/* Scroll progress bar (hidden when prefers-reduced-motion) */}
              <ScrollProgress />
              {/* Logo + nav: fixed at top; hides when scrolling down, shows when scrolling up or at top */}
              <FixedHeaderWrapper />
              <TrialBanner />
              <SiteMain>{children}</SiteMain>
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

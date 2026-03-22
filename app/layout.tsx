import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import FixedHeaderWrapper from "./components/FixedHeaderWrapper";
import { TrialBanner } from "./components/TrialBanner";
import ScrollProgress from "./components/ScrollProgress";
import SiteFooter from "./components/SiteFooter";
import MobileBottomNav from "./components/MobileBottomNav";
import { MobileNavProvider } from "./contexts/MobileNavContext";
import { getSiteBaseUrl, ensureAbsoluteUrl } from "./lib/siteUrl";
import { COMPANY_NAME, COMPANY_ADDRESS, COMPANY_PHONE_E164 } from "./lib/company";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "G-5FTCQF2JH4";
const gaEnabled = GA_MEASUREMENT_ID.length > 0;

/** Google Tag Manager container (public id). Must look like GTM-XXXXXXX. */
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID?.trim() ?? "";
const gtmEnabled = /^GTM-[A-Z0-9]+$/i.test(GTM_ID);

/** Absolute base URL (with https://) so manifest, OG, etc. resolve correctly and don't double-path. */
const baseUrl = ensureAbsoluteUrl(getSiteBaseUrl());

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

export const metadata: Metadata = {
  title: "Brand Growth | Brand Strategy, Web & Marketing — One Team",
  description:
    "Build a brand that converts. Brand strategy, websites, and marketing from one coordinated team. Launch, rebrand, or scale with the Brand Growth ecosystem.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "Ascendra Technologies",
    title: "Brand Growth | Brand Strategy, Web & Marketing — One Team",
    description:
      "Build a brand that converts. Brand strategy, websites, and marketing from one coordinated team. Launch, rebrand, or scale.",
    images: [
      {
        url: `${baseUrl}/ascendra-logo.svg`,
        width: 1200,
        height: 630,
        alt: "Ascendra Technologies — Brand Growth",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Brand Growth | Brand Strategy, Web & Marketing — One Team",
    description:
      "Build a brand that converts. Brand strategy, websites, and marketing from one coordinated team.",
    images: [`${baseUrl}/ascendra-logo.svg`],
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
    { media: "(prefers-color-scheme: light)", color: "#f5f7f6" },
    { media: "(prefers-color-scheme: dark)", color: "#111a1f" },
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
        {/* Google tag (gtag.js) — GA4; avoid duplicate page_view if you also load GA via GTM */}
        {gaEnabled && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', '${GA_MEASUREMENT_ID}');`,
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
              <main className="relative w-full min-w-0 max-w-full flex-1 overflow-x-hidden pt-[158px] fold:pt-[178px] sm:pt-[200px] md:pt-[220px] lg:pt-[240px] pb-[calc(56px+env(safe-area-inset-bottom,0px)+12px)] lg:pb-[env(safe-area-inset-bottom)]">
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

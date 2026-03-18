import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import FixedHeaderWrapper from "./components/FixedHeaderWrapper";
import ScrollProgress from "./components/ScrollProgress";
import SiteFooter from "./components/SiteFooter";
import MobileBottomNav from "./components/MobileBottomNav";
import { MobileNavProvider } from "./contexts/MobileNavContext";
import { getSiteBaseUrl, ensureAbsoluteUrl } from "./lib/siteUrl";
import { COMPANY_NAME, COMPANY_ADDRESS, COMPANY_PHONE_E164 } from "./lib/company";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "G-5FTCQF2JH4";
const gaEnabled = GA_MEASUREMENT_ID.length > 0;

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
        {/* Google tag (gtag.js) — immediately after <head> per Google's instructions so detection and GA work */}
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
      <body className="relative min-h-[100dvh] min-h-screen bg-background font-sans antialiased w-full max-w-full overflow-x-hidden">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        {/* Very soft full-page gradient – blends hero/particles with page, no harsh line at top */}
        <div className="fixed inset-0 -z-10 hero-page-gradient pointer-events-none" aria-hidden />
        <div className="flex min-h-[100dvh] min-h-screen w-full max-w-full min-w-0 flex-col overflow-x-hidden">
          <Providers>
            <MobileNavProvider>
              {/* Scroll progress bar (hidden when prefers-reduced-motion) */}
              <ScrollProgress />
              {/* Logo + nav: fixed at top; hides when scrolling down, shows when scrolling up or at top */}
              <FixedHeaderWrapper />
              <main className="relative w-full min-w-0 max-w-full flex-1 overflow-x-hidden pt-[150px] fold:pt-[170px] sm:pt-[200px] md:pt-[220px] lg:pt-[240px] pb-[calc(56px+env(safe-area-inset-bottom,0px))] lg:pb-[env(safe-area-inset-bottom)]">
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

import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import FixedHeaderWrapper from "./components/FixedHeaderWrapper";
import ScrollProgress from "./components/ScrollProgress";
import SiteFooter from "./components/SiteFooter";

const baseUrl = "https://mrguru.dev";

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
        alt: "Ascendra Technologies",
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
      <body className="relative min-h-[100dvh] min-h-screen bg-background font-sans antialiased w-full max-w-full overflow-x-hidden">
        {/* Very soft full-page gradient – blends hero/particles with page, no harsh line at top */}
        <div className="fixed inset-0 -z-10 hero-page-gradient pointer-events-none" aria-hidden />
        <div className="flex min-h-[100dvh] min-h-screen w-full max-w-full min-w-0 flex-col overflow-x-hidden">
          <Providers>
            {/* Scroll progress bar (hidden when prefers-reduced-motion) */}
            <ScrollProgress />
            {/* Logo + nav: fixed at top; hides when scrolling down, shows when scrolling up or at top */}
            <FixedHeaderWrapper />
            <main className="relative w-full min-w-0 max-w-full flex-1 overflow-x-hidden pt-[150px] fold:pt-[170px] sm:pt-[200px] md:pt-[220px] lg:pt-[240px] pb-[env(safe-area-inset-bottom)]">
              {children}
            </main>
            <SiteFooter />
          </Providers>
        </div>
      </body>
    </html>
  );
}

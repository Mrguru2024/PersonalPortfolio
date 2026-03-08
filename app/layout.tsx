import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import FixedHeaderWrapper from "./components/FixedHeaderWrapper";
import ScrollProgress from "./components/ScrollProgress";

const baseUrl = "https://mrguru.dev";

export const metadata: Metadata = {
  title: "Ascendra Technologies",
  description:
    "Ascendra Technologies – Senior Full Stack Developer Anthony MrGuru Feaster. Custom web solutions and professional delivery.",
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
    title: "Ascendra Technologies – Anthony MrGuru Feaster | Senior Full Stack Developer",
    description:
      "Senior Full Stack Developer at Ascendra Technologies. Explore projects, skills, and start your next web project with a proven professional.",
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
    title: "Ascendra Technologies – Anthony MrGuru Feaster | Senior Full Stack Developer",
    description:
      "Senior Full Stack Developer at Ascendra Technologies. Start your next web project with a proven professional.",
    images: [`${baseUrl}/ascendra-logo.svg`],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="overflow-x-hidden">
      <body className="relative min-h-[100dvh] min-h-screen bg-background font-sans antialiased w-full max-w-full overflow-x-hidden">
        {/* Subtle full-page gradient so hero effects blend smoothly; no hard edge */}
        <div className="fixed inset-0 -z-10 bg-gradient-to-b from-primary/[0.04] to-background dark:from-primary/[0.07] dark:to-background pointer-events-none" aria-hidden />
        <div className="flex min-h-[100dvh] min-h-screen w-full max-w-full min-w-0 flex-col overflow-x-hidden">
          <Providers>
            {/* Scroll progress bar (hidden when prefers-reduced-motion) */}
            <ScrollProgress />
            {/* Logo + nav: fixed at top; hides when scrolling down, shows when scrolling up or at top */}
            <FixedHeaderWrapper />
            <main className="relative w-full min-w-0 max-w-full flex-1 overflow-x-hidden pt-[180px] sm:pt-[200px] md:pt-[220px] lg:pt-[240px]">
              {children}
            </main>
          </Providers>
        </div>
      </body>
    </html>
  );
}

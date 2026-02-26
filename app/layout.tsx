import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import FixedHeaderWrapper from "./components/FixedHeaderWrapper";

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
    title: "Ascendra Technologies",
    description:
      "Ascendra Technologies – Custom web solutions and full stack development.",
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
    title: "Ascendra Technologies",
    description:
      "Ascendra Technologies – Custom web solutions and full stack development.",
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
    <html lang="en" suppressHydrationWarning>
      <body className="relative min-h-[100dvh] min-h-screen bg-background font-sans antialiased w-full max-w-[100vw]">
        <Providers>
          {/* Logo + nav: fixed at top; hides when scrolling down, shows when scrolling up or at top */}
          <FixedHeaderWrapper />
          <main className="relative min-w-0 overflow-x-hidden pt-[180px] sm:pt-[200px] md:pt-[220px] lg:pt-[240px]">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}

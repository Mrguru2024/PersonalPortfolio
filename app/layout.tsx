import type { Metadata } from "next";
import { ClientLayout } from "@/components/ClientLayout";
import "./globals.css";

export const metadata: Metadata = {
  title: "MrGuru.dev | Anthony Feaster | Full Stack Developer",
  description:
    "Anthony Feaster is a Full Stack Developer specializing in modern web technologies, custom applications, and innovative solutions.",
  openGraph: {
    type: "website",
    url: "https://mrguru.dev/",
    title: "MrGuru.dev | Anthony Feaster | Full Stack Developer",
    description:
      "Explore my portfolio of projects, skills, and expertise in web development.",
    images: [
      {
        url: "https://mrguru.dev/images/mrguru-og-image.jpg",
        width: 1200,
        height: 630,
        alt: "MrGuru.dev",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MrGuru.dev | Anthony Feaster | Full Stack Developer",
    description:
      "Explore my portfolio of projects, skills, and expertise in web development.",
    images: ["https://mrguru.dev/images/mrguru-og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta 
          name="viewport" 
          content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover, interactive-widget=resizes-content" 
        />
        <meta name="theme-color" content="#6366f1" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        {/* Support for foldable devices */}
        <meta name="screen-orientation" content="portrait" />
        <meta name="x5-orientation" content="portrait" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/logo192.png" />
        <meta name="author" content="Anthony Feaster" />
        <meta name="robots" content="index, follow" />
        {/* Performance hints */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      </head>
      <body suppressHydrationWarning>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}

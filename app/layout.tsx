import type { Metadata } from "next";
import { ClientLayout } from "@/components/ClientLayout";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://mrguru.dev"),
  title: "MrGuru.dev | Anthony Feaster | Full Stack Developer",
  description:
    "Anthony Feaster is a Full Stack Developer specializing in modern web technologies, custom applications, and innovative solutions.",
  keywords: [
    "Full Stack Developer",
    "Web Development",
    "React",
    "Next.js",
    "TypeScript",
  ],
  authors: [{ name: "Anthony Feaster" }],
  creator: "Anthony Feaster",
  publisher: "Anthony Feaster",
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/logo192.png",
  },
  manifest: "/manifest.json",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    viewportFit: "cover",
    interactiveWidget: "resizes-content",
  },
  themeColor: "#6366f1",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MrGuru.dev",
  },
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
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "screen-orientation": "any",
    "x5-orientation": "any",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}

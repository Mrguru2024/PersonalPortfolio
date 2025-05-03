import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { cn } from "@/components/ui/utils";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/toaster";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

// Define a custom font for headings
const fontHeading = localFont({
  src: "../public/fonts/Audiowide-Regular.ttf",
  variable: "--font-heading",
});

export const metadata: Metadata = {
  title: "MrGuru.dev | Anthony Feaster - Full Stack Developer",
  description: "Anthony 'MrGuru' Feaster - Portfolio showcasing full stack development expertise in React, Node.js, and modern web technologies.",
  keywords: "Web Developer, Full Stack, React, Node.js, JavaScript, TypeScript, Portfolio, Anthony Feaster, MrGuru, Atlanta",
  authors: [{ name: "Anthony Feaster", url: "https://mrguru.dev" }],
  creator: "Anthony Feaster",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://mrguru.dev",
    title: "MrGuru.dev | Anthony Feaster - Full Stack Developer",
    description: "Anthony 'MrGuru' Feaster - Portfolio showcasing full stack development expertise in React, Node.js, and modern web technologies.",
    siteName: "MrGuru.dev",
  },
  twitter: {
    card: "summary_large_image",
    title: "MrGuru.dev | Anthony Feaster - Full Stack Developer",
    description: "Anthony 'MrGuru' Feaster - Portfolio showcasing full stack development expertise in React, Node.js, and modern web technologies.",
    creator: "@MrGuru2024",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body 
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable,
          fontHeading.variable
        )}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
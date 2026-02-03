import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import Header from "./components/Header";

export const metadata: Metadata = {
  title: "Portfolio",
  description: "Personal Portfolio",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
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
      <body className="min-h-[100dvh] min-h-screen bg-background font-sans antialiased w-full max-w-[100vw]">
        <Providers>
          <Header />
          <main className="min-w-0 overflow-x-hidden">{children}</main>
        </Providers>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Anthony "MrGuru" Feaster | Full Stack Developer',
  description: 'Professional portfolio of Anthony Feaster, a full stack developer specializing in React, Node.js, and modern web technologies.',
  keywords: 'developer portfolio, web developer, full stack developer, react developer, javascript developer, node.js developer, Anthony Feaster, MrGuru, Atlanta',
  authors: [{ name: 'Anthony Feaster' }],
  creator: 'Anthony "MrGuru" Feaster',
  openGraph: {
    title: 'Anthony "MrGuru" Feaster | Full Stack Developer',
    description: 'Professional portfolio of Anthony Feaster, a full stack developer specializing in React, Node.js, and modern web technologies.',
    url: 'https://mrguru.dev',
    siteName: 'MrGuru.dev',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Anthony "MrGuru" Feaster - Full Stack Developer',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Anthony "MrGuru" Feaster | Full Stack Developer',
    description: 'Professional portfolio of Anthony Feaster, a full stack developer specializing in React, Node.js, and modern web technologies.',
    creator: '@mrguru2024',
    images: ['/twitter-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  alternates: {
    canonical: 'https://mrguru.dev',
  },
  verification: {
    google: process.env.GOOGLE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
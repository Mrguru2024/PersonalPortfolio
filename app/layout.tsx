import type { Metadata } from 'next';
import { Inter as FontSans } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Providers } from './providers';

// Font configuration
const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
});

// Metadata for SEO
export const metadata: Metadata = {
  title: 'MrGuru Dev | Full-Stack Developer & JavaScript Expert',
  description:
    'Anthony "MrGuru" Feaster is a full-stack developer, specializing in JavaScript, React, Next.js, and innovative web solutions in Atlanta, GA.',
  keywords:
    'MrGuru, Anthony Feaster, Web Developer, JavaScript, React, Next.js, Node.js, Full Stack, Atlanta',
  authors: [{ name: 'Anthony Feaster', url: 'https://mrguru.dev' }],
  creator: 'Anthony Feaster',
  publisher: 'MrGuru Dev',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://mrguru.dev',
    title: 'MrGuru Dev | Full-Stack Developer & JavaScript Expert',
    description:
      'Anthony "MrGuru" Feaster is a full-stack developer, specializing in JavaScript, React, Next.js, and innovative web solutions in Atlanta, GA.',
    siteName: 'MrGuru Dev',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MrGuru Dev | Full-Stack Developer & JavaScript Expert',
    description:
      'Anthony "MrGuru" Feaster is a full-stack developer, specializing in JavaScript, React, Next.js, and innovative web solutions in Atlanta, GA.',
    creator: '@MrGuruDev',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          fontSans.variable
        )}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
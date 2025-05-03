import './globals.css';

import type { Metadata } from 'next';
import { Inter, Montserrat } from 'next/font/google';
import { Providers } from './providers';

// Font configuration
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-montserrat',
});

export const metadata: Metadata = {
  title: 'Anthony "MrGuru" Feaster | Full Stack Developer',
  description: 'Full-stack developer specializing in modern web technologies, creating immersive digital experiences with a focus on performance and user experience.',
  keywords: 'web developer, full stack developer, react, next.js, javascript, typescript, atlanta',
  authors: [{ name: 'Anthony Feaster', url: 'https://mrguru.dev' }],
  creator: 'Anthony "MrGuru" Feaster',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://mrguru.dev',
    title: 'Anthony "MrGuru" Feaster | Full Stack Developer',
    description: 'Full-stack developer specializing in modern web technologies, creating immersive digital experiences with a focus on performance and user experience.',
    siteName: 'MrGuru.dev'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Anthony "MrGuru" Feaster | Full Stack Developer',
    description: 'Full-stack developer specializing in modern web technologies, creating immersive digital experiences with a focus on performance and user experience.',
    creator: '@MrGuru2024'
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${montserrat.variable}`} suppressHydrationWarning>
      <body className="min-h-screen antialiased font-sans">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
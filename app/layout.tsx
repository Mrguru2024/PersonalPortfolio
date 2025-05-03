import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../client/src/index.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MrGuru.dev - Full Stack Developer',
  description: 'Anthony "MrGuru" Feaster\'s portfolio showcasing projects, skills and services as a full stack developer in Atlanta, GA',
  keywords: 'developer, portfolio, full-stack, react, next.js, anthony feaster, mrguru, web developer, atlanta',
  authors: [{ name: 'Anthony "MrGuru" Feaster', url: 'https://mrguru.dev' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://mrguru.dev',
    title: 'MrGuru.dev - Full Stack Developer',
    description: 'Anthony "MrGuru" Feaster\'s portfolio showcasing projects, skills and services as a full stack developer in Atlanta, GA',
    siteName: 'MrGuru.dev',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MrGuru.dev - Full Stack Developer',
    description: 'Anthony "MrGuru" Feaster\'s portfolio showcasing projects, skills and services as a full stack developer in Atlanta, GA',
    creator: '@therealmrguru',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
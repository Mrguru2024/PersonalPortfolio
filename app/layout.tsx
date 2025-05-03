import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/providers';

// Load Inter font
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'MrGuru.dev | Anthony Feaster - Full Stack Developer',
  description: 'Anthony "MrGuru" Feaster is a Full Stack Developer based in Atlanta, GA, specializing in creating immersive, interactive web experiences.',
  keywords: ['Anthony Feaster', 'MrGuru', 'Full Stack Developer', 'React', 'Next.js', 'JavaScript', 'TypeScript', 'Atlanta'],
  authors: [{ name: 'Anthony Feaster', url: 'https://mrguru.dev' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://mrguru.dev',
    title: 'MrGuru.dev | Anthony Feaster - Full Stack Developer',
    description: 'Anthony "MrGuru" Feaster is a Full Stack Developer based in Atlanta, GA, specializing in creating immersive, interactive web experiences.',
    siteName: 'MrGuru.dev',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MrGuru.dev | Anthony Feaster - Full Stack Developer',
    description: 'Anthony "MrGuru" Feaster is a Full Stack Developer based in Atlanta, GA, specializing in creating immersive, interactive web experiences.',
    creator: '@mrguru2024',
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
import React from 'react';
import { Metadata } from 'next';
import { Providers } from './providers';
import { personalInfo } from '@/lib/data';
import '../client/src/index.css';

export const metadata: Metadata = {
  title: {
    default: `${personalInfo.name} | ${personalInfo.title}`,
    template: `%s | ${personalInfo.name}`
  },
  description: personalInfo.description,
  keywords: ['developer', 'portfolio', 'web developer', 'full stack', 'javascript', 'react', 'next.js'],
  authors: [{ name: personalInfo.name }],
  creator: personalInfo.name,
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
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
import '../client/src/index.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import CustomCursor from '@/components/CustomCursor';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FloatingNavigation from '@/components/FloatingNavigation';
import GuidedTour from '@/components/GuidedTour'; 
import JourneyExperience from '@/components/JourneyExperience';
import React from 'react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MrGuru.dev - Full Stack Developer Portfolio',
  description: 'Anthony "MrGuru" Feaster is a Full Stack Developer specializing in web and mobile application development with expertise in React, Node.js, and modern web technologies.',
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
          <div className="flex flex-col min-h-screen cursor-none md:cursor-none">
            <Header />
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
            <FloatingNavigation />
            <GuidedTour />
            <JourneyExperience activeSection={undefined} />
          </div>
        </Providers>
      </body>
    </html>
  );
}
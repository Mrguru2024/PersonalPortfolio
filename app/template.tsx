'use client';

import React from 'react';
import { Providers } from './providers';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CustomCursor from '@/components/CustomCursor';
import FloatingNavigation from '@/components/FloatingNavigation';

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <CustomCursor />
      <FloatingNavigation />
      <Header />
      <main className="min-h-screen">
        {children}
      </main>
      <Footer />
    </Providers>
  );
}
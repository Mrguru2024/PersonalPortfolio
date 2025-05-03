'use client';

import React from 'react';
import Home from '@/pages/Home';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FloatingNavigation from '@/components/FloatingNavigation';
import CustomCursor from '@/components/CustomCursor';

export default function HomePage() {
  const [currentSection, setCurrentSection] = React.useState<string>('home');

  const handleSectionChange = (sectionId: string) => {
    setCurrentSection(sectionId);
  };

  return (
    <>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <Home onSectionChange={handleSectionChange} />
        </main>
        <Footer />
      </div>
      <FloatingNavigation />
      <CustomCursor currentSection={currentSection} />
    </>
  );
}
'use client';

import React from 'react';
import ResumePage from '@/pages/ResumePage';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function Resume() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <ResumePage />
      </main>
      <Footer />
    </div>
  );
}
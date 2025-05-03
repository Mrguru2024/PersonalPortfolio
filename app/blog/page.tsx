'use client';

import React from 'react';
import Blog from '@/pages/Blog';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function BlogPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Blog />
      </main>
      <Footer />
    </div>
  );
}
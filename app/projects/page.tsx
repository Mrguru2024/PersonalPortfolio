'use client';

import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useSearchParams } from 'next/navigation';
import ProjectsSection from '@/sections/ProjectsSection';

export default function ProjectsPage() {
  const searchParams = useSearchParams();
  const technology = searchParams.get('tech');
  
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">
          {technology ? `Projects using ${technology}` : 'All Projects'}
        </h1>
        <ProjectsSection filterTech={technology || undefined} />
      </main>
      <Footer />
    </div>
  );
}
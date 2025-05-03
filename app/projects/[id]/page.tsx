'use client';

import React from 'react';
import ProjectDetails from '@/pages/ProjectDetails';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ProjectDetailsPage({ params }: { params: { id: string } }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <ProjectDetails id={params.id} />
      </main>
      <Footer />
    </div>
  );
}
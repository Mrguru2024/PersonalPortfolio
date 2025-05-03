'use client';

import React from 'react';
import BlogPost from '@/pages/BlogPost';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <BlogPost slug={params.slug} />
      </main>
      <Footer />
    </div>
  );
}
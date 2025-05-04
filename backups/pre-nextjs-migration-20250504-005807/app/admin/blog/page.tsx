'use client';

import React from 'react';
import AdminBlog from '@/pages/AdminBlog';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useNextAuth } from '@/hooks/use-next-auth';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AdminBlogPage() {
  const { user, isLoading, isAuthenticated } = useNextAuth();
  const router = useRouter();

  // Protected route - redirect if not an admin
  React.useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user?.isAdmin)) {
      router.push('/auth');
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user?.isAdmin) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <AdminBlog />
      </main>
      <Footer />
    </div>
  );
}
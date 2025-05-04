'use client';

import { useNextAuth } from '@/hooks/use-next-auth';
import { Loader2 } from 'lucide-react';
import { redirect } from 'next/navigation';
import React from 'react';

export function ProtectedContent({
  children,
  adminOnly = false,
}: {
  children: React.ReactNode;
  adminOnly?: boolean;
}) {
  const { isLoading, isAuthenticated, user } = useNextAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!isAuthenticated) {
    redirect('/auth');
    return null;
  }

  if (adminOnly && !(user as any)?.isAdmin) {
    redirect('/');
    return null;
  }

  return <>{children}</>;
}
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProjectsPage() {
  const router = useRouter();
  
  // Redirect to home page with projects section
  useEffect(() => {
    router.push('/#projects');
  }, [router]);
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-pulse">Redirecting to projects...</div>
    </div>
  );
}
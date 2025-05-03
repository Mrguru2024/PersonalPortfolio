'use client';

import dynamic from 'next/dynamic';

// Use dynamic import with ssr: false to ensure component only renders client-side
// This prevents hydration mismatches with components that use browser APIs
const HomePage = dynamic(() => import('./pages/Home'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-500 border-r-transparent mb-4"></div>
        <p className="text-lg">Loading Anthony's Portfolio...</p>
      </div>
    </div>
  )
});

export default function Home() {
  return <HomePage />;
}
'use client';

import dynamic from 'next/dynamic';

// Use dynamic import with ssr: false to ensure component only renders client-side
const HomePage = dynamic(() => import('@/pages/Home'), { ssr: false });

export default function Home() {
  return <HomePage />;
}
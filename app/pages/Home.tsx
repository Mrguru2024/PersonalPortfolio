'use client';

import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <header className="container mx-auto py-10 px-4">
        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
          Anthony "MrGuru" Feaster
        </h1>
        <h2 className="text-xl md:text-2xl mt-4 text-gray-300">
          Full Stack Developer
        </h2>
      </header>

      <main className="container mx-auto py-10 px-4">
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 border-b border-gray-700 pb-2">
            Projects
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Placeholder for projects that will be loaded from API */}
            <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="h-48 bg-gray-700 animate-pulse"></div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">Loading Projects...</h3>
                <p className="text-gray-400">
                  Project details will appear here soon.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 border-b border-gray-700 pb-2">
            Skills
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Placeholder for skills that will be loaded from API */}
            <div className="bg-gray-800 p-4 rounded-lg animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-2 bg-gray-700 rounded"></div>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
              <div className="h-2 bg-gray-700 rounded"></div>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-2/3 mb-2"></div>
              <div className="h-2 bg-gray-700 rounded"></div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold mb-6 border-b border-gray-700 pb-2">
            Contact
          </h2>
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <p className="mb-4">
              Interested in working together? Let's connect!
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://www.linkedin.com/in/anthony-mrguru-feaster/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                LinkedIn
              </a>
              <a 
                href="https://github.com/Mrguru2024"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                GitHub
              </a>
              <a 
                href="https://www.threads.com/@therealmrguru"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
              >
                Threads
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 py-6 mt-10">
        <div className="container mx-auto text-center text-gray-400 px-4">
          <p>© {new Date().getFullYear()} Anthony "MrGuru" Feaster. All rights reserved.</p>
          <p className="mt-2">
            <Link href="/auth" className="text-blue-400 hover:text-blue-300">
              Login
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import FloatingNavigation from '../components/FloatingNavigation';
import JourneyExperience from '../components/JourneyExperience';
import ParticleAnimation from '../components/ParticleAnimation';
import CustomCursor from '../components/CustomCursor';

export default function Home() {
  const [activeSection, setActiveSection] = useState('home');
  const [scrollY, setScrollY] = useState(0);

  // Update active section based on scroll position
  const handleScroll = useCallback(() => {
    const position = window.scrollY;
    setScrollY(position);
    
    // Calculate which section is currently visible
    const sections = document.querySelectorAll('section[id]');
    sections.forEach(section => {
      const sectionTop = (section as HTMLElement).offsetTop - 100;
      const sectionHeight = (section as HTMLElement).offsetHeight;
      if (position >= sectionTop && position < sectionTop + sectionHeight) {
        setActiveSection(section.id);
      }
    });
  }, []);
  
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    // Initial call to set the active section on mount
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white relative">
      {/* Custom Cursor */}
      <CustomCursor currentSection={activeSection} />
      
      {/* Particle Background */}
      <ParticleAnimation 
        count={60}
        colorArray={['#8b5cf6', '#6366f1', '#3b82f6']}
        linkParticles={true}
        linkDistance={150}
      />
      
      {/* Immersive Navigation Components */}
      <FloatingNavigation />
      <JourneyExperience activeSection={activeSection} />
      
      <header className="container mx-auto py-20 px-4" id="home">
        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
          Anthony "MrGuru" Feaster
        </h1>
        <h2 className="text-xl md:text-2xl mt-4 text-gray-300">
          Full Stack Developer
        </h2>
        <p className="mt-8 max-w-xl text-gray-300">
          Building immersive, cutting-edge web experiences that convert leads into customers.
          Specializing in React, Next.js, and full-stack JavaScript development.
        </p>
        
        <div className="mt-10 flex flex-wrap gap-4">
          <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-500 rounded-lg text-white font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all" data-cursor-text="Explore">
            Explore My Work
          </button>
          <button className="px-6 py-3 bg-transparent border border-purple-500 rounded-lg text-white font-medium hover:bg-purple-500/10 transition-all" data-cursor-text="Contact">
            Get In Touch
          </button>
        </div>
      </header>

      <main className="container mx-auto py-10 px-4">
        <section className="mb-24 pt-10" id="projects-section">
          <h2 className="text-3xl font-bold mb-6 border-b border-gray-700 pb-2">
            Projects
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Placeholder for projects that will be loaded from API */}
            <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 hover:-translate-y-1 transition-transform" data-cursor-text="View">
              <div className="h-48 bg-gray-700 animate-pulse"></div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">Stackzen</h3>
                <p className="text-gray-400">
                  Project details will appear here soon.
                </p>
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 hover:-translate-y-1 transition-transform" data-cursor-text="View">
              <div className="h-48 bg-gray-700 animate-pulse"></div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">Keycode Help</h3>
                <p className="text-gray-400">
                  Project details will appear here soon.
                </p>
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 hover:-translate-y-1 transition-transform" data-cursor-text="View">
              <div className="h-48 bg-gray-700 animate-pulse"></div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">Gatherly</h3>
                <p className="text-gray-400">
                  Project details will appear here soon.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-24 pt-10" id="skills-section">
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
        
        <section className="mb-24 pt-10" id="blog-section">
          <h2 className="text-3xl font-bold mb-6 border-b border-gray-700 pb-2">
            Blog
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 hover:-translate-y-1 transition-transform" data-cursor-text="Read">
              <div className="h-40 bg-gray-700 animate-pulse"></div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">Latest Posts</h3>
                <p className="text-gray-400">
                  Blog posts will be loaded here...
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-24 pt-10" id="achievements-section">
          <h2 className="text-3xl font-bold mb-6 border-b border-gray-700 pb-2">
            Achievements
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-4">Professional Achievements</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span className="text-gray-300">Achievement placeholder...</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span className="text-gray-300">Achievement placeholder...</span>
                </li>
              </ul>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-4">Certifications</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span className="text-gray-300">Certification placeholder...</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span className="text-gray-300">Certification placeholder...</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="pt-10" id="contact-section">
          <h2 className="text-3xl font-bold mb-6 border-b border-gray-700 pb-2">
            Contact
          </h2>
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <p className="mb-4">
              Interested in working together? Let's connect!
            </p>
            <div className="flex flex-wrap gap-4">
              <a 
                href="https://www.linkedin.com/in/anthony-mrguru-feaster/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                data-cursor-text="LinkedIn"
              >
                LinkedIn
              </a>
              <a 
                href="https://github.com/Mrguru2024"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                data-cursor-text="GitHub"
              >
                GitHub
              </a>
              <a 
                href="https://www.threads.com/@therealmrguru"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                data-cursor-text="Threads"
              >
                Threads
              </a>
            </div>
            
            <div className="mt-8">
              <h3 className="text-xl font-medium mb-4">Send me a message</h3>
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                    <input type="text" className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                    <input type="email" className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Message</label>
                  <textarea rows={4} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"></textarea>
                </div>
                <button type="button" className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-500 rounded-lg text-white font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all" data-cursor-text="Send">
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 py-6 mt-10">
        <div className="container mx-auto text-center text-gray-400 px-4">
          <p>© {new Date().getFullYear()} Anthony "MrGuru" Feaster. All rights reserved.</p>
          <p className="mt-2">
            <Link href="/auth" className="text-blue-400 hover:text-blue-300" data-cursor-text="Login">
              Login
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
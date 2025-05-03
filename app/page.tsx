'use client';

import React from 'react';
import Hero from '@/sections/Hero';
import Projects from '@/sections/Projects';
import Skills from '@/sections/Skills';
import Blog from '@/sections/Blog';
import Contact from '@/sections/Contact';

export default function Home() {
  return (
    <>
      <Hero />
      <Projects />
      <Skills />
      <Blog />
      <Contact />
    </>
  );
}
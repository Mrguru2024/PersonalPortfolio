'use client';

import React from 'react';
import Hero from '../client/src/sections/Hero';
import Projects from '../client/src/sections/Projects';
import Skills from '../client/src/sections/Skills';
import Blog from '../client/src/sections/Blog';
import Contact from '../client/src/sections/Contact';

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
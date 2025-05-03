'use client';

import { motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface HeroSectionProps {
  scrollToNextSection: () => void;
}

export default function HeroSection({ scrollToNextSection }: HeroSectionProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };
  
  return (
    <section className="min-h-screen flex flex-col justify-center relative px-4 md:px-8 lg:px-16">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(87,70,175,0.15),transparent_60%)]" />
      
      <motion.div
        className="max-w-4xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="mb-2">
          <p className="text-lg md:text-xl font-medium text-primary">
            Hello, I'm Anthony "MrGuru" Feaster
          </p>
        </motion.div>
        
        <motion.div variants={itemVariants} className="mb-6">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold">
            Full Stack Developer <br />
            <span className="text-gradient">Building for the web.</span>
          </h1>
        </motion.div>
        
        <motion.div variants={itemVariants} className="mb-8">
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
            I create thoughtful digital experiences that combine beautiful interfaces with solid performance. 
            Based in Atlanta, GA, specialized in React and modern JavaScript.
          </p>
        </motion.div>
        
        <motion.div 
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Link href="/projects">
            <Button className="button-gradient text-white px-8 py-6 text-lg">
              View my work
            </Button>
          </Link>
          <Link href="/resume">
            <Button variant="outline" className="px-8 py-6 text-lg">
              View my resume
            </Button>
          </Link>
        </motion.div>
      </motion.div>
      
      <motion.div 
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          transition: { 
            delay: 1.5,
            duration: 0.5
          }
        }}
      >
        <button
          onClick={scrollToNextSection}
          className="flex flex-col items-center text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Scroll to about section"
        >
          <span className="text-sm mb-2">Scroll down</span>
          <ArrowDown className="animate-bounce" />
        </button>
      </motion.div>
    </section>
  );
}
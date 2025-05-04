'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { SiGithub, SiLinkedin, SiThreads } from 'react-icons/si';
import HeroVideo from '@/components/HeroVideo';
import AnimatedButton from '@/components/AnimatedButton';

export default function Hero() {
  const handleConsultClick = () => {
    // Scroll to contact section
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15,
      },
    },
  };

  return (
    <section id="home" className="relative min-h-screen overflow-hidden bg-gradient-to-b from-background to-background/90">
      {/* Background video with overlay */}
      <HeroVideo 
        videoSrc="/assets/hero-background.mp4" 
        className="absolute inset-0 w-full h-full object-cover opacity-20"
        overlayClassName="absolute inset-0 bg-gradient-to-b from-transparent to-background"
      />
      
      {/* Content container */}
      <div className="container mx-auto px-4 pt-24 pb-16 lg:pt-32 relative z-10 flex flex-col h-full justify-center">
        <motion.div 
          className="max-w-3xl"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Subtitle */}
          <motion.div 
            className="inline-block mb-4 px-4 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm tracking-wider"
            variants={itemVariants}
          >
            FULL STACK DEVELOPER
          </motion.div>
          
          {/* Main heading */}
          <motion.h1 
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent"
            variants={itemVariants}
          >
            Hello, I&apos;m Anthony <br />
            <span className="text-primary">MrGuru</span> Feaster
          </motion.h1>
          
          {/* Description */}
          <motion.p 
            className="text-xl text-muted-foreground mb-8 max-w-xl"
            variants={itemVariants}
          >
            I build beautiful, responsive, and user-friendly web applications that help businesses grow their online presence and convert visitors into customers.
          </motion.p>
          
          {/* CTA Buttons */}
          <motion.div 
            className="flex flex-wrap gap-4 mb-12"
            variants={itemVariants}
          >
            <AnimatedButton
              onClick={handleConsultClick}
              variant="gradient"
              size="lg"
              withGlowEffect
              withHoverEffect
            >
              Free Consultation
            </AnimatedButton>
            
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => window.open('/anthony-feaster-resume.pdf', '_blank')}
              className="border-primary/30 hover:border-primary/60 transition-all duration-300"
            >
              View Resume
            </Button>
          </motion.div>
          
          {/* Social links */}
          <motion.div 
            className="flex gap-6"
            variants={itemVariants}
          >
            <a 
              href="https://github.com/Mrguru2024" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors duration-300"
            >
              <SiGithub className="w-6 h-6" />
            </a>
            <a 
              href="https://www.linkedin.com/in/anthony-mrguru-feaster/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors duration-300"
            >
              <SiLinkedin className="w-6 h-6" />
            </a>
            <a 
              href="https://www.threads.com/@therealmrguru" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors duration-300"
            >
              <SiThreads className="w-6 h-6" />
            </a>
          </motion.div>
        </motion.div>
        
        {/* Scroll indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ 
            opacity: 1, 
            y: 0,
            transition: { 
              delay: 1.2,
              duration: 0.5 
            } 
          }}
        >
          <div className="text-sm text-muted-foreground mb-2">Scroll Down</div>
          <div className="w-0.5 h-16 bg-gradient-to-b from-primary/50 to-transparent relative">
            <motion.div 
              className="absolute top-0 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-primary rounded-full"
              animate={{ 
                y: [0, 40, 0],
                opacity: [1, 0.2, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
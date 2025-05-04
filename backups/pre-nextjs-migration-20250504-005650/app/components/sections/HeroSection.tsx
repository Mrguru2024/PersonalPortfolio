"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import Image from "next/image";

export default function HeroSection() {
  const [scrollIndicator, setScrollIndicator] = useState(true);
  
  // Hide scroll indicator when user scrolls down
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setScrollIndicator(false);
      } else {
        setScrollIndicator(true);
      }
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <section 
      id="home" 
      className="min-h-screen flex flex-col justify-center relative overflow-hidden py-20"
    >
      <div className="container-custom z-10">
        <motion.div
          className="max-w-3xl mx-auto text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Animated profile image */}
          <motion.div 
            className="mb-8 relative inline-block"
            variants={itemVariants}
          >
            <div className="h-32 w-32 md:h-40 md:w-40 relative rounded-full overflow-hidden border-4 border-primary/20 mx-auto">
              {/* Replace with your actual profile image */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-primary rounded-full opacity-50" />
              <Image 
                src="/assets/profile.jpg" 
                alt="Anthony Feaster"
                width={160}
                height={160}
                className="rounded-full object-cover"
                priority
              />
            </div>
          </motion.div>
          
          {/* Heading */}
          <motion.h1 
            className="heading-xl mb-4"
            variants={itemVariants}
          >
            Hi, I'm <span className="gradient-text">Anthony Feaster</span>
          </motion.h1>
          
          {/* Subheading with typing effect */}
          <motion.div
            variants={itemVariants}
            className="heading-sm mb-6 text-muted-foreground"
          >
            Full Stack Developer | Interactive Experience Designer
          </motion.div>
          
          {/* Introduction */}
          <motion.p 
            className="text-lg mb-8 text-muted-foreground"
            variants={itemVariants}
          >
            I create immersive, interactive web experiences that focus on performance
            and user experience. Based in Atlanta, GA.
          </motion.p>
          
          {/* CTA Buttons */}
          <motion.div 
            className="flex flex-wrap justify-center gap-4"
            variants={itemVariants}
          >
            <a 
              href="#projects" 
              className="btn-primary"
            >
              View My Projects
            </a>
            <a 
              href="#contact" 
              className="btn-secondary"
            >
              Get In Touch
            </a>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      {scrollIndicator && (
        <motion.div 
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.5 }}
        >
          <div className="flex flex-col items-center text-muted-foreground">
            <span className="text-sm mb-2">Scroll Down</span>
            <motion.div
              animate={{ y: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <ArrowDown size={20} />
            </motion.div>
          </div>
        </motion.div>
      )}
      
      {/* Background elements */}
      <div className="absolute inset-0 -z-10 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
      </div>
    </section>
  );
}
'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Github, Linkedin, Mail, MapPin, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AboutSection() {
  const fadeInVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: custom * 0.1,
        duration: 0.5,
      },
    }),
  };
  
  return (
    <section className="py-20 px-4 md:px-8 lg:px-16 bg-gradient-to-b from-background to-card">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.h2 
            className="text-3xl md:text-4xl font-bold mb-4"
            custom={1}
            variants={fadeInVariants}
          >
            About <span className="text-gradient">Me</span>
          </motion.h2>
          <motion.div 
            className="w-24 h-1 bg-gradient-to-r from-primary to-blue-500 mx-auto"
            custom={2}
            variants={fadeInVariants}
          />
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <motion.div 
            className="md:col-span-5 flex justify-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            custom={3}
            variants={fadeInVariants}
          >
            <div className="relative rounded-lg overflow-hidden w-64 h-64 md:w-80 md:h-80 shadow-xl">
              <Image
                src="/avatar.jpg"
                alt="Anthony Feaster portrait"
                fill
                sizes="(max-width: 768px) 16rem, 20rem"
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-40" />
            </div>
          </motion.div>
          
          <motion.div 
            className="md:col-span-7"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            <motion.h3 
              className="text-2xl font-bold mb-3"
              custom={4}
              variants={fadeInVariants}
            >
              Anthony "MrGuru" Feaster
            </motion.h3>
            <motion.h4 
              className="text-xl text-primary mb-6"
              custom={5}
              variants={fadeInVariants}
            >
              Full Stack Developer
            </motion.h4>
            <motion.p 
              className="text-muted-foreground mb-6"
              custom={6}
              variants={fadeInVariants}
            >
              I'm a passionate full stack developer with over 5 years of experience building web applications 
              that combine beautiful interfaces with solid performance. My expertise spans across the entire 
              development stack, with a particular focus on React, Node.js, and modern JavaScript frameworks.
            </motion.p>
            <motion.p 
              className="text-muted-foreground mb-6"
              custom={7}
              variants={fadeInVariants}
            >
              Based in Atlanta, Georgia, I've worked with clients ranging from startups to large corporations, 
              helping them achieve their digital goals with clean code and thoughtful user experiences. 
              I'm passionate about continuous learning and staying up-to-date with the latest technologies.
            </motion.p>
            
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8"
              custom={8}
              variants={fadeInVariants}
            >
              <div className="flex items-center">
                <MapPin className="text-primary mr-3" />
                <span>Atlanta, GA</span>
              </div>
              <div className="flex items-center">
                <Phone className="text-primary mr-3" />
                <span>(678) 506-1143</span>
              </div>
              <div className="flex items-center">
                <Mail className="text-primary mr-3" />
                <span>anthony@mrguru.dev</span>
              </div>
            </motion.div>
            
            <motion.div 
              className="flex space-x-4"
              custom={9}
              variants={fadeInVariants}
            >
              <Button 
                variant="outline" 
                size="icon" 
                asChild
              >
                <a 
                  href="https://github.com/mrguru2024" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label="GitHub Profile"
                >
                  <Github />
                </a>
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                asChild
              >
                <a 
                  href="https://linkedin.com/in/anthony-feaster" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label="LinkedIn Profile"
                >
                  <Linkedin />
                </a>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
"use client";

import { motion } from "framer-motion";
import { Code, Briefcase, Award, Coffee } from "lucide-react";

export default function AboutSection() {
  // Animation variants for staggered animation
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
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
        duration: 0.5,
      },
    },
  };
  
  // Features/highlights with icons
  const highlights = [
    {
      icon: <Code className="h-10 w-10 text-primary" />,
      title: "Modern Technologies",
      description: "Specialized in React, Next.js, TypeScript, and Node.js to build robust scalable applications.",
    },
    {
      icon: <Briefcase className="h-10 w-10 text-primary" />,
      title: "Professional Experience",
      description: "Years of experience working on diverse projects from startups to large-scale enterprise applications.",
    },
    {
      icon: <Award className="h-10 w-10 text-primary" />,
      title: "Quality Focused",
      description: "Delivering clean, maintainable code with a focus on performance, accessibility, and user experience.",
    },
    {
      icon: <Coffee className="h-10 w-10 text-primary" />,
      title: "Passionate Developer",
      description: "Continuously learning and implementing the latest technologies and best practices.",
    },
  ];

  return (
    <section id="about" className="section bg-card relative overflow-hidden">
      <div className="container-custom">
        {/* Section header */}
        <div className="text-center mb-16">
          <motion.h2 
            className="heading-lg mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            About <span className="gradient-text">Me</span>
          </motion.h2>
          <motion.p 
            className="text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            I create immersive, interactive web experiences with a focus on performance and user experience.
          </motion.p>
        </div>
        
        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Bio and information */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="space-y-6">
              <h3 className="heading-md">Full Stack Developer from Atlanta, GA</h3>
              
              <p className="text-muted-foreground">
                I'm Anthony "MrGuru" Feaster, a passionate Full Stack Developer with a focus on 
                building web applications that provide exceptional user experiences. With 
                expertise in both frontend and backend technologies, I create scalable 
                solutions that meet modern business challenges.
              </p>
              
              <p className="text-muted-foreground">
                My technical journey has equipped me with skills across the entire development 
                process - from designing intuitive interfaces to implementing complex backend logic 
                and database architecture. I approach every project with a commitment to writing 
                clean, maintainable code that provides lasting value.
              </p>
              
              <p className="text-muted-foreground">
                When I'm not coding, I enjoy staying up-to-date with the latest technological 
                advancements, contributing to open-source projects, and mentoring up-and-coming 
                developers.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <a href="#projects" className="btn-primary">
                  View Projects
                </a>
                <a href="/resume" className="btn-secondary">
                  Download Resume
                </a>
              </div>
            </div>
          </motion.div>
          
          {/* Highlights/features */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {highlights.map((item, index) => (
              <motion.div
                key={index}
                className="bg-background/80 backdrop-blur-sm p-6 rounded-lg border border-border"
                variants={itemVariants}
              >
                <div className="mb-4">{item.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
      
      {/* Background decoration */}
      <div className="absolute -z-10 -right-40 -bottom-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
    </section>
  );
}
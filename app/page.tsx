"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function HomePage() {
  const [visibleSection, setVisibleSection] = useState("home");

  // Configure intersection observer for section visibility
  useEffect(() => {
    const options = {
      root: null,
      rootMargin: "0px",
      threshold: 0.5,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setVisibleSection(entry.target.id);
        }
      });
    }, options);

    // Observe each section
    const sections = document.querySelectorAll("section[id]");
    sections.forEach((section) => {
      observer.observe(section);
    });

    return () => {
      sections.forEach((section) => {
        observer.unobserve(section);
      });
    };
  }, []);

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section 
        id="home" 
        className="min-h-screen flex items-center relative overflow-hidden"
      >
        <div className="container-custom z-10">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="heading-xl">
                Hello, I'm Anthony Feaster 
                <span className="gradient-text block mt-2">Full Stack Developer</span>
              </h1>
              
              <p className="text-xl md:text-2xl mt-6 text-muted-foreground">
                Building exceptional digital experiences with modern web technologies.
                Turning complex problems into elegant, user-friendly solutions.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/#projects" 
                  className="px-8 py-3 rounded-lg bg-primary text-primary-foreground font-medium flex items-center justify-center hover:opacity-90 transition-opacity"
                >
                  View My Work
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link 
                  href="/#contact" 
                  className="px-8 py-3 rounded-lg bg-secondary text-secondary-foreground font-medium flex items-center justify-center hover:bg-secondary/80 transition-colors"
                >
                  Get In Touch
                </Link>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Background elements */}
        <div className="absolute inset-0 -z-10 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-blue-500 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-purple-500 rounded-full blur-[100px]" />
        </div>
      </section>

      {/* About Section */}
      <section 
        id="about" 
        className="py-20 bg-card"
      >
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="relative rounded-xl overflow-hidden aspect-square max-w-md mx-auto lg:mx-0">
                <Image 
                  src="/assets/profile.jpg" 
                  alt="Anthony Feaster" 
                  fill
                  className="object-cover"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <h2 className="heading-lg mb-6">About Me</h2>
              <div className="space-y-4 text-lg">
                <p>
                  I'm Anthony "MrGuru" Feaster, a passionate Full Stack Developer based in Atlanta, GA.
                  With a strong foundation in both front-end and back-end technologies, I create modern, 
                  responsive, and user-friendly web applications.
                </p>
                <p>
                  My journey in software development began with a curiosity about how websites work, 
                  leading me to dive deep into the world of coding. Since then, I've worked on a variety 
                  of projects, from simple websites to complex web applications with authentication, 
                  data management, and real-time features.
                </p>
                <p>
                  I specialize in JavaScript/TypeScript, React, Node.js, and various modern tools and 
                  frameworks. I'm constantly learning and adapting to new technologies to stay at the 
                  forefront of web development.
                </p>
              </div>
              
              <div className="mt-8">
                <Link 
                  href="/resume" 
                  className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium inline-flex items-center hover:opacity-90 transition-opacity"
                >
                  View My Resume
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Projects Section Placeholder */}
      <section 
        id="projects" 
        className="py-20"
      >
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="heading-lg">My Projects</h2>
            <p className="text-xl text-muted-foreground mt-4 max-w-3xl mx-auto">
              A showcase of my recent work, featuring web applications built with 
              modern technologies.
            </p>
          </motion.div>

          {/* Projects will be loaded via ProjectsSection component */}
          <div className="text-center py-10">
            <p className="text-muted-foreground">Loading projects...</p>
          </div>
        </div>
      </section>

      {/* Skills Section Placeholder */}
      <section 
        id="skills" 
        className="py-20 bg-card"
      >
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="heading-lg">My Skills</h2>
            <p className="text-xl text-muted-foreground mt-4 max-w-3xl mx-auto">
              The technologies and tools I use to bring ideas to life.
            </p>
          </motion.div>

          {/* Skills will be loaded via SkillsSection component */}
          <div className="text-center py-10">
            <p className="text-muted-foreground">Loading skills...</p>
          </div>
        </div>
      </section>

      {/* Contact Section Placeholder */}
      <section 
        id="contact" 
        className="py-20"
      >
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="heading-lg">Get In Touch</h2>
            <p className="text-xl text-muted-foreground mt-4 max-w-3xl mx-auto">
              Have a question or want to work together? Feel free to contact me!
            </p>
          </motion.div>

          {/* Contact form will be loaded via ContactSection component */}
          <div className="text-center py-10">
            <p className="text-muted-foreground">Loading contact form...</p>
          </div>
        </div>
      </section>
    </main>
  );
}
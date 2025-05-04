"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import ArrowUpRight from "lucide-react/dist/esm/icons/arrow-up-right";
import Github from "lucide-react/dist/esm/icons/github";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import Code from "lucide-react/dist/esm/icons/code";
import PlayCircle from "lucide-react/dist/esm/icons/play-circle";
import Image from "next/image";
import { cn } from "@/lib/utils";

// Sample project data (will connect to API later)
const projects = [
  {
    id: "1",
    title: "Stackzen",
    description: "A collaborative workspace platform for development teams with real-time code editing, task management, and integrated chat.",
    image: "/assets/projects/stackzen.jpg",
    demoUrl: "https://stackzen.vercel.app",
    repoUrl: "https://github.com/Mrguru2024/stackzen",
    technologies: ["React", "Next.js", "TypeScript", "Node.js", "PostgreSQL", "Socket.IO"],
    featured: true,
    demo_type: "iframe"
  },
  {
    id: "2",
    title: "Keycode Help",
    description: "An interactive tool to help developers find JavaScript keycodes quickly with visual keyboard layout and copy-to-clipboard functionality.",
    image: "/assets/projects/keycode-help.jpg",
    demoUrl: "https://keycode-help.vercel.app",
    repoUrl: "https://github.com/Mrguru2024/keycode-help",
    technologies: ["React", "CSS", "JavaScript"],
    featured: true,
    demo_type: "iframe"
  },
  {
    id: "3",
    title: "Inventory Management System",
    description: "A comprehensive inventory management solution with barcode scanning, stock alerts, and analytics dashboards.",
    image: "/assets/projects/inventory.jpg",
    demoUrl: "https://inv-management.vercel.app",
    repoUrl: "https://github.com/Mrguru2024/inventory-management",
    technologies: ["React", "Express", "MongoDB", "Chart.js", "TailwindCSS"],
    featured: true,
    demo_type: "video"
  },
  {
    id: "4",
    title: "Gatherly",
    description: "An event planning and RSVP platform with integrated social features and location-based recommendations.",
    image: "/assets/projects/gatherly.jpg",
    demoUrl: "https://gatherly.vercel.app",
    repoUrl: "https://github.com/Mrguru2024/gatherly",
    technologies: ["Next.js", "GraphQL", "Auth0", "TailwindCSS", "PostgreSQL"],
    featured: true,
    demo_type: "iframe"
  }
];

export default function ProjectsSection({ filterTech }: { filterTech?: string }) {
  const [showDemo, setShowDemo] = useState<string | null>(null);
  const [demoType, setDemoType] = useState<string>("iframe");
  const [demoUrl, setDemoUrl] = useState<string>("");
  
  // Filter projects by technology if filterTech is provided
  const filteredProjects = filterTech 
    ? projects.filter(project => 
        project.technologies.some(tech => 
          tech.toLowerCase().includes(filterTech.toLowerCase())
        )
      )
    : projects;
  
  // Handler for opening project demo
  const handleOpenDemo = (id: string, type: string, url: string) => {
    setShowDemo(id);
    setDemoType(type);
    setDemoUrl(url);
  };
  
  // Handler for closing project demo
  const handleCloseDemo = () => {
    setShowDemo(null);
  };
  
  // Animation variants
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
        duration: 0.5,
      },
    },
  };

  return (
    <section id="projects" className="section bg-background relative overflow-hidden">
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
            My <span className="gradient-text">Projects</span>
          </motion.h2>
          <motion.p 
            className="text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            A collection of my recent web development projects with live demos.
            Each project showcases different skills and technologies.
          </motion.p>
        </div>
        
        {/* Technologies filter (basic) */}
        {!filterTech && (
          <motion.div 
            className="flex flex-wrap justify-center gap-2 mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <a href="/projects" className="px-4 py-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
              All
            </a>
            {["React", "Next.js", "TypeScript", "Node.js", "PostgreSQL"].map(tech => (
              <a 
                key={tech}
                href={`/projects?tech=${tech}`}
                className="px-4 py-2 rounded-full bg-accent/50 hover:bg-accent transition-colors"
              >
                {tech}
              </a>
            ))}
          </motion.div>
        )}
        
        {/* Projects grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {filteredProjects.map((project) => (
            <motion.div 
              key={project.id}
              className="bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
              variants={itemVariants}
            >
              {/* Project image */}
              <div className="relative aspect-video overflow-hidden bg-muted">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                {/* This is a placeholder - replace with actual images */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20" />
                <div className="absolute bottom-4 left-4 z-20">
                  <h3 className="text-xl font-semibold text-white">{project.title}</h3>
                </div>
              </div>
              
              {/* Project details */}
              <div className="p-6">
                <p className="text-muted-foreground mb-4">{project.description}</p>
                
                {/* Technologies */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {project.technologies.map((tech) => (
                    <span 
                      key={tech} 
                      className="text-xs px-2 py-1 rounded-md bg-accent/50 text-accent-foreground"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                
                {/* Action buttons */}
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => handleOpenDemo(project.id, project.demo_type, project.demoUrl)}
                    className="btn-primary flex items-center gap-2"
                  >
                    <PlayCircle size={16} />
                    Live Demo
                  </button>
                  
                  <div className="flex gap-2">
                    <a
                      href={project.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full hover:bg-accent transition-colors"
                      aria-label="View source code"
                    >
                      <Github size={20} />
                    </a>
                    <a
                      href={project.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full hover:bg-accent transition-colors"
                      aria-label="Open live demo"
                    >
                      <ExternalLink size={20} />
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
        
        {/* More projects link */}
        <motion.div 
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <a 
            href="/projects" 
            className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
          >
            View All Projects <ArrowUpRight size={16} />
          </a>
        </motion.div>
      </div>
      
      {/* Demo Modal */}
      {showDemo && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg shadow-lg w-full max-w-5xl border border-border">
            <div className="flex justify-between items-center p-4 border-b border-border">
              <h3 className="font-semibold">
                Project Demo: {projects.find(p => p.id === showDemo)?.title}
              </h3>
              <button
                onClick={handleCloseDemo}
                className="p-1 hover:bg-muted rounded-full"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            
            <div className="relative w-full aspect-video bg-muted">
              {demoType === 'iframe' && (
                <iframe
                  src={demoUrl}
                  className="w-full h-full"
                  title="Project Demo"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
              
              {demoType === 'video' && (
                <video 
                  src="/assets/demos/placeholder-video.mp4" 
                  controls 
                  className="w-full h-full"
                >
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
            
            <div className="p-4 border-t border-border">
              <a
                href={demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary flex items-center gap-2 w-fit"
              >
                <ExternalLink size={16} />
                Open in New Tab
              </a>
            </div>
          </div>
        </div>
      )}
      
      {/* Background decoration */}
      <div className="absolute -z-10 -left-40 -bottom-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
    </section>
  );
}
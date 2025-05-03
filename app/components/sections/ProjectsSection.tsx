'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fetchFromAPI } from '@/app/lib/utils';
import { Project } from '@/shared/schema';

export default function ProjectsSection() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [techFilter, setTechFilter] = useState<string | null>(null);
  
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        const data = await fetchFromAPI<Project[]>('/api/projects');
        setProjects(data);
      } catch (error) {
        console.error('Failed to load projects:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadProjects();
  }, []);
  
  // Extract all unique technologies from all projects
  const allTechnologies = useMemo(() => {
    if (!projects.length) return [];
    
    const techSet = new Set<string>();
    
    projects.forEach(project => {
      const techs = project.techStack.split(',').map(tech => tech.trim());
      techs.forEach(tech => techSet.add(tech));
    });
    
    return Array.from(techSet).sort();
  }, [projects]);
  
  // Filter projects based on selected technology
  const filteredProjects = useMemo(() => {
    if (!techFilter) return projects;
    
    return projects.filter(project => 
      project.techStack.toLowerCase().includes(techFilter.toLowerCase())
    );
  }, [projects, techFilter]);
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };
  
  return (
    <section className="py-20 px-4 md:px-8 lg:px-16">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
        >
          <motion.h2 
            className="text-3xl md:text-4xl font-bold mb-4"
            variants={itemVariants}
          >
            My <span className="text-gradient">Projects</span>
          </motion.h2>
          <motion.div 
            className="w-24 h-1 bg-gradient-to-r from-primary to-blue-500 mx-auto mb-8"
            variants={itemVariants}
          />
          
          <motion.div 
            className="flex flex-wrap justify-center gap-2 mb-8"
            variants={itemVariants}
          >
            <Button 
              variant={!techFilter ? "default" : "outline"} 
              className="mb-2"
              onClick={() => setTechFilter(null)}
            >
              All Projects
            </Button>
            
            {allTechnologies.map(tech => (
              <Button
                key={tech}
                variant={techFilter === tech ? "default" : "outline"}
                className="mb-2"
                onClick={() => setTechFilter(tech)}
              >
                {tech}
              </Button>
            ))}
          </motion.div>
        </motion.div>
        
        {loading ? (
          <div className="flex justify-center items-center h-60">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {filteredProjects.map((project) => (
              <motion.div 
                key={project.id}
                className="rounded-lg overflow-hidden shadow-lg bg-card transition-all hover:shadow-xl card-hover"
                variants={itemVariants}
              >
                <div className="relative h-48 project-card">
                  <Image
                    src={project.image || '/project-placeholder.jpg'}
                    alt={project.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                  />
                  <div className="project-card-overlay">
                    <h3 className="text-xl font-bold mb-2">{project.title}</h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.techStack.split(',').map(tech => (
                        <Badge key={tech} variant="secondary" className="whitespace-nowrap">
                          {tech.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="p-5">
                  <h3 className="text-xl font-bold mb-2">{project.title}</h3>
                  <p className="text-muted-foreground mb-4 line-clamp-3">
                    {project.description}
                  </p>
                  
                  <div className="flex justify-between items-center">
                    <Link href={`/projects?id=${project.id}`}>
                      <Button variant="link" className="px-0 flex items-center gap-1">
                        View details <ChevronRight size={16} />
                      </Button>
                    </Link>
                    
                    {project.demoUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a 
                          href={project.demoUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          Live Demo
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
        
        <motion.div
          className="flex justify-center mt-12"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <Link href="/projects">
            <Button className="button-gradient text-white">
              View All Projects
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
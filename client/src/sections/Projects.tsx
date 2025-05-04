

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Project } from '@shared/schema';
import AnimatedButton from '@/components/AnimatedButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowUpRight, Github, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'wouter';

export default function Projects() {
  const [activeTab, setActiveTab] = useState<string>('all');
  
  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  const categorizedProjects = {
    all: projects || [],
    frontend: projects?.filter(p => (p.techStack || p.tags)?.some(t => 
      ['react', 'vue', 'angular', 'html', 'css', 'javascript', 'typescript'].includes(String(t).toLowerCase())
    )) || [],
    backend: projects?.filter(p => (p.techStack || p.tags)?.some(t => 
      ['node', 'express', 'django', 'python', 'java', 'php', 'ruby', 'api'].includes(String(t).toLowerCase())
    )) || [],
    fullstack: projects?.filter(p => 
      (p.techStack || p.tags)?.some(t => ['react', 'vue', 'angular', 'html', 'css', 'javascript', 'typescript'].includes(String(t).toLowerCase())) && 
      (p.techStack || p.tags)?.some(t => ['node', 'express', 'django', 'python', 'java', 'php', 'ruby', 'api'].includes(String(t).toLowerCase()))
    ) || [],
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
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
        damping: 10,
      },
    },
  };

  return (
    <section id="projects" className="py-20 bg-gradient-to-b from-background/95 to-background">
      <div className="container px-4 mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="mb-16"
        >
          <motion.h2 
            className="text-3xl md:text-4xl font-bold mb-6 text-center bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent"
            variants={itemVariants}
          >
            Projects that <span className="text-primary">Convert</span>
          </motion.h2>
          <motion.p 
            className="text-lg text-muted-foreground text-center max-w-2xl mx-auto mb-12"
            variants={itemVariants}
          >
            I build immersive, user-friendly web applications that help businesses increase their conversion rates and grow their online presence.
          </motion.p>

          <motion.div variants={itemVariants}>
            <Tabs 
              defaultValue="all" 
              className="w-full" 
              value={activeTab}
              onValueChange={setActiveTab}
            >
              <div className="flex justify-center mb-12">
                <TabsList className="bg-background/50 border border-border">
                  <TabsTrigger value="all">All Projects</TabsTrigger>
                  <TabsTrigger value="frontend">Frontend</TabsTrigger>
                  <TabsTrigger value="backend">Backend</TabsTrigger>
                  <TabsTrigger value="fullstack">Full Stack</TabsTrigger>
                </TabsList>
              </div>

              {['all', 'frontend', 'backend', 'fullstack'].map(tab => (
                <TabsContent key={tab} value={tab} className="mt-0">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {categorizedProjects[tab as keyof typeof categorizedProjects].map((project, index) => (
                        <motion.div
                          key={project.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          exit={{ opacity: 0, y: 20 }}
                          className="group"
                        >
                          <ProjectCard project={project} />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </motion.div>
        </motion.div>

        <motion.div 
          className="flex justify-center"
          variants={itemVariants}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
        >
          <AnimatedButton
            variant="outline"
            size="lg"
            className="border-primary/30 hover:border-primary/60"
            withHoverEffect
            onClick={() => window.open('https://github.com/Mrguru2024', '_blank')}
          >
            <Github className="mr-2 h-5 w-5" />
            View More on GitHub
          </AnimatedButton>
        </motion.div>
      </div>
    </section>
  );
}

interface ProjectCardProps {
  project: Project;
}

function ProjectCard({ project }: ProjectCardProps) {
  // Get technologies from either techStack or tags
  const technologies = project.techStack || project.tags || [];
  
  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="h-full overflow-hidden border border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 transform hover:-translate-y-1">
        <div 
          className="h-48 w-full bg-cover bg-center relative overflow-hidden"
          style={{ 
            backgroundImage: `url(${project.image})` 
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
          
          <div className="absolute bottom-0 left-0 p-4 w-full">
            <div className="flex flex-wrap gap-2">
              {technologies.slice(0, 3).map((tech, i) => (
                <span 
                  key={i} 
                  className="px-2 py-1 text-xs rounded-full bg-primary/20 text-primary border border-primary/20"
                >
                  {tech}
                </span>
              ))}
              {technologies.length > 3 && (
                <span className="px-2 py-1 text-xs rounded-full bg-muted/30 text-muted-foreground">
                  +{technologies.length - 3}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <CardHeader className="p-4 pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-xl group-hover:text-primary transition-colors duration-300">
              {project.title}
            </CardTitle>
            <span className={cn(
              "p-1.5 rounded-full text-xs font-medium flex items-center",
              project.category === "frontend" ? "bg-blue-500/20 text-blue-500" : 
              project.category === "backend" ? "bg-green-500/20 text-green-500" : 
              "bg-amber-500/20 text-amber-500"
            )}>
              {project.category.charAt(0).toUpperCase() + project.category.slice(1)}
            </span>
          </div>
          <CardDescription className="line-clamp-2 mt-2 text-muted-foreground">
            {project.description}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-4 pt-0">
          <div className="flex justify-between items-center mt-2">
            <div className="text-sm text-muted-foreground">
              {/* Display a static date or calculated date if needed */}
              {new Date().getFullYear()}
            </div>
            
            <div className="flex gap-2">
              {project.liveUrl && (
                <a 
                  href={project.liveUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-full bg-primary/20 text-primary hover:bg-primary/30 transition-colors duration-300"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              )}
              
              {project.githubUrl && (
                <a 
                  href={project.githubUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-full bg-muted/50 text-muted-foreground hover:bg-muted transition-colors duration-300"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Github className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
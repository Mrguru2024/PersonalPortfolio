import { useState, useEffect } from "react";
import { motion, useAnimation } from "framer-motion";
import { ExternalLink, Rocket, Code, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ProjectCard from "@/components/project/ProjectCard";
import ProjectFilter from "@/components/project/ProjectFilter";
import { projects } from "@/lib/data";
import { cn } from "@/lib/utils";

const ProjectsSection = () => {
  const [filter, setFilter] = useState("all");
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const controls = useAnimation();

  const filteredProjects = filter === "all" 
    ? projects 
    : projects.filter(project => project.category === filter);

  // Animate section on filter change
  useEffect(() => {
    const animate = async () => {
      await controls.start({ opacity: 0, y: 20, transition: { duration: 0.2 } });
      await controls.start({ opacity: 1, y: 0, transition: { duration: 0.3, staggerChildren: 0.1 } });
    };
    animate();
  }, [filter, controls]);

  // Find featured project (Stackzen or Keycode Help or first project)
  const featuredProject = projects.find(p => 
    p.title.includes("Stackzen") || p.title.includes("Keycode Help")
  ) || projects[0];

  return (
    <section id="projects" className="py-20 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge variant="outline" className="text-primary border-primary mb-3 px-3 py-1">
            FEATURED PROJECTS
          </Badge>
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            See My Work in Action
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
            Browse through my portfolio of live applications and projects. 
            Each one demonstrates my ability to solve real-world problems with code.
          </p>
          
          <ProjectFilter onFilterChange={setFilter} />
        </motion.div>

        {/* Featured Project Section */}
        {filter === "all" && featuredProject && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="bg-white dark:bg-gray-900 rounded-xl shadow-xl overflow-hidden mb-16"
          >
            <div className="flex flex-col lg:flex-row">
              <div className="lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center">
                <Badge className="text-xs w-fit mb-4 bg-primary/10 text-primary border-none">
                  FEATURED PROJECT
                </Badge>
                <h3 className="text-3xl font-bold mb-4">{featuredProject.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">
                  {featuredProject.description}
                </p>
                
                <div className="flex flex-wrap gap-2 mb-6">
                  {featuredProject.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 border-none"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  <div className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-1 mr-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">Fully responsive design across all devices</p>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-1 mr-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">Intuitive and engaging user experience</p>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-1 mr-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">High-performance optimized codebase</p>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-1 mr-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">Secure data handling and storage</p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  {featuredProject.liveUrl && (
                    <a 
                      href={featuredProject.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto"
                    >
                      <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 flex items-center gap-2">
                        <Rocket className="h-4 w-4" />
                        Try Live Demo
                      </Button>
                    </a>
                  )}
                  
                  {featuredProject.githubUrl && (
                    <a 
                      href={featuredProject.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto"
                    >
                      <Button variant="outline" className="w-full sm:w-auto flex items-center gap-2">
                        <Code className="h-4 w-4" />
                        View Source Code
                      </Button>
                    </a>
                  )}
                </div>
              </div>
              
              <div className="lg:w-1/2 relative overflow-hidden" style={{ minHeight: "400px" }}>
                <img
                  src={featuredProject.image}
                  alt={featuredProject.title}
                  className="w-full h-full object-cover object-center"
                />
                
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/40 to-transparent mix-blend-multiply" />
                
                <div className="absolute bottom-6 right-6">
                  <Badge className="bg-black/70 text-white border-none px-3 py-1">
                    {featuredProject.category}
                  </Badge>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        <motion.div
          animate={controls}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {filteredProjects.map((project) => (
            <ProjectCard 
              key={project.id} 
              project={project} 
            />
          ))}
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-6">
            Interested in working together? Let's build something amazing for your business!
          </p>
          <a href="#contact">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8">
              Get a Quote for Your Project
            </Button>
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default ProjectsSection;

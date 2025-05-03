import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, ExternalLink, Github, Play, Monitor } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Project } from "@/lib/data";

interface ProjectCardProps {
  project: Project;
}

const ProjectCard = ({ project }: ProjectCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-lg transition-all hover:shadow-xl hover:translate-y-[-5px]"
      data-category={project.category}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative overflow-hidden" style={{ paddingTop: "56.25%" }}>
        <img
          className={`absolute top-0 left-0 w-full h-full object-cover transition duration-500 ${isHovered ? 'scale-105 blur-[2px]' : ''}`}
          src={project.image}
          alt={project.title}
        />
        
        {project.liveUrl && isHovered && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 transition-opacity duration-300">
            <a 
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="transform transition-transform duration-300 hover:scale-110"
            >
              <Button size="lg" variant="default" className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2">
                <Play className="h-5 w-5" />
                Try Live Demo
              </Button>
            </a>
          </div>
        )}
        
        {/* Project category badge */}
        <Badge 
          className="absolute top-3 right-3 bg-primary/80 hover:bg-primary text-white border-none"
        >
          {project.category}
        </Badge>
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold mb-2 group flex items-center">
          {project.title}
          <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowRight className="h-4 w-4 text-primary" />
          </span>
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{project.description}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {project.tags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 border-none"
            >
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
          <Link href={`/projects/${project.id}`}>
            <Button variant="outline" className="w-full sm:w-auto flex items-center justify-center gap-2">
              <ArrowRight className="h-4 w-4" />
              View Details
            </Button>
          </Link>
          <div className="flex gap-2 justify-center sm:justify-end">
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="GitHub Repository"
                title="View Source Code"
              >
                <Github className="h-5 w-5" />
              </a>
            )}
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="Live Demo"
                title="Try Live Demo"
              >
                <Monitor className="h-5 w-5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;

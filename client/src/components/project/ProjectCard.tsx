import { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Github, Play, Monitor, Star, Rocket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Project } from "@/lib/data";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  project: Project;
}

const ProjectCard = ({ project }: ProjectCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { once: true, amount: 0.3 });
  
  // Random delay for staggered animation
  const randomDelay = Math.random() * 0.4;
  
  // Featured flag (e.g. for Stackzen or Keycode Help)
  const isFeatured = project.title.includes("Stackzen") || project.title.includes("Keycode Help");
  
  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? 
        { opacity: 1, y: 0 } : 
        { opacity: 0, y: 30 }
      }
      transition={{ 
        duration: 0.6, 
        delay: randomDelay,
        type: "spring",
        stiffness: 100 
      }}
      whileHover={{ y: -8 }}
      className={cn(
        "bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-lg transition-all",
        isFeatured ? "ring-2 ring-primary/30 dark:ring-primary/40" : ""
      )}
      data-category={project.category}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative overflow-hidden" style={{ paddingTop: "56.25%" }}>
        <motion.img
          className="absolute top-0 left-0 w-full h-full object-cover"
          src={project.image}
          alt={project.title}
          initial={{ scale: 1 }}
          animate={isHovered ? { scale: 1.1, filter: 'blur(2px)' } : { scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.4 }}
        />
        
        <AnimatePresence>
          {project.liveUrl && isHovered && (
            <motion.div 
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.a 
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ scale: 0.8, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 10 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Button size="lg" variant="default" className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2 group">
                  <motion.div
                    animate={{ 
                      rotate: [0, 15, 0],
                      y: [0, -2, 0] 
                    }}
                    transition={{ 
                      duration: 1.5, 
                      repeat: Infinity,
                      repeatType: "loop" 
                    }}
                  >
                    <Rocket className="h-5 w-5 group-hover:text-yellow-300 transition-colors" />
                  </motion.div>
                  Try Live Demo
                </Button>
              </motion.a>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Featured star for special projects */}
        {isFeatured && (
          <motion.div
            className="absolute top-3 left-3 z-10"
            initial={{ rotate: -10, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ 
              duration: 0.5,
              delay: 0.2 + randomDelay,
              type: "spring" 
            }}
          >
            <Badge className="bg-yellow-500 text-white border-none px-2 py-1 flex items-center gap-1">
              <motion.div
                animate={{ 
                  rotate: [0, 15, 0, -15, 0],
                  scale: [1, 1.2, 1, 1.2, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 4
                }}
              >
                <Star className="h-3 w-3 fill-white text-white" />
              </motion.div>
              <span className="text-xs">Featured</span>
            </Badge>
          </motion.div>
        )}
        
        {/* Project category badge */}
        <motion.div
          className="absolute top-3 right-3 z-10"
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 + randomDelay }}
          whileHover={{ scale: 1.1 }}
        >
          <Badge 
            className="bg-primary/80 hover:bg-primary text-white border-none"
          >
            {project.category}
          </Badge>
        </motion.div>
      </div>
      
      <motion.div 
        className="p-6"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.3, delay: 0.2 + randomDelay }}
      >
        <motion.h3 
          className="text-xl font-bold mb-2 group flex items-center bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent"
          initial={{ x: -10, opacity: 0 }}
          animate={isInView ? { x: 0, opacity: 1 } : { x: -10, opacity: 0 }}
          transition={{ duration: 0.4, delay: 0.3 + randomDelay }}
        >
          {project.title}
          <motion.span 
            className="ml-2 text-primary"
            initial={{ x: -5, opacity: 0 }}
            animate={isHovered ? { x: 5, opacity: 1 } : { x: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ArrowRight className="h-4 w-4" />
          </motion.span>
        </motion.h3>
        
        <motion.p 
          className="text-gray-600 dark:text-gray-400 mb-4"
          initial={{ y: 10, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : { y: 10, opacity: 0 }}
          transition={{ duration: 0.4, delay: 0.4 + randomDelay }}
        >
          {project.description}
        </motion.p>
        
        <motion.div 
          className="flex flex-wrap gap-2 mb-4"
          initial={{ y: 10, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : { y: 10, opacity: 0 }}
          transition={{ duration: 0.4, delay: 0.5 + randomDelay }}
        >
          {project.tags.map((tag, index) => (
            <motion.div
              key={tag}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
              transition={{ 
                duration: 0.3, 
                delay: 0.5 + randomDelay + (index * 0.1)
              }}
              whileHover={{ scale: 1.1, y: -2 }}
            >
              <Badge
                variant="outline"
                className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 border-none"
              >
                {tag}
              </Badge>
            </motion.div>
          ))}
        </motion.div>
        
        <motion.div 
          className="flex flex-col sm:flex-row sm:justify-between gap-3"
          initial={{ y: 10, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : { y: 10, opacity: 0 }}
          transition={{ duration: 0.4, delay: 0.6 + randomDelay }}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link href={`/projects/${project.id}`}>
              <Button variant="outline" className="w-full sm:w-auto flex items-center justify-center gap-2 group">
                <span>View Details</span>
                <motion.div
                  animate={isHovered ? { x: 5 } : { x: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                >
                  <ArrowRight className="h-4 w-4 group-hover:text-primary" />
                </motion.div>
              </Button>
            </Link>
          </motion.div>
          
          <div className="flex gap-2 justify-center sm:justify-end">
            {project.githubUrl && (
              <motion.a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="GitHub Repository"
                title="View Source Code"
                whileHover={{ scale: 1.2, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
              >
                <motion.div
                  animate={isHovered ? { rotate: 360 } : { rotate: 0 }}
                  transition={{ duration: 2, ease: "linear" }}
                >
                  <Github className="h-5 w-5" />
                </motion.div>
              </motion.a>
            )}
            {project.liveUrl && (
              <motion.a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="Live Demo"
                title="Try Live Demo"
                whileHover={{ scale: 1.2, rotate: -5 }}
                whileTap={{ scale: 0.9 }}
              >
                <Monitor className="h-5 w-5" />
              </motion.a>
            )}
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default ProjectCard;

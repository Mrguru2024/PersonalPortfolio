import { useState, useEffect, useRef } from "react";
import {
  motion,
  useAnimation,
  useInView,
  AnimatePresence,
} from "framer-motion";
import {
  ExternalLink,
  Rocket,
  Code,
  CheckCircle2,
  Eye,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ProjectCard from "@/components/project/ProjectCard";
import ProjectFilter from "@/components/project/ProjectFilter";
import { projects, upcomingProjects } from "@/lib/data";
import { cn } from "@/lib/utils";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";

const ProjectsSection = () => {
  const [filter, setFilter] = useState("all");
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const controls = useAnimation();

  const filteredProjects =
    filter === "all"
      ? projects
      : projects.filter((project) => project.category === filter);

  // Ensure component is mounted before using controls
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Animate section on filter change (only after mount)
  useEffect(() => {
    if (!isMounted) return;

    const animate = async () => {
      try {
        await controls.start({
          opacity: 0,
          y: 20,
          transition: { duration: 0.2 },
        });
        await controls.start({
          opacity: 1,
          y: 0,
          transition: { duration: 0.3, staggerChildren: 0.1 },
        });
      } catch (error) {
        // Ignore animation errors (component might be unmounting)
        console.debug("Animation error (ignored):", error);
      }
    };
    animate();
  }, [filter, controls, isMounted]);

  // Find featured project (Stackzen or Keycode Help or first project)
  const featuredProject =
    projects.find(
      (p) => p.title.includes("Stackzen") || p.title.includes("Keycode Help"),
    ) || projects[0];

  return (
    <section
      id="projects"
      className="py-12 xs:py-16 sm:py-20 md:py-24 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800"
    >
      <div className="container mx-auto px-3 fold:px-4 sm:px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge
            variant="outline"
            className="text-primary border-primary mb-3 px-3 py-1"
          >
            FEATURED PROJECTS
          </Badge>
          <h2 className="text-2xl fold:text-3xl xs:text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            See My Work in Action
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
            Browse through my portfolio of live applications and projects. Each
            one demonstrates my ability to solve real-world problems with code.
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
            whileHover={{ y: -5 }}
            className="bg-white dark:bg-gray-900 rounded-xl shadow-xl overflow-hidden mb-16 relative"
          >
            <div className="flex flex-col lg:flex-row">
              <div className="lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center relative z-10">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  viewport={{ once: true }}
                >
                  <Badge className="text-xs w-fit mb-4 bg-primary/10 text-primary border-none">
                    FEATURED PROJECT
                  </Badge>
                </motion.div>

                <motion.h3
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  viewport={{ once: true }}
                  className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent"
                >
                  {featuredProject.title}
                </motion.h3>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  viewport={{ once: true }}
                  className="text-gray-600 dark:text-gray-400 mb-6 text-lg"
                >
                  {featuredProject.description}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  viewport={{ once: true }}
                  className="flex flex-wrap gap-2 mb-6"
                >
                  {featuredProject.tags.map((tag, index) => (
                    <motion.div
                      key={tag}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                      viewport={{ once: true }}
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
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  viewport={{ once: true }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8"
                >
                  {[
                    "Fully responsive design across all devices",
                    "Intuitive and engaging user experience",
                    "High-performance optimized codebase",
                    "Secure data handling and storage",
                  ].map((feature, index) => (
                    <motion.div
                      key={index}
                      className="flex items-start"
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                      viewport={{ once: true }}
                      whileHover={{ x: 5 }}
                    >
                      <motion.div
                        animate={{ rotate: [0, 10, 0] }}
                        transition={{
                          duration: 0.5,
                          repeat: Infinity,
                          repeatType: "reverse",
                          ease: "easeInOut",
                          repeatDelay: Math.random() * 2 + 2,
                        }}
                      >
                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-1 mr-2" />
                      </motion.div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {feature}
                      </p>
                    </motion.div>
                  ))}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                  viewport={{ once: true }}
                  className="flex flex-col sm:flex-row gap-4"
                >
                  {featuredProject.liveUrl && (
                    <motion.a
                      href={featuredProject.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 flex items-center gap-2 group">
                        <motion.div
                          animate={{
                            y: [0, -3, 0],
                            rotate: [0, 15, 0],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            repeatType: "loop",
                            ease: "easeInOut",
                          }}
                        >
                          <Rocket className="h-4 w-4 group-hover:text-yellow-300 transition-colors" />
                        </motion.div>
                        <span>Try Live Demo</span>
                      </Button>
                    </motion.a>
                  )}

                  {featuredProject.githubUrl && (
                    <motion.a
                      href={featuredProject.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        size="lg"
                        variant="outline"
                        className="w-full sm:w-auto flex items-center justify-center gap-2 group text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3"
                      >
                        <motion.div
                          animate={{ rotate: [0, 360] }}
                          transition={{
                            duration: 5,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="group-hover:text-primary shrink-0"
                        >
                          <Code className="h-4 w-4" />
                        </motion.div>
                        <span className="whitespace-nowrap">View Source Code</span>
                      </Button>
                    </motion.a>
                  )}
                </motion.div>
              </div>

              <div
                className="lg:w-1/2 relative overflow-hidden"
                style={{ minHeight: "400px" }}
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <motion.img
                    initial={{ scale: 1.1, opacity: 0.9 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                    src={featuredProject.image}
                    alt={featuredProject.title}
                    className="w-full h-full object-cover object-center transition-all duration-500"
                  />
                </motion.div>

                <div className="absolute inset-0 bg-gradient-to-tr from-primary/40 to-transparent mix-blend-multiply" />

                <motion.div
                  className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-2"
                  initial={{ opacity: 0, y: -10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  viewport={{ once: true }}
                >
                  <motion.div whileHover={{ scale: 1.1, y: -2 }}>
                    <Badge className="bg-black/70 text-white border-none px-3 py-1 flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {featuredProject.category}
                    </Badge>
                  </motion.div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  viewport={{ once: true }}
                  className="absolute bottom-4 left-4 md:bottom-6 md:left-6"
                >
                  <Badge
                    variant="outline"
                    className="bg-white/20 backdrop-blur-sm text-white border-white/30 px-3 py-1"
                  >
                    View details
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Badge>
                </motion.div>
              </div>
            </div>

            {/* Background pattern */}
            <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />
            <div className="absolute -top-20 -left-20 h-60 w-60 rounded-full bg-purple-500/5 blur-3xl pointer-events-none" />
          </motion.div>
        )}

        <motion.div
          animate={controls}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8"
        >
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, type: "spring", stiffness: 50 }}
          viewport={{ once: true, amount: 0.6 }}
          className="text-center mt-20 relative"
        >
          {/* Decorative elements */}
          <motion.div
            className="absolute left-1/4 -top-10 h-16 w-16 rounded-full bg-primary/10 blur-xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
          <motion.div
            className="absolute right-1/4 -bottom-10 h-16 w-16 rounded-full bg-purple-500/10 blur-xl"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              repeatType: "reverse",
              delay: 1,
            }}
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto mb-10 bg-blue-50 dark:bg-blue-900/20 p-4 sm:p-6 rounded-xl border border-blue-100 dark:border-blue-800"
          >
            <h3 className="text-lg sm:text-xl font-bold mb-2 text-primary">
              Discover Your Perfect Project Match
            </h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4">
              Not sure which project fits your needs? Our AI-powered
              recommendation engine can suggest the perfect projects based on
              your interests and requirements.
            </p>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="text-center"
            >
              <a
                href="/recommendations"
                className="block w-full sm:w-auto sm:inline-block"
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto border-primary text-primary hover:bg-primary hover:text-white transition-colors duration-300 text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3"
                >
                  <span className="flex items-center justify-center gap-2 flex-wrap sm:flex-nowrap">
                    <span className="whitespace-nowrap">Get AI Project</span>
                    <span className="hidden xs:inline whitespace-nowrap">
                      Recommendations
                    </span>
                    <span className="xs:hidden">Recs</span>
                    <motion.div
                      animate={{
                        rotate: [0, 180, 360],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="shrink-0"
                    >
                      <Code className="h-4 w-4" />
                    </motion.div>
                  </span>
                </Button>
              </a>
            </motion.div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8 text-base sm:text-lg px-4"
          >
            Interested in working together? Let's build something amazing for
            your business!
          </motion.p>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            <motion.div
              animate={{
                y: [0, -5, 0],
                scale: [1, 1.02, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
              }}
            >
              <a
                href="/assessment"
                className="block w-full sm:w-auto sm:inline-block"
              >
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white px-4 sm:px-8 py-4 sm:py-6 shadow-lg hover:shadow-primary/20 hover:shadow-xl relative group overflow-hidden text-sm sm:text-base md:text-lg"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2 flex-wrap sm:flex-nowrap">
                    <span className="whitespace-nowrap">Start Project</span>
                    <span className="hidden xs:inline whitespace-nowrap">
                      Assessment
                    </span>
                    <span className="xs:hidden">Assessment</span>
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut",
                      }}
                      className="shrink-0"
                    >
                      <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:animate-pulse" />
                    </motion.div>
                  </span>

                  {/* Button shine effect */}
                  <motion.div
                    className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                    animate={{
                      x: ["-100%", "100%"],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      repeatDelay: 5,
                      ease: "easeInOut",
                    }}
                  />
                </Button>
              </a>
            </motion.div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
            className="text-gray-500 dark:text-gray-500 mt-4 text-sm"
          >
            No commitment, just a friendly conversation
          </motion.p>
        </motion.div>

        {/* Upcoming Projects Section */}
        {upcomingProjects && upcomingProjects.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="mt-20 pt-16 border-t border-border"
          >
            <div className="text-center mb-12">
              <Badge
                variant="outline"
                className="text-primary border-primary mb-3 px-3 py-1"
              >
                COMING SOON
              </Badge>
              <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Upcoming Projects
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Projects currently in development. Stay tuned for updates!
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {upcomingProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="group"
                >
                  <ProjectCard project={project} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default ProjectsSection;

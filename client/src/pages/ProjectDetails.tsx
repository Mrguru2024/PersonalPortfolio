import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { motion } from "framer-motion";
import { ChevronLeft, Github, ExternalLink, Calendar, Tag, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import ProjectDemo from "@/components/project/ProjectDemo";
import { ProjectSynopsis } from "@/components/projects/ProjectSynopsis";
import { projects } from "@/lib/data";
import ParallaxBackground from "@/components/ParallaxBackground";
import { PageSEO, StructuredData } from "@/components/SEO";

const ProjectDetails = () => {
  const [match, params] = useRoute("/projects/:id");
  const projectId = params?.id || "";

  const { data: project, isLoading } = useQuery({
    queryKey: [`/api/projects/${projectId}`],
    initialData: projects.find(p => p.id === projectId)
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <div className="animate-pulse">Loading project details...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Project Not Found</h1>
          <p className="mb-8">The project you're looking for doesn't exist.</p>
          <Link href="/#projects">
            <Button>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Projects
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative">
      {/* Add SEO for Project Details */}
      {project && (
        <>
          <PageSEO 
            title={`${project.title} | Project Details | MrGuru.dev`}
            description={project.description}
            canonicalPath={`/projects/${projectId}`}
            keywords={[...project.tags, ...project.techStack || [], project.category]}
            ogType="article"
            ogImage={project.image}
            ogImageAlt={`${project.title} project screenshot`}
            schemaType="WebPage"
          />
          
          {/* Add Project structured data */}
          <StructuredData
            schema={{
              type: 'Project',
              data: {
                name: project.title,
                description: project.description,
                url: `https://mrguru.dev/projects/${project.id}`,
                image: project.image,
                author: {
                  name: 'Anthony Feaster',
                  url: 'https://mrguru.dev'
                },
                datePublished: new Date().toISOString().split('T')[0],
                technologies: project.techStack || []
              }
            }}
          />
        </>
      )}
      
      <ParallaxBackground />

      <div className="container mx-auto px-4 py-16 relative z-10">
        <Link href="/#projects" className="inline-block mb-8">
          <Button variant="outline" className="flex items-center">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 xl:grid-cols-3 gap-8"
        >
          <div className="xl:col-span-2 space-y-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg">
              <img
                src={project.image}
                alt={project.title}
                className="w-full h-auto object-cover max-h-[400px]"
              />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent mb-4">
                {project.title}
              </h1>
              
              <div className="flex flex-wrap gap-2 mb-6">
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
              
              <div className="text-gray-600 dark:text-gray-400 mb-8 space-y-4">
                <p className="text-lg font-medium">{project.description}</p>
                <Separator />
                <p>{project.details}</p>
              </div>
              
              <div className="flex flex-wrap gap-4">
                {project.githubUrl && (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" className="flex items-center">
                      <Github className="mr-2 h-4 w-4" />
                      View on GitHub
                    </Button>
                  </a>
                )}
                
                {project.liveUrl && (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="flex items-center">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Live Website
                    </Button>
                  </a>
                )}
              </div>
              
              {/* Project Synopsis */}
              <ProjectSynopsis project={project} />
            </div>

            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Live Demo</h2>
              <ProjectDemo project={project} />
            </div>
          </div>

          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
            >
              <h2 className="text-xl font-bold mb-4">Project Details</h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Tag className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium">Category</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {project.category.charAt(0).toUpperCase() + project.category.slice(1)}
                    </p>
                  </div>
                </div>
                
                {project.techStack && project.techStack.length > 0 && (
                  <div className="flex items-start gap-3">
                    <Layers className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h3 className="font-medium">Technology Stack</h3>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {project.techStack.map(tech => (
                          <Badge key={tech} variant="outline" className="bg-primary/10 text-primary border-none">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Related projects could go here in the future */}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProjectDetails;

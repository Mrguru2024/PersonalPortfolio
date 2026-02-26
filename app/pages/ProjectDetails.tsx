"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ChevronLeft, Github, ExternalLink, Tag, Layers } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import ProjectDemo from "@/components/project/ProjectDemo";
import { ProjectSynopsis } from "@/components/projects/ProjectSynopsis";
import { PageSEO, StructuredData } from "@/components/SEO";
import type { Project } from "@/lib/data";

export default function ProjectDetails() {
  const params = useParams<{ id: string }>();
  const projectId = params?.id ?? "";

  const { data: project, isLoading } = useQuery<Project | null>({
    queryKey: [`/api/projects/${projectId}`],
    enabled: !!projectId,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center min-h-[50vh]">
        <div className="animate-pulse text-muted-foreground">
          Loading project details...
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto px-4 py-16 min-h-[50vh]">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4 text-foreground">
            Project Not Found
          </h1>
          <p className="mb-8 text-muted-foreground">
            The project you&apos;re looking for doesn&apos;t exist.
          </p>
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
    <div className="min-h-screen bg-background relative">
      <PageSEO
        title={`${project.title} | Project Details | Ascendra Technologies`}
        description={project.description}
        canonicalPath={`/projects/${projectId}`}
        keywords={[
          ...(project.tags || []),
          ...(project.techStack || []),
          project.category,
        ]}
        ogType="article"
        ogImage={project.image}
        ogImageAlt={`${project.title} project screenshot`}
        schemaType="WebPage"
      />
      <StructuredData
        schema={{
          type: "Project",
          data: {
            name: project.title,
            description: project.description,
            url: `https://mrguru.dev/projects/${project.id}`,
            image: project.image,
            author: { name: "Anthony MrGuru Feaster", url: "https://mrguru.dev" },
            datePublished: new Date().toISOString().split("T")[0],
            technologies: project.techStack || [],
          },
        }}
      />

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
            <div className="rounded-xl overflow-hidden shadow-lg bg-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={project.image}
                alt={project.title}
                className="w-full h-auto object-cover max-h-[400px]"
              />
            </div>

            <div className="rounded-xl shadow-lg p-6 bg-card">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent mb-4">
                {project.title}
              </h1>

              <div className="flex flex-wrap gap-2 mb-6">
                {(project.tags || []).map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="bg-primary/10 text-primary border-none"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="text-muted-foreground mb-8 space-y-4">
                <p className="text-lg font-medium text-foreground">
                  {project.description}
                </p>
                <Separator />
                {project.details && <p>{project.details}</p>}
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

              <ProjectSynopsis project={project} />
            </div>

            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground">Live Demo</h2>
              <ProjectDemo project={project} />
            </div>
          </div>

          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="rounded-xl shadow-lg p-6 bg-card"
            >
              <h2 className="text-xl font-bold mb-4 text-foreground">
                Project Details
              </h2>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Tag className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <h3 className="font-medium text-foreground">Category</h3>
                    <p className="text-muted-foreground">
                      {project.category.charAt(0).toUpperCase() +
                        project.category.slice(1)}
                    </p>
                  </div>
                </div>

                {project.techStack && project.techStack.length > 0 && (
                  <div className="flex items-start gap-3">
                    <Layers className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <h3 className="font-medium text-foreground">
                        Technology Stack
                      </h3>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {project.techStack.map((tech) => (
                          <Badge
                            key={tech}
                            variant="outline"
                            className="bg-primary/10 text-primary border-none"
                          >
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Project } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Rocket, Code, Github, Globe, RefreshCw, Maximize, ArrowUpRight, FileCode, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProjectDemoProps {
  project: Project;
}

const ProjectDemo = ({ project }: ProjectDemoProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('demo');

  // Handle iframe loading events
  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  // Function to handle the refresh button click
  const handleRefresh = () => {
    setIsLoading(true);
    // We force a refresh by appending a timestamp to the URL
    const iframe = document.getElementById('demo-iframe') as HTMLIFrameElement;
    if (iframe && iframe.src) {
      iframe.src = `${iframe.src.split('?')[0]}?t=${Date.now()}`;
    }
  };

  // Function to handle fullscreen toggle
  const handleFullscreenToggle = () => {
    const demoContainer = document.getElementById('demo-container');
    if (demoContainer) {
      if (!isFullscreen) {
        if (demoContainer.requestFullscreen) {
          demoContainer.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
      setIsFullscreen(!isFullscreen);
    }
  };

  // Listen for fullscreen change events (e.g. Esc key)
  if (typeof window !== 'undefined') {
    document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
      }
    });
  }

  // Determines which type of demo to render
  const renderDemo = () => {
    if (!project.demoType) {
      return (
        <div className="flex flex-col items-center justify-center p-10 text-center">
          <div className="text-gray-500 dark:text-gray-400 mb-4">
            <Globe className="h-16 w-16 mx-auto opacity-30" />
          </div>
          <h3 className="text-xl font-bold mb-3">No Live Demo Available</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            This project doesn't have an interactive demo yet. Check back later or visit the live site.
          </p>
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex"
            >
              <Button className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                Visit Live Site
              </Button>
            </a>
          )}
        </div>
      );
    }

    switch (project.demoType) {
      case 'iframe':
        return (
          <div id="demo-container" className="relative w-full bg-gray-50 dark:bg-gray-900 overflow-hidden">
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 z-10">
                <RefreshCw className="h-8 w-8 text-primary animate-spin mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Loading demo...</p>
              </div>
            )}
            <iframe
              id="demo-iframe"
              src={project.demoUrl}
              title={`${project.title} Demo`}
              className="w-full border-0"
              style={{ 
                height: project.demoConfig?.height || '600px',
                opacity: isLoading ? 0 : 1,
                transition: 'opacity 0.3s ease-in-out'
              }}
              allowFullScreen={project.demoConfig?.allowFullscreen}
              onLoad={handleIframeLoad}
            />
            <div className="absolute bottom-4 right-4 flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800"
                onClick={handleRefresh}
                title="Refresh Demo"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800"
                onClick={handleFullscreenToggle}
                title="Toggle Fullscreen"
              >
                <Maximize className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      
      case 'github':
        if (project.repoOwner && project.repoName) {
          const branch = project.demoConfig?.githubBranch || 'main';
          return (
            <div className="w-full">
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <a 
                  href={`https://github.com/${project.repoOwner}/${project.repoName}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button variant="secondary" className="w-full justify-start">
                    <Github className="mr-2 h-4 w-4" />
                    View Repository
                  </Button>
                </a>
                <a 
                  href={`https://github.com/${project.repoOwner}/${project.repoName}/archive/refs/heads/${branch}.zip`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button variant="outline" className="w-full justify-start">
                    <FileCode className="mr-2 h-4 w-4" />
                    Download Source
                  </Button>
                </a>
              </div>
              
              <div className="rounded-lg border bg-card overflow-hidden">
                <div className="bg-muted p-4 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Github className="h-5 w-5" />
                    <span className="font-semibold">{project.repoOwner}/{project.repoName}</span>
                  </div>
                  <Badge variant="outline">
                    Branch: {branch}
                  </Badge>
                </div>
                <div className="p-4">
                  <iframe 
                    src={`https://ghbtns.com/github-btn.html?user=${project.repoOwner}&repo=${project.repoName}&type=star&count=true&size=large`} 
                    frameBorder="0" 
                    scrolling="0" 
                    width="170" 
                    height="30" 
                    title="GitHub Stars"
                  ></iframe>
                </div>
                <div className="border-t">
                  <iframe 
                    src={`https://gh-readme.vercel.app/?user=${project.repoOwner}&repo=${project.repoName}&theme=${project.demoConfig?.theme || 'light'}`}
                    className="w-full h-[400px] border-0"
                    title={`${project.title} README`}
                  ></iframe>
                </div>
              </div>
            </div>
          );
        }
        return (
          <div className="flex flex-col items-center justify-center p-10 text-center">
            <Github className="h-16 w-16 mb-4 text-gray-400" />
            <h3 className="text-xl font-bold mb-2">GitHub Repository</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              The GitHub repository information for this project is incomplete.
            </p>
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
          </div>
        );
      
      case 'video':
        return (
          <div className="w-full">
            <div className="relative pb-[56.25%] overflow-hidden rounded-lg">
              <iframe
                src={project.demoUrl}
                title={`${project.title} Demo Video`}
                className="absolute top-0 left-0 w-full h-full border-0"
                allowFullScreen
              />
            </div>
          </div>
        );
      
      case 'custom':
      default:
        return (
          <div className="flex flex-col items-center justify-center p-10 text-center">
            <Rocket className="h-16 w-16 mb-4 text-primary" />
            <h3 className="text-xl font-bold mb-2">Live Demo</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Experience this project in action by visiting the live site.
            </p>
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="flex items-center">
                  <ArrowUpRight className="mr-2 h-4 w-4" />
                  Launch Live Demo
                </Button>
              </a>
            )}
          </div>
        );
    }
  };

  // Render project tech stack if available
  const renderTechStack = () => {
    if (!project.techStack || project.techStack.length === 0) {
      return (
        <div className="text-center p-8">
          <p className="text-gray-500 dark:text-gray-400">
            Technology stack information is not available for this project.
          </p>
        </div>
      );
    }

    return (
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">Technologies Used</h3>
        <div className="flex flex-wrap gap-2">
          {project.techStack.map((tech) => (
            <Badge key={tech} variant="secondary" className="px-3 py-1">
              {tech}
            </Badge>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardContent className="p-0 overflow-hidden">
        <Tabs defaultValue="demo" className="w-full" onValueChange={setActiveTab}>
          <div className="bg-muted p-2">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="demo" className="flex items-center gap-2">
                <Rocket className="h-4 w-4" />
                <span className="hidden sm:inline">Live Demo</span>
              </TabsTrigger>
              <TabsTrigger value="code" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                <span className="hidden sm:inline">Code</span>
              </TabsTrigger>
              <TabsTrigger value="tech" className="flex items-center gap-2">
                <FileCode className="h-4 w-4" />
                <span className="hidden sm:inline">Technologies</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="demo" className="relative">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {renderDemo()}
            </motion.div>
          </TabsContent>
          
          <TabsContent value="code">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="p-6"
            >
              <h3 className="text-lg font-semibold mb-4">Source Code</h3>
              {project.githubUrl ? (
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-400">
                    The source code for this project is available on GitHub. You can view the repository, star it, or contribute to the project.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" className="flex items-center">
                        <Github className="mr-2 h-4 w-4" />
                        View Repository
                      </Button>
                    </a>
                    {project.repoOwner && project.repoName && (
                      <a
                        href={`https://github.com/${project.repoOwner}/${project.repoName}/archive/refs/heads/${project.demoConfig?.githubBranch || 'main'}.zip`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline" className="flex items-center">
                          <FileCode className="mr-2 h-4 w-4" />
                          Download Source
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-400">
                  The source code for this project is not publicly available.
                </p>
              )}
            </motion.div>
          </TabsContent>
          
          <TabsContent value="tech">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {renderTechStack()}
            </motion.div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ProjectDemo;
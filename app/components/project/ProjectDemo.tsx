import { useState, useEffect } from 'react';
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
    
    // Find all iframes in the container
    const iframes = document.querySelectorAll('iframe');
    
    // Reload each iframe by updating its src with a timestamp
    iframes.forEach(iframe => {
      if (iframe.src) {
        const baseUrl = iframe.src.split('?')[0];
        iframe.src = `${baseUrl}?t=${Date.now()}`;
      }
    });
  };

  // Function to handle fullscreen toggle with cross-browser support
  const handleFullscreenToggle = () => {
    const demoContainer = document.getElementById('demo-container');
    if (!demoContainer) return;
    
    if (!isFullscreen) {
      // Request fullscreen with cross-browser support
      if (demoContainer.requestFullscreen) {
        demoContainer.requestFullscreen();
      } else if ((demoContainer as any).mozRequestFullScreen) { // Firefox
        (demoContainer as any).mozRequestFullScreen();
      } else if ((demoContainer as any).webkitRequestFullscreen) { // Chrome, Safari
        (demoContainer as any).webkitRequestFullscreen();
      } else if ((demoContainer as any).msRequestFullscreen) { // IE/Edge
        (demoContainer as any).msRequestFullscreen();
      }
    } else {
      // Exit fullscreen with cross-browser support
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).mozCancelFullScreen) { // Firefox
        (document as any).mozCancelFullScreen();
      } else if ((document as any).webkitExitFullscreen) { // Chrome, Safari
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) { // IE/Edge
        (document as any).msExitFullscreen();
      }
    }
    
    setIsFullscreen(!isFullscreen);
  };

  // Listen for fullscreen change events with cross-browser support
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).msFullscreenElement
      );
      
      if (isFullscreen !== isCurrentlyFullscreen) {
        setIsFullscreen(isCurrentlyFullscreen);
      }
    };
    
    // Add cross-browser fullscreen change event listeners
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    
    return () => {
      // Clean up event listeners
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [isFullscreen]);

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
              <Button size="lg" className="flex items-center justify-center gap-2 text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3">
                <ExternalLink className="h-4 w-4 shrink-0" />
                <span className="whitespace-nowrap">Visit Live Site</span>
              </Button>
            </a>
          )}
        </div>
      );
    }

    switch (project.demoType) {
      case 'iframe':
        return (
          <div id="demo-container" className="relative w-full bg-gray-50 dark:bg-gray-900 rounded-lg border-0 overflow-hidden shadow-md">
            <iframe
              src={project.liveUrl || project.demoUrl}
              title={`${project.title} Live Demo`}
              className="w-full border-0 transition-opacity duration-300"
              style={{ 
                height: project.demoConfig?.height || '600px',
                opacity: isLoading ? 0 : 1,
                minHeight: '400px',
                display: 'block' // Fix for older browsers
              }}
              allowFullScreen={true}
              onLoad={handleIframeLoad}
              referrerPolicy="no-referrer"
              loading="lazy"
              sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
              // Adding cross-browser fullscreen support with data attributes
              data-mozallowfullscreen="true"
              data-webkitallowfullscreen="true"
              data-msallowfullscreen="true"
            />

            {/* Loading overlay */}
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 z-10">
                <div className="flex flex-col items-center p-6 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg">
                  <RefreshCw className="h-12 w-12 text-primary animate-spin mb-4" />
                  <h3 className="text-xl font-bold">Loading Interactive Demo</h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Preparing your hands-on experience...
                  </p>
                </div>
              </div>
            )}

            {/* Demo overlay for better user experience */}
            <div className="absolute top-0 left-0 w-full bg-gradient-to-b from-white/80 dark:from-gray-900/80 to-transparent h-16 z-10 flex items-center justify-between px-4">
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 rounded-full bg-red-500"></div>
                <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
                <div className="ml-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {project.title} - Live Demo
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 min-h-[32px] min-w-[32px] touch-target"
                  onClick={handleRefresh}
                  title="Refresh Demo"
                  aria-label="Refresh Demo"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 min-h-[32px] min-w-[32px] touch-target"
                  onClick={handleFullscreenToggle}
                  title="Toggle Fullscreen"
                  aria-label="Toggle Fullscreen"
                >
                  <Maximize className="h-4 w-4" />
                </Button>
                <a
                  href={project.liveUrl || project.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-8 px-2 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-accent hover:text-accent-foreground"
                  title="Open in New Tab"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Fallback content if iframe fails to load */}
            <noscript>
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
                <Rocket className="h-16 w-16 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-3">Interactive Demo Available</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md text-center">
                  JavaScript is required to view this demo. Alternatively, you can visit the live site directly.
                </p>
                <a
                  href={project.liveUrl || project.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-2 rounded-md bg-primary text-primary-foreground"
                >
                  <Rocket className="h-5 w-5" />
                  Visit Live Site
                </a>
              </div>
            </noscript>
          </div>
        );
      
      case 'github':
        if (project.repoOwner && project.repoName) {
          const branch = project.demoConfig?.githubBranch || 'main';
          return (
            <div className="w-full">
              {/* If we have a live URL, display a demo preview first */}
              {project.liveUrl && (
                <div className="mb-6">
                  <div id="demo-container" className="relative w-full bg-gray-50 dark:bg-gray-900 rounded-lg border-0 overflow-hidden shadow-md">
                    <iframe
                      src={project.liveUrl}
                      title={`${project.title} Live Demo`}
                      className="w-full border-0 transition-opacity duration-300"
                      style={{ 
                        height: "400px",
                        opacity: isLoading ? 0 : 1,
                        minHeight: '300px',
                        display: 'block' // Fix for older browsers
                      }}
                      allowFullScreen={true}
                      onLoad={handleIframeLoad}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
                      // Adding cross-browser fullscreen support with data attributes
                      data-mozallowfullscreen="true"
                      data-webkitallowfullscreen="true"
                      data-msallowfullscreen="true"
                    />

                    {/* Loading overlay */}
                    {isLoading && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 z-10">
                        <div className="flex flex-col items-center p-6 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg">
                          <RefreshCw className="h-12 w-12 text-primary animate-spin mb-4" />
                          <h3 className="text-xl font-bold">Loading Demo</h3>
                        </div>
                      </div>
                    )}

                    {/* Demo overlay */}
                    <div className="absolute top-0 left-0 w-full bg-gradient-to-b from-white/80 dark:from-gray-900/80 to-transparent h-16 z-10 flex items-center justify-between px-4">
                      <div className="flex items-center space-x-2">
                        <div className="h-3 w-3 rounded-full bg-red-500"></div>
                        <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                        <div className="h-3 w-3 rounded-full bg-green-500"></div>
                        <div className="ml-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                          {project.title} - Preview
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <a
                          href={project.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-8 px-3 py-1 inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90"
                          title="Open Full Demo"
                        >
                          <ArrowUpRight className="h-4 w-4 mr-2" />
                          <span>Full Demo</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <a 
                  href={project.liveUrl || `https://github.com/${project.repoOwner}/${project.repoName}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <Button className="w-full justify-center">
                    <Rocket className="mr-2 h-4 w-4" />
                    {project.liveUrl ? "Launch Live Demo" : "View Project"}
                  </Button>
                </a>
                
                <a 
                  href={`https://github.com/${project.repoOwner}/${project.repoName}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <Button variant="outline" size="lg" className="w-full justify-center text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3">
                    <span className="flex items-center justify-center gap-2">
                      <Github className="h-4 w-4 shrink-0" />
                      <span className="whitespace-nowrap">Source Code</span>
                    </span>
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
                
                <div className="p-6">
                  {project.details && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3">Project Overview</h3>
                      <p className="text-gray-600 dark:text-gray-400">{project.details}</p>
                    </div>
                  )}
                  
                  <div className="flex flex-col gap-4">
                    <h3 className="text-lg font-semibold">Repository Resources</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <a 
                        href={`https://github.com/${project.repoOwner}/${project.repoName}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center justify-center p-3 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <Github className="h-6 w-6 mb-2 text-primary" />
                        <span className="text-sm font-medium">Repository</span>
                      </a>
                      
                      <a 
                        href={`https://github.com/${project.repoOwner}/${project.repoName}/issues`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center justify-center p-3 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <svg className="h-6 w-6 mb-2 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-medium">Issues</span>
                      </a>
                      
                      <a 
                        href={`https://github.com/${project.repoOwner}/${project.repoName}/pulls`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center justify-center p-3 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <svg className="h-6 w-6 mb-2 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        <span className="text-sm font-medium">PRs</span>
                      </a>
                      
                      <a 
                        href={`https://github.com/${project.repoOwner}/${project.repoName}/stargazers`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center justify-center p-3 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <svg className="h-6 w-6 mb-2 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        <span className="text-sm font-medium">Stars</span>
                      </a>
                      
                      <a 
                        href={`https://github.com/${project.repoOwner}/${project.repoName}/network/members`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center justify-center p-3 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <svg className="h-6 w-6 mb-2 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                        <span className="text-sm font-medium">Forks</span>
                      </a>
                      
                      <a 
                        href={`https://github.com/${project.repoOwner}/${project.repoName}/archive/refs/heads/${branch}.zip`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center justify-center p-3 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <FileCode className="h-6 w-6 mb-2 text-primary" />
                        <span className="text-sm font-medium">Download</span>
                      </a>
                    </div>
                  </div>
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
                <Button variant="outline" size="lg" className="flex items-center justify-center gap-2 text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3">
                  <Github className="h-4 w-4 shrink-0" />
                  <span className="whitespace-nowrap">View on GitHub</span>
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
                allowFullScreen={true}
                referrerPolicy="no-referrer"
                loading="lazy"
                data-mozallowfullscreen="true"
                data-webkitallowfullscreen="true"
                data-msallowfullscreen="true"
              />
            </div>
          </div>
        );
      
      case 'custom':
      default:
        // If there's a liveUrl, we'll embed that directly
        if (project.liveUrl) {
          return (
            <div id="demo-container" className="relative w-full bg-gray-50 dark:bg-gray-900 rounded-lg border-0 overflow-hidden shadow-md">
              <iframe
                src={project.liveUrl}
                title={`${project.title} Live Demo`}
                className="w-full border-0 transition-opacity duration-300"
                style={{ 
                  height: project.demoConfig?.height || '600px',
                  opacity: isLoading ? 0 : 1,
                  minHeight: '400px',
                  display: 'block' // Fix for older browsers
                }}
                allowFullScreen={true}
                onLoad={handleIframeLoad}
                referrerPolicy="no-referrer"
                loading="lazy"
                sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
                data-mozallowfullscreen="true"
                data-webkitallowfullscreen="true"
                data-msallowfullscreen="true"
              />

              {/* Loading overlay */}
              {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 z-10">
                  <div className="flex flex-col items-center p-6 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg">
                    <RefreshCw className="h-12 w-12 text-primary animate-spin mb-4" />
                    <h3 className="text-xl font-bold">Loading Interactive Demo</h3>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                      Preparing your hands-on experience...
                    </p>
                  </div>
                </div>
              )}

              {/* Demo overlay for better user experience */}
              <div className="absolute top-0 left-0 w-full bg-gradient-to-b from-white/80 dark:from-gray-900/80 to-transparent h-16 z-10 flex items-center justify-between px-4">
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 rounded-full bg-red-500"></div>
                  <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <div className="ml-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {project.title} - Live Demo
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2"
                    onClick={handleRefresh}
                    title="Refresh Demo"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2"
                    onClick={handleFullscreenToggle}
                    title="Toggle Fullscreen"
                  >
                    <Maximize className="h-4 w-4" />
                  </Button>
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-8 px-2 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-accent hover:text-accent-foreground"
                    title="Open in New Tab"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          );
        } else {
          // Fallback for when there's no live URL
          return (
            <div className="flex flex-col items-center justify-center p-10 text-center">
              <Rocket className="h-16 w-16 mb-4 text-primary" />
              <h3 className="text-xl font-bold mb-2">Live Demo</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                An interactive demo is not available at this moment.
                {project.details && <span> Learn more about this project in the description.</span>}
              </p>
              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2"
                >
                  <Button variant="outline" className="flex items-center">
                    <Github className="mr-2 h-4 w-4" />
                    View Source Code
                  </Button>
                </a>
              )}
            </div>
          );
        }
        
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
                        <Button variant="outline" size="lg" className="flex items-center justify-center gap-2 text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3">
                          <FileCode className="h-4 w-4 shrink-0" />
                          <span className="whitespace-nowrap">Download Source</span>
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

export default ProjectDemo;={{ duration: 0.3 }}
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
import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Github, Share2 } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  demoUrl?: string;
  githubUrl?: string;
  imageUrl?: string;
}

interface Recommendation {
  project: Project;
  score: number;
  reason: string;
}

interface ProjectRecommendationResultsProps {
  recommendations: Recommendation[];
  explanation: string;
}

const ProjectRecommendationResults: React.FC<ProjectRecommendationResultsProps> = ({
  recommendations,
  explanation
}) => {
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md text-center">
        <h3 className="text-xl font-semibold mb-4">No Matching Projects Found</h3>
        <p className="text-gray-600 dark:text-gray-300">
          We couldn't find projects matching your criteria. Try adjusting your preferences or interests.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-100 dark:border-blue-800">
        <h3 className="text-xl font-semibold mb-3 text-blue-800 dark:text-blue-300">Recommendation Summary</h3>
        <p className="text-gray-700 dark:text-gray-300">{explanation}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {recommendations.map((recommendation, index) => (
          <motion.div
            key={recommendation.project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="h-full flex flex-col overflow-hidden hover:shadow-lg transition-shadow">
              {recommendation.project.imageUrl && (
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={recommendation.project.imageUrl}
                    alt={recommendation.project.title}
                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="bg-blue-500 text-white font-semibold">
                      {recommendation.score}% Match
                    </Badge>
                  </div>
                </div>
              )}
              
              <CardHeader className={recommendation.project.imageUrl ? 'pt-4' : ''}>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{recommendation.project.title}</CardTitle>
                    <CardDescription>{recommendation.project.category}</CardDescription>
                  </div>
                  
                  {!recommendation.project.imageUrl && (
                    <Badge variant="secondary" className="bg-blue-500 text-white font-semibold">
                      {recommendation.score}% Match
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="flex-grow">
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {recommendation.project.description}
                </p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {recommendation.project.tags.map((tag, tagIndex) => (
                    <Badge key={tagIndex} variant="outline" className="bg-gray-100 dark:bg-gray-800">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <Separator className="my-4" />
                
                <div>
                  <h4 className="text-sm font-semibold mb-2 text-gray-500 dark:text-gray-400">Why this project:</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {recommendation.reason}
                  </p>
                </div>
              </CardContent>
              
              <CardFooter className="flex gap-2 pt-2">
                {recommendation.project.demoUrl && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex-1"
                          onClick={() => window.open(recommendation.project.demoUrl, '_blank')}
                        >
                          <ExternalLink size={16} className="mr-1" />
                          View Demo
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>See the live demo</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                
                {recommendation.project.githubUrl && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex-1"
                          onClick={() => window.open(recommendation.project.githubUrl, '_blank')}
                        >
                          <Github size={16} className="mr-1" />
                          GitHub
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>View source code</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const url = window.location.href.split('?')[0];
                          navigator.clipboard.writeText(`${url}?project=${recommendation.project.id}`);
                        }}
                      >
                        <Share2 size={16} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Copy link to this project</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ProjectRecommendationResults;
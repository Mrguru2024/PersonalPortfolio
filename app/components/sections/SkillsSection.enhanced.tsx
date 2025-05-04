"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import ThumbsUp from "lucide-react/dist/esm/icons/thumbs-up";
import Award from "lucide-react/dist/esm/icons/award";
import Star from "lucide-react/dist/esm/icons/star";
import Github from "lucide-react/dist/esm/icons/github";
import RefreshCw from "lucide-react/dist/esm/icons/refresh-cw";
import { useToast } from "@/hooks/use-toast";
import SkillEndorsementModal from "@/components/SkillEndorsementModal.fixed";
import SkillEndorsementCard from "@/components/SkillEndorsementCard.fixed";
import { cn } from "@/lib/utils";

// Define the DB skill type based on the real DB schema
type DBSkill = {
  id: number;
  name: string;
  category: string;
  percentage: number;
  endorsement_count: number;
};

export default function SkillsSection() {
  const [activeCategory, setActiveCategory] = useState<string>("frontend");
  const [skills, setSkills] = useState<Record<string, DBSkill[]>>({
    frontend: [],
    backend: [],
    other: [],
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSkill, setSelectedSkill] = useState<DBSkill | null>(null);
  const [isEndorsementModalOpen, setIsEndorsementModalOpen] = useState(false);
  const [isGithubSyncing, setIsGithubSyncing] = useState(false);
  const [githubSyncComplete, setGithubSyncComplete] = useState(false);
  const [githubUpdatedSkills, setGithubUpdatedSkills] = useState<string[]>([]);
  
  const { toast } = useToast();
  
  console.log("Skills component initialized");
  
  // Fetch skills from the API
  useEffect(() => {
    async function fetchSkills() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/skills");
        
        if (!response.ok) {
          throw new Error("Failed to fetch skills");
        }
        
        const data = await response.json();
        
        // Group skills by category
        const groupedSkills: Record<string, DBSkill[]> = {
          frontend: [],
          backend: [],
          other: [],
        };
        
        // Frontend skills from API response
        if (data.frontend && Array.isArray(data.frontend)) {
          groupedSkills.frontend = data.frontend;
        }
        
        // Backend skills from API response
        if (data.backend && Array.isArray(data.backend)) {
          groupedSkills.backend = data.backend;
        }
        
        // DevOps skills from API response (mapped to "other")
        if (data.devops && Array.isArray(data.devops)) {
          groupedSkills.other = data.devops;
        }
        
        setSkills(groupedSkills);
      } catch (error) {
        console.error("Error fetching skills:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchSkills();
  }, []);
  
  // Sync with GitHub data
  const syncWithGithub = async () => {
    try {
      setIsGithubSyncing(true);
      toast({
        title: "Syncing with GitHub",
        description: "Fetching your latest GitHub data to update skills...",
      });
      
      const response = await fetch("/api/github-skills");
      
      if (!response.ok) {
        throw new Error("Failed to sync with GitHub");
      }
      
      const data = await response.json();
      
      // Find which skills were updated from GitHub
      const updatedSkillNames = data.skills
        .filter((skill: any) => skill.githubUpdated)
        .map((skill: any) => skill.name);
      
      setGithubSyncComplete(true);
      setGithubUpdatedSkills(updatedSkillNames);
      
      // If skills were updated, refresh the skills data
      if (updatedSkillNames.length > 0) {
        // Re-fetch skills to get the updated values
        const refreshResponse = await fetch("/api/skills");
        if (refreshResponse.ok) {
          const refreshedData = await refreshResponse.json();
          
          // Group skills again
          const refreshedGroupedSkills: Record<string, DBSkill[]> = {
            frontend: [],
            backend: [],
            other: [],
          };
          
          if (refreshedData.frontend && Array.isArray(refreshedData.frontend)) {
            refreshedGroupedSkills.frontend = refreshedData.frontend;
          }
          
          if (refreshedData.backend && Array.isArray(refreshedData.backend)) {
            refreshedGroupedSkills.backend = refreshedData.backend;
          }
          
          if (refreshedData.devops && Array.isArray(refreshedData.devops)) {
            refreshedGroupedSkills.other = refreshedData.devops;
          }
          
          setSkills(refreshedGroupedSkills);
        }
        
        toast({
          title: "GitHub Sync Complete",
          description: `Updated ${updatedSkillNames.length} skills based on your GitHub activity.`,
          variant: "default",
        });
      } else {
        toast({
          title: "GitHub Sync Complete",
          description: "Your skills are already up to date with your GitHub activity.",
        });
      }
    } catch (error) {
      console.error("Error syncing with GitHub:", error);
      toast({
        title: "GitHub Sync Failed",
        description: error instanceof Error ? error.message : "An error occurred while syncing with GitHub",
        variant: "destructive",
      });
    } finally {
      setIsGithubSyncing(false);
      
      // Reset the completion state after a delay
      setTimeout(() => {
        setGithubSyncComplete(false);
        setGithubUpdatedSkills([]);
      }, 5000);
    }
  };
  
  // Handle endorsement modal
  const openEndorsementModal = (skill: DBSkill) => {
    setSelectedSkill(skill);
    setIsEndorsementModalOpen(true);
  };
  
  const closeEndorsementModal = () => {
    setIsEndorsementModalOpen(false);
  };
  
  const handleEndorsementSubmitted = () => {
    toast({
      title: "Endorsement Submitted",
      description: `Thank you for endorsing ${selectedSkill?.name}!`,
    });
    
    // Refresh skills data after endorsement
    // In a real scenario, you would fetch the updated data here
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };
  
  const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24,
      },
    },
  };

  return (
    <section id="skills" className="section bg-card relative overflow-hidden">
      <div className="container-custom">
        {/* Section header */}
        <div className="text-center mb-16">
          <motion.h2 
            className="heading-lg mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            My <span className="gradient-text">Skills</span>
          </motion.h2>
          <motion.p 
            className="text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            I've worked with a variety of technologies across the full stack.
            Here's a breakdown of my technical expertise. Feel free to endorse skills
            you've seen me demonstrate!
          </motion.p>
          
          {/* GitHub sync button */}
          <motion.div
            className="flex justify-center mt-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Button
              variant="outline"
              onClick={syncWithGithub}
              disabled={isGithubSyncing}
              className={cn(
                "flex items-center gap-2 transition-all duration-300",
                githubSyncComplete && "bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
              )}
            >
              {isGithubSyncing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Syncing with GitHub...
                </>
              ) : githubSyncComplete ? (
                <>
                  <RefreshCw className="h-4 w-4" />
                  GitHub Sync Complete!
                </>
              ) : (
                <>
                  <Github className="h-4 w-4" />
                  Sync with GitHub Activity
                </>
              )}
            </Button>
          </motion.div>
          
          {/* Alert for GitHub updated skills */}
          <AnimatePresence>
            {githubSyncComplete && githubUpdatedSkills.length > 0 && (
              <motion.div
                className="mt-4"
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Alert variant="default" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                  <RefreshCw className="h-4 w-4" />
                  <AlertTitle>Skills updated from GitHub!</AlertTitle>
                  <AlertDescription>
                    Updated skills: {githubUpdatedSkills.join(", ")}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Skills tabs */}
        <Tabs 
          defaultValue="frontend" 
          className="w-full"
          onValueChange={setActiveCategory}
        >
          <div className="flex justify-center mb-8">
            <TabsList className="bg-background/50 backdrop-blur-sm">
              <TabsTrigger 
                value="frontend"
                className="data-[state=active]:text-primary data-[state=active]:font-medium"
              >
                Frontend
              </TabsTrigger>
              <TabsTrigger 
                value="backend"
                className="data-[state=active]:text-primary data-[state=active]:font-medium"
              >
                Backend
              </TabsTrigger>
              <TabsTrigger 
                value="other"
                className="data-[state=active]:text-primary data-[state=active]:font-medium"
              >
                DevOps & Tools
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* Loading state */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-background/80 backdrop-blur-sm p-6 rounded-lg border border-border animate-pulse">
                  <div className="flex justify-between items-center mb-3">
                    <div className="h-5 w-32 bg-muted rounded"></div>
                    <div className="h-4 w-8 bg-muted rounded"></div>
                  </div>
                  <div className="h-2 bg-muted rounded w-full"></div>
                  <div className="mt-4 flex justify-between items-center">
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <div key={star} className="w-4 h-4 bg-muted rounded-full"></div>
                      ))}
                    </div>
                    <div className="h-8 w-20 bg-muted rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Frontend skills */}
              <TabsContent value="frontend">
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  variants={containerVariants}
                  initial="hidden"
                  animate={activeCategory === "frontend" ? "visible" : "hidden"}
                >
                  {skills.frontend.map((skill) => (
                    <SkillCard 
                      key={skill.id} 
                      skill={skill} 
                      onEndorse={openEndorsementModal}
                      isUpdatedFromGithub={githubUpdatedSkills.includes(skill.name)}
                    />
                  ))}
                </motion.div>
              </TabsContent>
              
              {/* Backend skills */}
              <TabsContent value="backend">
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  variants={containerVariants}
                  initial="hidden"
                  animate={activeCategory === "backend" ? "visible" : "hidden"}
                >
                  {skills.backend.map((skill) => (
                    <SkillCard 
                      key={skill.id} 
                      skill={skill} 
                      onEndorse={openEndorsementModal} 
                      isUpdatedFromGithub={githubUpdatedSkills.includes(skill.name)}
                    />
                  ))}
                </motion.div>
              </TabsContent>
              
              {/* Other skills */}
              <TabsContent value="other">
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  variants={containerVariants}
                  initial="hidden"
                  animate={activeCategory === "other" ? "visible" : "hidden"}
                >
                  {skills.other.map((skill) => (
                    <SkillCard 
                      key={skill.id} 
                      skill={skill} 
                      onEndorse={openEndorsementModal}
                      isUpdatedFromGithub={githubUpdatedSkills.includes(skill.name)}
                    />
                  ))}
                </motion.div>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
      
      {/* Endorsement modal */}
      {selectedSkill && (
        <SkillEndorsementModal 
          skill={selectedSkill} 
          isOpen={isEndorsementModalOpen} 
          onClose={closeEndorsementModal}
          onEndorsementSubmitted={handleEndorsementSubmitted}
        />
      )}
      
      {/* Featured endorsements - only show when we have data */}
      {!isLoading && skills.frontend.length > 0 && (
        <div className="mt-16 container-custom">
          <motion.h3 
            className="text-xl font-medium text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Featured Skill Endorsements
          </motion.h3>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {/* Display featured endorsements */}
            <SkillEndorsementCard skill={skills.frontend[0]} />
            {skills.backend.length > 0 && (
              <SkillEndorsementCard skill={skills.backend[0]} />
            )}
            {skills.frontend.length > 1 && (
              <SkillEndorsementCard skill={skills.frontend[1]} />
            )}
          </motion.div>
        </div>
      )}
      
      {/* Background elements */}
      <div className="absolute -z-10 -bottom-40 -left-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute -z-10 -right-40 -top-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
    </section>
  );
}

// Separate SkillCard component for better organization
function SkillCard({ 
  skill, 
  onEndorse,
  isUpdatedFromGithub = false
}: { 
  skill: DBSkill; 
  onEndorse: (skill: DBSkill) => void;
  isUpdatedFromGithub?: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  
  // Animation for the progress bar
  const progressVariants = {
    initial: { width: 0 },
    animate: { 
      width: `${skill.percentage}%`,
      transition: { 
        duration: 1.2, 
        ease: "easeOut",
        delay: 0.3
      }
    }
  };
  
  return (
    <motion.div 
      ref={ref}
      className={cn(
        "bg-background/80 backdrop-blur-sm p-6 rounded-lg border border-border transition-all duration-300",
        isHovered && "shadow-md border-primary/30",
        isUpdatedFromGithub && "ring-2 ring-green-400/30 dark:ring-green-500/20"
      )}
      variants={isInView ? {
        hidden: { x: -20, opacity: 0 },
        visible: {
          x: 0,
          opacity: 1,
          transition: {
            type: "spring",
            stiffness: 300,
            damping: 24,
            delay: Math.random() * 0.3
          }
        }
      } : {}}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium flex items-center">
          <motion.span
            animate={isHovered ? { color: "#3b82f6" } : { color: "" }}
            transition={{ duration: 0.3 }}
          >
            {skill.name}
          </motion.span>
          
          {isUpdatedFromGithub && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="ml-2 bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                    <Github className="h-3 w-3 mr-1" />
                    Updated
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Updated based on your GitHub activity</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {skill.endorsement_count > 0 && !isUpdatedFromGithub && (
            <div className="ml-2 flex items-center text-xs text-primary">
              <Award size={14} className="mr-1" />
              <span>{skill.endorsement_count}</span>
            </div>
          )}
        </h3>
        <span className="text-sm text-muted-foreground">{skill.percentage}%</span>
      </div>
      
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-gradient-to-r from-primary to-blue-400"
          initial="initial"
          animate={isInView ? "animate" : "initial"}
          variants={progressVariants}
        />
      </div>
      
      <div className="mt-4 flex justify-between items-center">
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map(star => (
            <Star 
              key={star}
              size={16}
              className={cn(
                star <= Math.min(5, Math.ceil(skill.percentage / 20)) 
                  ? "text-yellow-400 fill-yellow-400" 
                  : "text-gray-300",
                "transition-transform duration-300",
                isHovered && star <= Math.min(5, Math.ceil(skill.percentage / 20)) && "animate-pulse"
              )} 
            />
          ))}
          <span className="ml-2 text-xs font-medium text-muted-foreground">
            {getRating(skill.percentage)}
          </span>
        </div>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                size="sm" 
                variant="outline"
                className="flex items-center gap-1 text-xs"
                onClick={() => onEndorse(skill)}
              >
                <ThumbsUp size={14} /> Endorse
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Endorse {skill.name} if you've seen me demonstrate this skill</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </motion.div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skill } from "@/shared/schema";
import ThumbsUp from "lucide-react/dist/esm/icons/thumbs-up";
import Award from "lucide-react/dist/esm/icons/award";
import Star from "lucide-react/dist/esm/icons/star";
import SkillEndorsementModal from "@/components/SkillEndorsementModal";
import SkillEndorsementCard from "@/components/SkillEndorsementCard";
import { useToast } from "@/hooks/use-toast";
import { getMockSkills } from "@/lib/mock-skills";

export default function SkillsSection() {
  const [activeCategory, setActiveCategory] = useState<string>("frontend");
  const [skills, setSkills] = useState<Record<string, Skill[]>>({
    frontend: [],
    backend: [],
    other: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [isEndorsementModalOpen, setIsEndorsementModalOpen] = useState(false);
  const { toast } = useToast();
  
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
        const groupedSkills: Record<string, Skill[]> = {
          frontend: [],
          backend: [],
          other: [],
        };
        
        data.forEach((skill: Skill) => {
          const category = skill.category.toLowerCase();
          if (groupedSkills[category]) {
            groupedSkills[category].push(skill);
          } else {
            groupedSkills.other.push(skill);
          }
        });
        
        setSkills(groupedSkills);
      } catch (error) {
        console.error("Error fetching skills:", error);
        // Fallback to mock data if API call fails
        setSkills(getMockSkills());
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchSkills();
  }, []);
  
  // Handle endorsement modal
  const openEndorsementModal = (skill: Skill) => {
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
    // You would typically fetch the updated skills here
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
        duration: 0.5,
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
          
          {/* Frontend skills */}
          <TabsContent value="frontend">
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
              variants={containerVariants}
              initial="hidden"
              animate={activeCategory === "frontend" ? "visible" : "hidden"}
            >
              {skills.frontend.map((skill) => (
                <motion.div 
                  key={skill.id}
                  className="bg-background/80 backdrop-blur-sm p-6 rounded-lg border border-border"
                  variants={itemVariants}
                >
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium flex items-center">
                      {skill.name}
                      {skill.endorsementCount > 0 && (
                        <div className="ml-2 flex items-center text-xs text-primary">
                          <Award size={14} className="mr-1" />
                          <span>{skill.endorsementCount}</span>
                        </div>
                      )}
                    </h3>
                    <span className="text-sm text-muted-foreground">{skill.proficiency}%</span>
                  </div>
                  
                  <Progress 
                    value={skill.proficiency} 
                    className="h-2 bg-muted"
                  />
                  
                  <div className="mt-4 flex justify-between items-center">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star 
                          key={star}
                          size={16}
                          className={star <= Math.min(5, Math.ceil(skill.proficiency / 20)) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} 
                        />
                      ))}
                    </div>
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="flex items-center gap-1 text-xs"
                      onClick={() => openEndorsementModal(skill)}
                    >
                      <ThumbsUp size={14} /> Endorse
                    </Button>
                  </div>
                </motion.div>
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
                <motion.div 
                  key={skill.id}
                  className="bg-background/80 backdrop-blur-sm p-6 rounded-lg border border-border"
                  variants={itemVariants}
                >
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium flex items-center">
                      {skill.name}
                      {skill.endorsementCount > 0 && (
                        <div className="ml-2 flex items-center text-xs text-primary">
                          <Award size={14} className="mr-1" />
                          <span>{skill.endorsementCount}</span>
                        </div>
                      )}
                    </h3>
                    <span className="text-sm text-muted-foreground">{skill.proficiency}%</span>
                  </div>
                  
                  <Progress 
                    value={skill.proficiency} 
                    className="h-2 bg-muted"
                  />
                  
                  <div className="mt-4 flex justify-between items-center">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star 
                          key={star}
                          size={16}
                          className={star <= Math.min(5, Math.ceil(skill.proficiency / 20)) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} 
                        />
                      ))}
                    </div>
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="flex items-center gap-1 text-xs"
                      onClick={() => openEndorsementModal(skill)}
                    >
                      <ThumbsUp size={14} /> Endorse
                    </Button>
                  </div>
                </motion.div>
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
                <motion.div 
                  key={skill.id}
                  className="bg-background/80 backdrop-blur-sm p-6 rounded-lg border border-border"
                  variants={itemVariants}
                >
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium flex items-center">
                      {skill.name}
                      {skill.endorsementCount > 0 && (
                        <div className="ml-2 flex items-center text-xs text-primary">
                          <Award size={14} className="mr-1" />
                          <span>{skill.endorsementCount}</span>
                        </div>
                      )}
                    </h3>
                    <span className="text-sm text-muted-foreground">{skill.proficiency}%</span>
                  </div>
                  
                  <Progress 
                    value={skill.proficiency} 
                    className="h-2 bg-muted"
                  />
                  
                  <div className="mt-4 flex justify-between items-center">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star 
                          key={star}
                          size={16}
                          className={star <= Math.min(5, Math.ceil(skill.proficiency / 20)) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} 
                        />
                      ))}
                    </div>
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="flex items-center gap-1 text-xs"
                      onClick={() => openEndorsementModal(skill)}
                    >
                      <ThumbsUp size={14} /> Endorse
                    </Button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </TabsContent>
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
      
      {/* Featured endorsements */}
      <div className="mt-16">
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
          {/* We'd normally fetch and display actual endorsements here */}
          <SkillEndorsementCard skill={skills.frontend[0] || {
            id: 1,
            name: "React / Next.js",
            category: "frontend",
            proficiency: 95,
            endorsementCount: 0,
            icon: null,
            color: null,
            yearsOfExperience: 3,
            createdAt: new Date(),
            updatedAt: new Date(),
          }} />
          
          <SkillEndorsementCard skill={skills.backend[0] || {
            id: 9,
            name: "Node.js",
            category: "backend",
            proficiency: 90,
            endorsementCount: 0,
            icon: null,
            color: null,
            yearsOfExperience: 3,
            createdAt: new Date(),
            updatedAt: new Date(),
          }} />
          
          <SkillEndorsementCard skill={skills.frontend[1] || {
            id: 2,
            name: "TypeScript",
            category: "frontend",
            proficiency: 90,
            endorsementCount: 0,
            icon: null,
            color: null,
            yearsOfExperience: 2,
            createdAt: new Date(),
            updatedAt: new Date(),
          }} />
        </motion.div>
      </div>
      
      {/* Background elements */}
      <div className="absolute -z-10 -bottom-40 -left-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute -z-10 -right-40 -top-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
    </section>
  );
}
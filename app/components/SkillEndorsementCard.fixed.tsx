"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import Star from "lucide-react/dist/esm/icons/star";
import MessageSquare from "lucide-react/dist/esm/icons/message-square";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

type DBSkill = {
  id: number;
  name: string;
  category: string;
  percentage: number;
  endorsement_count: number;
};

type SkillEndorsement = {
  id: number;
  skillId: number;
  name: string;
  email: string;
  comment?: string | null;
  rating: number;
  createdAt: string;
  ipAddress?: string | null;
};

interface SkillEndorsementCardProps {
  skill: DBSkill;
}

export default function SkillEndorsementCard({ skill }: SkillEndorsementCardProps) {
  const [endorsements, setEndorsements] = useState<SkillEndorsement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [displayedEndorsement, setDisplayedEndorsement] = useState<SkillEndorsement | null>(null);
  
  useEffect(() => {
    async function fetchEndorsements() {
      try {
        setIsLoading(true);
        
        // If the skill has no endorsements, don't make the request
        if (skill.endorsement_count === 0) {
          setIsLoading(false);
          return;
        }
        
        const response = await fetch(`/api/skills/${skill.id}/endorsements`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch endorsements");
        }
        
        const data = await response.json();
        setEndorsements(data);
        
        // Select a random endorsement to display
        if (data.length > 0) {
          const randomIndex = Math.floor(Math.random() * data.length);
          setDisplayedEndorsement(data[randomIndex]);
        }
      } catch (error) {
        console.error("Error fetching endorsements:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchEndorsements();
  }, [skill.id, skill.endorsement_count]);
  
  // If there are no endorsements, show a placeholder
  if (skill.endorsement_count === 0) {
    return (
      <Card className="bg-background/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-primary">{skill.name}</h3>
            <Badge variant="outline">{skill.category}</Badge>
          </div>
          
          <div className="text-center py-6 text-muted-foreground">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No endorsements yet</p>
            <p className="text-xs mt-1">Be the first to endorse this skill!</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // If loading, show a skeleton
  if (isLoading) {
    return (
      <Card className="bg-background/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-3">
            <div className="h-5 w-24 bg-muted rounded animate-pulse"></div>
            <div className="h-5 w-16 bg-muted rounded animate-pulse"></div>
          </div>
          
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse mr-2"></div>
              <div className="h-4 w-36 bg-muted rounded animate-pulse"></div>
            </div>
            
            <div className="h-3 w-full bg-muted rounded animate-pulse my-2"></div>
            <div className="h-3 w-4/5 bg-muted rounded animate-pulse my-2"></div>
            
            <div className="flex mt-3">
              {[1, 2, 3, 4, 5].map(index => (
                <div key={index} className="w-4 h-4 mr-1 bg-muted rounded-full animate-pulse"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // If there's a displayed endorsement, show it
  if (displayedEndorsement) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-background/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium text-primary">{skill.name}</h3>
              <Badge variant="outline">{skill.category}</Badge>
            </div>
            
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {displayedEndorsement.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-sm">{displayedEndorsement.name}</span>
              </div>
              
              {displayedEndorsement.comment && (
                <p className="text-sm text-muted-foreground italic">
                  "{displayedEndorsement.comment}"
                </p>
              )}
              
              <div className="flex mt-3">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star 
                    key={star}
                    size={16}
                    className={star <= displayedEndorsement.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} 
                  />
                ))}
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground text-right">
              {skill.endorsement_count} endorsement{skill.endorsement_count !== 1 ? 's' : ''}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }
  
  // Fallback (although this should not happen)
  return null;
}
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Star from "lucide-react/dist/esm/icons/star";
import MessageCircle from "lucide-react/dist/esm/icons/message-circle";
import Heart from "lucide-react/dist/esm/icons/heart";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import ChevronUp from "lucide-react/dist/esm/icons/chevron-up";
import { Skill } from "@/shared/schema";

// Define the type for skill endorsements since we don't have direct access from the schema
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
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface SkillEndorsementCardProps {
  skill: Skill;
}

export default function SkillEndorsementCard({ skill }: SkillEndorsementCardProps) {
  const [endorsements, setEndorsements] = useState<SkillEndorsement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(false);
  
  // Fetch endorsements for this skill
  useEffect(() => {
    async function fetchEndorsements() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/skill-endorsements?skillId=${skill.id}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch endorsements");
        }
        
        const data = await response.json();
        setEndorsements(data);
      } catch (err) {
        console.error("Error fetching endorsements:", err);
        setError("Failed to load endorsements");
      } finally {
        setIsLoading(false);
      }
    }
    
    if (skill.id) {
      fetchEndorsements();
    }
  }, [skill.id]);
  
  // Get the initials for the avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Format the date
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return "recently";
    }
  };
  
  if (isLoading) {
    return (
      <div className="mt-6 text-center py-8">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-40 bg-muted rounded-md mb-4"></div>
          <div className="h-4 w-60 bg-muted rounded-md"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="mt-6 text-center py-8">
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }
  
  if (endorsements.length === 0) {
    return (
      <div className="mt-6 text-center py-8">
        <p className="text-muted-foreground">No endorsements yet. Be the first to endorse!</p>
      </div>
    );
  }
  
  // Display a limited number of endorsements by default
  const visibleEndorsements = showMore ? endorsements : endorsements.slice(0, 3);
  
  return (
    <div className="mt-6 space-y-4">
      <h4 className="font-medium flex items-center gap-2">
        <MessageCircle size={18} />
        Recent Endorsements <span className="text-muted-foreground">({endorsements.length})</span>
      </h4>
      
      {visibleEndorsements.map((endorsement) => (
        <motion.div
          key={endorsement.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card/50 p-4 rounded-lg border border-border"
        >
          <div className="flex justify-between items-start">
            <div className="flex gap-3">
              <Avatar className="h-10 w-10 border border-border">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(endorsement.name)}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <h5 className="font-medium">{endorsement.name}</h5>
                <div className="flex items-center mt-1 text-sm text-muted-foreground">
                  <div className="flex mr-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={`${
                          i < endorsement.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs">
                    {formatDate(endorsement.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {endorsement.comment && (
            <p className="mt-3 text-sm text-muted-foreground">
              {endorsement.comment}
            </p>
          )}
        </motion.div>
      ))}
      
      {endorsements.length > 3 && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-2"
          onClick={() => setShowMore(!showMore)}
        >
          {showMore ? (
            <span className="flex items-center">
              Show Less <ChevronUp className="ml-1 h-4 w-4" />
            </span>
          ) : (
            <span className="flex items-center">
              Show More <ChevronDown className="ml-1 h-4 w-4" />
            </span>
          )}
        </Button>
      )}
    </div>
  );
}
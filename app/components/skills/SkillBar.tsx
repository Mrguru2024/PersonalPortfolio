import React, { useState } from 'react';
import { type Skill } from '@shared/schema';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ThumbsUp } from 'lucide-react';
import SkillEndorsementModal from './SkillEndorsementModal';

interface SkillBarProps {
  skill: Skill;
  barColor?: string;
  onEndorsementSubmitted?: () => void;
}

const SkillBar: React.FC<SkillBarProps> = ({ 
  skill, 
  barColor = "bg-gradient-to-r from-primary to-blue-400", 
  onEndorsementSubmitted 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleEndorsementClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    if (onEndorsementSubmitted) {
      onEndorsementSubmitted();
    }
  };

  return (
    <div className="mb-4 relative">
      <div className="flex justify-between items-center mb-1.5">
        <div className="text-sm font-medium">{skill.name}</div>
        <div className="flex items-center">
          {skill.endorsement_count > 0 && (
            <div 
              className="flex items-center text-xs text-muted-foreground mr-2"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <ThumbsUp className="h-3 w-3 mr-1" />
              <span>{skill.endorsement_count}</span>
              
              {showTooltip && (
                <div className="absolute -top-8 right-12 bg-popover text-popover-foreground shadow-md rounded-md px-2 py-1 text-xs z-50">
                  {skill.endorsement_count} {skill.endorsement_count === 1 ? 'person has' : 'people have'} endorsed this skill
                </div>
              )}
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 rounded-full"
            onClick={handleEndorsementClick}
            title="Endorse this skill"
          >
            <ThumbsUp className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
        <div 
          className={`skill-bar-${skill.category} h-2.5 rounded-full`}
          style={{ width: `${skill.percentage}%` }}
        />
      </div>
      
      {isModalOpen && (
        <SkillEndorsementModal
          skill={skill}
          isOpen={isModalOpen}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};

export default SkillBar;
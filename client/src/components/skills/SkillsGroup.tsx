import React from 'react';
import { type Skill } from '@shared/schema';
import SkillBar from './SkillBar';
import { useQuery } from '@tanstack/react-query';

interface SkillsGroupProps {
  title: string;
  skills: Skill[];
  icon?: React.ReactNode;
  barColor?: string;
}

const SkillsGroup: React.FC<SkillsGroupProps> = ({ 
  title, 
  skills, 
  barColor = "bg-gradient-to-r from-primary to-blue-400" 
}) => {
  // We'll refetch skills when endorsements are submitted
  const { refetch: refetchSkills } = useQuery({
    queryKey: ['/api/skills'],
    queryFn: async () => {
      const response = await fetch('/api/skills');
      if (!response.ok) {
        throw new Error('Failed to fetch skills');
      }
      return response.json();
    },
    // We're only using this for refetch capabilities, so don't load initially
    enabled: false,
  });

  const handleEndorsementSubmitted = () => {
    // Refetch skills to get updated endorsement counts
    refetchSkills();
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 h-full">
      <h3 className="text-xl font-bold mb-5">{title}</h3>
      
      <div className="space-y-2">
        {skills.map((skill) => (
          <SkillBar 
            key={skill.id} 
            skill={skill} 
            barColor={barColor} 
            onEndorsementSubmitted={handleEndorsementSubmitted}
          />
        ))}
      </div>
    </div>
  );
};

export default SkillsGroup;
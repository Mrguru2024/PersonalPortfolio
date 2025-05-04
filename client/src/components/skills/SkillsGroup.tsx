import React, { ReactNode } from 'react';
import { type Skill } from '@shared/schema';
import SkillBar from './SkillBar';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';

interface SkillsGroupProps {
  title: string;
  skills: Skill[];
  icon?: ReactNode;
  barColor?: string;
}

const SkillsGroup: React.FC<SkillsGroupProps> = ({ 
  title, 
  skills, 
  icon, 
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
    <motion.div 
      className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 transition-all hover:shadow-xl h-full relative overflow-hidden"
      whileHover={{ 
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        y: -5
      }}
      transition={{ type: "spring", stiffness: 300, damping: 15 }}
    >
      {/* Background decoration */}
      <motion.div 
        className="absolute -right-16 -bottom-16 h-32 w-32 rounded-full bg-blue-50 dark:bg-blue-900/20 opacity-50 dark:opacity-30"
        initial={{ scale: 0.8 }}
        animate={{ 
          scale: [0.8, 1.1, 0.8],
          rotate: [0, 10, 0]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          repeatType: "reverse"
        }}
      />
      
      {icon && (
        <motion.div
          className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 flex items-center justify-center mb-4 shadow-sm group-hover:shadow"
          whileHover={{ 
            scale: 1.1,
            rotate: 5 
          }}
        >
          {icon}
        </motion.div>
      )}
      
      <motion.h3 
        className="text-xl font-bold mb-5 relative inline-block"
        initial={{ opacity: 1 }}
        whileHover={{ scale: 1.03 }}
      >
        {title}
        <motion.div 
          className="absolute -bottom-1 left-0 right-0 h-[3px] bg-gradient-to-r from-primary/40 to-transparent rounded-full"
          initial={{ width: "30%" }}
          whileHover={{ width: "100%" }}
          transition={{ duration: 0.3 }}
        />
      </motion.h3>
      
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
    </motion.div>
  );
};

export default SkillsGroup;
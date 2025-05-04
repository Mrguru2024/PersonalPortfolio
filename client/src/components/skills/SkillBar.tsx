import React, { useState, useRef } from 'react';
import { type Skill } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { ThumbsUp, CheckCircle2 } from 'lucide-react';
import SkillEndorsementModal from './SkillEndorsementModal';
import { motion, useInView, AnimatePresence } from 'framer-motion';

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
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

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

  // Rating system based on percentage
  const getRating = (percentage: number) => {
    if (percentage >= 90) return 'Expert';
    if (percentage >= 80) return 'Advanced';
    if (percentage >= 65) return 'Proficient';
    if (percentage >= 50) return 'Competent';
    return 'Familiar';
  };

  return (
    <motion.div 
      ref={ref}
      className="mb-4 relative group"
      initial={{ opacity: 0, y: 10 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex justify-between items-center mb-1.5">
        <motion.div
          className="flex items-center mb-1"
          initial={{ x: -5 }}
          animate={isInView ? { x: 0 } : { x: -5 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <motion.span 
            className="text-sm font-medium relative"
            style={{
              color: isHovered ? 'var(--primary)' : 'var(--foreground)',
              textShadow: isHovered ? '0 0 8px rgba(59, 130, 246, 0.3)' : 'none'
            }}
            transition={{ duration: 0.2 }}
          >
            {skill.name}
            <AnimatePresence>
              {isHovered && (
                <motion.span
                  className="absolute -left-5 text-primary"
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.span>
        </motion.div>
        
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
          <div className="flex items-center gap-1.5 mb-1">
            <motion.span 
              className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              style={{
                color: isHovered ? 'var(--primary)' : 'var(--muted-foreground)',
                backgroundColor: isHovered ? 'rgba(59, 130, 246, 0.1)' : ''
              }}
            >
              {getRating(skill.percentage)}
            </motion.span>
            
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
      </div>
      
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
        <motion.div
          className={`${barColor} h-2.5 rounded-full relative`}
          initial={{ width: 0 }}
          animate={isInView ? { width: `${skill.percentage}%` } : { width: 0 }}
          transition={{ 
            duration: 1.2, 
            ease: "easeOut",
            delay: 0.2
          }}
        >
          {/* Animated shine effect */}
          <motion.div 
            className="absolute top-0 bottom-0 left-0 right-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
            animate={{ 
              x: ['-100%', '200%'] 
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatDelay: 4,
              ease: "easeInOut"
            }}
            style={{
              opacity: isHovered ? 1 : 0
            }}
          />
        </motion.div>
      </div>
      
      {isModalOpen && (
        <SkillEndorsementModal
          skill={skill}
          isOpen={isModalOpen}
          onClose={handleModalClose}
        />
      )}
    </motion.div>
  );
};

export default SkillBar;
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Skill } from "@/lib/data";
import { useRef, useState } from "react";
import { CheckCircle2, Heart, Award } from "lucide-react";
import SkillEndorsementModal from "./SkillEndorsementModal";
import { Button } from "@/components/ui/button";

interface SkillBarProps {
  skill: Skill & { id?: number; endorsement_count?: number }; // Add optional fields
  barColor?: string;
  fetchSkills?: () => void; // Callback to refresh skills data
}

const SkillBar = ({ skill, barColor = "bg-primary", fetchSkills }: SkillBarProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const [isHovered, setIsHovered] = useState(false);
  const [showEndorseModal, setShowEndorseModal] = useState(false);
  
  // Rating system based on percentage
  const getRating = (percentage: number) => {
    if (percentage >= 90) return 'Expert';
    if (percentage >= 80) return 'Advanced';
    if (percentage >= 65) return 'Proficient';
    if (percentage >= 50) return 'Competent';
    return 'Familiar';
  };
  
  // Handle endorsement submission
  const handleEndorsementSubmitted = () => {
    if (fetchSkills) {
      fetchSkills();
    }
  };
  
  return (
    <>
      <motion.div 
        ref={ref}
        className="mb-5 group" /* Reduced margin to make room for endorse button */
        initial={{ opacity: 0, y: 10 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.02 }}
      >
        {/* Flex layout with wrap to ensure text wraps when needed */}
        <div className="flex flex-wrap justify-between mb-2 items-center">
          <motion.div
            className="flex items-center mb-1" /* Added margin bottom for when it wraps */
            initial={{ x: -5 }}
            animate={isInView ? { x: 0 } : { x: -5 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <motion.span 
              className="text-gray-800 dark:text-gray-200 font-medium relative"
              style={{
                color: isHovered ? '#3b82f6' : 'var(--foreground)',
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
          
          <div className="flex items-center gap-1.5 mb-1"> {/* Added margin bottom for when it wraps */}
            <motion.span 
              className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full font-medium whitespace-nowrap" /* Added whitespace-nowrap to prevent cutting off */
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              style={{
                color: isHovered ? '#3b82f6' : '#64748b',
                backgroundColor: isHovered ? 'rgba(59, 130, 246, 0.1)' : ''
              }}
            >
              {getRating(skill.percentage)}
            </motion.span>
            
            <motion.span 
              className="text-gray-600 dark:text-gray-400 text-sm font-medium"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              style={{
                color: isHovered ? '#3b82f6' : ''
              }}
            >
              {skill.percentage}%
            </motion.span>
            
            {skill.endorsement_count && skill.endorsement_count > 0 && (
              <motion.div
                className="flex items-center gap-1 text-xs text-yellow-500 font-medium ml-2"
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.3, delay: 0.5 }}
              >
                <Award size={14} className="text-yellow-400" />
                <span>{skill.endorsement_count}</span>
              </motion.div>
            )}
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
        
        {/* Endorse Button */}
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 5 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="flex justify-end mt-1.5"
        >
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 h-auto"
            onClick={() => setShowEndorseModal(true)}
          >
            <Heart size={12} className="mr-1" /> Endorse
          </Button>
        </motion.div>
        
        {/* Descriptive tooltip on hover */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              className="mt-1 text-xs text-gray-500 dark:text-gray-400 italic"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              {skill.percentage >= 85 ? 
                `Expert-level in ${skill.name} with extensive professional experience.` : 
                skill.percentage >= 70 ?
                `Strong proficiency in ${skill.name} for professional applications.` :
                `Competent in ${skill.name} for most development requirements.`
              }
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Endorsement Modal */}
      {showEndorseModal && (
        <SkillEndorsementModal
          skill={skill}
          isOpen={showEndorseModal}
          onClose={() => setShowEndorseModal(false)}
          onEndorsementSubmitted={handleEndorsementSubmitted}
        />
      )}
    </>
  );
};

export default SkillBar;

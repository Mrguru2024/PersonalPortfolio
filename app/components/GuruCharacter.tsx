import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User } from 'lucide-react';
// Use a default avatar component since we don't have the profile photo

interface GuruCharacterProps {
  position: number;
  isActive: boolean;
  onClosePopup: () => void;
}

const GuruCharacter: React.FC<GuruCharacterProps> = ({ 
  position, 
  isActive,
  onClosePopup
}) => {
  return (
    <div 
      className="absolute left-1/2 transform -translate-x-1/2 pointer-events-none"
      style={{ bottom: `${position}%` }}
    >
      <div className="relative">
        {/* Avatar photo */}
        <motion.div 
          className="w-10 h-10 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-white shadow-lg pointer-events-auto cursor-pointer z-10"
          animate={{ 
            scale: isActive ? 1.1 : 1,
            boxShadow: isActive 
              ? ['0 0 0 rgba(59, 130, 246, 0.4)', '0 0 20px rgba(59, 130, 246, 0.7)'] 
              : '0 4px 10px rgba(0, 0, 0, 0.1)'
          }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-blue-600">
            <User className="text-white h-6 w-6 md:h-8 md:w-8" />
          </div>
        </motion.div>

        {/* Speech bubble when active */}
        <AnimatePresence>
          {isActive && (
            <motion.div 
              className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gradient-to-br from-white/95 to-blue-50/95 dark:from-gray-800/95 dark:to-gray-900/95 rounded-lg shadow-lg p-3 max-w-[250px] text-sm pointer-events-auto border border-primary/20"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
              style={{
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1), 0 0 10px rgba(59, 130, 246, 0.1)'
              }}
            >
              {/* Close button */}
              <button 
                onClick={onClosePopup}
                className="absolute top-1 right-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                aria-label="Close popup"
              >
                <X size={14} />
              </button>
              
              <p className="pr-4 text-gray-700 dark:text-gray-300">
                I'll guide you through my portfolio. Click on milestone points to learn more!
              </p>
              
              {/* Triangle pointer */}
              <div className="absolute left-1/2 bottom-0 -mb-2 -ml-2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-blue-50 dark:border-t-gray-900"></div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GuruCharacter;
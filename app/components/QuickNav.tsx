'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface QuickNavProps {
  isOpen: boolean;
  onClose: () => void;
  currentSection: string;
  onSectionClick: (section: string) => void;
}

export default function QuickNav({ 
  isOpen, 
  onClose, 
  currentSection,
  onSectionClick 
}: QuickNavProps) {
  // Add a small delay before catching keyboard events
  // to prevent immediate closing after opening
  const [keyboardReady, setKeyboardReady] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      // Set keyboard ready after a small delay
      const timeout = setTimeout(() => setKeyboardReady(true), 100);
      
      const handleKeyDown = (e: KeyboardEvent) => {
        if (!keyboardReady) return;
        
        if (e.key === 'Escape') {
          onClose();
        } else if (e.key >= '1' && e.key <= '5') {
          const sectionKeys: Record<string, string> = {
            '1': 'hero',
            '2': 'about',
            '3': 'projects',
            '4': 'skills',
            '5': 'contact',
          };
          
          onSectionClick(sectionKeys[e.key]);
        }
      };
      
      window.addEventListener('keydown', handleKeyDown);
      
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        clearTimeout(timeout);
        setKeyboardReady(false);
      };
    }
  }, [isOpen, keyboardReady, onClose, onSectionClick]);
  
  const sectionInfo = [
    { key: 'hero', name: 'Home', icon: '🏠', shortcut: '1' },
    { key: 'about', name: 'About', icon: '👨‍💻', shortcut: '2' },
    { key: 'projects', name: 'Projects', icon: '💼', shortcut: '3' },
    { key: 'skills', name: 'Skills', icon: '🔧', shortcut: '4' },
    { key: 'contact', name: 'Contact', icon: '✉️', shortcut: '5' },
  ];
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="relative bg-card rounded-lg shadow-2xl w-full max-w-md p-6 mx-4"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close quick navigation"
            >
              <X size={20} />
            </button>
            
            <h3 className="text-xl font-bold mb-4">Quick Navigation</h3>
            <p className="text-muted-foreground mb-6 text-sm">
              Navigate through sections using your keyboard or by clicking below
            </p>
            
            <div className="space-y-2">
              {sectionInfo.map((section) => (
                <button
                  key={section.key}
                  onClick={() => onSectionClick(section.key)}
                  className={`flex items-center w-full p-3 rounded-md transition-colors ${
                    currentSection === section.key
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-secondary'
                  }`}
                >
                  <span className="mr-3 text-lg">{section.icon}</span>
                  <span className="flex-1 text-left">{section.name}</span>
                  <span className="px-2 py-1 rounded bg-black/20 text-xs">
                    {section.shortcut}
                  </span>
                </button>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-border text-xs text-center text-muted-foreground">
              Press <kbd className="px-2 py-1 rounded bg-card/80">ESC</kbd> to close
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
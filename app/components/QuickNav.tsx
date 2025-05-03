"use client";

import React, { useEffect } from "react";
import { Layers, Home, User, Code, Cpu, Mail, FileText, BookOpen, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/components/ui/utils";

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
  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const navItems = [
    { id: "home", label: "Home", icon: <Home className="h-6 w-6" /> },
    { id: "about", label: "About Me", icon: <User className="h-6 w-6" /> },
    { id: "projects", label: "Projects", icon: <Code className="h-6 w-6" /> },
    { id: "skills", label: "Skills", icon: <Cpu className="h-6 w-6" /> },
    { id: "contact", label: "Contact", icon: <Mail className="h-6 w-6" /> },
    { id: "blog", label: "Blog", icon: <BookOpen className="h-6 w-6" /> },
    { id: "resume", label: "Resume", icon: <FileText className="h-6 w-6" /> },
  ];

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        staggerChildren: 0.06,
      }
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md"
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={overlayVariants}
        >
          <motion.div 
            className="absolute top-4 right-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-secondary/50 text-foreground hover:bg-secondary transition-colors"
              aria-label="Close Navigation"
            >
              <X className="h-6 w-6" />
            </button>
          </motion.div>

          <motion.div
            className="relative p-8 max-w-md w-full"
            variants={containerVariants}
          >
            <div className="text-center mb-8">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Layers className="h-16 w-16 mx-auto mb-4 text-primary" />
                <h2 className="text-3xl font-bold">Quick Navigation</h2>
                <p className="text-muted-foreground mt-2">
                  Jump directly to any section of the site
                </p>
              </motion.div>
            </div>

            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              variants={containerVariants}
            >
              {navItems.map((item) => (
                <motion.button
                  key={item.id}
                  onClick={() => onSectionClick(item.id)}
                  className={cn(
                    "flex items-center p-4 rounded-lg transition-colors",
                    currentSection === item.id
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-card hover:bg-secondary/50 border border-border"
                  )}
                  variants={itemVariants}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="mr-3">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </motion.button>
              ))}
            </motion.div>

            <motion.div 
              className="mt-8 text-center text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Press <kbd className="px-2 py-1 bg-secondary rounded-md mx-1">ESC</kbd> to close
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
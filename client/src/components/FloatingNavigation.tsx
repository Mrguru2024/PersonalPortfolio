import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  User, 
  Briefcase, 
  Code, 
  Mail, 
  ChevronUp, 
  Menu,
  X 
} from 'lucide-react';

interface NavItem {
  id: string;
  icon: JSX.Element;
  label: string;
}

const FloatingNavigation: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('home');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [hasScrolled, setHasScrolled] = useState<boolean>(false);
  
  const navItems: NavItem[] = [
    { id: 'home', icon: <Home size={18} />, label: 'Home' },
    { id: 'about', icon: <User size={18} />, label: 'About' },
    { id: 'projects', icon: <Briefcase size={18} />, label: 'Projects' },
    { id: 'skills', icon: <Code size={18} />, label: 'Skills' },
    { id: 'contact', icon: <Mail size={18} />, label: 'Contact' },
  ];
  
  useEffect(() => {
    // Track scroll position to determine when to show the navigation
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setHasScrolled(scrollPosition > 300);
      
      // Determine which section is in view
      const sections = navItems.map(item => document.getElementById(item.id));
      const validSections = sections.filter(section => section !== null) as HTMLElement[];
      
      if (validSections.length > 0) {
        // Get the section closest to the top of the viewport
        const current = validSections.reduce((prev, current) => {
          const prevBounds = prev.getBoundingClientRect();
          const currentBounds = current.getBoundingClientRect();
          
          // If the section is above the viewport, prioritize the one closest to the top
          return prevBounds.top < 0 && currentBounds.top < 0
            ? (prevBounds.top > currentBounds.top ? prev : current)
            : (prevBounds.top < currentBounds.top && prevBounds.top >= 0 ? prev : current);
        });
        
        setActiveSection(current.id);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [navItems]);
  
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsOpen(false);
    }
  };
  
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  if (!hasScrolled) {
    return null;
  }
  
  return (
    <>
      {/* Mobile Navigation Button */}
      <motion.button
        className="fixed bottom-4 right-4 z-50 bg-primary text-white p-3 rounded-full shadow-lg md:hidden"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => setIsOpen(!isOpen)}
        whileTap={{ scale: 0.9 }}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </motion.button>
      
      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-16 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 md:hidden"
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <motion.button
                  key={item.id}
                  className={`flex items-center gap-2 p-2 rounded-md ${
                    activeSection === item.id
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => scrollToSection(item.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {item.icon}
                  <span className="text-sm">{item.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Desktop Navigation */}
      <motion.div
        className="fixed left-1/2 transform -translate-x-1/2 bottom-6 z-50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-full shadow-lg p-1.5 hidden md:flex"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-1">
          {navItems.map((item) => (
            <motion.button
              key={item.id}
              className={`relative flex items-center justify-center p-2 rounded-full group ${
                activeSection === item.id
                  ? 'text-primary'
                  : 'text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary'
              }`}
              onClick={() => scrollToSection(item.id)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {item.icon}
              <span
                className="absolute top-0 -mt-8 text-xs font-medium px-2 py-1 bg-primary text-white rounded-md opacity-0 group-hover:opacity-100 pointer-events-none"
              >
                {item.label}
              </span>
              {activeSection === item.id && (
                <motion.div
                  className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full"
                  layoutId="navIndicator"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
          
          <motion.div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
          
          <motion.button
            className="flex items-center justify-center p-2 rounded-full text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary group"
            onClick={scrollToTop}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronUp size={18} />
            <span
              className="absolute top-0 -mt-8 text-xs font-medium px-2 py-1 bg-primary text-white rounded-md opacity-0 group-hover:opacity-100 pointer-events-none"
            >
              Top
            </span>
          </motion.button>
        </div>
      </motion.div>
      
      {/* Scroll to top button for mobile */}
      <motion.button
        className="fixed bottom-4 left-4 z-50 bg-primary text-white p-3 rounded-full shadow-lg md:hidden"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={scrollToTop}
        whileTap={{ scale: 0.9 }}
      >
        <ChevronUp size={20} />
      </motion.button>
    </>
  );
};

export default FloatingNavigation;
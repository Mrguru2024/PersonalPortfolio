'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  Home, Briefcase, Lightbulb, User, MailPlus, 
  Menu, X, Settings, LogIn
} from 'lucide-react';

interface NavItem {
  id: string;
  icon: JSX.Element;
  label: string;
}

const navItems: NavItem[] = [
  { id: 'home', icon: <Home size={20} />, label: 'Home' },
  { id: 'projects', icon: <Briefcase size={20} />, label: 'Projects' },
  { id: 'blog', icon: <Lightbulb size={20} />, label: 'Blog' },
  { id: 'about', icon: <User size={20} />, label: 'About' },
  { id: 'contact', icon: <MailPlus size={20} />, label: 'Contact' },
];

const FloatingNavigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeItem, setActiveItem] = useState('home');
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      // Calculate scroll progress
      const scrollTop = window.scrollY;
      const docHeight = document.body.offsetHeight - window.innerHeight;
      const scrollPercent = scrollTop / docHeight;
      setScrollProgress(scrollPercent);

      // Determine active section based on scroll position
      const sections = ['home', 'projects', 'blog', 'about', 'contact'];
      const sectionHeight = docHeight / sections.length;
      
      const activeIndex = Math.min(
        Math.floor(scrollTop / sectionHeight),
        sections.length - 1
      );
      
      setActiveItem(sections[activeIndex]);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile Navigation Menu Button */}
      <div className="fixed bottom-6 right-6 md:hidden z-50">
        <button
          onClick={toggleMenu}
          className="w-14 h-14 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/30"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 right-6 md:hidden z-40"
          >
            <div className="bg-gray-800 rounded-lg overflow-hidden shadow-xl">
              {navItems.map((item) => (
                <Link
                  key={item.id}
                  href={`#${item.id}`}
                  className={`flex items-center px-4 py-3 hover:bg-gray-700 ${
                    activeItem === item.id ? 'text-purple-400' : 'text-gray-300'
                  }`}
                  onClick={() => {
                    setIsOpen(false);
                    setActiveItem(item.id);
                  }}
                >
                  <span className="mr-3">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
              <div className="border-t border-gray-700">
                <Link
                  href="/auth"
                  className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700"
                >
                  <span className="mr-3"><LogIn size={20} /></span>
                  <span>Log In</span>
                </Link>
                <Link
                  href="#theme"
                  className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700"
                >
                  <span className="mr-3"><Settings size={20} /></span>
                  <span>Settings</span>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Navigation */}
      <div className="fixed top-0 left-0 right-0 z-50 hidden md:block">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <Link 
              href="/" 
              className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent"
            >
              MrGuru.dev
            </Link>
            
            <div className="flex space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.id}
                  href={`#${item.id}`}
                  className={`relative group ${
                    activeItem === item.id 
                      ? 'text-purple-400' 
                      : 'text-gray-300 hover:text-gray-100'
                  }`}
                  onClick={() => setActiveItem(item.id)}
                >
                  <span className="flex items-center space-x-1">
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </span>
                  
                  {/* Animated underline */}
                  {activeItem === item.id && (
                    <motion.div
                      layoutId="navUnderline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-400"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </Link>
              ))}
            </div>

            <div className="flex items-center space-x-4">
              <Link 
                href="/auth" 
                className="text-gray-300 hover:text-white transition"
              >
                <LogIn size={20} />
              </Link>
              <button className="text-gray-300 hover:text-white transition">
                <Settings size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Progress Indicator */}
      <div className="fixed top-0 left-0 right-0 h-1 z-50">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
          style={{ width: `${scrollProgress * 100}%` }}
        />
      </div>
    </>
  );
};

export default FloatingNavigation;
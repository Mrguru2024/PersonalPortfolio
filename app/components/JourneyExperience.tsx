'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Code, Briefcase, Award, Lightbulb, Send, Heart } from 'lucide-react';

interface Milestone {
  id: string;
  label: string;
  position: number; // percentage down the path (0-100)
  icon: React.ReactNode;
  description: string;
  cta: string;
  elementId?: string; // ID of the element to scroll to
}

const milestones: Milestone[] = [
  {
    id: 'skills',
    label: 'Skills',
    position: 15,
    icon: <Code size={24} />,
    description: 'Explore my technical skills and expertise.',
    cta: 'View Skills',
    elementId: 'skills-section'
  },
  {
    id: 'projects',
    label: 'Projects',
    position: 35,
    icon: <Briefcase size={24} />,
    description: 'Check out my portfolio of projects.',
    cta: 'View Projects',
    elementId: 'projects-section'
  },
  {
    id: 'achievements',
    label: 'Achievements',
    position: 55,
    icon: <Award size={24} />,
    description: 'See my professional achievements and certifications.',
    cta: 'View Achievements',
    elementId: 'achievements-section'
  },
  {
    id: 'blog',
    label: 'Blog',
    position: 75,
    icon: <Lightbulb size={24} />,
    description: 'Read my thoughts and insights on technology.',
    cta: 'Read Blog',
    elementId: 'blog-section'
  },
  {
    id: 'contact',
    label: 'Contact',
    position: 95,
    icon: <Send size={24} />,
    description: 'Ready to work together? Get in touch!',
    cta: 'Contact Me',
    elementId: 'contact-section'
  }
];

interface JourneyExperienceProps {
  activeSection?: string;
}

const JourneyExperience: React.FC<JourneyExperienceProps> = ({ activeSection }) => {
  const [activeMilestone, setActiveMilestone] = useState<string | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle scroll position to determine active milestone
  useEffect(() => {
    if (activeSection) {
      const milestone = milestones.find(m => m.id === activeSection);
      if (milestone) {
        setActiveMilestone(milestone.id);
      }
    }
  }, [activeSection]);

  // Hide intro after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleMilestoneClick = (milestone: Milestone) => {
    setActiveMilestone(milestone.id);
    
    // Scroll to element if elementId is provided
    if (milestone.elementId) {
      const element = document.getElementById(milestone.elementId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div 
      ref={containerRef}
      className="fixed left-0 top-1/2 -translate-y-1/2 z-40 ml-4 hidden md:block"
    >
      {/* Intro bubble */}
      {showIntro && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="absolute left-16 top-0 bg-gray-800 rounded-lg p-4 mb-4 shadow-lg w-64"
        >
          <div className="text-white">
            <h3 className="font-bold text-lg mb-1">Welcome to My Journey</h3>
            <p className="text-sm text-gray-300 mb-2">Navigate through my professional journey using these milestones!</p>
            <div className="flex items-center text-xs text-gray-400">
              <Heart size={12} className="mr-1 text-red-400" />
              <span>Click any stop to explore</span>
            </div>
          </div>
          <div className="absolute left-0 top-1/2 -translate-x-2 -translate-y-1/2 w-0 h-0 border-t-8 border-t-transparent border-r-8 border-r-gray-800 border-b-8 border-b-transparent"></div>
        </motion.div>
      )}

      {/* Journey Path */}
      <div className="relative h-80">
        <div className="absolute left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500 rounded-full"></div>
        
        {/* Milestones */}
        {milestones.map((milestone) => (
          <div 
            key={milestone.id}
            className="absolute left-0 transform -translate-y-1/2"
            style={{ top: `${milestone.position}%` }}
          >
            <button
              onClick={() => handleMilestoneClick(milestone)}
              className={`group flex items-center focus:outline-none transition-all duration-300`}
            >
              {/* Icon with circle */}
              <div 
                className={`w-12 h-12 rounded-full flex items-center justify-center z-10 transition-all duration-300
                  ${activeMilestone === milestone.id 
                    ? 'bg-white text-purple-600 shadow-lg shadow-purple-500/30' 
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
              >
                {milestone.icon}
              </div>
              
              {/* Label that appears on hover */}
              <div 
                className={`ml-3 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0
                  ${activeMilestone === milestone.id ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}
              >
                <div className="bg-gray-800 rounded-lg p-3 shadow-lg min-w-[150px]">
                  <p className="font-medium text-white">{milestone.label}</p>
                  <p className="text-xs text-gray-400 mt-1">{milestone.description}</p>
                  <div className="mt-2 text-xs text-purple-400 flex items-center">
                    <span>{milestone.cta}</span>
                    <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JourneyExperience;
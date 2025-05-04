"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

type SectionTooltip = {
  [key: string]: string;
};

export default function CustomCursor({ currentSection }: { currentSection: string }) {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [isVisible, setIsVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  // Tooltip messages for different sections
  const sectionTooltips: SectionTooltip = {
    home: "Welcome to MrGuru.dev",
    about: "Learn about me",
    projects: "View my projects",
    skills: "Explore my skills",
    contact: "Get in touch",
    blog: "Read my blog",
    resume: "View my resume",
  };

  useEffect(() => {
    // Detect devices that likely don't have a mouse
    const isTouchDevice = ('ontouchstart' in window) || 
                          (navigator.maxTouchPoints > 0);
    
    if (isTouchDevice) {
      setIsVisible(false);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseDown = () => {
      setIsClicking(true);
    };

    const handleMouseUp = () => {
      setIsClicking(false);
    };

    const handleHoverStart = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'A' || 
          target.tagName === 'BUTTON' || 
          target.closest('a') || 
          target.closest('button')) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    // Add all event listeners
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseenter", handleMouseEnter);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mouseover", handleHoverStart);

    // Clean up
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseenter", handleMouseEnter);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mouseover", handleHoverStart);
    };
  }, [isVisible, isHovering]);

  // Control tooltip visibility
  useEffect(() => {
    if (currentSection && sectionTooltips[currentSection]) {
      setTooltipVisible(true);
      
      // Hide tooltip after a delay
      const timer = setTimeout(() => {
        setTooltipVisible(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [currentSection]);

  if (!isVisible) return null;

  return (
    <>
      <div 
        className={cn(
          "custom-cursor bg-primary",
          isHovering && "hovering",
          isClicking && "clicking"
        )}
        style={{ 
          left: `${position.x}px`, 
          top: `${position.y}px` 
        }}
      >
        <div 
          className={cn(
            "cursor-tooltip",
            tooltipVisible && "visible"
          )}
        >
          {sectionTooltips[currentSection] || "Explore"}
        </div>
      </div>
    </>
  );
}
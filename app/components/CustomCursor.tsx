"use client";

import { useState, useEffect } from "react";
import { cn } from "@/components/ui/utils";

type SectionTooltip = {
  [key: string]: string;
};

export default function CustomCursor({ currentSection }: { currentSection: string }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  
  // Map of section IDs to tooltips
  const sectionTooltips: SectionTooltip = {
    home: "Explore my portfolio",
    about: "Learn about me",
    projects: "View my work",
    skills: "Check my expertise",
    contact: "Get in touch",
    blog: "Read my articles",
    resume: "View my resume",
  };

  useEffect(() => {
    // Detect devices that likely don't have a mouse
    const isTouchDevice = ('ontouchstart' in window) || 
                          (navigator.maxTouchPoints > 0) || 
                          (navigator.msMaxTouchPoints > 0);
    
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
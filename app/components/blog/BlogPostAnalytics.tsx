"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";

interface AnalyticsData {
  scrollDepth: number;
  timeSpent: number;
  readComplete: boolean;
  scrollEvents: Array<{ timestamp: number; depth: number }>;
}

export function BlogPostAnalytics() {
  const params = useParams();
  const slug = params?.slug as string;
  const [viewId, setViewId] = useState<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const lastUpdateRef = useRef<number>(Date.now());
  const maxScrollDepthRef = useRef<number>(0);
  const scrollEventsRef = useRef<Array<{ timestamp: number; depth: number }>>([]);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasTrackedInitialView = useRef<boolean>(false);

  // Track initial view
  useEffect(() => {
    if (!slug || hasTrackedInitialView.current) return;
    
    const trackInitialView = async () => {
      try {
        const response = await fetch(`/api/blog/${slug}/analytics`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scrollDepth: 0,
            timeSpent: 0,
            readComplete: false,
            scrollEvents: [],
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.view?.id) {
            setViewId(data.view.id);
          }
          hasTrackedInitialView.current = true;
        }
      } catch (error) {
        console.error("Error tracking initial view:", error);
      }
    };
    
    trackInitialView();
  }, [slug]);

  // Update view function (defined before useEffects that use it)
  const updateView = useCallback(async (updates?: Partial<AnalyticsData>) => {
    if (!viewId || !slug) return;
    
    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
    
    try {
      await fetch(`/api/blog/${slug}/analytics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scrollDepth: updates?.scrollDepth ?? maxScrollDepthRef.current,
          timeSpent: updates?.timeSpent ?? timeSpent,
          readComplete: updates?.readComplete ?? maxScrollDepthRef.current >= 90,
          scrollEvents: scrollEventsRef.current.slice(-50),
        }),
      });
    } catch (error) {
      console.error("Error updating view:", error);
    }
  }, [viewId, slug]);

  // Track scroll depth
  useEffect(() => {
    if (!slug) return;
    
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      const scrollDepth = Math.round(
        ((scrollTop + windowHeight) / documentHeight) * 100
      );
      
      if (scrollDepth > maxScrollDepthRef.current) {
        maxScrollDepthRef.current = scrollDepth;
      }
      
      // Track scroll events (throttled)
      const now = Date.now();
      if (now - lastUpdateRef.current > 1000) { // Update every second
        scrollEventsRef.current.push({
          timestamp: now,
          depth: scrollDepth,
        });
        lastUpdateRef.current = now;
      }
      
      // Check if user scrolled to bottom (read complete)
      const isAtBottom = scrollTop + windowHeight >= documentHeight - 100;
      if (isAtBottom && maxScrollDepthRef.current >= 90) {
        // Mark as read complete
        if (viewId) {
          updateView({
            scrollDepth: maxScrollDepthRef.current,
            readComplete: true,
          });
        }
      }
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [slug, viewId, updateView]);


  // Update view periodically
  useEffect(() => {
    if (!viewId || !slug) return;
    
    // Update every 10 seconds
    updateIntervalRef.current = setInterval(() => {
      updateView();
    }, 10000);
    
    // Update on page unload
    const handleBeforeUnload = () => {
      updateView();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Final update
      updateView();
    };
  }, [viewId, slug, updateView]);

  // This component doesn't render anything
  return null;
}

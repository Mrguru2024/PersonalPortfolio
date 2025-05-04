'use client';

import React, { useEffect, useRef, useState } from 'react';

interface HeroVideoProps {
  videoSrc: string;
  className?: string;
  overlayClassName?: string;
}

export default function HeroVideo({
  videoSrc,
  className = '',
  overlayClassName = '',
}: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    
    if (!video) return;

    const handleLoadedData = () => {
      setIsLoaded(true);
    };

    video.addEventListener('loadeddata', handleLoadedData);
    
    // Attempt to start playing, handle autoplay restrictions gracefully
    const playPromise = video.play();
    
    if (playPromise !== undefined) {
      playPromise
        .catch(error => {
          // Auto-play was prevented, add a muted attribute and try again
          video.muted = true;
          video.play().catch(e => {
            console.log('Video autoplay still prevented:', e);
          });
        });
    }

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
    };
  }, []);

  return (
    <div className="relative">
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className={`transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
      >
        <source src={videoSrc} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      {overlayClassName && <div className={overlayClassName} />}
    </div>
  );
}
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface HeroVideoProps {
  videoSrc: string;
  className?: string;
  overlayClassName?: string;
}

const HeroVideo: React.FC<HeroVideoProps> = ({ 
  videoSrc, 
  className = "", 
  overlayClassName = "" 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const videoElement = videoRef.current;
    
    if (videoElement) {
      const handleCanPlay = () => {
        setIsLoaded(true);
      };
      
      videoElement.addEventListener('canplay', handleCanPlay);
      
      // In case the video is already loaded
      if (videoElement.readyState >= 3) {
        setIsLoaded(true);
      }
      
      return () => {
        videoElement.removeEventListener('canplay', handleCanPlay);
      };
    }
  }, []);

  // Create a staggered fade-in effect once the video is loaded
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        duration: 1,
        ease: "easeInOut"
      }
    }
  };

  return (
    <motion.div 
      className={`relative w-full h-full overflow-hidden ${className}`}
      initial="hidden"
      animate={isLoaded ? "visible" : "hidden"}
      variants={containerVariants}
    >
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover"
      >
        <source src={videoSrc} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {/* Overlay */}
      <div className={`absolute inset-0 bg-black/30 backdrop-blur-[1px] ${overlayClassName}`}></div>
      
      {/* Scan lines effect */}
      <div className="absolute inset-0 bg-scan-lines opacity-10 pointer-events-none"></div>
      
      {/* Vignette effect */}
      <div className="absolute inset-0 bg-radial-gradient-vignette pointer-events-none"></div>
    </motion.div>
  );
};

export default HeroVideo;
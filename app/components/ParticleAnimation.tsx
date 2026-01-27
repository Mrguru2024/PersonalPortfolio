import { useEffect, useRef, useState } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  speedX: number;
  speedY: number;
  alpha: number;
  alphaSpeed: number;
}

interface ParticleAnimationProps {
  count?: number;
  minSize?: number;
  maxSize?: number;
  minSpeed?: number;
  maxSpeed?: number;
  color?: string;
  colorArray?: string[];
  linkParticles?: boolean;
  linkDistance?: number;
  linkThickness?: number;
  className?: string;
}

const ParticleAnimation: React.FC<ParticleAnimationProps> = ({
  count = 50,
  minSize = 1,
  maxSize = 3,
  minSpeed = 0.1,
  maxSpeed = 0.5,
  color = "#3b82f6",
  colorArray,
  linkParticles = true,
  linkDistance = 150,
  linkThickness = 0.5,
  className = "",
}) => {
  // Reduce particle count on smaller devices for better performance
  const [adjustedCount, setAdjustedCount] = useState(count);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const updateCount = () => {
        const width = window.innerWidth;
        if (width < 640) {
          setAdjustedCount(Math.floor(count * 0.5)); // 50% on mobile
        } else if (width < 1024) {
          setAdjustedCount(Math.floor(count * 0.75)); // 75% on tablet
        } else {
          setAdjustedCount(count); // Full count on desktop
        }
      };
      updateCount();
      window.addEventListener('resize', updateCount);
      return () => window.removeEventListener('resize', updateCount);
    }
  }, [count]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number>(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMouseInCanvas, setIsMouseInCanvas] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize particles
  useEffect(() => {
    if (!mounted || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size
    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      setCanvasSize({
        width: rect.width,
        height: rect.height
      });
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    
    // Create random particles
    const newParticles: Particle[] = [];
    
    for (let i = 0; i < count; i++) {
      let particleColor = color;
      
      // Use colors from array if provided
      if (colorArray && colorArray.length > 0) {
        const randomIndex = Math.floor(Math.random() * colorArray.length);
        particleColor = colorArray[randomIndex];
      }
      
      newParticles.push({
        x: Math.random() * canvasSize.width,
        y: Math.random() * canvasSize.height,
        size: minSize + Math.random() * (maxSize - minSize),
        color: particleColor,
        speedX: (Math.random() - 0.5) * (maxSpeed - minSpeed) + minSpeed,
        speedY: (Math.random() - 0.5) * (maxSpeed - minSpeed) + minSpeed,
        alpha: 0.3 + Math.random() * 0.7,
        alphaSpeed: 0.001 + Math.random() * 0.01
      });
    }
    
    setParticles(newParticles);
    
    // Mouse events
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    };
    
    const handleMouseEnter = () => setIsMouseInCanvas(true);
    const handleMouseLeave = () => setIsMouseInCanvas(false);
    
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseenter', handleMouseEnter);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      window.removeEventListener('resize', updateSize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseenter', handleMouseEnter);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationRef.current);
    };
  }, [adjustedCount, minSize, maxSize, minSpeed, maxSpeed, color, colorArray, mounted]);
  
  // Animation loop
  // Keep track of animation state without triggering re-renders
  const particlesRef = useRef(particles);
  
  useEffect(() => {
    particlesRef.current = particles;
  }, [particles]);
  
  useEffect(() => {
    if (!canvasRef.current || particles.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const animate = () => {
      ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
      
      // Create a working copy of particles without triggering state updates
      const updatedParticles = [...particlesRef.current];
      
      for (let i = 0; i < updatedParticles.length; i++) {
        const p = updatedParticles[i];
        
        // Update position
        p.x += p.speedX;
        p.y += p.speedY;
        
        // Update alpha for pulsing effect
        p.alpha += p.alphaSpeed;
        if (p.alpha > 1) {
          p.alpha = 1;
          p.alphaSpeed *= -1;
        } else if (p.alpha < 0.3) {
          p.alpha = 0.3;
          p.alphaSpeed *= -1;
        }
        
        // Boundary check with bounce
        if (p.x < 0 || p.x > canvasSize.width) p.speedX *= -1;
        if (p.y < 0 || p.y > canvasSize.height) p.speedY *= -1;
        
        // Mouse repulsion
        if (isMouseInCanvas) {
          const distX = p.x - mousePosition.x;
          const distY = p.y - mousePosition.y;
          const distance = Math.sqrt(distX * distX + distY * distY);
          
          if (distance < 100) {
            const force = (100 - distance) / 500;
            p.x += distX * force;
            p.y += distY * force;
          }
        }
        
        // Draw the particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      
      // Draw links between particles
      if (linkParticles) {
        ctx.globalAlpha = 0.3;
        for (let i = 0; i < updatedParticles.length; i++) {
          for (let j = i + 1; j < updatedParticles.length; j++) {
            const p1 = updatedParticles[i];
            const p2 = updatedParticles[j];
            
            const distX = p1.x - p2.x;
            const distY = p1.y - p2.y;
            const distance = Math.sqrt(distX * distX + distY * distY);
            
            if (distance < linkDistance) {
              const opacity = 1 - (distance / linkDistance);
              
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.strokeStyle = p1.color;
              ctx.lineWidth = linkThickness * opacity;
              ctx.stroke();
            }
          }
        }
        ctx.globalAlpha = 1;
      }
      
      // Update ref instead of state to avoid re-rendering
      particlesRef.current = updatedParticles;
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [canvasSize, isMouseInCanvas, mousePosition, linkParticles, linkDistance, linkThickness, mounted]);

  if (!mounted) {
    return null;
  }

  return (
    <canvas 
      ref={canvasRef} 
      className={`absolute inset-0 w-full h-full ${className}`}
    />
  );
};

export default ParticleAnimation;
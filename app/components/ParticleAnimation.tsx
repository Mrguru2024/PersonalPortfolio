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

/** Parse hex or hsl(...) to RGB for canvas gradient (glow). */
function colorToRgb(color: string): { r: number; g: number; b: number } {
  const c = color.trim();
  if (c.startsWith('#')) {
    const hex = c.slice(1).padEnd(6, '0');
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }
  const hslMatch = c.match(/hsl\s*\(\s*(\d+(?:\.\d+)?)\s*[, ]\s*(\d+(?:\.\d+)?)%\s*[, ]\s*(\d+(?:\.\d+)?)%\s*\)/i);
  if (hslMatch) {
    const h = Number(hslMatch[1]) / 360;
    const s = Number(hslMatch[2]) / 100;
    const l = Number(hslMatch[3]) / 100;
    let r: number, g: number, b: number;
    if (s === 0) {
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
  }
  return { r: 100, g: 116, b: 139 };
}

interface ParticleAnimationProps {
  count?: number;
  minSize?: number;
  maxSize?: number;
  minSpeed?: number;
  maxSpeed?: number;
  color?: string;
  colorArray?: string[];
  /** Used when document has .dark class (e.g. dark theme) for better visibility */
  colorArrayDark?: string[];
  linkParticles?: boolean;
  linkDistance?: number;
  linkThickness?: number;
  /** Soft glow radius multiplier around each particle (0 = no glow) */
  glowRadius?: number;
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
  colorArrayDark,
  linkParticles = true,
  linkDistance = 150,
  linkThickness = 0.5,
  glowRadius = 2.5,
  className = "",
}) => {
  // Reduce particle count on smaller devices for better performance
  const [adjustedCount, setAdjustedCount] = useState(count);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  
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

  // Initialize particles (read dark from DOM so first paint in dark theme is correct)
  useEffect(() => {
    if (!mounted || !canvasRef.current) return;

    const isDarkNow = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
    const activeColorArray = isDarkNow && colorArrayDark && colorArrayDark.length > 0 ? colorArrayDark : colorArray;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size and get dimensions for particle spread (use rect so particles fill area immediately)
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
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(rect.width, 1);
    const h = Math.max(rect.height, 1);
    window.addEventListener('resize', updateSize);
    
    // Create random particles spread across full area (use w/h so they're not clustered at origin)
    const newParticles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      let particleColor = color;

      if (activeColorArray && activeColorArray.length > 0) {
        const randomIndex = Math.floor(Math.random() * activeColorArray.length);
        particleColor = activeColorArray[randomIndex];
      }
      
      newParticles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: minSize + Math.random() * (maxSize - minSize),
        color: particleColor,
        speedX: (Math.random() - 0.5) * (maxSpeed - minSpeed) + minSpeed,
        speedY: (Math.random() - 0.5) * (maxSpeed - minSpeed) + minSpeed,
        alpha: 0.6 + Math.random() * 0.4,
        alphaSpeed: 0.0004 + Math.random() * 0.004
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
  }, [adjustedCount, minSize, maxSize, minSpeed, maxSpeed, color, colorArray, colorArrayDark, isDark, mounted]);
  
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
        } else if (p.alpha < 0.6) {
          p.alpha = 0.6;
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
        
        // Draw soft glow under particle (if enabled)
        if (glowRadius > 0 && p.size > 0) {
          const glowSize = p.size * glowRadius;
          const { r, g, b } = colorToRgb(p.color);
          const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowSize);
          gradient.addColorStop(0, `rgba(${r},${g},${b},${p.alpha * 0.45})`);
          gradient.addColorStop(0.5, `rgba(${r},${g},${b},${p.alpha * 0.15})`);
          gradient.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.beginPath();
          ctx.arc(p.x, p.y, glowSize, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
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
        ctx.globalAlpha = 0.48;
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
  }, [canvasSize, isMouseInCanvas, mousePosition, linkParticles, linkDistance, linkThickness, glowRadius, mounted]);

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
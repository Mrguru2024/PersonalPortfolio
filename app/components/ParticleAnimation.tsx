'use client';

import React, { useRef, useEffect, useState } from 'react';

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
  color = '#8b5cf6',
  colorArray,
  linkParticles = true,
  linkDistance = 150,
  linkThickness = 0.5,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [particles, setParticles] = useState<Particle[]>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMouseMoving, setIsMouseMoving] = useState(false);
  const animationFrameRef = useRef<number>(0);

  // Initialize particles
  useEffect(() => {
    if (!canvasRef.current) return;

    // Set dimensions based on window size
    const width = window.innerWidth;
    const height = window.innerHeight;
    setDimensions({ width, height });

    // Create particles
    const initialParticles: Particle[] = [];
    const colors = colorArray || [color];

    for (let i = 0; i < count; i++) {
      initialParticles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: minSize + Math.random() * (maxSize - minSize),
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: (Math.random() - 0.5) * (maxSpeed - minSpeed) + minSpeed,
        speedY: (Math.random() - 0.5) * (maxSpeed - minSpeed) + minSpeed,
        alpha: 0.1 + Math.random() * 0.5,
        alphaSpeed: 0.001 + Math.random() * 0.005,
      });
    }

    setParticles(initialParticles);

    // Resize handler
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const width = window.innerWidth;
      const height = window.innerHeight;
      setDimensions({ width, height });

      // Reposition particles within new dimensions
      setParticles(prevParticles => 
        prevParticles.map(particle => ({
          ...particle,
          x: particle.x > width ? width : particle.x,
          y: particle.y > height ? height : particle.y,
        }))
      );
    };

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      setIsMouseMoving(true);
      
      // Reset the mouse moving state after a delay
      setTimeout(() => setIsMouseMoving(false), 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [count, minSize, maxSize, minSpeed, maxSpeed, color, colorArray]);

  // Animation loop
  useEffect(() => {
    if (!canvasRef.current || particles.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      // Update and draw particles
      setParticles(prevParticles => {
        const updatedParticles = prevParticles.map(particle => {
          // Move particle
          let x = particle.x + particle.speedX;
          let y = particle.y + particle.speedY;

          // Boundary check and bounce
          if (x < 0 || x > dimensions.width) {
            particle.speedX *= -1;
            x = x < 0 ? 0 : dimensions.width;
          }
          if (y < 0 || y > dimensions.height) {
            particle.speedY *= -1;
            y = y < 0 ? 0 : dimensions.height;
          }

          // Pulse alpha value
          let alpha = particle.alpha + particle.alphaSpeed;
          if (alpha > 0.8 || alpha < 0.1) {
            particle.alphaSpeed *= -1;
            alpha = alpha > 0.8 ? 0.8 : 0.1;
          }

          // Mouse interaction (attract particles if mouse is moving)
          if (isMouseMoving) {
            const dx = mousePosition.x - x;
            const dy = mousePosition.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 100) {
              const angle = Math.atan2(dy, dx);
              const force = 0.2;
              x += Math.cos(angle) * force;
              y += Math.sin(angle) * force;
            }
          }

          return { ...particle, x, y, alpha };
        });

        // Draw particles
        updatedParticles.forEach(particle => {
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fillStyle = particle.color;
          ctx.globalAlpha = particle.alpha;
          ctx.fill();
        });

        // Draw links between particles
        if (linkParticles) {
          for (let i = 0; i < updatedParticles.length; i++) {
            for (let j = i + 1; j < updatedParticles.length; j++) {
              const p1 = updatedParticles[i];
              const p2 = updatedParticles[j];
              const dx = p1.x - p2.x;
              const dy = p1.y - p2.y;
              const distance = Math.sqrt(dx * dx + dy * dy);

              if (distance < linkDistance) {
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.strokeStyle = p1.color;
                ctx.globalAlpha = (1 - distance / linkDistance) * linkThickness;
                ctx.stroke();
              }
            }
          }
        }

        return updatedParticles;
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [dimensions, particles, linkParticles, linkDistance, linkThickness, isMouseMoving, mousePosition]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 -z-10 ${className}`}
      width={dimensions.width}
      height={dimensions.height}
    />
  );
};

export default ParticleAnimation;
'use client';

import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'gradient' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  withHoverEffect?: boolean;
  withPressEffect?: boolean;
  withGlowEffect?: boolean;
}

const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      withHoverEffect = false,
      withPressEffect = true,
      withGlowEffect = false,
      children,
      ...props
    },
    ref
  ) => {
    // Compute variant and size classes
    const variantClasses = {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90',
      gradient: 'bg-gradient-to-r from-primary to-primary-hover text-primary-foreground',
      outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
    };

    const sizeClasses = {
      sm: 'h-9 px-3 rounded-md text-sm',
      md: 'h-10 px-4 py-2 rounded-md',
      lg: 'h-12 px-6 py-3 rounded-lg text-lg',
      icon: 'h-10 w-10 rounded-full',
    };

    const hoverMotion = withHoverEffect
      ? {
          whileHover: { scale: 1.05, transition: { duration: 0.2 } },
        }
      : {};

    const pressMotion = withPressEffect
      ? {
          whileTap: { scale: 0.98, transition: { duration: 0.1 } },
        }
      : {};

    return (
      <div className={withGlowEffect ? 'group relative' : ''}>
        {withGlowEffect && (
          <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-primary/50 to-primary-hover/50 opacity-0 blur group-hover:opacity-75 transition-all duration-500" />
        )}

        <motion.button
          ref={ref}
          className={cn(
            'inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background relative',
            variantClasses[variant],
            sizeClasses[size],
            withGlowEffect && 'relative',
            className
          )}
          {...hoverMotion}
          {...pressMotion}
          {...props}
        >
          {children}
        </motion.button>
      </div>
    );
  }
);

AnimatedButton.displayName = 'AnimatedButton';

export default AnimatedButton;
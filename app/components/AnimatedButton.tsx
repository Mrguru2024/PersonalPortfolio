"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AnimatedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "gradient" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  withGlowEffect?: boolean;
  withPressEffect?: boolean;
  withHoverEffect?: boolean;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Thin wrapper around {@link Button}. Use **`variant="gradient"`** for at most one primary CTA per screen
 * (same rule as `Button variant="gradient"`).
 */
const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  (
    {
      variant = "default",
      size = "default",
      withGlowEffect,
      withPressEffect: _withPressEffect,
      withHoverEffect: _withHoverEffect,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const resolvedVariant =
      variant === "gradient"
        ? "gradient"
        : variant === "outline"
          ? "outline"
          : variant === "secondary"
            ? "secondary"
            : variant === "ghost"
              ? "ghost"
              : variant === "link"
                ? "link"
                : variant === "destructive"
                  ? "destructive"
                  : "default";

    return (
      <Button
        ref={ref}
        variant={resolvedVariant}
        size={size}
        className={cn(
          withGlowEffect && "shadow-primary/25 shadow-lg hover:shadow-primary/40",
          className
        )}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

AnimatedButton.displayName = "AnimatedButton";

export default AnimatedButton;

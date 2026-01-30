"use client";

import * as React from "react";
import { Button, buttonVariants } from "@/components/ui/button";
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

const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  (
    {
      variant = "default",
      size = "default",
      withGlowEffect,
      withPressEffect,
      withHoverEffect,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const isGradient = variant === "gradient";
    const buttonVariant = variant === "gradient" ? "default" : variant === "outline" ? "outline" : variant;

    const baseClass = cn(
      buttonVariants({ variant: buttonVariant, size }),
      isGradient &&
        "bg-gradient-to-r from-primary to-purple-600 text-white hover:from-primary/90 hover:to-purple-600/90 border-0 shadow-lg",
      withGlowEffect && "shadow-primary/25 shadow-lg hover:shadow-primary/40",
      className
    );

    return (
      <Button ref={ref} className={baseClass} size={size} variant={buttonVariant} {...props}>
        {children}
      </Button>
    );
  }
);

AnimatedButton.displayName = "AnimatedButton";

export default AnimatedButton;

import { ButtonHTMLAttributes, forwardRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface AnimatedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "gradient" | "outline" | "ghost";
  size?: "sm" | "md" | "lg" | "icon";
  withHoverEffect?: boolean;
  withPressEffect?: boolean;
  withGlowEffect?: boolean;
}

const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(({
  children,
  className,
  variant = "default",
  size = "md",
  withHoverEffect = true,
  withPressEffect = true,
  withGlowEffect = false,
  ...props
}, ref) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Define base class based on variant
  let baseClass = "";
  
  switch (variant) {
    case "gradient":
      baseClass = "bg-gradient-to-r from-primary to-blue-400 text-white border-0";
      break;
    case "outline":
      baseClass = "bg-transparent border border-primary text-primary hover:bg-primary/10";
      break;
    case "ghost":
      baseClass = "bg-transparent hover:bg-primary/10 text-primary";
      break;
    default:
      baseClass = "bg-primary text-white";
      break;
  }
  
  // Size classes
  let sizeClass = "";
  switch (size) {
    case "sm":
      sizeClass = "py-1 px-3 text-sm";
      break;
    case "lg":
      sizeClass = "py-3 px-8 text-lg";
      break;
    case "icon":
      sizeClass = "w-10 h-10 p-2";
      break;
    default:
      sizeClass = "py-2 px-5";
      break;
  }
  
  return (
    <motion.div
      className={cn(
        "relative",
        withGlowEffect && "group"
      )}
      initial={{ opacity: 1 }}
      whileHover={withHoverEffect ? { scale: 1.05 } : {}}
      whileTap={withPressEffect ? { scale: 0.95 } : {}}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Glow effect */}
      {withGlowEffect && (
        <motion.div 
          className="absolute top-0 left-0 right-0 bottom-0 rounded-full bg-primary/20 blur-xl -z-10"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: isHovered ? 0.8 : 0,
            scale: isHovered ? 1.1 : 0.8,
          }}
          transition={{ duration: 0.3 }}
        />
      )}
      
      <Button
        ref={ref}
        className={cn(
          baseClass,
          sizeClass,
          "relative overflow-hidden font-medium rounded-full transition-all",
          className
        )}
        {...props}
      >
        {/* Shine effect overlay */}
        {variant !== "ghost" && variant !== "outline" && (
          <motion.span
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            initial={{ x: "-100%" }}
            animate={isHovered ? { x: "100%" } : { x: "-100%" }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            style={{ pointerEvents: "none" }}
          />
        )}
        
        {children}
      </Button>
    </motion.div>
  );
});

AnimatedButton.displayName = "AnimatedButton";

export default AnimatedButton;
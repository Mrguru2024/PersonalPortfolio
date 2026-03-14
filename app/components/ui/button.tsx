import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium ring-offset-background transition-transform duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 min-w-0 max-w-full sm:whitespace-nowrap touch-manipulation [-webkit-tap-highlight-color:transparent] hover:scale-[1.02] active:scale-[0.96] motion-reduce:transform-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground transition-[transform,box-shadow,background-color] duration-200 hover:bg-primary/90 hover:shadow-md active:shadow-sm active:bg-primary/95",
        destructive:
          "bg-destructive text-destructive-foreground transition-[transform,box-shadow,background-color] duration-200 hover:bg-destructive/90 hover:shadow-md active:shadow-sm active:bg-destructive/95",
        outline:
          "border border-input bg-background transition-[transform,box-shadow,background-color] duration-200 hover:bg-accent hover:text-accent-foreground hover:shadow-sm active:shadow-none active:bg-accent/80",
        secondary:
          "bg-secondary text-secondary-foreground transition-[transform,box-shadow,background-color] duration-200 hover:bg-secondary/80 hover:shadow-sm active:shadow-none active:bg-secondary/70",
        ghost:
          "hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
        link: "text-primary underline-offset-4 hover:underline hover:scale-100 active:scale-100",
      },
      size: {
        default: "h-10 min-h-[44px] sm:min-h-[40px] px-4 py-2",
        sm: "h-9 min-h-[44px] sm:min-h-[36px] rounded-md px-3",
        lg: "h-11 min-h-[44px] sm:min-h-[44px] rounded-md px-6 sm:px-8 py-2",
        icon: "h-10 w-10 min-h-[44px] min-w-[44px] sm:min-h-[40px] sm:min-w-[40px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
export default Button;

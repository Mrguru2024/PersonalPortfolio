import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary-hover/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/85",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "border-border/80 bg-transparent text-foreground",
        success:
          "border-success/25 bg-success/10 text-foreground dark:bg-success/18 dark:text-success-foreground",
        warning:
          "border-warning/30 bg-warning/12 text-warning-foreground dark:bg-warning/18",
        info:
          "border-info/30 bg-info/10 text-info-foreground dark:bg-info/18",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface FieldHintProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

/**
 * Consistent helper text under admin form fields (autofill / guidance copy).
 */
export function FieldHint({ children, className, id }: FieldHintProps) {
  return (
    <p
      id={id}
      className={cn("text-xs text-muted-foreground leading-relaxed mt-1", className)}
    >
      {children}
    </p>
  );
}

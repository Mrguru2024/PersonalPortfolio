"use client";

import { FormLabel } from "@/components/ui/form";
import { SimpleTooltip } from "./SimpleTooltip";
import { getTermDefinition } from "@/lib/glossary";

interface FormLabelWithTooltipProps {
  label: string;
  term?: string;
  definition?: string;
  required?: boolean;
  className?: string;
}

export function FormLabelWithTooltip({
  label,
  term,
  definition,
  required = false,
  className,
}: FormLabelWithTooltipProps) {
  // Try to get definition from glossary if term is provided
  const glossaryTerm = term ? getTermDefinition(term) : null;
  const tooltipDefinition = definition || glossaryTerm?.definition;
  const tooltipTerm = term || glossaryTerm?.term || label;

  if (tooltipDefinition) {
    return (
      <div className="flex items-center gap-2">
        <FormLabel className={className}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </FormLabel>
        <SimpleTooltip term={tooltipTerm} definition={tooltipDefinition} />
      </div>
    );
  }

  return (
    <FormLabel className={className}>
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </FormLabel>
  );
}

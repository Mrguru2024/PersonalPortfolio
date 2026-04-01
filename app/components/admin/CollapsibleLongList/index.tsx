"use client";

import { Fragment, useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface CollapsibleLongListProps<T> {
  items: readonly T[];
  /** First N items stay visible; remainder behind expand. Default 8. */
  previewCount?: number;
  getKey: (item: T, index: number) => React.Key;
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Used in expand/collapse labels, e.g. "contacts" → "Show 12 more contacts". */
  nounPlural: string;
  className?: string;
  listClassName?: string;
  /** If true, long lists start expanded (optional override). */
  defaultOpen?: boolean;
}

/**
 * Keeps long lists scannable: first `previewCount` rows stay visible;
 * the rest expand on demand with a clear control and count.
 */
export function CollapsibleLongList<T>({
  items,
  previewCount = 8,
  getKey,
  renderItem,
  nounPlural,
  className,
  listClassName,
  defaultOpen = false,
}: CollapsibleLongListProps<T>) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();
  const hiddenCount = Math.max(0, items.length - previewCount);

  if (items.length <= previewCount) {
    return (
      <div className={cn(listClassName, className)}>
        {items.map((item, i) => (
          <Fragment key={getKey(item, i)}>{renderItem(item, i)}</Fragment>
        ))}
      </div>
    );
  }

  const preview = items.slice(0, previewCount);
  const rest = items.slice(previewCount);

  return (
    <div className={cn("space-y-3", className)}>
      <div className={cn(listClassName)}>
        {preview.map((item, i) => (
          <Fragment key={getKey(item, i)}>{renderItem(item, i)}</Fragment>
        ))}
      </div>

      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full justify-center gap-2 border-dashed text-muted-foreground hover:text-foreground"
            aria-expanded={open}
            aria-controls={contentId}
          >
            <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform duration-200", open && "rotate-180")} />
            {open ? `Hide ${hiddenCount} ${nounPlural}` : `Show ${hiddenCount} more ${nounPlural}`}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent
          id={contentId}
          className={cn("pt-3 mt-2 border-t border-border/50 data-[state=closed]:animate-none", listClassName)}
        >
          {rest.map((item, i) => (
            <Fragment key={getKey(item, i + previewCount)}>{renderItem(item, i + previewCount)}</Fragment>
          ))}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

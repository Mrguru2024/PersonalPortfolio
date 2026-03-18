"use client";

import { useQuery } from "@tanstack/react-query";
import { Lightbulb, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface AdminPlatformTipsProps {
  /** Section for tips: playbooks, discovery, proposal-prep, contacts, pipeline, or general */
  section?: string;
  /** Optional default open state */
  defaultOpen?: boolean;
  className?: string;
}

export function AdminPlatformTips({
  section = "general",
  defaultOpen = false,
  className,
}: AdminPlatformTipsProps) {
  const [open, setOpen] = useState(defaultOpen);

  const { data, isLoading } = useQuery<{ tips: string[]; source: "static" | "ai" }>({
    queryKey: ["/api/admin/crm/help/platform-tips", section],
    queryFn: async () => {
      const url = `/api/admin/crm/help/platform-tips${section ? `?section=${encodeURIComponent(section)}` : ""}`;
      const res = await apiRequest("GET", url);
      if (!res.ok) throw new Error("Failed to load tips");
      return res.json();
    },
  });

  const tips = data?.tips ?? [];

  return (
    <Collapsible open={open} onOpenChange={setOpen} className={cn("rounded-lg border bg-muted/40", className)}>
      <CollapsibleTrigger className="flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-muted/60">
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        <Lightbulb className="h-4 w-4 text-amber-500 dark:text-amber-400" />
        <span className="min-w-0 flex-1 leading-snug">Platform tips &amp; how to use this section</span>
        {data?.source === "ai" && (
          <span className="ml-2 shrink-0 text-xs text-muted-foreground">AI</span>
        )}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-3 pb-3 pt-0 text-sm">
          {isLoading ? (
            <div className="flex items-center gap-2 py-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading tips…
            </div>
          ) : tips.length === 0 ? (
            <p className="text-muted-foreground py-2">No tips available for this section.</p>
          ) : (
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              {tips.map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

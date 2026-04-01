"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  Bell,
  Loader2,
  Check,
  Clock,
  X,
  ChevronRight,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export interface AdminReminder {
  id: number;
  reminderKey: string;
  title: string;
  body: string | null;
  priority: string;
  actionUrl: string | null;
  relatedType: string | null;
  relatedId: number | null;
  status: string;
  snoozedUntil: string | null;
  createdAt: string;
}

interface AdminRemindersCardProps {
  /** Show compact list (e.g. dashboard); full page shows more. */
  compact?: boolean;
  /** Max items to show when compact. */
  maxItems?: number;
  /** Show "Generate" button to run engine. */
  showGenerate?: boolean;
}

interface ReminderConfig {
  reminderPlanningDays: string[];
  reminderCityFocus: string | null;
  reminderEditorialHolidaysEnabled: boolean;
  reminderEditorialLocalEventsEnabled: boolean;
  reminderEditorialHorizonDays: number;
}

export function AdminRemindersCard({
  compact = true,
  maxItems = 5,
  showGenerate = true,
}: AdminRemindersCardProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [suggestingId, setSuggestingId] = useState<number | null>(null);
  const [suggestSteps, setSuggestSteps] = useState<{ id: number; steps: string[]; summary?: string | null } | null>(null);

  const { data: reminders = [], isLoading } = useQuery<AdminReminder[]>({
    queryKey: ["/api/admin/reminders"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/reminders");
      if (!res.ok) throw new Error("Failed to load reminders");
      return res.json();
    },
  });

  const { data: reminderConfig } = useQuery<ReminderConfig>({
    queryKey: ["/api/admin/reminders/config"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/reminders/config");
      if (!res.ok) throw new Error("Failed to load reminder config");
      return res.json();
    },
  });

  const updateReminderMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      snoozedUntil,
    }: {
      id: number;
      status: string;
      snoozedUntil?: string;
    }) => {
      const res = await apiRequest("PATCH", `/api/admin/reminders/${id}`, {
        status,
        ...(snoozedUntil ? { snoozedUntil } : {}),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reminders"] });
      toast({ title: "Reminder updated" });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/reminders", {});
      if (!res.ok) throw new Error("Failed to generate");
      return res.json();
    },
    onSuccess: (data: { created?: number; skipped?: number }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reminders"] });
      const created = data?.created ?? 0;
      if (created > 0) {
        toast({
          titleKey: "admin.remindersAdded",
          values: { count: String(created) },
        });
      } else {
        toast({ titleKey: "admin.remindersUpToDate" });
      }
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const fetchSuggestNext = async (id: number) => {
    setSuggestingId(id);
    setSuggestSteps(null);
    try {
      const res = await apiRequest("POST", `/api/admin/reminders/${id}/suggest-next`, {});
      if (!res.ok) throw new Error("Failed to load suggestions");
      const data = await res.json();
      setSuggestSteps({ id, steps: data.steps ?? [], summary: data.summary });
    } catch {
      toast({ title: "Could not load suggestions", variant: "destructive" });
    } finally {
      setSuggestingId(null);
    }
  };

  const displayList = compact ? reminders.slice(0, maxItems) : reminders;

  const priorityColor = (p: string) => {
    switch (p) {
      case "urgent":
        return "destructive";
      case "high":
        return "default";
      case "medium":
        return "secondary";
      default:
        return "outline";
    }
  };

  const snoozeOptions = [
    { label: "1 hour", until: () => new Date(Date.now() + 60 * 60 * 1000).toISOString() },
    { label: "Until tomorrow", until: () => new Date(new Date().setHours(9, 0, 0, 0) + 24 * 60 * 60 * 1000).toISOString() },
    { label: "3 days", until: () => new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() },
    { label: "1 week", until: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
  ];

  return (
    <Card className="border bg-card shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            Growth reminders
          </CardTitle>
          <CardDescription>
            Tasks and nudges from your goals and platform activity. Stay aligned with growth.
          </CardDescription>
        </div>
        <div className="flex items-center gap-1">
          {showGenerate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
            >
              {generateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : displayList.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            No reminders right now. Use &quot;Refresh&quot; to generate from your CRM tasks, follow-ups, and goals.
          </p>
        ) : (
          <ul className="space-y-2">
            {displayList.map((r) => (
              <li
                key={r.id}
                className="flex flex-col gap-2 rounded-lg border p-3 bg-muted/30 min-w-0"
              >
                <div className="min-w-0 w-full">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-sm">{r.title}</span>
                    <Badge variant={priorityColor(r.priority)} className="text-xs">
                      {r.priority}
                    </Badge>
                    {r.relatedType === "editorial" ? (
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                        editorial
                      </Badge>
                    ) : null}
                  </div>
                  {r.body && (
                    <p className="text-xs text-muted-foreground mt-0.5">{r.body}</p>
                  )}
                </div>
                <div className="flex w-full flex-wrap items-center gap-1 sm:w-auto sm:shrink-0">
                  {r.actionUrl && (
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={r.actionUrl}>
                        Open <ChevronRight className="h-3 w-3 ml-0.5" />
                      </Link>
                    </Button>
                  )}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => suggestSteps?.id !== r.id && fetchSuggestNext(r.id)}
                        disabled={suggestingId === r.id}
                      >
                        {suggestingId === r.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" align="end">
                      <div className="space-y-2">
                        <p className="font-medium text-sm">Suggested next steps</p>
                        {suggestSteps?.id === r.id && suggestSteps.steps.length > 0 ? (
                          <>
                            {suggestSteps.summary && (
                              <p className="text-xs text-muted-foreground">{suggestSteps.summary}</p>
                            )}
                            <ul className="list-disc list-inside text-sm space-y-1">
                              {suggestSteps.steps.map((step, i) => (
                                <li key={i}>{step}</li>
                              ))}
                            </ul>
                          </>
                        ) : (
                          <p className="text-xs text-muted-foreground">Click to load AI suggestions.</p>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        Actions
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => updateReminderMutation.mutate({ id: r.id, status: "done" })}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Mark done
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => updateReminderMutation.mutate({ id: r.id, status: "dismissed" })}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Dismiss
                      </DropdownMenuItem>
                      {snoozeOptions.map((opt) => (
                        <DropdownMenuItem
                          key={opt.label}
                          onClick={() =>
                            updateReminderMutation.mutate({
                              id: r.id,
                              status: "snoozed",
                              snoozedUntil: opt.until(),
                            })
                          }
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          Snooze {opt.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </li>
            ))}
          </ul>
        )}
        {compact && reminders.length > 0 && (
          <div className="mt-3">
            <Button variant="link" size="sm" asChild>
              <Link href="/admin/reminders">View all reminders</Link>
            </Button>
          </div>
        )}
        {!compact && reminderConfig ? (
          <div className="mt-4 rounded-lg border border-dashed border-border/70 bg-muted/20 p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Editorial reminder targeting</p>
            <p>
              Planning days:{" "}
              {(reminderConfig.reminderPlanningDays ?? []).length > 0
                ? reminderConfig.reminderPlanningDays.map((d) => d[0].toUpperCase() + d.slice(1)).join(", ")
                : "Monday"}
            </p>
            <p>City focus: {reminderConfig.reminderCityFocus || "not set"}</p>
            <p>
              Holiday reminders: {reminderConfig.reminderEditorialHolidaysEnabled ? "on" : "off"} · Local events:{" "}
              {reminderConfig.reminderEditorialLocalEventsEnabled ? "on" : "off"} · Horizon:{" "}
              {reminderConfig.reminderEditorialHorizonDays} days
            </p>
            <p>
              Update from{" "}
              <Link href="/admin/settings" className="underline text-foreground">
                Admin settings
              </Link>
              .
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

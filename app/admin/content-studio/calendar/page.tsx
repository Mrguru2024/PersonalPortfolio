"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  addDays,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameDay,
  isSameMonth,
} from "date-fns";
import { Loader2, Plus, GripVertical, Copy, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

type View = "month" | "week" | "day" | "agenda";

interface CalEntry {
  id: number;
  title: string;
  scheduledAt: string;
  calendarStatus: string;
  platformTargets: string[];
  personaTags: string[];
  ctaObjective: string | null;
  warningsJson: string[] | null;
  documentId: number | null;
  sortOrder?: number;
}

function SortableRow({ entry }: { entry: CalEntry }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: entry.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  const warnings = entry.warningsJson ?? [];
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-2 rounded-lg border border-border/60 p-3 bg-card"
    >
      <button
        type="button"
        className="mt-1 text-muted-foreground hover:text-foreground touch-none"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="font-medium">{entry.title}</div>
        <div className="text-xs text-muted-foreground">
          {format(new Date(entry.scheduledAt), "PPp")} · {entry.calendarStatus}
        </div>
        <div className="flex flex-wrap gap-1 mt-1">
          {(entry.platformTargets ?? []).map((p) => (
            <Badge key={p} variant="outline" className="text-xs">
              {p}
            </Badge>
          ))}
        </div>
        {warnings.length > 0 && (
          <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-xs mt-2">
            <AlertTriangle className="h-3 w-3 shrink-0" />
            {warnings.join(", ")}
          </div>
        )}
        {entry.documentId && (
          <Link
            href={`/admin/content-studio/documents/${entry.documentId}`}
            className="text-xs text-primary underline mt-1 inline-block"
          >
            Linked document
          </Link>
        )}
      </div>
      <div className="flex flex-col gap-1 shrink-0">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            void fetch(`/api/admin/content-studio/calendar/${entry.id}/duplicate`, {
              method: "POST",
              credentials: "include",
            }).then((r) => {
              if (r.ok) window.location.reload();
            });
          }}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function ContentStudioCalendarPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [view, setView] = useState<View>("month");
  const [cursor, setCursor] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [quickOpen, setQuickOpen] = useState(false);
  const [qTitle, setQTitle] = useState("");
  const [qWhen, setQWhen] = useState(() => format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [qCta, setQCta] = useState("");
  const [qPersonas, setQPersonas] = useState("");
  const [qPlatforms, setQPlatforms] = useState("linkedin,x");

  const range = useMemo(() => {
    if (view === "month") {
      return { from: startOfMonth(cursor), to: endOfMonth(cursor) };
    }
    if (view === "week") {
      return { from: startOfWeek(cursor), to: endOfWeek(cursor) };
    }
    if (view === "day") {
      return { from: cursor, to: cursor };
    }
    return { from: addDays(cursor, -14), to: addDays(cursor, 60) };
  }, [view, cursor]);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/content-studio/calendar", range.from.toISOString(), range.to.toISOString()],
    queryFn: async () => {
      const q = new URLSearchParams();
      q.set("from", range.from.toISOString());
      q.set("to", range.to.toISOString());
      const res = await fetch(`/api/admin/content-studio/calendar?${q}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{ entries: CalEntry[] }>;
    },
  });

  const entries = data?.entries ?? [];

  const dayEntriesFixed = useMemo(() => {
    return [...entries]
      .filter((e) => isSameDay(new Date(e.scheduledAt), selectedDay))
      .sort(
        (a, b) =>
          (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
          new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
      );
  }, [entries, selectedDay]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const reorderMutation = useMutation({
    mutationFn: async (orderedIds: number[]) => {
      const res = await fetch("/api/admin/content-studio/calendar/reorder", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      });
      if (!res.ok) throw new Error("Reorder failed");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/content-studio/calendar"] });
    },
  });

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = dayEntriesFixed.map((e) => e.id);
    const oldIndex = ids.indexOf(Number(active.id));
    const newIndex = ids.indexOf(Number(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(ids, oldIndex, newIndex);
    reorderMutation.mutate(next);
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/content-studio/calendar", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: qTitle,
          scheduledAt: new Date(qWhen).toISOString(),
          ctaObjective: qCta || null,
          personaTags: qPersonas
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          platformTargets: qPlatforms
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          calendarStatus: "draft",
        }),
      });
      if (!res.ok) throw new Error("Create failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/content-studio/calendar"] });
      setQuickOpen(false);
      setQTitle("");
      toast({ title: "Scheduled" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor));
    const end = endOfWeek(endOfMonth(cursor));
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Editorial calendar</CardTitle>
            <CardDescription>
              Plan like Buffer/Hookle: draft → scheduled → published. Drag to reorder within a day.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={view} onValueChange={(v) => setView(v as View)}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="agenda">Agenda</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => setCursor(addDays(cursor, view === "month" ? -30 : -7))}>
              Prev
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCursor(addDays(cursor, view === "month" ? 30 : 7))}>
              Next
            </Button>
            <Dialog open={quickOpen} onOpenChange={setQuickOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Quick add
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New calendar entry</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 py-2">
                  <div className="space-y-1">
                    <Label>Title / headline</Label>
                    <Input value={qTitle} onChange={(e) => setQTitle(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>When (local → stored UTC)</Label>
                    <Input type="datetime-local" value={qWhen} onChange={(e) => setQWhen(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>CTA objective</Label>
                    <Input value={qCta} onChange={(e) => setQCta(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Personas (comma)</Label>
                    <Input value={qPersonas} onChange={(e) => setQPersonas(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Platforms (comma)</Label>
                    <Input value={qPlatforms} onChange={(e) => setQPlatforms(e.target.value)} />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => createMutation.mutate()} disabled={!qTitle.trim() || createMutation.isPending}>
                    {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : view === "month" ? (
            <div className="grid grid-cols-7 gap-1 text-center text-xs mb-1 text-muted-foreground">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>
          ) : null}
          {view === "month" && (
            <div className="grid grid-cols-7 gap-1">
              {monthDays.map((d) => {
                const count = entries.filter((e) => isSameDay(new Date(e.scheduledAt), d)).length;
                const sel = isSameDay(d, selectedDay);
                return (
                  <button
                    key={d.toISOString()}
                    type="button"
                    onClick={() => setSelectedDay(d)}
                    className={`min-h-[72px] rounded-md border p-1 text-left text-sm transition-colors ${
                      sel ? "border-primary bg-primary/10" : "border-border/60 bg-muted/20"
                    } ${!isSameMonth(d, cursor) ? "opacity-40" : ""}`}
                  >
                    <div className="font-medium">{format(d, "d")}</div>
                    {count > 0 && (
                      <Badge variant="secondary" className="text-[10px] px-1 py-0">
                        {count}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          {view === "agenda" && (
            <ul className="space-y-2">
              {[...entries]
                .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
                .map((e) => (
                  <li key={e.id} className="rounded-lg border p-3 text-sm">
                    <div className="font-medium">{e.title}</div>
                    <div className="text-xs text-muted-foreground">{format(new Date(e.scheduledAt), "PPp")}</div>
                  </li>
                ))}
            </ul>
          )}
          {(view === "week" || view === "day") && (
            <p className="text-sm text-muted-foreground">
              Use month or agenda for bulk planning; selected day panel below applies to all views.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{format(selectedDay, "EEEE, MMM d")} — queue</CardTitle>
          <CardDescription>Drag cards to reorder (sort order persists).</CardDescription>
        </CardHeader>
        <CardContent>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={dayEntriesFixed.map((e) => e.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {dayEntriesFixed.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No entries this day.</p>
                ) : (
                  dayEntriesFixed.map((e) => <SortableRow key={e.id} entry={e} />)
                )}
              </div>
            </SortableContext>
          </DndContext>
        </CardContent>
      </Card>
    </div>
  );
}

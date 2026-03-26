"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragOverlay,
  MeasuringStrategy,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
  type DropAnimation,
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
import { useMemo, useState, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  addDays,
  addMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameDay,
} from "date-fns";
import { Loader2, Plus, GripVertical, Copy, AlertTriangle, Settings2, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { calendarCollisionDetection, CALENDAR_SORTABLE_TRANSITION } from "@/components/content-studio/calendarDndConfig";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const WEEK_START_LS_KEY = "content-studio-calendar-week-starts-on";
const MONTH_DENSITY_LS_KEY = "content-studio-calendar-month-density";

type View = "month" | "week" | "day" | "agenda";
type WeekStartsOn = 0 | 1;
type MonthCellDensity = "compact" | "comfortable";

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
  documentApprovalStatus?: string | null;
  documentWorkflowStatus?: string | null;
}

interface PlatformAdapterRow {
  id: number;
  key: string;
  displayName: string;
  active: boolean;
}

function dayDropId(d: Date) {
  return `day-${format(d, "yyyy-MM-dd")}` as const;
}

function parseDayDropId(id: string): Date | null {
  if (!id.startsWith("day-")) return null;
  const part = id.slice(4);
  const [y, m, d] = part.split("-").map((x) => parseInt(x, 10));
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

const dropAnimation: DropAnimation = {
  duration: 280,
  easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
};

type DroppableDayCellVariant = "month" | "week";

function isCompactMonthCell(variant: DroppableDayCellVariant, monthDensity: MonthCellDensity): boolean {
  return variant === "month" && monthDensity === "compact";
}

/** Month grid cell or week strip column — same `day-*` droppable id as month (reschedule on drop). */
function DroppableDayCell({
  day,
  selectedDay,
  count,
  onSelect,
  variant,
  monthDensity = "compact",
}: {
  day: Date;
  selectedDay: Date;
  count: number;
  onSelect: () => void;
  variant: DroppableDayCellVariant;
  monthDensity?: MonthCellDensity;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: dayDropId(day) });
  const sel = isSameDay(day, selectedDay);
  const isMonthView = variant === "month";
  const compactMonth = isCompactMonthCell(variant, monthDensity);
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-lg transition-[box-shadow,transform,background-color] duration-200 ease-out",
        isMonthView && compactMonth && "min-h-[76px]",
        isMonthView && !compactMonth && "min-h-[104px]",
        variant === "week" && "min-h-[104px]",
        isOver && "ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.02] z-[1] bg-primary/10 shadow-md",
        !isOver && sel && "ring-1 ring-primary/60 bg-primary/10",
        !isOver && !sel && "border border-border/60 bg-muted/20",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "w-full h-full rounded-md text-left text-sm transition-colors hover:bg-muted/30",
          compactMonth && "min-h-[72px] p-1.5",
          isMonthView && !compactMonth && "min-h-[98px] p-2 flex flex-col gap-0.5",
          variant === "week" && "min-h-[96px] p-2 flex flex-col gap-0.5",
        )}
      >
        {compactMonth ? (
          <div className="font-medium tabular-nums leading-none">{format(day, "d")}</div>
        ) : (
          <>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground leading-tight">
              {format(day, "EEE")}
            </div>
            <div className="font-semibold text-base leading-none tabular-nums">{format(day, "d")}</div>
          </>
        )}
        {count > 0 && (
          <Badge
            variant="secondary"
            className={cn("text-[10px] px-1 py-0 w-fit", compactMonth ? "mt-0.5" : "mt-1")}
          >
            {count}
          </Badge>
        )}
        {isOver && (
          <div className={cn("text-[10px] font-medium text-primary", compactMonth ? "mt-1" : "mt-auto pt-1")}>
            Drop here
          </div>
        )}
      </button>
    </div>
  );
}

/** Static card for DragOverlay — must not call useSortable (duplicate id breaks DnD). */
function CalendarEntryDragPreview({ entry }: { entry: CalEntry }) {
  const warnings = entry.warningsJson ?? [];
  return (
    <div className="flex items-start gap-2 rounded-xl border-2 border-primary/50 p-3 bg-card shadow-xl ring-2 ring-primary/20 cursor-grabbing max-w-md">
      <div className="mt-1 text-primary shrink-0 p-1" aria-hidden>
        <GripVertical className="h-4 w-4" />
      </div>
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
      </div>
    </div>
  );
}

function SortableRow({
  entry,
  adapters,
  calendarQueryKey,
  qc,
}: {
  entry: CalEntry;
  adapters: PlatformAdapterRow[];
  calendarQueryKey: readonly unknown[];
  qc: ReturnType<typeof useQueryClient>;
}) {
  const { toast } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [editStatus, setEditStatus] = useState(entry.calendarStatus);
  const [editPlatforms, setEditPlatforms] = useState<string[]>([...(entry.platformTargets ?? [])]);

  useEffect(() => {
    if (editOpen) {
      setEditStatus(entry.calendarStatus);
      setEditPlatforms([...(entry.platformTargets ?? [])]);
    }
  }, [editOpen, entry]);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: entry.id,
    transition: CALENDAR_SORTABLE_TRANSITION,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
  };
  const warnings = entry.warningsJson ?? [];
  const activeAdapters = adapters.filter((a) => a.active);

  async function saveEdit() {
    const res = await fetch(`/api/admin/content-studio/calendar/${entry.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ calendarStatus: editStatus, platformTargets: editPlatforms }),
    });
    if (!res.ok) {
      toast({ title: "Save failed", variant: "destructive" });
      return;
    }
    void qc.invalidateQueries({ queryKey: calendarQueryKey });
    setEditOpen(false);
    toast({ title: "Calendar entry updated" });
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-start gap-2 rounded-xl border border-border/60 p-3 bg-card shadow-sm",
        isDragging && "shadow-md border-primary/30",
      )}
    >
      <button
        type="button"
        className="mt-1 text-muted-foreground hover:text-foreground touch-none cursor-grab active:cursor-grabbing shrink-0 rounded-md p-1 hover:bg-muted/80"
        aria-label="Drag to reorder or move to another day"
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
        {entry.documentId != null && entry.documentApprovalStatus && (
          <div className="mt-1">
            <Badge variant={entry.documentApprovalStatus === "approved" ? "default" : "secondary"} className="text-[10px]">
              Doc approval: {entry.documentApprovalStatus}
            </Badge>
          </div>
        )}
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
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="ghost" aria-label="Edit targets and status">
              <Pencil className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit publish targets</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Calendar status</Label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">draft</SelectItem>
                    <SelectItem value="scheduled">scheduled (cron picks up when due)</SelectItem>
                    <SelectItem value="published">published</SelectItem>
                    <SelectItem value="skipped">skipped</SelectItem>
                    <SelectItem value="failed">failed (fix + set back to scheduled)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Platforms (multi-select)</Label>
                <p className="text-xs text-muted-foreground">
                  Use keys that match adapters (e.g. facebook_page, manual). Cron publishes each target when the slot is due.
                </p>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                  {activeAdapters.map((a) => (
                    <label
                      key={a.key}
                      className="flex items-center gap-2 text-xs border rounded-md px-2 py-1.5 cursor-pointer bg-muted/30"
                    >
                      <input
                        type="checkbox"
                        className="rounded border-input"
                        checked={editPlatforms.includes(a.key)}
                        onChange={(e) => {
                          setEditPlatforms((prev) =>
                            e.target.checked ? [...prev, a.key] : prev.filter((k) => k !== a.key),
                          );
                        }}
                      />
                      <span>{a.displayName}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={() => void saveEdit()}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
  const [weekStartsOn, setWeekStartsOn] = useState<WeekStartsOn>(0);
  const [monthCellDensity, setMonthCellDensity] = useState<MonthCellDensity>("compact");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [qTitle, setQTitle] = useState("");
  const [qWhen, setQWhen] = useState(() => format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [qCta, setQCta] = useState("");
  const [qPersonas, setQPersonas] = useState("");
  const [qSelectedPlatforms, setQSelectedPlatforms] = useState<string[]>(["facebook_page", "manual"]);
  const [activeDragEntry, setActiveDragEntry] = useState<CalEntry | null>(null);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "draft" | "scheduled" | "published" | "skipped" | "failed"
  >("all");

  useEffect(() => {
    try {
      const w = localStorage.getItem(WEEK_START_LS_KEY);
      if (w === "1") setWeekStartsOn(1);
      const d = localStorage.getItem(MONTH_DENSITY_LS_KEY);
      if (d === "comfortable") setMonthCellDensity("comfortable");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(WEEK_START_LS_KEY, String(weekStartsOn));
    } catch {
      /* ignore */
    }
  }, [weekStartsOn]);

  useEffect(() => {
    try {
      localStorage.setItem(MONTH_DENSITY_LS_KEY, monthCellDensity);
    } catch {
      /* ignore */
    }
  }, [monthCellDensity]);

  const weekOptions = useMemo(() => ({ weekStartsOn }) as const, [weekStartsOn]);

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

  const calendarQueryKey = useMemo(
    () => ["/api/admin/content-studio/calendar", range.from.toISOString(), range.to.toISOString()] as const,
    [range.from, range.to],
  );

  const { data, isLoading } = useQuery({
    queryKey: calendarQueryKey,
    queryFn: async () => {
      const q = new URLSearchParams();
      q.set("from", range.from.toISOString());
      q.set("to", range.to.toISOString());
      const res = await fetch(`/api/admin/content-studio/calendar?${q}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{ entries: CalEntry[] }>;
    },
  });

  const { data: adaptersRes } = useQuery({
    queryKey: ["/api/admin/content-studio/adapters"],
    queryFn: async () => {
      const r = await fetch("/api/admin/content-studio/adapters", { credentials: "include" });
      if (!r.ok) throw new Error("Failed adapters");
      return r.json() as Promise<{ adapters: PlatformAdapterRow[] }>;
    },
  });

  const entries = data?.entries ?? [];
  const activeAdapters = useMemo(
    () => (adaptersRes?.adapters ?? []).filter((a) => a.active),
    [adaptersRes],
  );

  const visibleEntries = useMemo(() => {
    if (statusFilter === "all") return entries;
    return entries.filter((e) => e.calendarStatus === statusFilter);
  }, [entries, statusFilter]);

  const dayEntriesFixed = useMemo(() => {
    return [...visibleEntries]
      .filter((e) => isSameDay(new Date(e.scheduledAt), selectedDay))
      .sort(
        (a, b) =>
          (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
          new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
      );
  }, [visibleEntries, selectedDay]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8, tolerance: 5, delay: 0 },
    }),
  );

  const applyOptimisticReorder = useCallback(
    (orderedIds: number[]) => {
      qc.setQueryData<{ entries: CalEntry[] }>(calendarQueryKey, (old) => {
        if (!old?.entries) return old;
        const others = old.entries.filter((e) => !isSameDay(new Date(e.scheduledAt), selectedDay));
        const map = new Map(old.entries.map((e) => [e.id, e]));
        const reordered = orderedIds.map((id, i) => {
          const e = map.get(id);
          if (!e) return null;
          return { ...e, sortOrder: i };
        }).filter(Boolean) as CalEntry[];
        return { entries: [...others, ...reordered] };
      });
    },
    [qc, calendarQueryKey, selectedDay],
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
      void qc.invalidateQueries({ queryKey: calendarQueryKey });
    },
    onError: () => {
      void qc.invalidateQueries({ queryKey: calendarQueryKey });
      toast({ title: "Reorder failed", variant: "destructive" });
    },
  });

  const rescheduleMutation = useMutation({
    mutationFn: async ({ id, scheduledAt }: { id: number; scheduledAt: string }) => {
      const res = await fetch(`/api/admin/content-studio/calendar/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledAt }),
      });
      if (!res.ok) throw new Error("Could not move entry");
      return res.json();
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: calendarQueryKey });
      toast({ title: "Moved to new day" });
    },
    onError: (e: Error) => {
      void qc.invalidateQueries({ queryKey: calendarQueryKey });
      toast({ title: "Move failed", description: e.message, variant: "destructive" });
    },
  });

  const onDragStart = useCallback((event: DragStartEvent) => {
    const id = event.active.id;
    if (typeof id !== "number") return;
    const entry = entries.find((e) => e.id === id);
    setActiveDragEntry(entry ?? null);
  }, [entries]);

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDragEntry(null);
      const { active, over } = event;
      if (!over) return;
      const activeId = active.id;
      if (typeof activeId !== "number") return;

      const overId = over.id;

      if (typeof overId === "string" && overId.startsWith("day-")) {
        const targetDay = parseDayDropId(overId);
        if (!targetDay) return;
        const entry = entries.find((e) => e.id === activeId);
        if (!entry) return;
        const old = new Date(entry.scheduledAt);
        const next = new Date(
          targetDay.getFullYear(),
          targetDay.getMonth(),
          targetDay.getDate(),
          old.getHours(),
          old.getMinutes(),
          old.getSeconds(),
          old.getMilliseconds(),
        );
        if (isSameDay(old, next)) return;
        setSelectedDay(next);
        rescheduleMutation.mutate({ id: activeId, scheduledAt: next.toISOString() });
        return;
      }

      if (typeof overId !== "number") return;
      if (activeId === overId) return;
      const ids = dayEntriesFixed.map((e) => e.id);
      const oldIndex = ids.indexOf(activeId);
      const newIndex = ids.indexOf(overId);
      if (oldIndex < 0 || newIndex < 0) return;
      const next = arrayMove(ids, oldIndex, newIndex);
      applyOptimisticReorder(next);
      reorderMutation.mutate(next);
    },
    [entries, dayEntriesFixed, applyOptimisticReorder, reorderMutation, rescheduleMutation],
  );

  const onDragCancel = useCallback(() => {
    setActiveDragEntry(null);
  }, []);

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
          platformTargets: qSelectedPlatforms,
          calendarStatus: "draft",
        }),
      });
      if (!res.ok) throw new Error("Create failed");
      return res.json();
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: calendarQueryKey });
      setQuickOpen(false);
      setQTitle("");
      toast({ title: "Scheduled" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), weekOptions);
    const end = endOfWeek(endOfMonth(cursor), weekOptions);
    return eachDayOfInterval({ start, end });
  }, [cursor, weekOptions]);

  const monthWeekdayHeaders = useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(cursor), weekOptions);
    return eachDayOfInterval({ start: gridStart, end: addDays(gridStart, 6) });
  }, [cursor, weekOptions]);

  const weekDays = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(cursor, weekOptions),
        end: endOfWeek(cursor, weekOptions),
      }),
    [cursor, weekOptions],
  );

  function shiftCursorPrev() {
    if (view === "month") setCursor((c) => addMonths(c, -1));
    else if (view === "day") setCursor((c) => addDays(c, -1));
    else if (view === "agenda") setCursor((c) => addDays(c, -14));
    else setCursor((c) => addDays(c, -7));
  }

  function shiftCursorNext() {
    if (view === "month") setCursor((c) => addMonths(c, 1));
    else if (view === "day") setCursor((c) => addDays(c, 1));
    else if (view === "agenda") setCursor((c) => addDays(c, 14));
    else setCursor((c) => addDays(c, 7));
  }

  const sortableIds = dayEntriesFixed.map((e) => e.id);

  return (
    <div className="space-y-6">
      <Card className="border-primary/25 bg-primary/5">
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Automated social publishing</CardTitle>
          <CardDescription className="text-xs leading-relaxed">
            Vercel cron calls <code className="text-[10px] bg-muted px-1 rounded">/api/cron/content-studio-publish</code>{" "}
            every 10 minutes (Bearer <code className="text-[10px] bg-muted px-1 rounded">CRON_SECRET</code>). A row is
            eligible when it is <strong>scheduled</strong>, <strong>scheduledAt</strong> is in the past, it has a{" "}
            <strong>linked document</strong>, and <strong>platform targets</strong> are set (e.g.{" "}
            <code className="text-[10px] bg-muted px-1 rounded">facebook_page</code>,{" "}
            <code className="text-[10px] bg-muted px-1 rounded">manual</code>). By default the document must be{" "}
            <strong>approval: approved</strong> for auto-publish; set{" "}
            <code className="text-[10px] bg-muted px-1 rounded">CONTENT_STUDIO_SCHEDULED_REQUIRE_APPROVAL=0</code> to
            disable. Facebook Page posts need <code className="text-[10px] bg-muted px-1 rounded">FACEBOOK_ACCESS_TOKEN</code>{" "}
            + <code className="text-[10px] bg-muted px-1 rounded">FACEBOOK_PAGE_ID</code>. Failures set calendar status{" "}
            <strong>failed</strong> — fix tokens or copy, then set back to <strong>scheduled</strong>. Check{" "}
            <Link href="/admin/content-studio/workflow" className="underline font-medium text-foreground">
              workflow / publish logs
            </Link>
            .
          </CardDescription>
        </CardHeader>
      </Card>
      <DndContext
        sensors={sensors}
        collisionDetection={calendarCollisionDetection}
        measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
      >
        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Editorial calendar</CardTitle>
              <CardDescription>
                Drag the grip to <strong className="text-foreground">reorder</strong> the day queue, or drop onto a{" "}
                <strong className="text-foreground">day</strong> in month or week view to reschedule (time of day is
                preserved).
              </CardDescription>
            </div>
            <div className="flex flex-col gap-3 w-full lg:max-w-none">
              <Tabs value={view} onValueChange={(v) => setView(v as View)} className="w-full">
                <TabsList className="w-full sm:w-auto h-auto min-h-10 flex flex-wrap justify-start gap-1 p-1">
                  <TabsTrigger value="month" className="text-xs sm:text-sm">
                    Month
                  </TabsTrigger>
                  <TabsTrigger value="week" className="text-xs sm:text-sm">
                    Week
                  </TabsTrigger>
                  <TabsTrigger value="day" className="text-xs sm:text-sm">
                    Day
                  </TabsTrigger>
                  <TabsTrigger value="agenda" className="text-xs sm:text-sm">
                    Agenda
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm text-muted-foreground min-w-0 mr-auto sm:mr-0">
                  {view === "month" && <span className="font-medium text-foreground">{format(cursor, "MMMM yyyy")}</span>}
                  {view === "week" && (
                    <span className="font-medium text-foreground">
                      Week of {format(startOfWeek(cursor, weekOptions), "MMM d")} –{" "}
                      {format(endOfWeek(cursor, weekOptions), "MMM d, yyyy")}
                    </span>
                  )}
                  {view === "day" && (
                    <span className="font-medium text-foreground">{format(cursor, "EEEE, MMM d, yyyy")}</span>
                  )}
                  {view === "agenda" && (
                    <span className="font-medium text-foreground">
                      {format(range.from, "MMM d")} – {format(range.to, "MMM d, yyyy")}
                    </span>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={shiftCursorPrev}>
                  Prev
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>
                  Today
                </Button>
                <Button variant="outline" size="sm" onClick={shiftCursorNext}>
                  Next
                </Button>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                  <SelectTrigger className="w-[140px] h-9 text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="skipped">Skipped</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
                <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" aria-label="Calendar display settings">
                      <Settings2 className="h-4 w-4 sm:mr-1" />
                      <span className="hidden sm:inline">View options</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-80 space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Week starts on
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Aligns weekday headers and grid columns. Applies to month and week views.
                      </p>
                      <Select
                        value={String(weekStartsOn)}
                        onValueChange={(v) => setWeekStartsOn(v === "1" ? 1 : 0)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Sunday</SelectItem>
                          <SelectItem value="1">Monday (ISO)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Month cells
                      </Label>
                      <Select
                        value={monthCellDensity}
                        onValueChange={(v) => setMonthCellDensity(v as MonthCellDensity)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="compact">Compact (date only)</SelectItem>
                          <SelectItem value="comfortable">Comfortable (weekday + date)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </PopoverContent>
                </Popover>
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
                      <div className="space-y-2">
                        <Label>Platforms (publish targets)</Label>
                        <p className="text-xs text-muted-foreground">
                          Must match adapter keys from the list. Multiple Facebook Pages appear as separate targets (up to
                          four connected in Integrations).
                        </p>
                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                          {activeAdapters.map((a) => (
                            <label
                              key={a.key}
                              className="flex items-center gap-2 text-xs border rounded-md px-2 py-1.5 cursor-pointer bg-muted/30"
                            >
                              <input
                                type="checkbox"
                                className="rounded border-input"
                                checked={qSelectedPlatforms.includes(a.key)}
                                onChange={(e) => {
                                  setQSelectedPlatforms((prev) =>
                                    e.target.checked ? [...prev, a.key] : prev.filter((k) => k !== a.key),
                                  );
                                }}
                              />
                              <span>{a.displayName}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={() => createMutation.mutate()}
                        disabled={!qTitle.trim() || createMutation.isPending || qSelectedPlatforms.length === 0}
                      >
                        {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : view === "month" ? (
              <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-medium text-muted-foreground mb-1.5">
                {monthWeekdayHeaders.map((d) => (
                  <div key={d.toISOString()} className="py-1 truncate">
                    {format(d, "EEE")}
                  </div>
                ))}
              </div>
            ) : null}
            {view === "month" && (
              <div className="grid grid-cols-7 gap-1.5">
                {monthDays.map((d) => {
                  const inMonth =
                    d.getMonth() === cursor.getMonth() && d.getFullYear() === cursor.getFullYear();
                  const count = visibleEntries.filter((e) => isSameDay(new Date(e.scheduledAt), d)).length;
                  return (
                    <div
                      key={d.toISOString()}
                      className={cn(!inMonth && "opacity-45")}
                    >
                      <DroppableDayCell
                        day={d}
                        selectedDay={selectedDay}
                        count={count}
                        onSelect={() => {
                          setSelectedDay(d);
                          if (!inMonth) setCursor(d);
                        }}
                        variant="month"
                        monthDensity={monthCellDensity}
                      />
                    </div>
                  );
                })}
              </div>
            )}
            {view === "week" && (
              <div className="overflow-x-auto -mx-1 px-1 pb-1">
                <div className="min-w-[36rem] space-y-1.5">
                  <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-muted-foreground">
                    {weekDays.map((d) => (
                      <div key={`h-${d.toISOString()}`} className="py-1">
                        <div>{format(d, "EEE")}</div>
                        <div className="tabular-nums text-[10px] opacity-80">{format(d, "MMM d")}</div>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {weekDays.map((d) => {
                      const count = visibleEntries.filter((e) => isSameDay(new Date(e.scheduledAt), d)).length;
                      return (
                        <DroppableDayCell
                          key={d.toISOString()}
                          day={d}
                          selectedDay={selectedDay}
                          count={count}
                          onSelect={() => setSelectedDay(d)}
                          variant="week"
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            {view === "day" && (
              <div className="max-w-xs">
                <DroppableDayCell
                  day={cursor}
                  selectedDay={selectedDay}
                  count={visibleEntries.filter((e) => isSameDay(new Date(e.scheduledAt), cursor)).length}
                  onSelect={() => setSelectedDay(cursor)}
                  variant="week"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Drop an entry here to move it to this day (same as week/month cells).
                </p>
              </div>
            )}
            {view === "agenda" && (
              <ul className="space-y-2">
                {[...visibleEntries]
                  .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
                  .map((e) => (
                    <li key={e.id} className="rounded-lg border p-3 text-sm">
                      <div className="font-medium">{e.title}</div>
                      <div className="text-xs text-muted-foreground">{format(new Date(e.scheduledAt), "PPp")}</div>
                    </li>
                  ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{format(selectedDay, "EEEE, MMM d")} — queue</CardTitle>
            <CardDescription>
              Reorder with drag-and-drop; items animate into place. Drag onto a day in month or week view (or the day
              card in day view) to reschedule.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
              <div className="space-y-2.5">
                {dayEntriesFixed.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No entries this day.</p>
                ) : (
                  dayEntriesFixed.map((e) => (
                    <SortableRow
                      key={e.id}
                      entry={e}
                      adapters={adaptersRes?.adapters ?? []}
                      calendarQueryKey={calendarQueryKey}
                      qc={qc}
                    />
                  ))
                )}
              </div>
            </SortableContext>
          </CardContent>
        </Card>

        <DragOverlay dropAnimation={dropAnimation}>
          {activeDragEntry ? <CalendarEntryDragPreview entry={activeDragEntry} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

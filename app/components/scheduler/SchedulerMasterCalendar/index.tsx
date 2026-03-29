"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CalendarDays, ChevronLeft, ChevronRight, Loader2, Search } from "lucide-react";
import type { SchedulerAppointmentDetailClient } from "@/components/scheduler/schedulerAdminTypes";
import { SchedulerAppointmentDrawer } from "@/components/scheduler/SchedulerAppointmentDrawer";

type Enriched = {
  appointment: {
    id: number;
    guestName: string;
    guestEmail: string;
    startAt: string | Date;
    endAt: string | Date;
    status: string;
    leadScoreTier: string | null;
    intentClassification: string | null;
    noShowRiskTier: string | null;
    paymentStatus: string;
    estimatedValueCents: number | null;
    bookingSource: string | null;
  };
  bookingTypeName: string | null;
  hostDisplay: string | null;
};

type CalendarView = "day" | "week" | "month" | "agenda";

function statusStyles(status: string): string {
  const s = status.toLowerCase();
  if (s === "cancelled") return "border-destructive/50 bg-destructive/10 text-destructive";
  if (s === "completed") return "border-emerald-500/40 bg-emerald-500/10";
  if (s === "pending") return "border-amber-500/40 bg-amber-500/10";
  return "border-primary/30 bg-primary/5";
}

export function SchedulerMasterCalendar({
  businessTimezone = "America/New_York",
}: {
  businessTimezone?: string;
}) {
  const [view, setView] = useState<CalendarView>("week");
  const [cursor, setCursor] = useState(() => new Date());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Enriched[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<SchedulerAppointmentDetailClient | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const range = useMemo(() => {
    if (view === "day") {
      const d = startOfDay(cursor);
      return { from: d, to: new Date(d.getTime() + 24 * 60 * 60 * 1000 - 1) };
    }
    if (view === "week") {
      const start = startOfWeek(cursor, { weekStartsOn: 0 });
      const end = endOfWeek(cursor, { weekStartsOn: 0 });
      return { from: start, to: end };
    }
    if (view === "month") {
      return { from: startOfMonth(cursor), to: endOfMonth(cursor) };
    }
    const start = startOfWeek(cursor, { weekStartsOn: 0 });
    const end = endOfWeek(addWeeks(cursor, 3), { weekStartsOn: 0 });
    return { from: start, to: end };
  }, [cursor, view]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        from: range.from.toISOString(),
        to: range.to.toISOString(),
      });
      const res = await fetch(`/api/admin/scheduler/appointments?${qs}`, { credentials: "include" });
      const j = await res.json();
      setRows(j.appointments ?? []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [range.from, range.to]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (selectedId == null) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/admin/scheduler/appointments/${selectedId}`, { credentials: "include" });
        const j = await res.json();
        if (!cancelled && res.ok) setDetail(j as SchedulerAppointmentDetailClient);
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const a = r.appointment;
      return (
        a.guestName.toLowerCase().includes(q) ||
        a.guestEmail.toLowerCase().includes(q) ||
        (r.bookingTypeName || "").toLowerCase().includes(q)
      );
    });
  }, [rows, search]);

  const daysInView = useMemo(() => {
    if (view === "month") {
      const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 0 });
      const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 0 });
      return eachDayOfInterval({ start, end });
    }
    if (view === "week") {
      return eachDayOfInterval({
        start: startOfWeek(cursor, { weekStartsOn: 0 }),
        end: endOfWeek(cursor, { weekStartsOn: 0 }),
      });
    }
    return [startOfDay(cursor)];
  }, [cursor, view]);

  function goToday() {
    setCursor(new Date());
  }
  function goPrev() {
    if (view === "month") setCursor(addMonths(cursor, -1));
    else if (view === "day") setCursor(addDays(cursor, -1));
    else setCursor(addWeeks(cursor, -1));
  }
  function goNext() {
    if (view === "month") setCursor(addMonths(cursor, 1));
    else if (view === "day") setCursor(addDays(cursor, 1));
    else setCursor(addWeeks(cursor, 1));
  }

  const headerLabel =
    view === "month"
      ? format(cursor, "MMMM yyyy")
      : view === "day"
        ? format(cursor, "EEEE, MMM d, yyyy")
        : `${format(daysInView[0]!, "MMM d")} – ${format(daysInView[daysInView.length - 1]!, "MMM d, yyyy")}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="icon" onClick={goPrev} aria-label="Previous">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" size="icon" onClick={goNext} aria-label="Next">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={goToday}>
            Today
          </Button>
          <div className="flex items-center gap-2 text-sm font-medium px-2 min-w-[10rem]">
            <CalendarDays className="h-4 w-4 text-muted-foreground" aria-hidden />
            {headerLabel}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {(["day", "week", "month", "agenda"] as const).map((v) => (
            <Button
              key={v}
              type="button"
              size="sm"
              variant={view === v ? "default" : "outline"}
              className="capitalize"
              onClick={() => setView(v)}
            >
              {v}
            </Button>
          ))}
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden />
        <Input
          className="pl-9"
          placeholder="Search name, email, type…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search appointments"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : view === "agenda" ? (
        <div className="rounded-xl border border-border/70 divide-y divide-border/60 bg-card/30">
          {filtered.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No appointments in this range.</p>
          ) : (
            filtered.map((r) => {
              const a = r.appointment;
              const start = new Date(a.startAt);
              return (
                <button
                  type="button"
                  key={a.id}
                  className="w-full text-left px-4 py-3 hover:bg-muted/40 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                  onClick={() => setSelectedId(a.id)}
                >
                  <div>
                    <div className="font-medium text-foreground">{a.guestName}</div>
                    <div className="text-xs text-muted-foreground">
                      {format(toZonedTime(start, businessTimezone), "EEE MMM d · h:mm a")} · {r.bookingTypeName ?? "—"}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    <span className="rounded-md border px-1.5 py-0.5 capitalize">{a.status}</span>
                    {a.leadScoreTier ? (
                      <span className="rounded-md border px-1.5 py-0.5">Score: {a.leadScoreTier}</span>
                    ) : null}
                    {a.paymentStatus !== "none" ? (
                      <span className="rounded-md border px-1.5 py-0.5">Pay: {a.paymentStatus}</span>
                    ) : null}
                  </div>
                </button>
              );
            })
          )}
        </div>
      ) : (
        <div
          className={cn(
            "grid gap-2",
            view === "day" ? "grid-cols-1" : view === "week" ? "grid-cols-1 sm:grid-cols-7" : "grid-cols-7",
          )}
        >
          {daysInView.map((day) => {
            const inMonth = view !== "month" || isSameMonth(day, cursor);
            const dayApps = filtered.filter((r) => isSameDay(new Date(r.appointment.startAt), day));
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-[120px] rounded-lg border border-border/60 p-2 bg-muted/10",
                  !inMonth && view === "month" ? "opacity-40" : "",
                )}
              >
                <div className="text-xs font-semibold text-foreground mb-1">
                  {format(day, view === "month" ? "d" : "EEE d")}
                </div>
                <div className="space-y-1">
                  {dayApps.map((r) => {
                    const a = r.appointment;
                    const start = new Date(a.startAt);
                    return (
                      <button
                        type="button"
                        key={a.id}
                        className={cn(
                          "w-full text-left rounded border px-1.5 py-1 text-[11px] leading-tight",
                          statusStyles(a.status),
                        )}
                        onClick={() => setSelectedId(a.id)}
                      >
                        <div className="font-medium truncate">
                          {format(toZonedTime(start, businessTimezone), "h:mm a")}
                        </div>
                        <div className="truncate">{a.guestName}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <SchedulerAppointmentDrawer
        open={selectedId != null}
        onOpenChange={(o) => {
          if (!o) setSelectedId(null);
        }}
        loading={detailLoading}
        detail={detail}
        onSaved={() => void load()}
      />
    </div>
  );
}

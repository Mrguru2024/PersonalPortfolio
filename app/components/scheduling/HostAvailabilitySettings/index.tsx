"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface HostAvailabilitySettingsProps {
  /** When set, skips internal fetch and uses this data (for Storybook/tests). */
  initialData?: {
    timezone: string;
    weeklyRules: Array<{ dayOfWeek: number; startTimeLocal: string; endTimeLocal: string }>;
    blockedDates: string[];
  };
  apiBasePath?: string;
}

const DOW: Record<number, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

type WeeklyRule = { dayOfWeek: number; startTimeLocal: string; endTimeLocal: string };

function toTimeInput(isoHm: string): string {
  const m = isoHm.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return "";
  return `${m[1]!.padStart(2, "0")}:${m[2]}`;
}

export function HostAvailabilitySettings({
  initialData,
  apiBasePath = "/api/admin/scheduling/host-availability",
}: HostAvailabilitySettingsProps) {
  const [loading, setLoading] = useState(!initialData);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [timezone, setTimezone] = useState("America/New_York");
  const [weeklyRules, setWeeklyRules] = useState<WeeklyRule[]>([]);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [newBlocked, setNewBlocked] = useState("");

  useEffect(() => {
    if (initialData) {
      setTimezone(initialData.timezone);
      setWeeklyRules(initialData.weeklyRules);
      setBlockedDates(initialData.blockedDates);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(apiBasePath, { credentials: "include" });
        const j = await res.json();
        if (!res.ok) throw new Error(j.message || j.error || "Failed to load");
        if (cancelled) return;
        setTimezone(j.timezone || "America/New_York");
        setWeeklyRules(j.weeklyRules ?? []);
        setBlockedDates(j.blockedDates ?? []);
      } catch (e) {
        if (!cancelled) setMessage(e instanceof Error ? e.message : "Load failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialData, apiBasePath]);

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(apiBasePath, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weeklyRules, blockedDates }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Save failed");
      setMessage("Saved your availability.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function addRule() {
    setWeeklyRules([
      ...weeklyRules,
      { dayOfWeek: 1, startTimeLocal: "09:00", endTimeLocal: "17:00" },
    ]);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your working hours</CardTitle>
          <CardDescription>
            Wall times in <span className="font-medium text-foreground">{timezone}</span>. If you leave this empty,
            public booking uses the team&apos;s default availability from{" "}
            <span className="font-medium text-foreground">Scheduling → Availability</span>. When you add windows here,
            only your hours apply for meetings booked with you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {weeklyRules.length === 0 ? (
            <p className="text-sm text-muted-foreground">No personal hours — inheriting global schedule.</p>
          ) : null}
          <ul className="space-y-3">
            {weeklyRules.map((r, i) => (
              <li key={i} className="flex flex-wrap items-end gap-3 rounded-lg border p-3">
                <div className="space-y-1 min-w-[140px]">
                  <Label className="text-xs">Day</Label>
                  <Select
                    value={String(r.dayOfWeek)}
                    onValueChange={(v) => {
                      const next = [...weeklyRules];
                      next[i] = { ...next[i]!, dayOfWeek: parseInt(v, 10) };
                      setWeeklyRules(next);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(DOW).map(([k, label]) => (
                        <SelectItem key={k} value={k}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Start</Label>
                  <Input
                    type="time"
                    value={r.startTimeLocal.length === 5 ? r.startTimeLocal : ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      const next = [...weeklyRules];
                      next[i] = { ...next[i]!, startTimeLocal: v };
                      setWeeklyRules(next);
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">End</Label>
                  <Input
                    type="time"
                    value={toTimeInput(r.endTimeLocal)}
                    onChange={(e) => {
                      const v = e.target.value;
                      const next = [...weeklyRules];
                      next[i] = { ...next[i]!, endTimeLocal: v };
                      setWeeklyRules(next);
                    }}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  aria-label="Remove window"
                  onClick={() => setWeeklyRules(weeklyRules.filter((_, j) => j !== i))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
          <Button type="button" variant="outline" size="sm" onClick={addRule} className="gap-1">
            <Plus className="h-4 w-4" /> Add weekly window
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Unavailable dates</CardTitle>
          <CardDescription>
            Full days off — no public slots on these calendar dates ({timezone}).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <Label htmlFor="host-block-date">Add date</Label>
              <Input
                id="host-block-date"
                type="date"
                value={newBlocked}
                onChange={(e) => setNewBlocked(e.target.value)}
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                if (!newBlocked || blockedDates.includes(newBlocked)) return;
                setBlockedDates([...blockedDates, newBlocked].sort());
                setNewBlocked("");
              }}
            >
              Block day
            </Button>
          </div>
          {blockedDates.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {blockedDates.map((d) => (
                <li
                  key={d}
                  className="inline-flex items-center gap-1 rounded-full border bg-muted/50 px-3 py-1 text-sm"
                >
                  {d}
                  <button
                    type="button"
                    className="rounded-full p-0.5 hover:bg-muted"
                    aria-label={`Remove ${d}`}
                    onClick={() => setBlockedDates(blockedDates.filter((x) => x !== d))}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No blocked dates.</p>
          )}
        </CardContent>
      </Card>

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

      <Button type="button" onClick={() => void save()} disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Save my availability
      </Button>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type BookingType = { id: number; name: string; slug: string };
type Rule = {
  id: number;
  bookingTypeId: number | null;
  dayOfWeek: number;
  startTimeLocal: string;
  endTimeLocal: string;
};

const DOW: Record<number, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

export default function AdminSchedulingAvailabilityPage() {
  const [loading, setLoading] = useState(true);
  const [types, setTypes] = useState<BookingType[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [aiDesc, setAiDesc] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiScope, setAiScope] = useState<string>("global");
  const [newRule, setNewRule] = useState({
    bookingTypeScope: "global" as "global" | string,
    dayOfWeek: 1,
    startTimeLocal: "09:00",
    endTimeLocal: "17:00",
  });
  const [editingRuleId, setEditingRuleId] = useState<number | null>(null);

  const typeById = useMemo(() => new Map(types.map((t) => [t.id, t])), [types]);

  async function loadTypes() {
    const res = await fetch("/api/admin/scheduling/booking-types", { credentials: "include" });
    const j = await res.json();
    setTypes(j.types ?? []);
  }

  async function loadRules() {
    const res = await fetch("/api/admin/scheduling/availability-rules", { credentials: "include" });
    const j = await res.json();
    setRules(j.rules ?? []);
  }

  useEffect(() => {
    (async () => {
      try {
        await Promise.all([loadTypes(), loadRules()]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function applyAi() {
    setAiBusy(true);
    try {
      const bookingTypeId =
        aiScope === "global" ? null : parseInt(aiScope, 10);
      const res = await fetch("/api/admin/scheduling/availability/apply-ai", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: aiDesc, bookingTypeId }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(j.error || "Apply failed");
        return;
      }
      alert(`Saved ${j.inserted} rule(s). ${j.summary || ""}`);
      await loadRules();
    } finally {
      setAiBusy(false);
    }
  }

  async function saveRule() {
    const bookingTypeId =
      newRule.bookingTypeScope === "global" ? null : parseInt(newRule.bookingTypeScope, 10);
    const body = {
      bookingTypeId,
      dayOfWeek: newRule.dayOfWeek,
      startTimeLocal: newRule.startTimeLocal,
      endTimeLocal: newRule.endTimeLocal,
    };
    const res =
      editingRuleId != null
        ? await fetch(`/api/admin/scheduling/availability-rules/${editingRuleId}`, {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/admin/scheduling/availability-rules", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(j.error || "Could not save rule");
      return;
    }
    setEditingRuleId(null);
    setNewRule({ bookingTypeScope: "global", dayOfWeek: 1, startTimeLocal: "09:00", endTimeLocal: "17:00" });
    await loadRules();
  }

  function startEditRule(r: Rule) {
    setEditingRuleId(r.id);
    setNewRule({
      bookingTypeScope: r.bookingTypeId == null ? "global" : String(r.bookingTypeId),
      dayOfWeek: r.dayOfWeek,
      startTimeLocal: r.startTimeLocal,
      endTimeLocal: r.endTimeLocal,
    });
  }

  function cancelRuleEdit() {
    setEditingRuleId(null);
    setNewRule({ bookingTypeScope: "global", dayOfWeek: 1, startTimeLocal: "09:00", endTimeLocal: "17:00" });
  }

  async function deleteRule(id: number) {
    if (!confirm("Delete this rule?")) return;
    if (editingRuleId === id) cancelRuleEdit();
    const res = await fetch(`/api/admin/scheduling/availability-rules/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      alert("Delete failed");
      return;
    }
    await loadRules();
  }

  function scopeLabel(r: Rule) {
    if (r.bookingTypeId == null) return "All meeting types";
    const t = typeById.get(r.bookingTypeId);
    return t ? t.name : `Type #${r.bookingTypeId}`;
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Availability rules</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Per–meeting-type rules override “all types” for that day. Times are wall clock in your business timezone
            (Scheduling settings).
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/scheduling">Back</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>AI: parse &amp; save</CardTitle>
          <CardDescription>
            Replaces every rule for the selected scope with AI-parsed windows (same engine as Scheduling settings).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 max-w-2xl">
          <Textarea
            rows={3}
            value={aiDesc}
            onChange={(e) => setAiDesc(e.target.value)}
            placeholder="e.g. Monday–Friday 10:00–16:00, Saturday 10:00–14:00, closed Sunday"
          />
          <div className="space-y-2">
            <Label>Apply to</Label>
            <Select value={aiScope} onValueChange={setAiScope}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="global">All meeting types (default)</SelectItem>
                {types.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="button" disabled={aiBusy || !aiDesc.trim()} onClick={() => void applyAi()}>
            {aiBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Parse with AI & save to database"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add rule manually</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 max-w-4xl items-end">
          <div className="space-y-2">
            <Label>Scope</Label>
            <Select
              value={newRule.bookingTypeScope}
              onValueChange={(v) => setNewRule({ ...newRule, bookingTypeScope: v as "global" | string })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="global">All meeting types</SelectItem>
                {types.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Day</Label>
            <Select
              value={String(newRule.dayOfWeek)}
              onValueChange={(v) => setNewRule({ ...newRule, dayOfWeek: parseInt(v, 10) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                  <SelectItem key={d} value={String(d)}>
                    {DOW[d]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Start (HH:mm)</Label>
            <Input
              value={newRule.startTimeLocal}
              onChange={(e) => setNewRule({ ...newRule, startTimeLocal: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>End (HH:mm)</Label>
            <Input
              value={newRule.endTimeLocal}
              onChange={(e) => setNewRule({ ...newRule, endTimeLocal: e.target.value })}
            />
          </div>
          <div className="flex flex-wrap gap-2 lg:col-span-4">
            <Button type="button" className="w-fit" onClick={() => void saveRule()}>
              {editingRuleId != null ? "Save rule" : "Add rule"}
            </Button>
            {editingRuleId != null ? (
              <Button type="button" variant="outline" className="w-fit" onClick={cancelRuleEdit}>
                Cancel edit
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current rules</CardTitle>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <p className="text-sm text-muted-foreground">No rules — public slots will be empty until you add some.</p>
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border">
              {rules.map((r) => (
                <li key={r.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 text-sm">
                  <div>
                    <span className="font-medium">{DOW[r.dayOfWeek]}</span>{" "}
                    <span className="text-muted-foreground">
                      {r.startTimeLocal}–{r.endTimeLocal} · {scopeLabel(r)}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button type="button" size="sm" variant="secondary" onClick={() => startEditRule(r)}>
                      Edit
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => void deleteRule(r.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

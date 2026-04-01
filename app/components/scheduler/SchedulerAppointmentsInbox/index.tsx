"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Search } from "lucide-react";
import type { SchedulerAppointmentDetailClient } from "@/components/scheduler/schedulerAdminTypes";
import { SchedulerAppointmentDrawer } from "@/components/scheduler/SchedulerAppointmentDrawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Row = {
  appointment: {
    id: number;
    guestName: string;
    guestEmail: string;
    guestCompany: string | null;
    startAt: string | Date;
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

const TZ = "America/New_York";

export function SchedulerAppointmentsInbox() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<SchedulerAppointmentDetailClient | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/scheduler/appointments", { credentials: "include" });
      const j = await res.json();
      setRows(j.appointments ?? []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (selectedId == null) {
      setDetail(null);
      return;
    }
    let c = false;
    setDetailLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/admin/scheduler/appointments/${selectedId}`, { credentials: "include" });
        const j = await res.json();
        if (!c && res.ok) setDetail(j as SchedulerAppointmentDetailClient);
      } finally {
        if (!c) setDetailLoading(false);
      }
    })();
    return () => {
      c = true;
    };
  }, [selectedId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = rows;
    if (q) {
      list = list.filter((r) => {
        const a = r.appointment;
        return (
          a.guestName.toLowerCase().includes(q) ||
          (a.guestEmail || "").toLowerCase().includes(q) ||
          (r.bookingTypeName || "").toLowerCase().includes(q) ||
          (a.bookingSource || "").toLowerCase().includes(q)
        );
      });
    }
    switch (filter) {
      case "high_value":
        list = list.filter((r) => r.appointment.estimatedValueCents != null && r.appointment.estimatedValueCents >= 500_00);
        break;
      case "low_quality":
        list = list.filter((r) => r.appointment.leadScoreTier === "low");
        break;
      case "paid":
        list = list.filter((r) => r.appointment.paymentStatus === "paid");
        break;
      case "unpaid":
        list = list.filter((r) => ["pending", "none"].includes(r.appointment.paymentStatus));
        break;
      case "no_show_risk":
        list = list.filter((r) => r.appointment.noShowRiskTier === "high" || r.appointment.noShowRiskTier === "medium");
        break;
      case "upcoming":
        list = list.filter((r) => new Date(r.appointment.startAt) > new Date() && r.appointment.status !== "cancelled");
        break;
      case "cancelled":
        list = list.filter((r) => r.appointment.status === "cancelled");
        break;
      case "completed":
        list = list.filter((r) => r.appointment.status === "completed");
        break;
      default:
        break;
    }
    return list;
  }, [rows, search, filter]);

  const sorted = useMemo(
    () =>
      [...filtered].sort((a, b) => new Date(b.appointment.startAt).getTime() - new Date(a.appointment.startAt).getTime()),
    [filtered],
  );

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full md:w-[220px]">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="high_value">High value (5k+ est.)</SelectItem>
            <SelectItem value="low_quality">Low score</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="unpaid">Unpaid / none</SelectItem>
            <SelectItem value="no_show_risk">No-show risk</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
          Refresh
        </Button>
      </div>

      <div className="rounded-xl border border-border/70 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Host</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Intent</TableHead>
              <TableHead>Pay</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Risk</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center text-muted-foreground py-10">
                  No rows match.
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((r) => {
                const a = r.appointment;
                return (
                  <TableRow
                    key={a.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedId(a.id)}
                  >
                    <TableCell className="font-medium">{a.guestName}</TableCell>
                    <TableCell>{a.guestCompany ?? "-"}</TableCell>
                    <TableCell>{r.bookingTypeName ?? "-"}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs">
                      {format(toZonedTime(new Date(a.startAt), TZ), "MMM d, h:mm a")}
                    </TableCell>
                    <TableCell className="text-xs">{r.hostDisplay ?? "-"}</TableCell>
                    <TableCell className="capitalize text-xs">{a.status}</TableCell>
                    <TableCell className="capitalize text-xs">{a.leadScoreTier ?? "-"}</TableCell>
                    <TableCell className="text-xs max-w-[120px] truncate">
                      {a.intentClassification?.replace(/_/g, " ") ?? "-"}
                    </TableCell>
                    <TableCell className="text-xs capitalize">{a.paymentStatus}</TableCell>
                    <TableCell className="text-xs">
                      {a.estimatedValueCents != null
                        ? "$" + (a.estimatedValueCents / 100).toFixed(0)
                        : "-"}
                    </TableCell>
                    <TableCell className="text-xs max-w-[100px] truncate">{a.bookingSource ?? "-"}</TableCell>
                    <TableCell className="text-xs capitalize">{a.noShowRiskTier ?? "-"}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <SchedulerAppointmentDrawer
        open={selectedId != null}
        onOpenChange={(o) => !o && setSelectedId(null)}
        loading={detailLoading}
        detail={detail}
        onSaved={() => void load()}
      />
    </div>
  );
}

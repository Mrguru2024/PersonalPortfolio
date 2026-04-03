"use client";

import Link from "next/link";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { SchedulerAppointmentDetailClient } from "@/components/scheduler/schedulerAdminTypes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TZ = "America/New_York";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  detail: SchedulerAppointmentDetailClient | null;
  onSaved: () => void;
};

export function SchedulerAppointmentDrawer({ open, onOpenChange, loading, detail, onSaved }: Props) {
  const [internalNotes, setInternalNotes] = useState("");
  const [status, setStatus] = useState("confirmed");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!detail) return;
    setInternalNotes(detail.appointment.internalNotes ?? "");
    setStatus(detail.appointment.status);
  }, [detail]);

  async function save() {
    if (!detail) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/scheduler/appointments/${detail.appointment.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ internalNotes, status }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        console.error(j.error || "Save failed");
        return;
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  const a = detail?.appointment;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg overflow-y-auto border-l border-border/80"
        accessibilityTitle={
          loading || !detail || !a ? "Appointment details" : undefined
        }
      >
        {loading || !detail || !a ? (
          <>
            <div className="flex justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="Loading" />
            </div>
          </>
        ) : (
          <>
            <SheetHeader className="pr-8">
              <SheetTitle className="text-left">{a.guestName}</SheetTitle>
              <SheetDescription className="text-left space-y-1">
                <span className="block">
                  {format(toZonedTime(new Date(a.startAt), TZ), "EEEE, MMM d, yyyy · h:mm a")} →{" "}
                  {format(toZonedTime(new Date(a.endAt), TZ), "h:mm a")}
                </span>
                <span className="block text-xs">{detail.bookingTypeName ?? "Meeting"}</span>
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6 text-sm">
              <section className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact</h3>
                <p>{a.guestEmail}</p>
                {a.guestPhone ? <p>{a.guestPhone}</p> : null}
                {a.guestCompany || detail.contactCompany ? (
                  <p className="text-muted-foreground">
                    {a.guestCompany || detail.contactCompany}
                  </p>
                ) : null}
              </section>

              <section className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-muted-foreground">Lead score</div>
                  <div className="font-medium capitalize">{a.leadScoreTier ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Intent</div>
                  <div className="font-medium capitalize">{a.intentClassification?.replace(/_/g, " ") ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">No-show risk</div>
                  <div className="font-medium capitalize">{a.noShowRiskTier ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Payment</div>
                  <div className="font-medium capitalize">{a.paymentStatus}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Est. value</div>
                  <div className="font-medium">
                    {a.estimatedValueCents != null
                      ? "$" + (a.estimatedValueCents / 100).toLocaleString()
                      : "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Source</div>
                  <div className="font-medium truncate" title={a.bookingSource ?? ""}>
                    {a.bookingSource ?? "—"}
                  </div>
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Host</h3>
                <p>{detail.hostDisplay ?? "Unassigned pool"}</p>
              </section>

              {a.guestNotes ? (
                <section className="space-y-1">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Guest notes
                  </h3>
                  <p className="whitespace-pre-wrap text-muted-foreground">{a.guestNotes}</p>
                </section>
              ) : null}

              {a.formAnswersJson && Object.keys(a.formAnswersJson).length > 0 ? (
                <section className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Booking answers
                  </h3>
                  <ul className="space-y-1 text-muted-foreground">
                    {Object.entries(a.formAnswersJson).map(([k, v]) => (
                      <li key={k}>
                        <span className="font-medium text-foreground">{k}:</span> {String(v)}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {detail.crmContact && typeof detail.crmContact.id === "number" ? (
                <section className="space-y-2 rounded-lg border border-border/60 p-3 bg-muted/20">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    CRM record
                  </h3>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/crm/${detail.crmContact.id}`}>Open contact in CRM</Link>
                  </Button>
                </section>
              ) : null}

              {detail.priorAppointments?.length ? (
                <section className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Prior bookings
                  </h3>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {detail.priorAppointments.slice(0, 8).map((p) => (
                      <li key={p.id}>
                        {format(toZonedTime(new Date(p.startAt), TZ), "MMM d, yyyy")} · {p.status}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <section className="space-y-3 border-t border-border/60 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="appt-status">Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger id="appt-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="no_show">No-show</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appt-internal">Internal notes (team only)</Label>
                  <Textarea
                    id="appt-internal"
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    rows={4}
                    className="resize-y"
                  />
                </div>
                <Button type="button" onClick={() => void save()} disabled={saving} className="w-full sm:w-auto">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
                </Button>
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

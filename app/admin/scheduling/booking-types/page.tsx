"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type BookingType = {
  id: number;
  name: string;
  slug: string;
  durationMinutes: number;
  description: string | null;
  active: boolean;
  sortOrder: number;
};

export default function AdminSchedulingBookingTypesPage() {
  const [loading, setLoading] = useState(true);
  const [types, setTypes] = useState<BookingType[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    durationMinutes: 30,
    description: "",
    sortOrder: 0,
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  async function load() {
    const res = await fetch("/api/admin/scheduling/booking-types", { credentials: "include" });
    const j = await res.json();
    setTypes(j.types ?? []);
  }

  useEffect(() => {
    (async () => {
      try {
        await load();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function addType() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/scheduling/booking-types", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          slug: form.slug,
          durationMinutes: form.durationMinutes,
          description: form.description || null,
          sortOrder: form.sortOrder,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(j.error || "Could not create");
        return;
      }
      setForm({ name: "", slug: "", durationMinutes: 30, description: "", sortOrder: 0 });
      setEditingId(null);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit() {
    if (editingId == null) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/scheduling/booking-types/${editingId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          slug: form.slug,
          durationMinutes: form.durationMinutes,
          description: form.description || null,
          sortOrder: form.sortOrder,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(j.error || "Could not update");
        return;
      }
      setEditingId(null);
      setForm({ name: "", slug: "", durationMinutes: 30, description: "", sortOrder: 0 });
      await load();
    } finally {
      setSaving(false);
    }
  }

  function startEdit(t: BookingType) {
    setEditingId(t.id);
    setForm({
      name: t.name,
      slug: t.slug,
      durationMinutes: t.durationMinutes,
      description: t.description || "",
      sortOrder: t.sortOrder,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({ name: "", slug: "", durationMinutes: 30, description: "", sortOrder: 0 });
  }

  async function toggleActive(t: BookingType) {
    const res = await fetch(`/api/admin/scheduling/booking-types/${t.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !t.active }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j.error || "Update failed");
      return;
    }
    await load();
  }

  async function removeType(t: BookingType) {
    if (!confirm(`Delete "${t.name}"? Only allowed if there are no bookings for this type.`)) return;
    const res = await fetch(`/api/admin/scheduling/booking-types/${t.id}`, {
      method: "DELETE",
      credentials: "include",
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(j.error || "Delete failed");
      return;
    }
    await load();
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
          <h1 className="text-2xl font-bold">Meeting types</h1>
          <p className="text-sm text-muted-foreground mt-1">Duration and slug power the public /book flow.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/scheduling">Back</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editingId != null ? `Edit type #${editingId}` : "Add type"}</CardTitle>
          <CardDescription>Slug: lowercase, hyphens (e.g. strategy-call).</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 max-w-3xl">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Slug</Label>
            <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="intro-call" />
          </div>
          <div className="space-y-2">
            <Label>Duration (minutes)</Label>
            <Input
              type="number"
              value={form.durationMinutes}
              onChange={(e) => setForm({ ...form, durationMinutes: parseInt(e.target.value, 10) || 30 })}
            />
          </div>
          <div className="space-y-2">
            <Label>Sort order</Label>
            <Input
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value, 10) || 0 })}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Description</Label>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            {editingId != null ? (
              <>
                <Button type="button" onClick={saveEdit} disabled={saving || !form.name.trim() || !form.slug.trim()}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
                </Button>
                <Button type="button" variant="outline" onClick={cancelEdit} disabled={saving}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button type="button" onClick={addType} disabled={saving || !form.name.trim() || !form.slug.trim()}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create type"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {types.length === 0 ? (
            <p className="text-sm text-muted-foreground">No types yet.</p>
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border">
              {types.map((t) => (
                <li key={t.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-medium">
                      {t.name}{" "}
                      <span className="text-muted-foreground font-normal text-sm">
                        ({t.durationMinutes} min, slug: {t.slug})
                      </span>
                    </p>
                    {t.description ? <p className="text-sm text-muted-foreground mt-0.5">{t.description}</p> : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="secondary" onClick={() => startEdit(t)}>
                      Edit
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => toggleActive(t)}>
                      {t.active ? "Deactivate" : "Activate"}
                    </Button>
                    <Button type="button" size="sm" variant="destructive" onClick={() => removeType(t)}>
                      <Trash2 className="h-4 w-4" />
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

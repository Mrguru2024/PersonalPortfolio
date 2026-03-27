"use client";

import { useEffect, useMemo, useState } from "react";
import type { CommSegmentFilters } from "@shared/communicationsSchema";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CRM_PIPELINE_STAGES, getPipelineStageLabel } from "@/lib/crm-pipeline-stages";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const LIFECYCLE_OPTIONS = ["cold", "warm", "qualified", "sales_ready"];
const INTENT_OPTIONS = ["low_intent", "moderate_intent", "high_intent", "hot_lead"];

const ANY = "__any__";

function sel(v: string | undefined): string {
  return v && String(v).trim() !== "" ? String(v) : ANY;
}

function out(v: string): string | undefined {
  return v === ANY || !v.trim() ? undefined : v;
}

type CrmContactRow = { id: number; name: string; email: string };

export interface CommAudienceSegmentBuilderProps {
  value: CommSegmentFilters;
  onChange: (next: CommSegmentFilters) => void;
  /** Optional saved list merges on the server over these fields when creating/previewing. */
  savedListId: string;
  onSavedListIdChange: (id: string) => void;
  savedLists: { id: number; name: string }[];
}

export function CommAudienceSegmentBuilder({
  value,
  onChange,
  savedListId,
  onSavedListIdChange,
  savedLists,
}: CommAudienceSegmentBuilderProps) {
  const patch = (partial: Partial<CommSegmentFilters>) => {
    onChange({ ...value, ...partial });
  };

  const tagsStr = useMemo(() => (value.tags ?? []).join(", "), [value.tags]);

  const setTagsFromString = (s: string) => {
    const tags = s
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    patch({ tags: tags.length ? tags : undefined });
  };

  const [contactSearch, setContactSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchResults, setSearchResults] = useState<CrmContactRow[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedHydrated, setSelectedHydrated] = useState<CrmContactRow[]>([]);

  const contactIdsKey = useMemo(
    () => [...(value.contactIds ?? [])].sort((a, b) => a - b).join(","),
    [value.contactIds],
  );

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(contactSearch.trim()), 300);
    return () => clearTimeout(t);
  }, [contactSearch]);

  useEffect(() => {
    if (debouncedSearch.length < 2) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    setSearchLoading(true);
    void fetch(`/api/admin/crm/contacts?search=${encodeURIComponent(debouncedSearch)}`, {
      credentials: "include",
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: unknown) => {
        if (cancelled) return;
        if (!Array.isArray(rows)) {
          setSearchResults([]);
          return;
        }
        setSearchResults(
          rows.map((r) => {
            const row = r as CrmContactRow;
            return { id: row.id, name: row.name, email: row.email };
          }),
        );
      })
      .catch(() => {
        if (!cancelled) setSearchResults([]);
      })
      .finally(() => {
        if (!cancelled) setSearchLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch]);

  useEffect(() => {
    const ids = value.contactIds ?? [];
    if (ids.length === 0) {
      setSelectedHydrated([]);
      return;
    }
    let cancelled = false;
    void fetch(`/api/admin/crm/contacts?ids=${ids.join(",")}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: unknown) => {
        if (cancelled || !Array.isArray(rows)) return;
        const map = new Map(
          rows.map((r) => {
            const row = r as CrmContactRow;
            return [row.id, { id: row.id, name: row.name, email: row.email }] as const;
          }),
        );
        const ordered = ids.map((id) => map.get(id)).filter(Boolean) as CrmContactRow[];
        setSelectedHydrated(ordered);
      })
      .catch(() => {
        if (!cancelled) setSelectedHydrated([]);
      });
    return () => {
      cancelled = true;
    };
  }, [contactIdsKey]);

  const addContact = (row: CrmContactRow) => {
    const ids = [...(value.contactIds ?? [])];
    if (!ids.includes(row.id)) ids.push(row.id);
    patch({ contactIds: ids });
    setContactSearch("");
    setDebouncedSearch("");
    setSearchResults([]);
  };

  const removeContact = (id: number) => {
    const ids = (value.contactIds ?? []).filter((x) => x !== id);
    patch({ contactIds: ids.length ? ids : undefined });
  };

  const bookedCallSel =
    value.bookedCall === true ? "yes" : value.bookedCall === false ? "no" : ANY;

  const researchSel =
    value.hasResearch === true ? "yes" : value.hasResearch === false ? "no" : ANY;

  const selectedIdSet = useMemo(() => new Set(value.contactIds ?? []), [value.contactIds]);

  return (
    <div className="space-y-6 rounded-lg border border-border bg-muted/20 p-4 dark:bg-muted/10">
      <div className="space-y-2">
        <Label>Start from saved list (optional)</Label>
        <Select value={savedListId || ANY} onValueChange={(v) => onSavedListIdChange(v === ANY ? "" : v)}>
          <SelectTrigger>
            <SelectValue placeholder="None — build audience below" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>None — use only the rules below</SelectItem>
            {savedLists.map((l) => (
              <SelectItem key={l.id} value={String(l.id)}>
                {l.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          If you pick a list, its rules are combined with the fields below (below wins when both set).
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Checkbox
          id="seg-dnc"
          checked={value.excludeDoNotContact !== false}
          onCheckedChange={(c) => patch({ excludeDoNotContact: c !== false })}
        />
        <Label htmlFor="seg-dnc" className="cursor-pointer font-medium">
          Exclude do-not-contact leads
        </Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="seg-contact-search">Specific people (optional)</Label>
        {(value.contactIds?.length ?? 0) > 0 && (
          <ul className="flex flex-wrap gap-2">
            {(value.contactIds ?? []).map((id) => {
              const row = selectedHydrated.find((r) => r.id === id);
              return (
                <li
                  key={id}
                  className="flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-sm max-w-full"
                >
                  <span className="truncate">
                    {row ? (
                      <>
                        <span className="font-medium text-foreground">{row.name}</span>
                        <span className="text-muted-foreground"> · {row.email}</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">Loading…</span>
                    )}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => removeContact(id)}
                    aria-label={`Remove ${row?.name ?? "contact"}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
        <div className="relative">
          <Input
            id="seg-contact-search"
            value={contactSearch}
            onChange={(e) => setContactSearch(e.target.value)}
            placeholder="Search by name or email"
            autoComplete="off"
          />
          {debouncedSearch.length >= 2 && searchLoading ? (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          ) : null}
        </div>
        {debouncedSearch.length >= 2 && !searchLoading && searchResults.length === 0 ? (
          <p className="text-xs text-muted-foreground">No leads match that search.</p>
        ) : null}
        {searchResults.some((r) => !selectedIdSet.has(r.id)) ? (
          <ul
            className="max-h-44 overflow-y-auto rounded-md border border-border bg-card text-sm"
            role="listbox"
            aria-label="Search results"
          >
            {searchResults
              .filter((r) => !selectedIdSet.has(r.id))
              .map((r) => (
                <li key={r.id} className="border-b border-border/60 last:border-0">
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2.5 hover:bg-muted/80 transition-colors"
                    onClick={() => addContact(r)}
                  >
                    <span className="font-medium text-foreground">{r.name}</span>
                    <span className="text-muted-foreground"> — {r.email}</span>
                  </button>
                </li>
              ))}
          </ul>
        ) : null}
        <p className="text-xs text-muted-foreground">
          When people are listed here, the campaign only goes to them (other filters still apply).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={sel(value.type)} onValueChange={(v) => patch({ type: out(v) })}>
            <SelectTrigger>
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any</SelectItem>
              <SelectItem value="lead">Lead</SelectItem>
              <SelectItem value="client">Client</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={sel(value.status)} onValueChange={(v) => patch({ status: out(v) })}>
            <SelectTrigger>
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Intent level</Label>
          <Select value={sel(value.intentLevel)} onValueChange={(v) => patch({ intentLevel: out(v) })}>
            <SelectTrigger>
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any</SelectItem>
              {INTENT_OPTIONS.map((o) => (
                <SelectItem key={o} value={o}>
                  {o.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Pipeline stage (open deal)</Label>
          <Select value={sel(value.pipelineStage)} onValueChange={(v) => patch({ pipelineStage: out(v) })}>
            <SelectTrigger>
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any</SelectItem>
              {CRM_PIPELINE_STAGES.map((s) => (
                <SelectItem key={s} value={s}>
                  {getPipelineStageLabel(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Lifecycle stage</Label>
          <Select value={sel(value.lifecycleStage)} onValueChange={(v) => patch({ lifecycleStage: out(v) })}>
            <SelectTrigger>
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any</SelectItem>
              {LIFECYCLE_OPTIONS.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Booked call</Label>
          <Select
            value={bookedCallSel}
            onValueChange={(v) =>
              patch({
                bookedCall: v === "yes" ? true : v === "no" ? false : undefined,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any</SelectItem>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Has research profile (account)</Label>
          <Select
            value={researchSel}
            onValueChange={(v) =>
              patch({
                hasResearch: v === "yes" ? true : v === "no" ? false : undefined,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any</SelectItem>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Days since last activity (minimum)</Label>
          <Input
            inputMode="numeric"
            value={value.noContactSinceDays != null ? String(value.noContactSinceDays) : ""}
            onChange={(e) => {
              const t = e.target.value.trim();
              if (t === "") {
                patch({ noContactSinceDays: undefined });
                return;
              }
              const n = Number.parseInt(t, 10);
              patch({ noContactSinceDays: Number.isFinite(n) && n >= 0 ? n : undefined });
            }}
            placeholder="e.g. 30"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Checkbox
          id="seg-tasks"
          checked={!!value.hasOpenTasks}
          onCheckedChange={(c) => patch({ hasOpenTasks: c === true ? true : undefined })}
        />
        <Label htmlFor="seg-tasks" className="cursor-pointer">
          Only leads with open CRM tasks
        </Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="seg-source">Source (exact match)</Label>
        <Input
          id="seg-source"
          value={value.source ?? ""}
          onChange={(e) => patch({ source: e.target.value.trim() || undefined })}
          placeholder="e.g. website, referral"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="seg-tags">Tags (comma-separated, any match)</Label>
        <Input id="seg-tags" value={tagsStr} onChange={(e) => setTagsFromString(e.target.value)} placeholder="vip, newsletter" />
      </div>

      <div className="rounded-md border border-border/80 bg-card/50 p-3 space-y-3">
        <p className="text-sm font-medium">Match leads by UTM (optional)</p>
        <p className="text-xs text-muted-foreground">
          These narrow the audience to contacts whose stored UTM fields match — separate from link tracking UTMs below.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-xs">UTM source</Label>
            <Input
              value={value.utmSource ?? ""}
              onChange={(e) => patch({ utmSource: e.target.value.trim() || undefined })}
              placeholder="google"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">UTM medium</Label>
            <Input
              value={value.utmMedium ?? ""}
              onChange={(e) => patch({ utmMedium: e.target.value.trim() || undefined })}
              placeholder="cpc"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">UTM campaign</Label>
            <Input
              value={value.utmCampaign ?? ""}
              onChange={(e) => patch({ utmCampaign: e.target.value.trim() || undefined })}
              placeholder="spring_sale"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Marketing persona</Label>
          <Input
            value={value.personaId ?? ""}
            onChange={(e) => patch({ personaId: e.target.value.trim() || undefined })}
            placeholder="From Offer + Persona IQ"
          />
        </div>
        <div className="space-y-2">
          <Label>Service interest contains</Label>
          <Input
            value={value.serviceInterestContains ?? ""}
            onChange={(e) => patch({ serviceInterestContains: e.target.value.trim() || undefined })}
            placeholder="Keyword in service interest / notes"
          />
        </div>
      </div>
    </div>
  );
}

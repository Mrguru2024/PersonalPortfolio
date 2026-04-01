"use client";

import { useEffect, useMemo, useState } from "react";
import type { CommSegmentFilters } from "@shared/communicationsSchema";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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

type AudienceMode = "all" | "segment" | "selected" | "manual_only";

function inferAudienceMode(v: CommSegmentFilters): AudienceMode {
  if (v.audienceTargeting) return v.audienceTargeting;
  if (v.allCrmContacts === true) return "all";
  if (v.additionalRecipientsOnly === true) return "manual_only";
  if (v.contactIds && v.contactIds.length > 0) return "selected";
  return "segment";
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

  const additionalEmailsStr = useMemo(
    () => (value.additionalEmails ?? []).join("\n"),
    [value.additionalEmails],
  );

  const setAdditionalEmailsFromString = (raw: string) => {
    const emails = [
      ...new Set(
        raw
          .split(/[\n,]+/)
          .map((x) => x.trim().toLowerCase())
          .filter(Boolean),
      ),
    ];
    patch({ additionalEmails: emails.length > 0 ? emails : undefined });
  };

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

  const audienceMode = inferAudienceMode(value);

  const applyAudienceMode = (mode: AudienceMode) => {
    if (mode === "all") {
      onChange({
        ...value,
        audienceTargeting: "all",
        allCrmContacts: true,
        additionalRecipientsOnly: false,
        contactIds: undefined,
      });
    } else if (mode === "manual_only") {
      onChange({
        ...value,
        audienceTargeting: "manual_only",
        allCrmContacts: false,
        additionalRecipientsOnly: true,
        contactIds: undefined,
      });
    } else if (mode === "selected") {
      onChange({
        ...value,
        audienceTargeting: "selected",
        allCrmContacts: false,
        additionalRecipientsOnly: false,
        contactIds: value.contactIds?.length ? value.contactIds : [],
      });
    } else {
      onChange({
        ...value,
        audienceTargeting: "segment",
        allCrmContacts: false,
        additionalRecipientsOnly: false,
        contactIds: undefined,
      });
    }
  };

  const showSegmentFilters = audienceMode === "segment";
  const showContactPicker = audienceMode === "segment" || audienceMode === "selected";

  return (
    <div className="space-y-6 rounded-lg border border-border bg-muted/20 p-4 dark:bg-muted/10">
      <p className="text-xs text-muted-foreground leading-relaxed">
        Same audience pattern as newsletters and CRM sequences: everyone in the CRM, a filtered segment, selected
        contacts only, or addresses you type (one-offs do not need a CRM row yet).
      </p>
      <div className="space-y-3">
        <Label className="text-base">Who should receive this send?</Label>
        <RadioGroup
          value={audienceMode}
          onValueChange={(v) => applyAudienceMode(v as AudienceMode)}
          className="flex flex-col gap-2"
        >
          <label className="flex items-start gap-2 rounded-lg border border-border/80 bg-background/50 p-3 cursor-pointer has-[:checked]:border-primary/60">
            <RadioGroupItem value="all" id="aud-all" className="mt-0.5" />
            <div>
              <span className="font-medium text-sm">Everyone in CRM</span>
              <p className="text-xs text-muted-foreground mt-0.5">
                All contacts with an email (respects do-not-contact when enabled below). Segment rules below are ignored.
              </p>
            </div>
          </label>
          <label className="flex items-start gap-2 rounded-lg border border-border/80 bg-background/50 p-3 cursor-pointer has-[:checked]:border-primary/60">
            <RadioGroupItem value="segment" id="aud-seg" className="mt-0.5" />
            <div>
              <span className="font-medium text-sm">Segment rules</span>
              <p className="text-xs text-muted-foreground mt-0.5">
                Saved list, tags, status, pipeline, UTMs, and optional hand-picked people.
              </p>
            </div>
          </label>
          <label className="flex items-start gap-2 rounded-lg border border-border/80 bg-background/50 p-3 cursor-pointer has-[:checked]:border-primary/60">
            <RadioGroupItem value="selected" id="aud-sel" className="mt-0.5" />
            <div>
              <span className="font-medium text-sm">Selected contacts only</span>
              <p className="text-xs text-muted-foreground mt-0.5">Search and add specific CRM contacts — no broad filters.</p>
            </div>
          </label>
          <label className="flex items-start gap-2 rounded-lg border border-border/80 bg-background/50 p-3 cursor-pointer has-[:checked]:border-primary/60">
            <RadioGroupItem value="manual_only" id="aud-man" className="mt-0.5" />
            <div>
              <span className="font-medium text-sm">Addresses I enter</span>
              <p className="text-xs text-muted-foreground mt-0.5">
                One or more emails only (they do not need to exist in the CRM yet).
              </p>
            </div>
          </label>
        </RadioGroup>
      </div>

      {audienceMode === "selected" && (value.contactIds?.length ?? 0) === 0 ? (
        <p className="text-sm text-amber-800 dark:text-amber-200 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2">
          Choose at least one contact before sending.
        </p>
      ) : null}

      {showSegmentFilters ? (
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
      ) : null}

      {audienceMode !== "manual_only" ? (
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
      ) : (
        <p className="text-xs text-muted-foreground">
          Do-not-contact flags apply to CRM sends only; manual addresses are unchanged.
        </p>
      )}

      {showContactPicker ? (
      <div className="space-y-2">
        <Label htmlFor="seg-contact-search">
          {audienceMode === "selected" ? "Contacts" : "Specific people (optional)"}
        </Label>
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
          {audienceMode === "selected"
            ? "Only these CRM contacts receive the send (plus any extra addresses below)."
            : "When people are listed here, the campaign only goes to them (other filters still apply)."}
        </p>
      </div>
      ) : null}

      <div className="space-y-2 rounded-md border border-dashed border-border/80 bg-muted/10 p-3">
        <Label htmlFor="seg-additional-emails">Extra email addresses (optional)</Label>
        <Textarea
          id="seg-additional-emails"
          value={additionalEmailsStr}
          onChange={(e) => setAdditionalEmailsFromString(e.target.value)}
          placeholder="one@example.com — one per line or comma-separated"
          rows={4}
          className="font-mono text-sm"
        />
        <div className="flex flex-wrap items-center gap-3">
          <Checkbox
            id="seg-additional-only"
            checked={value.additionalRecipientsOnly === true}
            disabled={audienceMode === "manual_only"}
            onCheckedChange={(c) =>
              audienceMode === "manual_only" ? undefined : patch({ additionalRecipientsOnly: c === true ? true : undefined })
            }
          />
          <Label htmlFor="seg-additional-only" className="cursor-pointer text-sm font-medium leading-snug">
            Send only to these addresses (ignore CRM segment rules above)
          </Label>
        </div>
        <p className="text-xs text-muted-foreground">
          These recipients do not need to exist in the CRM. Merge tags use the email address when there is no contact
          row. If you leave the box unchecked, these addresses are added to the CRM-filtered audience (deduped by email).
        </p>
      </div>

      {showSegmentFilters ? (
      <>
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
      </>
      ) : null}
    </div>
  );
}

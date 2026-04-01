"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  ExternalLink,
  Loader2,
  Mail,
  Phone,
  Search,
  UserRound,
} from "lucide-react";
import type { CrmContact } from "@shared/crmSchema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

const SEARCH_DEBOUNCE_MS = 300;

function ContactDetailBody({
  contact,
  showComposeLink,
  onComposeNavigate,
}: {
  contact: CrmContact;
  showComposeLink?: boolean;
  /** When set (e.g. picker), use callback instead of raw link */
  onComposeNavigate?: (c: CrmContact) => void;
}) {
  const tags = Array.isArray(contact.tags) ? contact.tags : [];
  return (
    <div className="space-y-4 text-sm">
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">{contact.type}</Badge>
        {contact.status ? <Badge variant="outline">{contact.status}</Badge> : null}
        {contact.intentLevel ? <Badge variant="outline">{contact.intentLevel.replace(/_/g, " ")}</Badge> : null}
      </div>
      <dl className="space-y-2">
        <div>
          <dt className="text-xs font-medium text-muted-foreground">Email</dt>
          <dd>
            <a href={`mailto:${contact.email}`} className="text-primary underline break-all">
              {contact.email}
            </a>
          </dd>
        </div>
        {contact.phone ?
          <div>
            <dt className="text-xs font-medium text-muted-foreground">Phone</dt>
            <dd>
              <a href={`tel:${contact.phone}`} className="text-primary underline">
                {contact.phone}
              </a>
            </dd>
          </div>
        : null}
        {contact.company ?
          <div>
            <dt className="text-xs font-medium text-muted-foreground">Company</dt>
            <dd>{contact.company}</dd>
          </div>
        : null}
        {contact.jobTitle ?
          <div>
            <dt className="text-xs font-medium text-muted-foreground">Title</dt>
            <dd>{contact.jobTitle}</dd>
          </div>
        : null}
        {contact.source ?
          <div>
            <dt className="text-xs font-medium text-muted-foreground">Source</dt>
            <dd>{contact.source}</dd>
          </div>
        : null}
        {contact.notesSummary ?
          <div>
            <dt className="text-xs font-medium text-muted-foreground">Summary</dt>
            <dd className="text-muted-foreground whitespace-pre-wrap">{contact.notesSummary}</dd>
          </div>
        : null}
        {tags.length > 0 ?
          <div>
            <dt className="text-xs font-medium text-muted-foreground mb-1">Tags</dt>
            <dd className="flex flex-wrap gap-1">
              {tags.map((t) => (
                <Badge key={t} variant="outline" className="text-[10px]">
                  {t}
                </Badge>
              ))}
            </dd>
          </div>
        : null}
        {contact.linkedinUrl ?
          <div>
            <dt className="text-xs font-medium text-muted-foreground">LinkedIn</dt>
            <dd>
              <a
                href={contact.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline inline-flex items-center gap-1"
              >
                Profile <ExternalLink className="h-3 w-3" />
              </a>
            </dd>
          </div>
        : null}
      </dl>

      <div className="flex flex-wrap gap-2 pt-2 border-t border-border/60">
        {showComposeLink ?
          onComposeNavigate ?
            <Button type="button" size="sm" onClick={() => onComposeNavigate(contact)}>
              <Mail className="h-4 w-4 mr-2" />
              Use in composer
            </Button>
          : <Button size="sm" asChild>
              <Link href={`/admin/email-hub/compose?contactId=${contact.id}`}>
                <Mail className="h-4 w-4 mr-2" />
                Compose email
              </Link>
            </Button>
        : null}
        <Button size="sm" variant="outline" asChild>
          <Link href={`/admin/crm/${contact.id}`} target="_blank" rel="noopener noreferrer">
            Open full CRM record
            <ExternalLink className="h-3.5 w-3.5 ml-1" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

/** Read-only CRM contact in a sheet — keeps users inside Email Hub for routine lookups. */
export function EmailHubContactDetailSheet(props: {
  contactId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When picking from composer */
  onComposeNavigate?: (c: CrmContact) => void;
}) {
  const { contactId, open, onOpenChange, onComposeNavigate } = props;

  const { data: contact, isLoading } = useQuery({
    queryKey: ["/api/admin/crm/contacts", contactId, "detail"],
    queryFn: async () => {
      const res = await fetch(`/api/admin/crm/contacts/${contactId}`, { credentials: "include" });
      if (!res.ok) return null;
      return (await res.json()) as CrmContact;
    },
    enabled: open && contactId != null && Number.isFinite(contactId) && contactId > 0,
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="pr-8">{contact?.name ?? "Contact"}</SheetTitle>
          <SheetDescription>
            CRM record preview. Edit advanced fields in the full CRM when needed.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          {isLoading ?
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          : contact ?
            <ContactDetailBody
              contact={contact}
              showComposeLink
              onComposeNavigate={onComposeNavigate}
            />
          : <p className="text-sm text-muted-foreground">Could not load this contact.</p>}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** Dialog: search and pick a contact without leaving compose. */
export function EmailHubContactPickDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (contact: CrmContact) => void;
  enabled: boolean;
}) {
  const { open, onOpenChange, onPick, enabled } = props;
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const [filterType, setFilterType] = useState<string>("all");

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["/api/admin/crm/contacts", "pick", debouncedSearch, filterType],
    queryFn: async () => {
      if (debouncedSearch.trim().length >= 2) {
        const res = await fetch(
          `/api/admin/crm/contacts?search=${encodeURIComponent(debouncedSearch.trim())}`,
          { credentials: "include" },
        );
        if (!res.ok) throw new Error("Failed to search");
        return (await res.json()) as CrmContact[];
      }
      const typeQ = filterType !== "all" ? `&type=${filterType}` : "";
      const res = await fetch(`/api/admin/crm/contacts?limit=100${typeQ}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load contacts");
      return (await res.json()) as CrmContact[];
    },
    enabled: enabled && open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-2 space-y-3">
          <DialogTitle>CRM contacts</DialogTitle>
          <DialogDescription>
            Search by name, email, or company (min. 2 characters), or browse the 100 most recently updated
            contacts.
          </DialogDescription>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="pl-9 rounded-xl"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-[140px] rounded-xl">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="lead">Leads</SelectItem>
                <SelectItem value="client">Clients</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </DialogHeader>
        <ScrollArea className="flex-1 min-h-[200px] max-h-[50vh] border-t border-border/60">
          <div className="p-2 space-y-1">
            {isLoading ?
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            : rows.length === 0 ?
              <p className="text-sm text-muted-foreground text-center py-12 px-4">
                {debouncedSearch.trim().length >= 2 ? "No matches." : "Type to search, or browse the list below."}
              </p>
            : rows.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    onPick(c);
                    onOpenChange(false);
                    setSearch("");
                  }}
                  className="w-full text-left rounded-xl border border-transparent px-3 py-2.5 hover:bg-muted/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <p className="font-medium text-sm truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                  {c.company ?
                    <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                      <Building2 className="h-3 w-3 shrink-0" />
                      {c.company}
                    </p>
                  : null}
                </button>
              ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

/** Full Email Hub &gt; Contacts workspace: search, list, detail sheet. */
export function EmailHubContactWorkspace({ enabled }: { enabled: boolean }) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const [filterType, setFilterType] = useState<string>("all");
  const [detailId, setDetailId] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["/api/admin/crm/contacts", "hub-workspace", debouncedSearch, filterType],
    queryFn: async () => {
      if (debouncedSearch.trim().length >= 2) {
        const res = await fetch(
          `/api/admin/crm/contacts?search=${encodeURIComponent(debouncedSearch.trim())}`,
          { credentials: "include" },
        );
        if (!res.ok) throw new Error("Failed to search");
        return (await res.json()) as CrmContact[];
      }
      const typeQ = filterType !== "all" ? `&type=${filterType}` : "";
      const res = await fetch(`/api/admin/crm/contacts?limit=100${typeQ}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load contacts");
      return (await res.json()) as CrmContact[];
    },
    enabled,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-3 lg:items-end">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, company…"
            className="pl-9 rounded-xl"
          />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[160px] rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All contacts</SelectItem>
              <SelectItem value="lead">Leads only</SelectItem>
              <SelectItem value="client">Clients only</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/crm" target="_blank" rel="noopener noreferrer">
              Full CRM
              <ExternalLink className="h-3.5 w-3.5 ml-1" />
            </Link>
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {debouncedSearch.trim().length >= 2 ? "search results" : "up to 100 recently updated contacts"}.
        Click a row for details, compose, or open the full CRM record.
      </p>

      <div className="rounded-2xl border border-border/60 bg-card/80 overflow-hidden">
        {isLoading ?
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        : rows.length === 0 ?
          <p className="text-sm text-muted-foreground text-center py-16 px-4">
            No contacts found. Try another search or add people in the CRM.
          </p>
        : (
          <ScrollArea className="h-[min(60vh,520px)]">
            <ul className="divide-y divide-border/50">
              {rows.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setDetailId(c.id);
                      setDetailOpen(true);
                    }}
                    className="w-full text-left px-4 py-3 flex gap-3 hover:bg-muted/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  >
                    <div className="rounded-lg bg-primary/10 p-2 h-fit shrink-0">
                      <UserRound className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                        <Mail className="h-3 w-3 shrink-0" />
                        {c.email}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        <Badge variant="outline" className="text-[10px]">
                          {c.type}
                        </Badge>
                        {c.status ?
                          <Badge variant="secondary" className="text-[10px]">
                            {c.status}
                          </Badge>
                        : null}
                        {c.company ?
                          <span className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                            <Building2 className="h-3 w-3 shrink-0" />
                            {c.company}
                          </span>
                        : null}
                        {c.phone ?
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3 shrink-0" />
                            {c.phone}
                          </span>
                        : null}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </div>

      <EmailHubContactDetailSheet
        contactId={detailId}
        open={detailOpen}
        onOpenChange={(o) => {
          setDetailOpen(o);
          if (!o) setDetailId(null);
        }}
      />
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, UserPlus, X } from "lucide-react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const SEARCH_DEBOUNCE_MS = 280;

export type PickerContactRow = {
  id: number;
  name: string;
  email: string;
  company?: string | null;
};

function displayLine(c: Pick<PickerContactRow, "name" | "email">): string {
  const name = (c.name || "").trim() || "Unnamed contact";
  const email = (c.email || "").trim();
  return email ? `${name} · ${email}` : name;
}

export interface CommSpecificContactsPickerProps {
  selectedIds: number[];
  onIdsChange: (ids: number[]) => void;
}

export function CommSpecificContactsPicker({ selectedIds, onIdsChange }: CommSpecificContactsPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);

  const idsKey = useMemo(() => [...new Set(selectedIds)].sort((a, b) => a - b).join(","), [selectedIds]);

  const { data: selectedRows = [] } = useQuery({
    queryKey: ["/api/admin/crm/contacts", "ids", idsKey],
    queryFn: async () => {
      if (!idsKey) return [] as PickerContactRow[];
      const res = await apiRequest("GET", `/api/admin/crm/contacts?ids=${encodeURIComponent(idsKey)}`);
      if (!res.ok) throw new Error("Failed to load contacts");
      return res.json() as Promise<PickerContactRow[]>;
    },
    enabled: idsKey.length > 0,
  });

  const selectedById = useMemo(() => new Map(selectedRows.map((r) => [r.id, r])), [selectedRows]);

  const searchQ = debouncedSearch.trim();
  const { data: searchHits = [], isFetching: searchLoading } = useQuery({
    queryKey: ["/api/admin/crm/contacts", "q", searchQ],
    queryFn: async () => {
      const res = await apiRequest(
        "GET",
        `/api/admin/crm/contacts?q=${encodeURIComponent(searchQ)}&limit=40`
      );
      if (!res.ok) throw new Error("Search failed");
      return res.json() as Promise<PickerContactRow[]>;
    },
    enabled: open && searchQ.length >= 1,
  });

  const addId = (id: number) => {
    if (selectedIds.includes(id)) return;
    onIdsChange([...selectedIds, id]);
  };

  const removeId = (id: number) => {
    onIdsChange(selectedIds.filter((x) => x !== id));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 min-h-[2rem]">
        {selectedIds.length === 0 ? (
          <span className="text-sm text-muted-foreground">No specific people selected — audience uses your rules only.</span>
        ) : (
          selectedIds.map((id) => {
            const row = selectedById.get(id);
            const label = row ? displayLine(row) : `Loading…`;
            return (
              <Badge
                key={id}
                variant="secondary"
                className="pl-2 pr-1 py-1 gap-1 font-normal max-w-full items-center"
              >
                <span className="truncate" title={row ? displayLine(row) : undefined}>
                  {row ? row.name.trim() || row.email : label}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 shrink-0 rounded-full"
                  aria-label={`Remove ${row?.name ?? "contact"}`}
                  onClick={() => removeId(id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            );
          })
        )}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            <span className="flex items-center gap-2 truncate">
              <UserPlus className="h-4 w-4 shrink-0 opacity-70" />
              Add people by name or email
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[280px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search contacts…"
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              {searchQ.length < 1 ? (
                <p className="px-3 py-6 text-sm text-muted-foreground text-center">
                  Type a name, email, or company to search your CRM.
                </p>
              ) : searchLoading ? (
                <p className="px-3 py-6 text-sm text-muted-foreground text-center">Searching…</p>
              ) : searchHits.length === 0 ? (
                <CommandEmpty>No contacts match.</CommandEmpty>
              ) : (
                <CommandGroup>
                  {searchHits.map((c) => {
                    const picked = selectedIds.includes(c.id);
                    return (
                      <CommandItem
                        key={c.id}
                        value={`${c.id}-${c.email}`}
                        disabled={picked}
                        onSelect={() => {
                          addId(c.id);
                          setSearch("");
                        }}
                      >
                        <Check className={cn("mr-2 h-4 w-4", picked ? "opacity-100" : "opacity-0")} />
                        <div className="flex flex-col min-w-0">
                          <span className="truncate font-medium">{c.name?.trim() || c.email}</span>
                          <span className="truncate text-xs text-muted-foreground">{c.email}</span>
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <p className="text-xs text-muted-foreground">
        When specific people are listed, the send includes only them (saved-list rules and filters below still apply).
      </p>
    </div>
  );
}

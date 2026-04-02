"use client";

import Link from "next/link";
import { Inbox } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
type InboxRow = {
  id: number;
  kind: string;
  title: string;
  body: string | null;
  createdAt: string;
  isRead: boolean;
};

interface InboxPreviewPayload {
  items: InboxRow[];
  unreadCount: number;
}

export function AdminInboxNotificationBell() {
  const queryClient = useQueryClient();
  const { data, isLoading, refetch } = useQuery<InboxPreviewPayload>({
    queryKey: ["/api/admin/inbox", "preview"],
    queryFn: async () => {
      const res = await fetch("/api/admin/inbox?limit=8", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch inbox");
      return res.json();
    },
    refetchInterval: 25_000,
  });

  const unreadCount = data?.unreadCount ?? 0;
  const items = data?.items ?? [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 sm:h-9 sm:w-9 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
          aria-label={
            unreadCount > 0
              ? `${unreadCount} unread inbound notifications`
              : "Inbound notifications"
          }
        >
          <Inbox className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground px-1">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="px-2 py-1.5 font-medium text-sm">Inbound (forms &amp; leads)</div>
        {isLoading ? (
          <div className="px-2 py-4 text-muted-foreground text-sm">Loading…</div>
        ) : items.length === 0 ? (
          <div className="px-2 py-4 text-muted-foreground text-sm">No items yet.</div>
        ) : (
          <div className="max-h-64 overflow-y-auto space-y-1">
            {items.map((row) => (
              <Link
                key={row.id}
                href={`/admin/inbox?item=${row.id}`}
                className={`block rounded-md px-2 py-1.5 text-sm hover:bg-muted/80 ${
                  !row.isRead ? "bg-muted" : ""
                }`}
                onClick={() => {
                  void refetch();
                  void queryClient.invalidateQueries({ queryKey: ["/api/admin/inbox"] });
                }}
              >
                <span className="font-medium line-clamp-1">{row.title}</span>
                <span className="text-muted-foreground text-xs ml-1">
                  {format(new Date(row.createdAt), "MMM d, h:mm a")}
                </span>
                {row.body ? (
                  <p className="text-muted-foreground line-clamp-2 mt-0.5 text-xs">
                    {row.body}
                  </p>
                ) : null}
              </Link>
            ))}
          </div>
        )}
        <div className="border-t pt-2 mt-2 flex flex-col gap-1">
          <Link
            href="/admin/inbox"
            className="block px-2 py-2 text-sm font-medium text-primary hover:underline"
            onClick={() => {
              void queryClient.invalidateQueries({ queryKey: ["/api/admin/inbox"] });
            }}
          >
            Open full inbox →
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

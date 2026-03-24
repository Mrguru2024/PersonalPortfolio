"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

interface NotificationPayload {
  unreadCount: number;
  recentMessages: Array<{
    id: number;
    senderId: number;
    senderUsername: string;
    content: string;
    createdAt: string;
    isUnread: boolean;
  }>;
}

export function AdminChatNotificationBell() {
  const queryClient = useQueryClient();
  const { data, isLoading, refetch } = useQuery<NotificationPayload>({
    queryKey: ["/api/admin/chat/notifications"],
    queryFn: async () => {
      const res = await fetch("/api/admin/chat/notifications", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    refetchInterval: 30_000,
  });

  const handleOpenChange = (open: boolean) => {
    if (!open) return;
    void (async () => {
      const { data: fresh } = await refetch();
      const list = fresh?.recentMessages ?? [];
      const latestId = list[0]?.id;
      if (latestId != null && latestId > 0) {
        try {
          await apiRequest("POST", "/api/admin/chat/read", {
            lastReadMessageId: latestId,
          });
        } catch {
          /* badge still updates from refetch above */
        }
      }
      await queryClient.invalidateQueries({
        queryKey: ["/api/admin/chat/notifications"],
      });
    })();
  };

  const unreadCount = data?.unreadCount ?? 0;
  const recent = data?.recentMessages ?? [];

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 sm:h-9 sm:w-9 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
          aria-label={
            unreadCount > 0
              ? `${unreadCount} unread chat messages`
              : "Chat notifications"
          }
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground px-1">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <div className="px-2 py-1.5 font-medium text-sm">Internal chat</div>
        {isLoading ? (
          <div className="px-2 py-4 text-muted-foreground text-sm">
            Loading…
          </div>
        ) : recent.length === 0 ? (
          <div className="px-2 py-4 text-muted-foreground text-sm">
            No messages yet.
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto space-y-1">
            {recent.map((msg) => (
              <div
                key={msg.id}
                className={`rounded-md px-2 py-1.5 text-sm ${
                  msg.isUnread ? "bg-muted" : ""
                }`}
              >
                <span className="font-medium">{msg.senderUsername}</span>
                <span className="text-muted-foreground text-xs ml-1">
                  {format(new Date(msg.createdAt), "MMM d, h:mm a")}
                </span>
                <p className="text-muted-foreground line-clamp-2 mt-0.5">
                  {msg.content}
                </p>
              </div>
            ))}
          </div>
        )}
        <div className="border-t pt-2 mt-2">
          <Link
            href="/admin/chat"
            className="block px-2 py-2 text-sm font-medium text-primary hover:underline"
          >
            Open chat →
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

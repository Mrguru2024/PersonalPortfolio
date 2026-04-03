"use client";

import { useMutation } from "@tanstack/react-query";
import { Loader2, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export interface AdminPushSubscribeButtonProps {
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
}

/** Subscribe this browser to admin web push (VAPID). Same flow as /admin/chat. */
export function AdminPushSubscribeButton({
  variant = "outline",
  size = "sm",
  className,
}: AdminPushSubscribeButtonProps) {
  const { toast } = useToast();
  const mutation = useMutation({
    mutationFn: async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        throw new Error("Push not supported in this browser");
      }
      const keyRes = await fetch("/api/admin/push/vapid-public-key", {
        credentials: "include",
      });
      if (!keyRes.ok) throw new Error("Cannot get push key");
      const { vapidPublicKey } = await keyRes.json();
      if (!vapidPublicKey) throw new Error("Push not configured (VAPID keys missing)");
      if (!navigator.serviceWorker.controller) {
        await navigator.serviceWorker.register("/sw.js");
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey,
      });
      const subscription = sub.toJSON();
      const res = await apiRequest("POST", "/api/admin/push/subscribe", {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      });
      if (!res.ok) throw new Error("Subscribe failed");
    },
    onSuccess: () => {
      toast({
        title: "Push enabled",
        description: "This device will get alerts for new form submissions and inbox items.",
      });
    },
    onError: (err: Error) => {
      toast({
        title: "Push subscribe failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      disabled={mutation.isPending}
      onClick={() => mutation.mutate()}
    >
      {mutation.isPending ? (
        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
      ) : (
        <Bell className="h-4 w-4 shrink-0" />
      )}
      <span className="ml-2">Enable browser push on this device</span>
    </Button>
  );
}

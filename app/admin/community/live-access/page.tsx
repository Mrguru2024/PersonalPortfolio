"use client";

import { useAuth, isAuthSuperUser } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { TIMELINE_LIVE_ACCESS_LEVELS } from "@/lib/community/constants";

export default function AdminAfnLiveAccessPage() {
  const { user, isLoading } = useAuth();
  const isSuper = isAuthSuperUser(user);
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [userIdStr, setUserIdStr] = useState("");
  const [accessLevel, setAccessLevel] = useState<string>("featured");
  const [reason, setReason] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  useEffect(() => {
    if (!isLoading && (!user || !user.isAdmin || !user.adminApproved)) {
      router.replace("/admin/dashboard");
    }
  }, [user, isLoading, router]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const userId = Number(userIdStr);
      if (!Number.isFinite(userId) || userId < 1) throw new Error("userid");
      const res = await apiRequest("PATCH", "/api/admin/Afn/live-access", {
        userId,
        accessLevel,
        reason: reason.trim() || null,
        expiresAt: expiresAt.trim() || null,
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(typeof j.error === "string" ? j.error : "save failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/live/status"] });
      toast({ title: "Timeline Live access updated" });
    },
    onError: (e: Error) => toast({ title: e.message || "Save failed", variant: "destructive" }),
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      const userId = Number(userIdStr);
      if (!Number.isFinite(userId) || userId < 1) throw new Error("User ID required");
      const res = await apiRequest("PATCH", "/api/admin/Afn/live-access", {
        userId,
        accessLevel: null,
      });
      if (!res.ok) throw new Error("clear failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/live/status"] });
      toast({ title: "Override cleared; tier recomputed" });
    },
    onError: () => toast({ title: "Clear failed", variant: "destructive" }),
  });

  if (isLoading || !user?.isAdmin || !user.adminApproved) return null;

  return (
    <div className="container max-w-lg py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Timeline Live access override</CardTitle>
          <CardDescription>
            {isSuper ?
              "Set an admin tier for a member (e.g. featured) or clear to restore automatic scoring."
            : "Set a spotlight tier for a member (for example featured) or clear it to restore automatic scoring."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userId">
              {isSuper ? "Member user ID (users.id)" : "Member user ID"}
            </Label>
            <Input
              id="userId"
              type="number"
              min={1}
              value={userIdStr}
              onChange={(e) => setUserIdStr(e.target.value)}
              placeholder="e.g. 42"
            />
          </div>
          <div className="space-y-2">
            <Label>Access level</Label>
            <Select value={accessLevel} onValueChange={setAccessLevel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMELINE_LIVE_ACCESS_LEVELS.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="exp">Expires at (optional, ISO datetime)</Label>
            <Input id="exp" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} placeholder="2026-12-31T23:59:59Z" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save override"}
            </Button>
            <Button type="button" variant="outline" onClick={() => clearMutation.mutate()} disabled={clearMutation.isPending}>
              {clearMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Clear override"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

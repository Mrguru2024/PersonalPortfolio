"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CommunityShell } from "@/components/community/CommunityShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PROFILE_VISIBILITY, MESSAGE_PERMISSION } from "@/lib/community/constants";
import { Loader2 } from "lucide-react";

export default function CommunitySettingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["/api/community/profile/settings"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/community/profile/settings");
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    enabled: !!user?.id,
  });

  const updateMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await apiRequest("PATCH", "/api/community/profile/settings", body);
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/profile/settings"] });
      toast({ title: "Settings updated" });
    },
    onError: () => toast({ title: "Failed to update settings", variant: "destructive" }),
  });

  useEffect(() => {
    if (!authLoading && !user) router.replace("/auth?redirect=/Afn/settings");
  }, [user, authLoading, router]);

  const settings = data?.settings ?? {
    profileVisibility: "public",
    messagePermission: "none",
    openToCollaborate: false,
    showActivity: true,
    showContactLinks: true,
    emailNotificationsEnabled: true,
    inAppNotificationsEnabled: true,
  };

  const handleVisibility = (v: string) => updateMutation.mutate({ ...settings, profileVisibility: v });
  const handleMessagePermission = (v: string) => updateMutation.mutate({ ...settings, messagePermission: v });
  const handleOpenToCollaborate = (v: boolean) => updateMutation.mutate({ ...settings, openToCollaborate: v });
  const handleShowActivity = (v: boolean) => updateMutation.mutate({ ...settings, showActivity: v });
  const handleShowContactLinks = (v: boolean) => updateMutation.mutate({ ...settings, showContactLinks: v });

  if (authLoading || !user) return null;

  return (
    <CommunityShell>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground text-sm mb-6">
          Control your profile visibility and who can message you.
        </p>
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Privacy & messaging</CardTitle>
              <CardDescription>
                Private messaging is only allowed when you enable it or when you're open to collaborate and allow collab-only messages.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Profile visibility</Label>
                <RadioGroup
                  value={settings.profileVisibility}
                  onValueChange={handleVisibility}
                  className="mt-2 gap-2"
                >
                  {PROFILE_VISIBILITY.map((v) => (
                    <div key={v} className="flex items-center space-x-2">
                      <RadioGroupItem value={v} id={`vis-${v}`} />
                      <Label htmlFor={`vis-${v}`} className="font-normal capitalize">{v}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div>
                <Label>Who can message you</Label>
                <RadioGroup
                  value={settings.messagePermission}
                  onValueChange={handleMessagePermission}
                  className="mt-2 gap-2"
                >
                  {MESSAGE_PERMISSION.map((v) => (
                    <div key={v} className="flex items-center space-x-2">
                      <RadioGroupItem value={v} id={`msg-${v}`} />
                      <Label htmlFor={`msg-${v}`} className="font-normal">
                        {v === "none" ? "No one" : v === "collab_only" ? "Only when I'm open to collaborate" : "Anyone in the network"}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Open to collaborate</Label>
                  <p className="text-xs text-muted-foreground">Show others you're open to collaboration opportunities</p>
                </div>
                <Switch
                  checked={settings.openToCollaborate}
                  onCheckedChange={handleOpenToCollaborate}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show activity</Label>
                  <p className="text-xs text-muted-foreground">Allow your recent activity to be visible on your profile</p>
                </div>
                <Switch
                  checked={settings.showActivity}
                  onCheckedChange={handleShowActivity}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show contact links</Label>
                  <p className="text-xs text-muted-foreground">Show website and social links on your public profile</p>
                </div>
                <Switch
                  checked={settings.showContactLinks}
                  onCheckedChange={handleShowContactLinks}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </CommunityShell>
  );
}

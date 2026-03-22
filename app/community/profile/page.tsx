"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CommunityShell } from "@/components/community/CommunityShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Camera, Loader2 } from "lucide-react";

export default function CommunityProfilePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["/api/community/profile"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/community/profile");
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    enabled: !!user?.id,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await apiRequest("PATCH", "/api/community/profile", body);
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/profile"] });
      toast({ title: "Profile updated" });
    },
    onError: () => toast({ title: "Failed to update profile", variant: "destructive" }),
  });

  const avatarUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/community/profile/avatar", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const text = await res.text();
      if (!res.ok) {
        let msg = text || res.statusText;
        try {
          const j = JSON.parse(text) as { error?: string };
          if (j.error) msg = j.error;
        } catch {
          /* use text */
        }
        throw new Error(msg);
      }
      return JSON.parse(text) as { url: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({ title: "Profile photo updated" });
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: (e: Error) =>
      toast({ title: "Upload failed", description: e.message, variant: "destructive" }),
  });

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login?redirect=/community/profile");
  }, [user, authLoading, router]);

  const profile = data?.profile ?? null;
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const body: Record<string, unknown> = {
      displayName: (form.querySelector('[name="displayName"]') as HTMLInputElement)?.value,
      headline: (form.querySelector('[name="headline"]') as HTMLInputElement)?.value,
      bio: (form.querySelector('[name="bio"]') as HTMLTextAreaElement)?.value,
      businessName: (form.querySelector('[name="businessName"]') as HTMLInputElement)?.value,
      businessStage: (form.querySelector('[name="businessStage"]') as HTMLInputElement)?.value,
      industry: (form.querySelector('[name="industry"]') as HTMLInputElement)?.value,
      location: (form.querySelector('[name="location"]') as HTMLInputElement)?.value,
      websiteUrl: (form.querySelector('[name="websiteUrl"]') as HTMLInputElement)?.value,
      whatBuilding: (form.querySelector('[name="whatBuilding"]') as HTMLTextAreaElement)?.value,
      biggestChallenge: (form.querySelector('[name="biggestChallenge"]') as HTMLTextAreaElement)?.value,
      goals: (form.querySelector('[name="goals"]') as HTMLTextAreaElement)?.value,
      askMeAbout: (form.querySelector('[name="askMeAbout"]') as HTMLTextAreaElement)?.value,
    };
    updateMutation.mutate(body);
  };

  if (authLoading || !user) return null;

  const displayAvatarUrl = profile?.avatarUrl ?? user.avatarUrl ?? undefined;
  const initials = (profile?.displayName ?? user.username ?? "?")
    .split(/\s+/)
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <CommunityShell>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold mb-2">Your profile</h1>
        <p className="text-muted-foreground text-sm mb-6">
          This is how you appear in the member directory. Visibility is controlled in <a href="/community/settings" className="text-primary underline">Settings</a>.
        </p>
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Edit profile</CardTitle>
              <CardDescription>Update your founder profile details.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-2 border-b border-border/60">
                  <Avatar className="h-24 w-24 shrink-0 border border-border">
                    <AvatarImage src={displayAvatarUrl} alt="" className="object-cover" />
                    <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-2 min-w-0">
                    <Label className="text-base">Profile photo</Label>
                    <p className="text-sm text-muted-foreground">
                      JPG, PNG, GIF, WebP, or AVIF — up to 5MB. Cropped to a square for the directory and feed.
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp,image/avif"
                      className="sr-only"
                      aria-label="Choose profile photo"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) avatarUploadMutation.mutate(f);
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={avatarUploadMutation.isPending}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {avatarUploadMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Camera className="h-4 w-4 mr-2" />
                      )}
                      Upload photo
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="displayName">Display name</Label>
                  <Input id="displayName" name="displayName" defaultValue={profile?.displayName ?? user?.username} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="headline">Headline</Label>
                  <Input id="headline" name="headline" placeholder="e.g. Founder, Builder" defaultValue={profile?.headline} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea id="bio" name="bio" placeholder="Short intro" defaultValue={profile?.bio} className="mt-1 min-h-[100px]" />
                </div>
                <div>
                  <Label htmlFor="businessName">Business name</Label>
                  <Input id="businessName" name="businessName" defaultValue={profile?.businessName} className="mt-1" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="businessStage">Stage</Label>
                    <Input id="businessStage" name="businessStage" placeholder="e.g. launched, growing" defaultValue={profile?.businessStage} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="industry">Industry</Label>
                    <Input id="industry" name="industry" defaultValue={profile?.industry} className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" name="location" defaultValue={profile?.location} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="websiteUrl">Website</Label>
                  <Input id="websiteUrl" name="websiteUrl" type="url" defaultValue={profile?.websiteUrl} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="whatBuilding">What you're building</Label>
                  <Textarea id="whatBuilding" name="whatBuilding" defaultValue={profile?.whatBuilding} className="mt-1 min-h-[80px]" />
                </div>
                <div>
                  <Label htmlFor="biggestChallenge">Biggest challenge</Label>
                  <Textarea id="biggestChallenge" name="biggestChallenge" defaultValue={profile?.biggestChallenge} className="mt-1 min-h-[80px]" />
                </div>
                <div>
                  <Label htmlFor="goals">Goals</Label>
                  <Textarea id="goals" name="goals" defaultValue={profile?.goals} className="mt-1 min-h-[80px]" />
                </div>
                <div>
                  <Label htmlFor="askMeAbout">Ask me about</Label>
                  <Textarea id="askMeAbout" name="askMeAbout" placeholder="Topics you can help with" defaultValue={profile?.askMeAbout} className="mt-1 min-h-[60px]" />
                </div>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save profile"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </CommunityShell>
  );
}

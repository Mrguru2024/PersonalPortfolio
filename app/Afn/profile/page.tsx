"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { CommunityAuthLoading } from "@/components/community/CommunityAuthLoading";
import { CommunityShell } from "@/components/community/CommunityShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  BUSINESS_STAGES,
  FOUNDER_TYPES,
  FOUNDER_TYPE_LABELS,
  PUBLIC_PROFILE_THEMES,
  PUBLIC_PROFILE_THEME_LABELS,
  isPublicProfileTheme,
} from "@/lib/community/constants";
import { AFN_PROFILE_FONT_PRESETS } from "@/lib/community/profileFonts";
import {
  mergePublicProfileStyle,
  PUBLIC_PROFILE_LAYOUT_LABELS,
  resolveProfileMotion,
} from "@/lib/community/publicProfileStyle";
import type { PublicProfileLayout, PublicProfileStyle } from "@shared/publicProfileStyle";
import { Camera, ExternalLink, Loader2, Palette, Sparkles, Type, UserCircle } from "lucide-react";

const PROFILE_BUILDER_KEYS = [
  "displayName",
  "headline",
  "bio",
  "founderTribe",
  "businessStage",
  "industry",
  "location",
  "whatBuilding",
  "websiteUrl",
] as const;

function completionPercent(values: Record<string, string | null | undefined>): number {
  let filled = 0;
  for (const k of PROFILE_BUILDER_KEYS) {
    const v = values[k];
    if (v != null && String(v).trim() !== "") filled++;
  }
  return Math.round((filled / PROFILE_BUILDER_KEYS.length) * 100);
}

export default function CommunityProfilePage() {
  const { user, isLoading: authLoading, isAuthPlaceholder } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);

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
  const coverInputRef = useRef<HTMLInputElement>(null);
  const profile = data?.profile ?? null;

  const [founderTribe, setFounderTribe] = useState<string>("");
  const [publicProfileTheme, setPublicProfileTheme] = useState<string>("classic");
  const [publicProfileStyle, setPublicProfileStyle] = useState<PublicProfileStyle>({});
  const fontFileRef = useRef<HTMLInputElement>(null);
  const [customFontLabel, setCustomFontLabel] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!profile) return;
    setFounderTribe(profile.founderTribe ?? "");
    const th = profile.publicProfileTheme ?? "classic";
    setPublicProfileTheme(isPublicProfileTheme(th) ? th : "classic");
    setPublicProfileStyle(mergePublicProfileStyle(profile.publicProfileStyleJson ?? null, {}));
    setCustomFontLabel(profile.publicProfileStyleJson?.customFontFamily ?? "");
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await apiRequest("PATCH", "/api/community/profile", body);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Failed to update");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/profile"] });
      toast({ title: "Saved", description: "Your profile has been updated." });
    },
    onError: (e: Error) =>
      toast({ title: "Could not save", description: e.message, variant: "destructive" }),
  });

  const fontUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/community/profile/font", {
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
    onSuccess: (data) => {
      const label = customFontLabel.trim() || "My custom font";
      setPublicProfileStyle((s) => ({
        ...s,
        customFontUrl: data.url,
        customFontFamily: label,
      }));
      setCustomFontLabel(label);
      if (fontFileRef.current) fontFileRef.current.value = "";
      toast({
        title: "Font uploaded",
        description: "Click Save profile so your public page stores this font URL.",
      });
    },
    onError: (e: Error) =>
      toast({ title: "Font upload failed", description: e.message, variant: "destructive" }),
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
      toast({ title: "Photo updated" });
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: (e: Error) =>
      toast({ title: "Upload failed", description: e.message, variant: "destructive" }),
  });

  const coverUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/community/profile/cover", {
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
      toast({ title: "Cover image updated" });
      if (coverInputRef.current) coverInputRef.current.value = "";
    },
    onError: (e: Error) =>
      toast({ title: "Cover upload failed", description: e.message, variant: "destructive" }),
  });

  useEffect(() => {
    if (mounted && !authLoading && !user) router.replace("/auth?redirect=/Afn/profile");
  }, [mounted, user, authLoading, router]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const tribeVal = founderTribe.trim() === "" ? null : founderTribe;
    const body: Record<string, unknown> = {
      displayName: (form.querySelector('[name="displayName"]') as HTMLInputElement)?.value,
      headline: (form.querySelector('[name="headline"]') as HTMLInputElement)?.value,
      bio: (form.querySelector('[name="bio"]') as HTMLTextAreaElement)?.value,
      businessName: (form.querySelector('[name="businessName"]') as HTMLInputElement)?.value,
      businessStage: (form.querySelector('[name="businessStage"]') as HTMLInputElement)?.value,
      industry: (form.querySelector('[name="industry"]') as HTMLInputElement)?.value,
      location: (form.querySelector('[name="location"]') as HTMLInputElement)?.value,
      websiteUrl: (form.querySelector('[name="websiteUrl"]') as HTMLInputElement)?.value,
      linkedinUrl: (form.querySelector('[name="linkedinUrl"]') as HTMLInputElement)?.value,
      whatBuilding: (form.querySelector('[name="whatBuilding"]') as HTMLTextAreaElement)?.value,
      biggestChallenge: (form.querySelector('[name="biggestChallenge"]') as HTMLTextAreaElement)?.value,
      goals: (form.querySelector('[name="goals"]') as HTMLTextAreaElement)?.value,
      lookingFor: (form.querySelector('[name="lookingFor"]') as HTMLTextAreaElement)?.value,
      collaborationInterests: (form.querySelector('[name="collaborationInterests"]') as HTMLTextAreaElement)?.value,
      askMeAbout: (form.querySelector('[name="askMeAbout"]') as HTMLTextAreaElement)?.value,
      founderTribe: tribeVal,
      publicProfileTheme,
      publicProfileStyle,
    };
    updateMutation.mutate(body);
  };

  const progressValues = useMemo(
    () => ({
      displayName: profile?.displayName ?? user?.username,
      headline: profile?.headline,
      bio: profile?.bio,
      founderTribe: profile?.founderTribe,
      businessStage: profile?.businessStage,
      industry: profile?.industry,
      location: profile?.location,
      whatBuilding: profile?.whatBuilding,
      websiteUrl: profile?.websiteUrl,
    }),
    [profile, user?.username],
  );
  const progress = completionPercent(progressValues);
  const publicUsername = profile?.username ?? user?.username ?? "";
  const publicUrl = `/Afn/members/${encodeURIComponent(publicUsername)}`;

  if (!mounted || authLoading || isAuthPlaceholder || !user) return <CommunityAuthLoading />;

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
        <h1 className="text-2xl font-bold mb-2">Build your public profile</h1>
        <p className="text-muted-foreground text-sm mb-4">
          Move through each step at your own pace. Save anytime. Who can see your page is set in{" "}
          <Link href="/Afn/settings" className="text-primary underline font-medium">
            Settings
          </Link>
          — public profiles can appear in Google search.
        </p>

        <div className="mb-6 space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Profile strength</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Profile builder
              </CardTitle>
              <CardDescription>
                Plain-language fields — no code required. Your headline and bio matter most for introductions and search results.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <Tabs defaultValue="basics" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto gap-1 bg-muted/50 p-1">
                    <TabsTrigger value="basics" className="text-xs sm:text-sm">
                      Basics
                    </TabsTrigger>
                    <TabsTrigger value="story" className="text-xs sm:text-sm">
                      Story
                    </TabsTrigger>
                    <TabsTrigger value="connect" className="text-xs sm:text-sm">
                      Connect
                    </TabsTrigger>
                    <TabsTrigger value="look" className="text-xs sm:text-sm">
                      Look & preview
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="basics" className="space-y-4 mt-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-4 border-b border-border/60">
                      <Avatar className="h-24 w-24 shrink-0 border border-border">
                        <AvatarImage src={displayAvatarUrl} alt="" className="object-cover" />
                        <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="space-y-2 min-w-0">
                        <Label className="text-base">Profile photo</Label>
                        <p className="text-sm text-muted-foreground">
                          A clear face or logo helps people recognize you in the directory.
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

                    <div className="rounded-lg border bg-muted/20 p-4 space-y-2">
                      <Label className="text-base">Public profile cover</Label>
                      <p className="text-sm text-muted-foreground">
                        Wide banner at the top of your public member page. Optional — uses a solid or gradient header if
                        you skip this.
                      </p>
                      {profile?.coverImageUrl ? (
                        <div className="relative h-28 w-full max-w-md overflow-hidden rounded-md border">
                          <img
                            src={profile.coverImageUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : null}
                      <input
                        ref={coverInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp,image/avif"
                        className="sr-only"
                        aria-label="Choose cover image"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) coverUploadMutation.mutate(f);
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={coverUploadMutation.isPending}
                        onClick={() => coverInputRef.current?.click()}
                      >
                        {coverUploadMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Camera className="h-4 w-4 mr-2" />
                        )}
                        Upload cover image
                      </Button>
                    </div>

                    <div>
                      <Label htmlFor="displayName">Display name</Label>
                      <Input
                        id="displayName"
                        name="displayName"
                        defaultValue={profile?.displayName ?? user?.username}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="headline">Headline</Label>
                      <Input
                        id="headline"
                        name="headline"
                        placeholder="What you do in one line"
                        defaultValue={profile?.headline ?? ""}
                        className="mt-1"
                      />
                    </div>

                    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <UserCircle className="h-4 w-4" />
                        Your founder community type
                      </div>
                      <p className="text-sm text-muted-foreground">
                        We use this to suggest people like you and similar journeys. You can change it anytime.
                      </p>
                      <Select value={founderTribe || "none"} onValueChange={(v) => setFounderTribe(v === "none" ? "" : v)}>
                        <SelectTrigger className="w-full bg-background">
                          <SelectValue placeholder="Choose the option that fits best" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Not sure yet</SelectItem>
                          {FOUNDER_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>
                              {FOUNDER_TYPE_LABELS[t]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="businessName">Business name (optional)</Label>
                      <Input id="businessName" name="businessName" defaultValue={profile?.businessName ?? ""} className="mt-1" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="businessStage">Business stage</Label>
                        <select
                          id="businessStage"
                          name="businessStage"
                          aria-label="Business stage"
                          defaultValue={profile?.businessStage ?? ""}
                          className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          <option value="">Select stage</option>
                          {BUSINESS_STAGES.map((s) => (
                            <option key={s} value={s}>
                              {s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="industry">Industry</Label>
                        <Input id="industry" name="industry" placeholder="e.g. Software, Health" defaultValue={profile?.industry ?? ""} className="mt-1" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="location">Location (optional)</Label>
                      <Input id="location" name="location" placeholder="City or region" defaultValue={profile?.location ?? ""} className="mt-1" />
                    </div>
                  </TabsContent>

                  <TabsContent value="story" className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        name="bio"
                        placeholder="A short story: who you help, what you care about, what you're working toward."
                        defaultValue={profile?.bio ?? ""}
                        className="mt-1 min-h-[120px]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="whatBuilding">What you&apos;re building</Label>
                      <Textarea id="whatBuilding" name="whatBuilding" defaultValue={profile?.whatBuilding ?? ""} className="mt-1 min-h-[88px]" />
                    </div>
                    <div>
                      <Label htmlFor="biggestChallenge">Biggest challenge right now</Label>
                      <Textarea id="biggestChallenge" name="biggestChallenge" defaultValue={profile?.biggestChallenge ?? ""} className="mt-1 min-h-[72px]" />
                    </div>
                    <div>
                      <Label htmlFor="goals">Goals</Label>
                      <Textarea id="goals" name="goals" defaultValue={profile?.goals ?? ""} className="mt-1 min-h-[72px]" />
                    </div>
                  </TabsContent>

                  <TabsContent value="connect" className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="websiteUrl">Website</Label>
                      <Input id="websiteUrl" name="websiteUrl" type="url" placeholder="https://" defaultValue={profile?.websiteUrl ?? ""} className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="linkedinUrl">LinkedIn</Label>
                      <Input id="linkedinUrl" name="linkedinUrl" type="url" placeholder="https://linkedin.com/in/..." defaultValue={profile?.linkedinUrl ?? ""} className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="lookingFor">What you&apos;re looking for</Label>
                      <Textarea
                        id="lookingFor"
                        name="lookingFor"
                        placeholder="Partners, clients, feedback, introductions..."
                        defaultValue={profile?.lookingFor ?? ""}
                        className="mt-1 min-h-[72px]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="collaborationInterests">Collaboration interests</Label>
                      <Textarea id="collaborationInterests" name="collaborationInterests" defaultValue={profile?.collaborationInterests ?? ""} className="mt-1 min-h-[72px]" />
                    </div>
                    <div>
                      <Label htmlFor="askMeAbout">Ask me about</Label>
                      <Textarea id="askMeAbout" name="askMeAbout" placeholder="Topics you love to help with" defaultValue={profile?.askMeAbout ?? ""} className="mt-1 min-h-[60px]" />
                    </div>
                  </TabsContent>

                  <TabsContent value="look" className="space-y-4 mt-4">
                    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Palette className="h-4 w-4" />
                        Color theme
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Gradient backdrop and accent classes for your public page.
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {PUBLIC_PROFILE_THEMES.map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setPublicProfileTheme(t)}
                            className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                              publicProfileTheme === t
                                ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                                : "border-border bg-background hover:bg-muted/50"
                            }`}
                          >
                            <span className="font-medium block">{PUBLIC_PROFILE_THEME_LABELS[t]}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium">Page layout</div>
                      <p className="text-sm text-muted-foreground">
                        Choose how your story and hero blocks are arranged on desktop and mobile.
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {(Object.keys(PUBLIC_PROFILE_LAYOUT_LABELS) as PublicProfileLayout[]).map((layout) => (
                          <button
                            key={layout}
                            type="button"
                            onClick={() => setPublicProfileStyle((s) => ({ ...s, layout }))}
                            className={`rounded-lg border px-3 py-2 text-left text-xs sm:text-sm transition-colors ${
                              (publicProfileStyle.layout ?? "editorial") === layout
                                ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                                : "border-border bg-background hover:bg-muted/50"
                            }`}
                          >
                            {PUBLIC_PROFILE_LAYOUT_LABELS[layout]}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Type className="h-4 w-4" />
                        Typography ({AFN_PROFILE_FONT_PRESETS.length} fonts + custom upload)
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Presets load from Google Fonts. Upload WOFF2, WOFF, TTF, or OTF (max 2MB) to use your own
                        brand typeface; enter the CSS font name your file expects.
                      </p>
                      <div className="space-y-2">
                        <Label htmlFor="profile-font-preset">Preset font</Label>
                        <select
                          id="profile-font-preset"
                          aria-label="Preset font for public profile"
                          className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={publicProfileStyle.fontPreset ?? "inter"}
                          onChange={(e) =>
                            setPublicProfileStyle((s) => ({
                              ...s,
                              fontPreset: e.target.value,
                              customFontUrl: null,
                              customFontFamily: null,
                            }))
                          }
                        >
                          {AFN_PROFILE_FONT_PRESETS.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      {publicProfileStyle.customFontUrl && (
                        <p className="text-xs text-muted-foreground">
                          Using uploaded font — preset is ignored until you clear the upload.
                        </p>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="custom-font-name">Custom font name (CSS)</Label>
                          <Input
                            id="custom-font-name"
                            placeholder="e.g. Acme Sans"
                            value={customFontLabel}
                            onChange={(e) => setCustomFontLabel(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div className="flex flex-col justify-end gap-2">
                          <input
                            ref={fontFileRef}
                            type="file"
                            accept=".woff2,.woff,.ttf,.otf,font/woff2,font/woff,application/octet-stream"
                            className="sr-only"
                            aria-label="Upload font file"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) fontUploadMutation.mutate(f);
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={fontUploadMutation.isPending}
                            onClick={() => fontFileRef.current?.click()}
                          >
                            {fontUploadMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Upload font file
                          </Button>
                          {(publicProfileStyle.customFontUrl || publicProfileStyle.customFontFamily) && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground"
                              onClick={() =>
                                setPublicProfileStyle((s) => ({
                                  ...s,
                                  customFontUrl: null,
                                  customFontFamily: null,
                                }))
                              }
                            >
                              Clear custom font
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                      <div className="text-sm font-medium">Fine-tuning</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="accent-hex">Accent color (optional)</Label>
                          <div className="flex gap-2 mt-1">
                            <Input
                              id="accent-hex"
                              type="color"
                              className="w-14 h-10 p-1 cursor-pointer"
                              value={
                                publicProfileStyle.primaryHex && /^#([0-9a-fA-F]{6})$/.test(publicProfileStyle.primaryHex)
                                  ? publicProfileStyle.primaryHex
                                  : "#6366f1"
                              }
                              onChange={(e) =>
                                setPublicProfileStyle((s) => ({ ...s, primaryHex: e.target.value }))
                              }
                            />
                            <Input
                              placeholder="#6366f1"
                              value={publicProfileStyle.primaryHex ?? ""}
                              onChange={(e) => {
                                const v = e.target.value.trim();
                                setPublicProfileStyle((s) => ({
                                  ...s,
                                  primaryHex: v === "" ? null : v,
                                }));
                              }}
                              className="font-mono text-sm flex-1"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="link"
                            className="px-0 h-auto text-xs"
                            onClick={() => setPublicProfileStyle((s) => ({ ...s, primaryHex: null }))}
                          >
                            Use theme default
                          </Button>
                        </div>
                        <div>
                          <Label htmlFor="surface-hex">Surface tint (optional)</Label>
                          <div className="flex gap-2 mt-1">
                            <Input
                              id="surface-hex"
                              type="color"
                              className="w-14 h-10 p-1 cursor-pointer"
                              value={
                                publicProfileStyle.surfaceHex && /^#([0-9a-fA-F]{6})$/.test(publicProfileStyle.surfaceHex)
                                  ? publicProfileStyle.surfaceHex
                                  : "#94a3b8"
                              }
                              onChange={(e) =>
                                setPublicProfileStyle((s) => ({ ...s, surfaceHex: e.target.value }))
                              }
                            />
                            <Input
                              placeholder="#optional"
                              value={publicProfileStyle.surfaceHex ?? ""}
                              onChange={(e) => {
                                const v = e.target.value.trim();
                                setPublicProfileStyle((s) => ({
                                  ...s,
                                  surfaceHex: v === "" ? null : v,
                                }));
                              }}
                              className="font-mono text-sm flex-1"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="link"
                            className="px-0 h-auto text-xs"
                            onClick={() => setPublicProfileStyle((s) => ({ ...s, surfaceHex: null }))}
                          >
                            Clear tint
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label>Card roundness</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {(["sm", "md", "lg", "xl"] as const).map((r) => (
                              <button
                                key={r}
                                type="button"
                                onClick={() => setPublicProfileStyle((s) => ({ ...s, radius: r }))}
                                className={`rounded-md border px-3 py-1.5 text-xs uppercase ${
                                  (publicProfileStyle.radius ?? "lg") === r
                                    ? "border-primary bg-primary/10"
                                    : "border-border bg-background"
                                }`}
                              >
                                {r}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <Label>Motion</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {(
                              [
                                ["on", "Interactive hover"],
                                ["reduced", "Reduced motion"],
                              ] as const
                            ).map(([val, label]) => (
                              <button
                                key={val}
                                type="button"
                                onClick={() =>
                                  setPublicProfileStyle((s) => ({ ...s, motion: val }))
                                }
                                className={`rounded-md border px-3 py-1.5 text-xs ${
                                  resolveProfileMotion(publicProfileStyle) === val
                                    ? "border-primary bg-primary/10"
                                    : "border-border bg-background"
                                }`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border p-4 space-y-2">
                      <p className="text-sm font-medium">Preview your public page</p>
                      <p className="text-sm text-muted-foreground">
                        Opens in a new tab. If your profile is private in Settings, only you will see the full page when logged in.
                      </p>
                      <Button type="button" variant="outline" size="sm" className="gap-2" asChild>
                        <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                          View public profile
                        </a>
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>

                <Button type="submit" disabled={updateMutation.isPending} className="w-full sm:w-auto">
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

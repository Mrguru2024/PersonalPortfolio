"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { Mail, ExternalLink, User, Sparkles, MapPin, Briefcase } from "lucide-react";
import { CommunityShell } from "@/components/community/CommunityShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AfnProfile } from "@shared/schema";
import {
  FOUNDER_TYPE_LABELS,
  isFounderType,
  isPublicProfileTheme,
  PUBLIC_PROFILE_THEME_CLASSES,
} from "@/lib/community/constants";
import { mergePublicProfileStyle, resolveProfileMotion } from "@/lib/community/publicProfileStyle";
import {
  getAfnProfileFontPresetById,
  profileGoogleFontStylesheetHref,
} from "@/lib/community/profileFonts";
import type { PublicProfileLayout } from "@shared/publicProfileStyle";

export interface MemberProfilePageClientProps {
  profile: AfnProfile;
  showContactLinks: boolean;
  isOwnProfile: boolean;
  viewerUserId: number | null;
}

const RADIUS_MAP: Record<NonNullable<import("@shared/publicProfileStyle").PublicProfileStyle["radius"]>, string> = {
  sm: "rounded-xl",
  md: "rounded-2xl",
  lg: "rounded-3xl",
  xl: "rounded-[2rem]",
};

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function surfaceTint(hex: string | null | undefined): string | undefined {
  if (!hex) return undefined;
  const rgb = hexToRgb(hex);
  if (!rgb) return undefined;
  return `rgba(${rgb.r},${rgb.g},${rgb.b},0.09)`;
}

function cssFontFamilySafe(name: string): string {
  const s = name.replace(/[^a-zA-Z0-9 _\-]/g, "").trim().slice(0, 120);
  return s || "ProfileCustomFont";
}

function fontFormatFromUrl(url: string): string {
  const u = url.toLowerCase();
  if (u.endsWith(".woff2")) return "woff2";
  if (u.endsWith(".woff")) return "woff";
  if (u.endsWith(".otf")) return "opentype";
  return "truetype";
}

function useProfileGoogleFont(href: string | null, instanceId: string) {
  useEffect(() => {
    if (!href) return;
    const id = `afn-profile-font-${instanceId}`;
    document.getElementById(id)?.remove();
    const el = document.createElement("link");
    el.id = id;
    el.rel = "stylesheet";
    el.href = href;
    document.head.appendChild(el);
    return () => {
      el.remove();
    };
  }, [href, instanceId]);
}

export function MemberProfilePageClient({
  profile,
  showContactLinks,
  isOwnProfile,
  viewerUserId,
}: MemberProfilePageClientProps) {
  const displayName = profile.displayName || profile.username || profile.fullName || "Member";
  const showContact = showContactLinks;
  const themeKey = isPublicProfileTheme(profile.publicProfileTheme) ? profile.publicProfileTheme : "classic";
  const theme = PUBLIC_PROFILE_THEME_CLASSES[themeKey];
  const style = useMemo(
    () => mergePublicProfileStyle(profile.publicProfileStyleJson ?? null, {}),
    [profile.publicProfileStyleJson]
  );
  const layout: PublicProfileLayout = style.layout ?? "editorial";
  const radiusClass = RADIUS_MAP[style.radius ?? "lg"] ?? RADIUS_MAP.lg;
  const motionOn = resolveProfileMotion(style) === "on";
  const motionCard = motionOn ? "transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10" : "";
  const motionBtn = motionOn ? "transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]" : "";

  const customUrl = style.customFontUrl?.trim() || null;
  const customFamilyRaw = style.customFontFamily?.trim() || null;
  const customFamily = customFamilyRaw ? cssFontFamilySafe(customFamilyRaw) : null;
  const preset = getAfnProfileFontPresetById(style.fontPreset ?? "inter");
  const googleHref =
    customUrl && customFamily ? null : profileGoogleFontStylesheetHref(preset.googleFamily);

  useProfileGoogleFont(googleHref, `${profile.userId}-${preset.id}`);

  const fontStack =
    customUrl && customFamily
      ? `'${customFamily}', ui-sans-serif, system-ui, sans-serif`
      : `'${preset.googleFamily.replace(/'/g, "\\'")}', ui-sans-serif, system-ui, sans-serif`;

  const accentColor = style.primaryHex?.trim() || null;
  const rgbAccent = accentColor ? hexToRgb(accentColor) : null;
  const accentStyle = rgbAccent ? { color: `rgb(${rgbAccent.r},${rgbAccent.g},${rgbAccent.b})` } : undefined;
  const surfaceBg = surfaceTint(style.surfaceHex ?? null);
  const badgeBase = accentColor && rgbAccent ? { borderColor: `${accentColor}55`, color: `rgb(${rgbAccent.r},${rgbAccent.g},${rgbAccent.b})`, background: `rgba(${rgbAccent.r},${rgbAccent.g},${rgbAccent.b},0.12)` } : undefined;

  const tribeLabel =
    profile.founderTribe && isFounderType(profile.founderTribe)
      ? FOUNDER_TYPE_LABELS[profile.founderTribe]
      : profile.founderTribe
        ? profile.founderTribe.replace(/_/g, " ")
        : null;

  const canMessage = Boolean(viewerUserId && !isOwnProfile && showContact);

  const metaLine = [profile.businessStage?.replace(/_/g, " "), profile.industry].filter(Boolean).join(" · ");

  const storyChunks = [
    profile.bio && { id: "about", label: "About", body: profile.bio },
    profile.whatBuilding && { id: "building", label: "Building", body: profile.whatBuilding },
    profile.biggestChallenge && { id: "challenge", label: "Challenge", body: profile.biggestChallenge },
    profile.goals && { id: "goals", label: "Goals", body: profile.goals },
    profile.lookingFor && { id: "looking", label: "Looking for", body: profile.lookingFor },
    profile.collaborationInterests && {
      id: "collab",
      label: "Collaboration",
      body: profile.collaborationInterests,
    },
    profile.askMeAbout && { id: "ask", label: "Ask me about", body: profile.askMeAbout },
  ].filter(Boolean) as { id: string; label: string; body: string }[];

  const SectionCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <Card
      className={`border-border/60 bg-card/80 backdrop-blur-md shadow-sm dark:bg-card/70 ${radiusClass} ${motionCard} ${className}`}
      style={surfaceBg ? { backgroundColor: surfaceBg } : undefined}
    >
      {children}
    </Card>
  );

  const heroGradient =
    themeKey === "midnight"
      ? "from-slate-900/90 via-slate-800/50 to-transparent"
      : themeKey === "ocean"
        ? "from-cyan-900/40 via-background to-transparent"
        : themeKey === "sunset"
          ? "from-amber-900/35 via-background to-transparent"
          : themeKey === "forest"
            ? "from-emerald-900/35 via-background to-transparent"
            : themeKey === "violet"
              ? "from-violet-900/45 via-background to-transparent"
              : "from-primary/25 via-background to-transparent";

  const HeadBlock = () => (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {tribeLabel && (
          <Badge variant="outline" className={theme.badge} style={badgeBase}>
            <User className="h-3 w-3 mr-1" aria-hidden />
            {tribeLabel}
          </Badge>
        )}
        {metaLine && (
          <Badge variant="secondary" className="font-normal gap-1">
            <Briefcase className="h-3 w-3 opacity-70" aria-hidden />
            {metaLine}
          </Badge>
        )}
        {profile.location && (
          <Badge variant="outline" className="font-normal text-muted-foreground gap-1">
            <MapPin className="h-3 w-3" aria-hidden />
            {profile.location}
          </Badge>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {isOwnProfile && (
          <Button variant="outline" size="sm" className={motionBtn} asChild>
            <Link href="/Afn/profile">Customize look</Link>
          </Button>
        )}
        {!isOwnProfile && canMessage && (
          <Button size="sm" className={`gap-2 ${motionBtn}`} asChild>
            <Link href={`/Afn/inbox?with=${profile.userId}`}>
              <Mail className="h-4 w-4" />
              Message
            </Link>
          </Button>
        )}
        {!isOwnProfile && !viewerUserId && showContact && profile.username && (
          <Button size="sm" variant="secondary" className={motionBtn} asChild>
            <Link href={`/auth?redirect=/Afn/members/${encodeURIComponent(profile.username)}`}>
              Sign in to connect
            </Link>
          </Button>
        )}
      </div>
    </div>
  );

  const LinksBlock = () =>
    showContact &&
    (profile.websiteUrl || profile.linkedinUrl) ? (
      <SectionCard className="p-5">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Links</h2>
        <div className="flex flex-wrap gap-3">
          {profile.websiteUrl && (
            <a
              href={profile.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2 ${accentStyle ? "" : "text-primary"} hover:opacity-90 text-sm font-medium`}
              style={accentStyle}
            >
              <ExternalLink className="h-4 w-4 shrink-0" />
              Website
            </a>
          )}
          {profile.linkedinUrl && (
            <a
              href={profile.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2 ${accentStyle ? "" : "text-primary"} hover:opacity-90 text-sm font-medium`}
              style={accentStyle}
            >
              <ExternalLink className="h-4 w-4 shrink-0" />
              LinkedIn
            </a>
          )}
        </div>
      </SectionCard>
    ) : null;

  const StoryTabs = () =>
    storyChunks.length > 0 ? (
      <SectionCard className="p-0 overflow-hidden">
        <Tabs defaultValue={storyChunks[0]?.id} className="w-full">
          <div className="border-b border-border/60 bg-muted/20 px-3 pt-3">
            <TabsList className="flex w-full flex-wrap h-auto gap-1 bg-transparent p-0 justify-start">
              {storyChunks.map((c) => (
                <TabsTrigger
                  key={c.id}
                  value={c.id}
                  className="rounded-lg data-[state=active]:shadow-sm text-xs sm:text-sm px-3 py-2"
                >
                  {c.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          {storyChunks.map((c) => (
            <TabsContent key={c.id} value={c.id} className="p-5 sm:p-6 mt-0 focus-visible:outline-none">
              <p className="whitespace-pre-wrap leading-relaxed text-foreground/95">{c.body}</p>
            </TabsContent>
          ))}
        </Tabs>
      </SectionCard>
    ) : null;

  const rootStyle = {
    fontFamily: fontStack,
    ...(accentStyle?.color ? { ["--profile-accent" as string]: accentStyle.color } : {}),
  } as React.CSSProperties;

  const titleClass = `font-bold tracking-tight ${accentStyle ? "" : theme.accent}`;

  const EditorialLayout = () => (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)] lg:items-start">
      <div className="space-y-6">
        <SectionCard className={`p-6 sm:p-8 border-dashed ${theme.card}`}>
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="relative shrink-0">
              <div
                className={`absolute -inset-1 rounded-full opacity-40 blur-md bg-gradient-to-tr ${heroGradient}`}
                aria-hidden
              />
              <Avatar className={`relative h-24 w-24 sm:h-28 sm:w-28 border-2 border-white/10 shadow-lg ${radiusClass}`}>
                <AvatarImage src={profile.avatarUrl ?? undefined} alt="" />
                <AvatarFallback className="text-2xl bg-muted">{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Member profile
              </p>
              <h1 className={`text-3xl sm:text-4xl ${titleClass}`} style={accentStyle}>
                {displayName}
              </h1>
              {profile.headline && (
                <p className="text-lg text-muted-foreground leading-snug">{profile.headline}</p>
              )}
              <HeadBlock />
            </div>
          </div>
        </SectionCard>
        <StoryTabs />
        <LinksBlock />
      </div>
      <aside className="space-y-4 lg:sticky lg:top-20">
        <SectionCard className={`p-5 ${theme.card}`}>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Profiles on Ascendra Founder Network are built by members.{" "}
            <Link href="/Afn/members" className="underline underline-offset-4 hover:text-foreground">
              Browse the directory
            </Link>
            .
          </p>
        </SectionCard>
      </aside>
    </div>
  );

  const HeroLayout = () => (
    <div className="space-y-6">
      <div className={`relative overflow-hidden ${radiusClass} ${theme.card} border shadow-lg`}>
        <div className={`h-44 sm:h-52 bg-gradient-to-br ${heroGradient}`} />
        <div className="px-6 sm:px-10 pb-8 -mt-14 sm:-mt-16 relative flex flex-col sm:flex-row gap-6 items-start sm:items-end">
          <Avatar className={`h-28 w-28 sm:h-32 sm:w-32 border-4 border-background shadow-xl ${radiusClass}`}>
            <AvatarImage src={profile.avatarUrl ?? undefined} alt="" />
            <AvatarFallback className="text-3xl">{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 pb-1 space-y-2">
            <h1 className={`text-3xl sm:text-4xl font-bold ${titleClass}`} style={accentStyle}>
              {displayName}
            </h1>
            {profile.headline && <p className="text-muted-foreground text-lg">{profile.headline}</p>}
            <HeadBlock />
          </div>
        </div>
      </div>
      <StoryTabs />
      <LinksBlock />
    </div>
  );

  const BentoLayout = () => (
    <div className="space-y-6">
      <div className={`grid gap-4 md:grid-cols-12 ${radiusClass}`}>
        <SectionCard className={`md:col-span-7 p-6 sm:p-8 ${theme.card} md:row-span-2`}>
          <div className="flex items-start gap-4">
            <Avatar className={`h-16 w-16 shrink-0 border ${radiusClass}`}>
              <AvatarImage src={profile.avatarUrl ?? undefined} alt="" />
              <AvatarFallback>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h1 className={`text-2xl sm:text-3xl font-bold ${titleClass}`} style={accentStyle}>
                {displayName}
              </h1>
              {profile.headline && <p className="text-muted-foreground mt-1">{profile.headline}</p>}
            </div>
          </div>
          <div className="mt-6">
            <HeadBlock />
          </div>
        </SectionCard>
        <SectionCard className={`md:col-span-5 p-5 ${theme.card}`}>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">At a glance</h2>
          <ul className="text-sm space-y-2 text-muted-foreground">
            {tribeLabel && <li>Tribe: {tribeLabel}</li>}
            {metaLine && <li>{metaLine}</li>}
            {profile.location && <li>{profile.location}</li>}
          </ul>
        </SectionCard>
        <div className="md:col-span-12">
          <StoryTabs />
        </div>
      </div>
      <LinksBlock />
    </div>
  );

  const MinimalLayout = () => (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="flex flex-col items-center text-center gap-4 py-4">
        <Avatar className={`h-20 w-20 border ${radiusClass}`}>
          <AvatarImage src={profile.avatarUrl ?? undefined} alt="" />
          <AvatarFallback className="text-xl">{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className={`text-3xl font-semibold ${titleClass}`} style={accentStyle}>
            {displayName}
          </h1>
          {profile.headline && <p className="text-muted-foreground mt-2 max-w-lg mx-auto">{profile.headline}</p>}
        </div>
        <HeadBlock />
      </div>
      <StoryTabs />
      <LinksBlock />
    </div>
  );

  return (
    <CommunityShell>
      {customUrl && customFamily ? (
        <style>{`
          @font-face {
            font-family: '${customFamily}';
            src: url('${customUrl}') format('${fontFormatFromUrl(customUrl)}');
            font-weight: 300 700;
            font-display: swap;
          }
        `}</style>
      ) : null}

      <div className="mx-auto max-w-5xl px-4 sm:px-6 pb-16" style={rootStyle}>
        <div className="mb-6 pt-2">
          <Link
            href="/Afn/members"
            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 group"
          >
            <span className="transition-transform group-hover:-translate-x-0.5">←</span>
            {" "}
            Back to members
          </Link>
        </div>

        {layout === "hero" && <HeroLayout />}
        {layout === "bento" && <BentoLayout />}
        {layout === "minimal" && <MinimalLayout />}
        {layout === "editorial" && <EditorialLayout />}
      </div>
    </CommunityShell>
  );
}

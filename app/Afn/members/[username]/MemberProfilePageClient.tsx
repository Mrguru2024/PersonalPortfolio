"use client";

import Link from "next/link";
import { Mail, ExternalLink, User } from "lucide-react";
import { CommunityShell } from "@/components/community/CommunityShell";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { AfnProfile } from "@shared/schema";
import {
  FOUNDER_TYPE_LABELS,
  isFounderType,
  isPublicProfileTheme,
  PUBLIC_PROFILE_THEME_CLASSES,
} from "@/lib/community/constants";

export interface MemberProfilePageClientProps {
  profile: AfnProfile;
  showContactLinks: boolean;
  isOwnProfile: boolean;
  viewerUserId: number | null;
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
  const tribeLabel =
    profile.founderTribe && isFounderType(profile.founderTribe)
      ? FOUNDER_TYPE_LABELS[profile.founderTribe]
      : profile.founderTribe
        ? profile.founderTribe.replace(/_/g, " ")
        : null;

  const canMessage = Boolean(viewerUserId && !isOwnProfile && showContact);

  return (
    <CommunityShell>
      <div className="mx-auto max-w-2xl">
        <div className="mb-4">
          <Link href="/Afn/members" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to members
          </Link>
        </div>

        <Card className={`overflow-hidden ${theme.card}`}>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <Avatar className="h-20 w-20 border border-border/60">
                <AvatarImage src={profile.avatarUrl ?? undefined} alt="" />
                <AvatarFallback className="text-2xl">
                  {displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h1 className={`text-2xl font-bold ${theme.accent}`}>{displayName}</h1>
                {profile.headline && <p className="text-muted-foreground mt-1">{profile.headline}</p>}
                <div className="flex flex-wrap gap-2 mt-2">
                  {tribeLabel && (
                    <Badge variant="outline" className={theme.badge}>
                      <User className="h-3 w-3 mr-1" />
                      {tribeLabel}
                    </Badge>
                  )}
                  {(profile.businessStage || profile.industry) && (
                    <Badge variant="secondary" className="font-normal">
                      {[profile.businessStage?.replace(/_/g, " "), profile.industry].filter(Boolean).join(" · ")}
                    </Badge>
                  )}
                </div>
                {isOwnProfile && (
                  <Button variant="outline" size="sm" className="mt-3" asChild>
                    <Link href="/Afn/profile">Edit profile</Link>
                  </Button>
                )}
                {!isOwnProfile && canMessage && (
                  <Button size="sm" className="mt-3 gap-2" asChild>
                    <Link href={`/Afn/inbox?with=${profile.userId}`}>
                      <Mail className="h-4 w-4" />
                      Message
                    </Link>
                  </Button>
                )}
                {!isOwnProfile && !viewerUserId && showContact && profile.username && (
                  <Button size="sm" variant="secondary" className="mt-3" asChild>
                    <Link href={`/auth?redirect=/Afn/members/${encodeURIComponent(profile.username)}`}>
                      Sign in to connect
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {profile.bio && (
              <section aria-labelledby="about-heading">
                <h2 id="about-heading" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  About
                </h2>
                <p className="whitespace-pre-wrap text-foreground">{profile.bio}</p>
              </section>
            )}
            {profile.whatBuilding && (
              <section aria-labelledby="building-heading">
                <h2 id="building-heading" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  What I&apos;m building
                </h2>
                <p className="whitespace-pre-wrap">{profile.whatBuilding}</p>
              </section>
            )}
            {profile.biggestChallenge && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">Biggest challenge</h2>
                <p>{profile.biggestChallenge}</p>
              </section>
            )}
            {profile.goals && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">Goals</h2>
                <p className="whitespace-pre-wrap">{profile.goals}</p>
              </section>
            )}
            {profile.lookingFor && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">Looking for</h2>
                <p className="whitespace-pre-wrap">{profile.lookingFor}</p>
              </section>
            )}
            {profile.collaborationInterests && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">Collaboration interests</h2>
                <p className="whitespace-pre-wrap">{profile.collaborationInterests}</p>
              </section>
            )}
            {showContact && (profile.websiteUrl || profile.linkedinUrl) && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Links</h2>
                <div className="flex flex-wrap gap-2">
                  {profile.websiteUrl && (
                    <a
                      href={profile.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Website
                    </a>
                  )}
                  {profile.linkedinUrl && (
                    <a
                      href={profile.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      LinkedIn
                    </a>
                  )}
                </div>
              </section>
            )}
          </CardContent>
        </Card>
      </div>
    </CommunityShell>
  );
}

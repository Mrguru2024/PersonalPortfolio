"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Mail, ExternalLink, Loader2 } from "lucide-react";
import { CommunityShell } from "@/components/community/CommunityShell";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/queryClient";

interface ProfileData {
  profile: {
    id: number;
    userId: number;
    fullName: string | null;
    displayName: string | null;
    username: string | null;
    avatarUrl: string | null;
    headline: string | null;
    bio: string | null;
    businessName: string | null;
    businessStage: string | null;
    industry: string | null;
    location: string | null;
    websiteUrl: string | null;
    linkedinUrl: string | null;
    whatBuilding: string | null;
    biggestChallenge: string | null;
    goals: string | null;
    lookingFor: string | null;
    collaborationInterests: string | null;
    askMeAbout: string | null;
  };
  settings: { showContactLinks?: boolean; profileVisibility?: string } | null;
}

export default function CommunityMemberProfilePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const username = params?.username ? String(params.username) : null;

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`/auth?redirect=/community/members/${username}`);
    }
  }, [user, authLoading, router, username]);

  const { data, isLoading } = useQuery<ProfileData>({
    queryKey: ["/api/community/members", username],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/community/members/${encodeURIComponent(username!)}`);
      return res.json();
    },
    enabled: !!user && !!username,
  });

  if (authLoading || !user || !username) return null;
  if (isLoading || !data?.profile) {
    return (
      <CommunityShell>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </CommunityShell>
    );
  }

  const { profile, settings } = data;
  const displayName = profile.displayName || profile.username || profile.fullName || `Member`;
  const showContact = settings?.showContactLinks !== false;
  const isOwnProfile = user?.id && Number(user.id) === profile.userId;

  return (
    <CommunityShell>
      <div className="mx-auto max-w-2xl">
        <div className="mb-4">
          <Link href="/community/members" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to members
          </Link>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.avatarUrl ?? undefined} />
                <AvatarFallback className="text-2xl">
                  {displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold">{displayName}</h1>
                {profile.headline && (
                  <p className="text-muted-foreground mt-1">{profile.headline}</p>
                )}
                {(profile.businessStage || profile.industry) && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {[profile.businessStage?.replace(/_/g, " "), profile.industry].filter(Boolean).join(" · ")}
                  </p>
                )}
                {isOwnProfile && (
                  <Button variant="outline" size="sm" className="mt-3" asChild>
                    <Link href="/community/profile">Edit profile</Link>
                  </Button>
                )}
                {!isOwnProfile && showContact && (
                  <Button size="sm" className="mt-3 gap-2" asChild>
                    <Link href={`/community/inbox?with=${profile.userId}`}>
                      <Mail className="h-4 w-4" />
                      Message
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {profile.bio && (
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">About</h2>
                <p className="whitespace-pre-wrap">{profile.bio}</p>
              </div>
            )}
            {profile.whatBuilding && (
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">What I&apos;m building</h2>
                <p className="whitespace-pre-wrap">{profile.whatBuilding}</p>
              </div>
            )}
            {profile.biggestChallenge && (
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">Biggest challenge</h2>
                <p>{profile.biggestChallenge}</p>
              </div>
            )}
            {profile.collaborationInterests && (
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">Collaboration interests</h2>
                <p className="whitespace-pre-wrap">{profile.collaborationInterests}</p>
              </div>
            )}
            {showContact && (profile.websiteUrl || profile.linkedinUrl) && (
              <div>
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
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </CommunityShell>
  );
}

"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Users, Loader2, UserPlus, Sparkles } from "lucide-react";
import { CommunityShell } from "@/components/community/CommunityShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import {
  BUSINESS_STAGES,
  FOUNDER_TYPES,
  FOUNDER_TYPE_LABELS,
  isFounderType,
} from "@/lib/community/constants";

interface Profile {
  id: number;
  userId: number;
  displayName: string | null;
  username: string | null;
  avatarUrl: string | null;
  headline: string | null;
  businessStage: string | null;
  industry: string | null;
  founderTribe?: string | null;
}

interface Suggestion {
  id: number;
  userId: number;
  displayName: string | null;
  username: string | null;
  avatarUrl: string | null;
  headline: string | null;
  businessStage: string | null;
  industry: string | null;
  founderTribe: string | null;
  score: number;
  reasons: string[];
}

export default function CommunityMembersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [industry, setIndustry] = useState<string>("");
  const [businessStage, setBusinessStage] = useState<string>("");
  const [founderTribeFilter, setFounderTribeFilter] = useState<string>("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/auth?redirect=/community/members");
    }
  }, [user, authLoading, router]);

  const { data: members = [], isLoading } = useQuery<Profile[]>({
    queryKey: ["/api/community/members", industry, businessStage, founderTribeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (industry) params.set("industry", industry);
      if (businessStage) params.set("businessStage", businessStage);
      if (founderTribeFilter) params.set("founderTribe", founderTribeFilter);
      const res = await apiRequest("GET", `/api/community/members?${params.toString()}`);
      return res.json();
    },
    enabled: !!user,
  });

  const { data: suggestionsData, isLoading: suggestionsLoading } = useQuery<{ suggestions: Suggestion[] }>({
    queryKey: ["/api/community/suggestions"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/community/suggestions?limit=6");
      return res.json();
    },
    enabled: !!user,
  });
  const suggestions = suggestionsData?.suggestions ?? [];

  if (authLoading || !user) return null;

  return (
    <CommunityShell>
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold mb-2">Members</h1>
        <p className="text-muted-foreground text-sm mb-6">
          Discover founders and builders. Profiles respect visibility settings.
        </p>

        {/* Friend suggestions: profile + business needs + topics + focus */}
        {suggestionsLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading suggestions…</span>
          </div>
        ) : suggestions.length > 0 ? (
          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardContent className="pt-4 pb-4">
              <h2 className="text-base font-semibold flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-primary" />
                Suggested for you
              </h2>
              <p className="text-xs text-muted-foreground mb-4">
                Based on your profile, business focus, topics, and what you&apos;re looking for.
              </p>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {suggestions.map((s) => (
                  <li key={s.userId}>
                    <Card className="overflow-hidden">
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10 shrink-0">
                            <AvatarImage src={s.avatarUrl ?? undefined} />
                            <AvatarFallback>
                              {(s.displayName || s.username || "U").slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">
                              {s.displayName || s.username || `Member #${s.userId}`}
                            </p>
                            {s.headline && (
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{s.headline}</p>
                            )}
                            {s.founderTribe && FOUNDER_TYPE_LABELS[s.founderTribe as keyof typeof FOUNDER_TYPE_LABELS] && (
                              <p className="text-[10px] text-muted-foreground mt-1">
                                {FOUNDER_TYPE_LABELS[s.founderTribe as keyof typeof FOUNDER_TYPE_LABELS]}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-1 mt-2">
                              {s.reasons.slice(0, 3).map((r, i) => (
                                <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0">
                                  {r}
                                </Badge>
                              ))}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1.5">Match: {s.score}%</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="mt-2 w-full" asChild>
                          <Link
                            href={`/community/members/${encodeURIComponent(String(s.username ?? s.userId))}`}
                          >
                            View profile
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}

        <div className="flex flex-wrap gap-3 mb-6">
          <Select value={businessStage} onValueChange={setBusinessStage}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All stages</SelectItem>
              {BUSINESS_STAGES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={industry} onValueChange={setIndustry}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All industries</SelectItem>
              <SelectItem value="tech">Tech</SelectItem>
              <SelectItem value="services">Services</SelectItem>
              <SelectItem value="creative">Creative</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Select value={founderTribeFilter} onValueChange={setFounderTribeFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Community type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All types</SelectItem>
              {FOUNDER_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {FOUNDER_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : members.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Users className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">No members match your filters yet.</p>
            </CardContent>
          </Card>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((member) => (
              <li key={member.id}>
                <Card>
                  <CardContent className="pt-4">
                    <Link
                      href={`/community/members/${encodeURIComponent(String(member.username ?? member.userId))}`}
                      className="flex items-start gap-3 hover:opacity-90"
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={member.avatarUrl ?? undefined} />
                        <AvatarFallback>
                          {(member.displayName || member.username || "U").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">
                          {member.displayName || member.username || `Member #${member.userId}`}
                        </p>
                        {member.headline && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{member.headline}</p>
                        )}
                        {(member.businessStage || member.industry) && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {[member.businessStage?.replace(/_/g, " "), member.industry].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </div>
                    </Link>
                    <Button variant="outline" size="sm" className="mt-3 w-full" asChild>
                      <Link
                        href={`/community/members/${encodeURIComponent(String(member.username ?? member.userId))}`}
                      >
                        View profile
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </CommunityShell>
  );
}

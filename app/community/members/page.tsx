"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Users, Loader2 } from "lucide-react";
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
import { apiRequest } from "@/lib/queryClient";
import { BUSINESS_STAGES } from "@/lib/community/constants";

interface Profile {
  id: number;
  userId: number;
  displayName: string | null;
  username: string | null;
  avatarUrl: string | null;
  headline: string | null;
  businessStage: string | null;
  industry: string | null;
}

export default function CommunityMembersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [industry, setIndustry] = useState<string>("");
  const [businessStage, setBusinessStage] = useState<string>("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?redirect=/community/members");
    }
  }, [user, authLoading, router]);

  const { data: members = [], isLoading } = useQuery<Profile[]>({
    queryKey: ["/api/community/members", industry, businessStage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (industry) params.set("industry", industry);
      if (businessStage) params.set("businessStage", businessStage);
      const res = await apiRequest("GET", `/api/community/members?${params.toString()}`);
      return res.json();
    },
    enabled: !!user,
  });

  if (authLoading || !user) return null;

  return (
    <CommunityShell>
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold mb-2">Members</h1>
        <p className="text-muted-foreground text-sm mb-6">
          Discover founders and builders. Profiles respect visibility settings.
        </p>

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
                      href={`/community/members/${member.username ?? member.userId}`}
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
                      <Link href={`/community/members/${member.username ?? member.userId}`}>
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

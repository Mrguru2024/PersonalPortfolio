"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function PaidGrowthAccountsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState("meta");
  const [nickname, setNickname] = useState("");
  const [externalId, setExternalId] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["/api/admin/paid-growth/accounts"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/paid-growth/accounts");
      if (!res.ok) throw new Error("fail");
      return res.json() as Promise<
        {
          id: number;
          platform: string;
          nickname: string;
          externalAccountId: string;
          status: string;
          adReadyStatus?: string;
        }[]
      >;
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const addMut = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/paid-growth/accounts", {
        platform,
        nickname,
        externalAccountId: externalId.replace(/^act_/i, ""),
      });
      if (!res.ok) throw new Error("fail");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Account saved" });
      qc.invalidateQueries({ queryKey: ["/api/admin/paid-growth/accounts"] });
      setOpen(false);
      setNickname("");
      setExternalId("");
    },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  if (authLoading || !user?.isAdmin || !user?.adminApproved) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4">
        <p className="text-sm text-muted-foreground max-w-xl">
          Store platform account IDs here. Connection credentials are managed in hosting settings and stay hidden in
          this app. Map each account to campaigns in the builder.
        </p>
        <Button type="button" onClick={() => setOpen((o) => !o)}>
          <Plus className="h-4 w-4 mr-2" />
          Add account
        </Button>
      </div>

      {open && (
        <Card>
          <CardHeader>
            <CardTitle>New connection record</CardTitle>
            <CardDescription>Meta: numeric ad account id. Google: customer id (no dashes).</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label>Platform</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meta">Meta</SelectItem>
                  <SelectItem value="google_ads">Google Ads</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 flex-1 min-w-[140px]">
              <Label>Nickname</Label>
              <Input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Ascendra — main" />
            </div>
            <div className="space-y-2 flex-1 min-w-[140px]">
              <Label>External account ID</Label>
              <Input value={externalId} onChange={(e) => setExternalId(e.target.value)} placeholder="1234567890" />
            </div>
            <Button onClick={() => addMut.mutate()} disabled={!nickname.trim() || !externalId.trim() || addMut.isPending}>
              Save
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <Loader2 className="h-8 w-8 animate-spin" />
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id}>
              <Card>
                <CardContent className="py-4 flex flex-wrap justify-between gap-2">
                  <div>
                    <p className="font-medium">{r.nickname}</p>
                    <p className="text-sm text-muted-foreground font-mono">{r.externalAccountId}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <Badge variant="outline">{r.platform}</Badge>
                    {r.adReadyStatus === "not_ad_ready" ?
                      <Badge variant="destructive">Not ad ready</Badge>
                    : r.adReadyStatus === "ad_ready" ?
                      <Badge className="bg-emerald-600 hover:bg-emerald-600">Ad ready</Badge>
                    : <Badge variant="secondary">Not assessed</Badge>}
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

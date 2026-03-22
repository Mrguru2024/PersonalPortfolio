"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Building2, Plus, Search, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";

interface CrmAccount {
  id: number;
  name: string;
  website?: string | null;
  industry?: string | null;
  businessType?: string | null;
  companySize?: string | null;
  accountStatus?: string | null;
  tags?: string[] | null;
  createdAt: string;
  updatedAt: string;
}

export default function CrmAccountsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const { data: accounts = [], isLoading } = useQuery<CrmAccount[]>({
    queryKey: ["/api/admin/crm/accounts"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/crm/accounts");
      return res.json();
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const filtered = search.trim()
    ? accounts.filter(
        (a) =>
          a.name.toLowerCase().includes(search.toLowerCase()) ||
          (a.industry ?? "").toLowerCase().includes(search.toLowerCase()) ||
          (a.website ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : accounts;

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Accounts</h1>
          <p className="text-muted-foreground">Companies and organizations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/crm/dashboard">Dashboard</Link>
          </Button>
          <Button asChild>
            <Link href="/admin/crm/accounts/new">
              <Plus className="h-4 w-4 mr-2" />
              Add account
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, industry, website…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                {accounts.length === 0 ? "No accounts yet. Add your first account." : "No accounts match your search."}
              </CardContent>
            </Card>
          ) : (
            filtered.map((account) => (
              <Card key={account.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{account.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {[account.industry, account.companySize].filter(Boolean).join(" · ") || "—"}
                        </p>
                      </div>
                      {account.accountStatus && (
                        <Badge variant="secondary">{account.accountStatus}</Badge>
                      )}
                      {account.tags && account.tags.length > 0 && (
                        <div className="flex gap-1">
                          {account.tags.slice(0, 3).map((t) => (
                            <Badge key={t} variant="outline">{t}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/crm/accounts/${account.id}`}>
                        View <ArrowRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

        <div className="mt-6">
          <Button variant="outline" asChild>
            <Link href="/admin/crm">← Contacts</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

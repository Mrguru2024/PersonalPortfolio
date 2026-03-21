"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Loader2, Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";

interface ScriptRow {
  id: number;
  personaId: string;
  category: string;
  name: string;
  status: string;
  updatedAt: string;
}

interface PersonaOpt {
  id: string;
  displayName: string;
}

export default function AscendraScriptsListPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [personaFilter, setPersonaFilter] = useState<string>("all");

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const { data: personasData } = useQuery<{ personas: PersonaOpt[] }>({
    queryKey: ["/api/admin/ascendra-intelligence/personas"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/ascendra-intelligence/personas");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const scriptsUrl =
    personaFilter === "all"
      ? "/api/admin/ascendra-intelligence/scripts"
      : `/api/admin/ascendra-intelligence/scripts?personaId=${encodeURIComponent(personaFilter)}`;

  const { data, isLoading } = useQuery<{ scripts: ScriptRow[] }>({
    queryKey: [scriptsUrl],
    queryFn: async () => {
      const res = await apiRequest("GET", scriptsUrl);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const scripts = data?.scripts ?? [];
  const personas = personasData?.personas ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/ascendra-intelligence">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Hub
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/admin/ascendra-intelligence/scripts/new">
              <Plus className="h-4 w-4 mr-2" />
              New script
            </Link>
          </Button>
        </div>

        <h1 className="text-2xl font-bold flex items-center gap-2 mb-1">
          <FileText className="h-7 w-7 text-primary" />
          Outreach scripts
        </h1>
        <p className="text-muted-foreground text-sm mb-4">Persona-specific templates (warm, cold, follow-up, etc.).</p>

        <div className="mb-6 max-w-xs">
          <Select value={personaFilter} onValueChange={setPersonaFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by persona" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All personas</SelectItem>
              {personas.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : scripts.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-muted-foreground">
              No scripts yet. Create one to store DM, email, or LinkedIn drafts per persona.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {scripts.map((s) => (
              <Link key={s.id} href={`/admin/ascendra-intelligence/scripts/${s.id}`}>
                <Card className="hover:border-primary/40 transition-colors">
                  <CardHeader className="py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <CardTitle className="text-base">{s.name}</CardTitle>
                      <span className="text-xs text-muted-foreground uppercase">{s.status}</span>
                    </div>
                    <CardDescription>
                      {s.category.replace(/_/g, " ")} · {s.personaId} · updated{" "}
                      {new Date(s.updatedAt).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

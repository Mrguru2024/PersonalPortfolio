"use client";

import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, RefreshCw, CloudUpload, AlertTriangle } from "lucide-react";
import { useAuth, isAuthSuperUser } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type EnvSummary = {
  id: string;
  key: string;
  type: string;
  targets: string[];
};

export default function AdminDeploymentEnvPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const isSuperUser = isAuthSuperUser(user);

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(false);
  const [projectRef, setProjectRef] = useState<string | null>(null);
  const [envs, setEnvs] = useState<EnvSummary[]>([]);
  const [banner, setBanner] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [envKey, setEnvKey] = useState("");
  const [envValue, setEnvValue] = useState("");
  const [envType, setEnvType] = useState<"sensitive" | "encrypted" | "plain">("sensitive");
  const [targetProduction, setTargetProduction] = useState(true);
  const [targetPreview, setTargetPreview] = useState(true);
  const [targetDevelopment, setTargetDevelopment] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && !isSuperUser) router.push("/admin/dashboard");
  }, [mounted, user, authLoading, router, isSuperUser]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setBanner(null);
    try {
      const res = await fetch("/api/admin/deployment-env", { credentials: "include" });
      const data = (await res.json().catch(() => ({}))) as {
        configured?: boolean;
        projectRef?: string | null;
        envs?: EnvSummary[];
        message?: string;
        error?: string;
        listError?: string;
      };
      if (!res.ok) {
        throw new Error(data.error || data.message || `HTTP ${res.status}`);
      }
      setConfigured(data.configured === true);
      setProjectRef(typeof data.projectRef === "string" ? data.projectRef : null);
      setEnvs(Array.isArray(data.envs) ? data.envs : []);
      if (data.configured === false && typeof data.message === "string") {
        setBanner(data.message);
      } else if (typeof data.listError === "string" && data.listError.trim()) {
        setBanner(`Could not load the list of saved variables: ${data.listError}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load this page");
      setEnvs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user || !isSuperUser) return;
    void load();
  }, [user, isSuperUser, load]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setBanner(null);
    try {
      const targets: string[] = [];
      if (targetProduction) targets.push("production");
      if (targetPreview) targets.push("preview");
      if (targetDevelopment) targets.push("development");
      await apiRequest("POST", "/api/admin/deployment-env", {
        key: envKey.trim(),
        value: envValue,
        type: envType,
        targets,
      });
      setEnvValue("");
      setBanner(
        "Variable saved on Vercel. Redeploy or wait for the next deployment for the new value to apply in that environment.",
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  /** Never render the form until we have a session that matches super-admin identity (API enforces the same). */
  if (!mounted || authLoading || !user || !isSuperUser) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-8 px-4">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/dashboard">
          <Button variant="ghost" size="icon" type="button" aria-label="Back to dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <CloudUpload className="h-7 w-7" />
            Live site settings (hosting)
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Super-admin only. Add or update a saved name and secret on your host (Vercel). Only names are listed
            here—values stay hidden after you save.{" "}
            <Link href="/admin/integrations" className="underline text-foreground font-medium">
              Connect Facebook, LinkedIn, X, or Threads
            </Link>{" "}
            on Connections &amp; email; use this screen when you already know the exact setting name.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          <span className="ml-2">Refresh</span>
        </Button>
      </div>

      <div className="rounded-lg border border-amber-500/35 bg-amber-500/[0.07] dark:bg-amber-950/25 px-3 py-2.5 text-sm flex gap-2 mb-6">
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-700 dark:text-amber-500 mt-0.5" />
        <div>
          <p className="font-medium text-foreground">Use a private sign-in key for your host</p>
          <p className="text-muted-foreground text-xs mt-1">
            In Vercel create a personal access token at{" "}
            <a href="https://vercel.com/account/tokens" className="underline" target="_blank" rel="noreferrer">
              vercel.com/account/tokens
            </a>{" "}
            that can manage this project. Save it only on this machine or in a private settings file—never in a public
            repository. Save it as <code className="text-xs">VERCEL_API_TOKEN</code> in your private host settings.
          </p>
        </div>
      </div>

      {banner ? (
        <p className="mb-4 text-sm rounded-md border border-border bg-muted/30 px-3 py-2 text-foreground">{banner}</p>
      ) : null}
      {error ? (
        <p className="mb-4 text-sm rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-destructive">
          {error}
        </p>
      ) : null}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Save a variable on the host</CardTitle>
          <CardDescription>
            If the name already exists, its value is replaced.{" "}
            {projectRef ? (
              <>
                Project id: <code className="text-xs">{projectRef}</code>
              </>
            ) : null}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
            <div className="space-y-2">
              <Label htmlFor="deploy-env-key">Name</Label>
              <Input
                id="deploy-env-key"
                placeholder="e.g. FACEBOOK_APP_ID"
                value={envKey}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setEnvKey(e.target.value)}
                autoComplete="off"
                disabled={!configured || saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deploy-env-value">Value</Label>
              <Input
                id="deploy-env-value"
                type="password"
                placeholder="Secret or token"
                value={envValue}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setEnvValue(e.target.value)}
                autoComplete="new-password"
                disabled={!configured || saving}
              />
            </div>
            <div className="space-y-2">
              <Label>Storage type</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={envType}
                onChange={(e) => setEnvType(e.target.value as typeof envType)}
                disabled={!configured || saving}
              >
                <option value="sensitive">Sensitive (recommended)</option>
                <option value="encrypted">Encrypted</option>
                <option value="plain">Plain (avoid for secrets)</option>
              </select>
            </div>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Use on</legend>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={targetProduction}
                  onChange={() => setTargetProduction((v) => !v)}
                  disabled={!configured || saving}
                />
                Production
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={targetPreview}
                  onChange={() => setTargetPreview((v) => !v)}
                  disabled={!configured || saving}
                />
                Preview
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={targetDevelopment}
                  onChange={() => setTargetDevelopment((v) => !v)}
                  disabled={!configured || saving}
                />
                Development
              </label>
            </fieldset>
            <Button type="submit" disabled={!configured || saving || !envKey.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save on host"}
            </Button>
            {!configured ? (
              <p className="text-xs text-muted-foreground">
                Your host needs the Vercel token and project name saved first—see{" "}
                <code className="text-xs">VERCEL_API_TOKEN</code>, <code className="text-xs">VERCEL_PROJECT_ID</code> (or{" "}
                <code className="text-xs">VERCEL_PROJECT_NAME</code>
                ), and <code className="text-xs">VERCEL_TEAM_ID</code> if you use a team. Check the example settings file in
                the project.
              </p>
            ) : null}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Names saved on this project</CardTitle>
          <CardDescription>
            {loading ? "Loading…" : `${envs.length} saved name${envs.length === 1 ? "" : "s"} (values stay hidden)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            </div>
          ) : envs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No variables returned (or none configured yet).</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {envs.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-wrap items-baseline justify-between gap-2 rounded-md border border-border px-3 py-2"
                >
                  <code className="font-medium text-foreground">{row.key}</code>
                  <span className="text-xs text-muted-foreground">
                    {row.type}
                    {row.targets?.length ? ` · ${row.targets.join(", ")}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground mt-6">
        <Link href="/admin/integrations" className="underline">
          Connections &amp; email
        </Link>{" "}
        — try Facebook, LinkedIn, and others after your host has deployed the new values.
      </p>
    </div>
  );
}

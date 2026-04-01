"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, LogIn, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

function withRedirect(base: string, redirect: string | null): string {
  if (!redirect || !redirect.startsWith("/")) return base;
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}redirect=${encodeURIComponent(redirect)}`;
}

export default function SignInHubPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");

  useEffect(() => {
    if (isLoading || !user) return;
    const target = redirect && redirect.startsWith("/") ? redirect : "/dashboard";
    router.replace(target);
  }, [user, isLoading, redirect, router]);

  if (!isLoading && user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-section px-4">
        <p className="text-sm text-muted-foreground">Opening your account…</p>
      </div>
    );
  }

  const clientHref = withRedirect("/portal", redirect);
  const generalHref = withRedirect("/auth", redirect);

  return (
    <div className="flex min-h-screen min-w-0 items-center justify-center bg-gradient-to-br from-slate-50 via-background to-slate-100/80 dark:from-slate-950/40 dark:via-background dark:to-slate-900/30 px-4 py-10">
      <div className="w-full max-w-xl space-y-8">
        <div className="text-center space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-primary">Ascendra Technologies</p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Sign in</h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
            One login for the whole Brand Growth ecosystem. Choose the door that matches why you&apos;re here: active
            client work, community and learning, or the tools you use to run the business.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-1">
          <Card className="border-emerald-500/25 shadow-md">
            <CardHeader className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <Building2 className="h-5 w-5 shrink-0" aria-hidden />
                <CardTitle className="text-lg">Client workspace</CardTitle>
              </div>
              <CardDescription>
                We&apos;re working together on a website, brand, or growth project. View proposals and invoices, see
                updates, and send feedback in one place.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700">
                <Link href={clientHref}>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign in to client workspace
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-1">
              <div className="flex items-center gap-2">
                <LogIn className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                <CardTitle className="text-lg">Community &amp; account</CardTitle>
              </div>
              <CardDescription>
                Community, member resources, courses, and your Ascendra profile. New here? You can register on the next
                screen.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="default" className="w-full">
                <Link href={generalHref}>Sign in or register</Link>
              </Button>
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground border-t pt-4 leading-relaxed">
              Approved founders and internal team: use this sign-in too. After you&apos;re in, your admin dashboard
              and tools appear when your account is set up for it.
            </CardFooter>
          </Card>

          <Card className="border-dashed">
            <CardHeader className="space-y-1 pb-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Shield className="h-4 w-4 shrink-0" aria-hidden />
                <CardTitle className="text-base font-medium">Not sure which to pick?</CardTitle>
              </div>
              <CardDescription className="text-xs leading-relaxed">
                If you&apos;re here for an active engagement with us (quotes, billing, deliverables), use{" "}
                <strong className="text-foreground font-medium">Client workspace</strong>. For everything else,
                including community and founder access, use{" "}
                <Link href={generalHref} className="font-medium text-foreground underline-offset-4 hover:underline">
                  Community &amp; account
                </Link>
                .
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          <Link href="/auth/forgot-password" className="underline underline-offset-4 hover:text-foreground">
            Forgot your password? Reset it here
          </Link>
        </p>
      </div>
    </div>
  );
}

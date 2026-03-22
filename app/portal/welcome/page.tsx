"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Building2, Loader2, LogOut, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

export default function ClientPortalWelcomePage() {
  const { user, isLoading, logoutMutation } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/portal");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-950/40 dark:to-background px-4">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen min-w-0 items-center justify-center bg-gradient-to-br from-emerald-50 via-background to-teal-100/80 dark:from-emerald-950/30 dark:via-background dark:to-teal-950/20 px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md mx-auto">
            <Building2 className="h-6 w-6" aria-hidden />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Welcome</h1>
          <p className="text-sm text-muted-foreground">
            Signed in as <span className="font-medium text-foreground">@{user.username}</span>
          </p>
        </div>

        <Card className="border-emerald-500/20 shadow-lg">
          <CardHeader>
            <CardTitle>No client workspace yet</CardTitle>
            <CardDescription>
              We did not find invoices, proposals, or project records linked to this account. If you are working with
              Ascendra, we may still be setting up your portal — or you may have used a different email.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild variant="outline" className="w-full border-emerald-600/30">
              <Link href="/contact">
                <Mail className="mr-2 h-4 w-4" />
                Contact us
              </Link>
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Wrong place?{" "}
              <Link href="/auth" className="underline font-medium text-foreground hover:no-underline">
                General sign-in
              </Link>{" "}
              is for community and standard access.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 border-t pt-4">
            <Button
              variant="secondary"
              className="w-full"
              disabled={logoutMutation.isPending}
              onClick={() => logoutMutation.mutate()}
            >
              {logoutMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="mr-2 h-4 w-4" />
              )}
              Sign out
            </Button>
            <Button asChild variant="ghost" className="w-full text-muted-foreground">
              <Link href="/portal">Back to client sign-in</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

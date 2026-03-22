"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth, type AuthUser } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Building2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

const loginSchema = z.object({
  username: z.string().min(3, "Username or email must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().default(false),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function ClientPortalLoginPage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [routing, setRouting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "", rememberMe: false },
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem("rememberedUsername");
      if (saved) {
        form.setValue("username", saved, { shouldValidate: false });
        form.setValue("rememberMe", true, { shouldValidate: false });
      }
    } catch {
      /* ignore */
    }
  }, [form]);

  useEffect(() => {
    if (!isLoading && user && !routing) {
      void routeAfterPortalSession(user);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- route once when user appears
  }, [user, isLoading]);

  async function routeAfterPortalSession(u: AuthUser) {
    setRouting(true);
    const redirect = searchParams.get("redirect");
    if (redirect && redirect.startsWith("/")) {
      router.replace(redirect);
      return;
    }
    if (u.isAdmin === true && u.adminApproved === true) {
      router.replace("/admin/dashboard");
      return;
    }
    try {
      const res = await fetch("/api/user/client-portal-eligibility", { credentials: "include" });
      const data = (await res.json()) as { eligible?: boolean };
      router.replace(data.eligible ? "/dashboard" : "/portal/welcome");
    } catch {
      router.replace("/portal/welcome");
    } finally {
      setRouting(false);
    }
  }

  const onSubmit = async (values: LoginFormValues) => {
    setSubmitting(true);
    try {
      if (values.rememberMe) localStorage.setItem("rememberedUsername", values.username);
      else localStorage.removeItem("rememberedUsername");

      const { rememberMe, ...creds } = values;
      const res = await apiRequest("POST", "/api/login", { ...creds, rememberMe });
      const userData = await res.json();
      queryClient.setQueryData(["/api/user"], userData);
      try {
        sessionStorage.setItem(
          "auth_user_cache_v2",
          JSON.stringify({ user: userData, ts: Date.now() }),
        );
      } catch {
        /* ignore */
      }

      toast({
        title: "Signed in",
        description: `Welcome back, ${userData.username ?? "there"}!`,
      });

      const redirect = searchParams.get("redirect");
      if (redirect && redirect.startsWith("/")) {
        router.replace(redirect);
        return;
      }
      if (userData.isAdmin === true && userData.adminApproved === true) {
        router.replace("/admin/dashboard");
        return;
      }
      const el = await fetch("/api/user/client-portal-eligibility", { credentials: "include" });
      const body = (await el.json()) as { eligible?: boolean };
      router.replace(body.eligible ? "/dashboard" : "/portal/welcome");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Please check your credentials and try again";
      let displayMessage = errorMessage;
      try {
        const parsed = JSON.parse(errorMessage) as { message?: string };
        if (parsed.message) displayMessage = parsed.message;
      } catch {
        /* use as-is */
      }
      toast({
        title: "Sign-in failed",
        description: displayMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoading && user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-950/40 dark:to-background px-4">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen min-w-0 items-center justify-center bg-gradient-to-br from-emerald-50 via-background to-teal-100/80 dark:from-emerald-950/30 dark:via-background dark:to-teal-950/20 px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md mx-auto">
            <Building2 className="h-6 w-6" aria-hidden />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Client workspace</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            For <strong className="font-medium text-foreground">paying clients and active projects</strong> — sign in to
            view invoices, proposals, updates, and send feedback. This is separate from community member sign-in and
            admin access.
          </p>
        </div>
        <Card className="border-emerald-500/20 shadow-lg">
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Use the email or username on your Ascendra account.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username or email</FormLabel>
                      <FormControl>
                        <Input placeholder="you@company.com" autoComplete="username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" autoComplete="current-password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <FormField
                    control={form.control}
                    name="rememberMe"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">Remember me</FormLabel>
                      </FormItem>
                    )}
                  />
                  <Button type="button" variant="link" className="px-0 text-sm h-auto" asChild>
                    <Link href="/auth/forgot-password">Forgot password?</Link>
                  </Button>
                </div>
                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    "Sign in to client workspace"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 border-t pt-4 text-center text-xs text-muted-foreground">
            <p>
              <strong className="text-foreground font-medium">Not a client?</strong> Members and community use{" "}
              <Link href="/auth" className="underline font-medium text-foreground hover:no-underline">
                general sign-in
              </Link>
              .
            </p>
            <p>
              <strong className="text-foreground font-medium">Admin or founder?</strong>{" "}
              <Link href="/auth" className="underline font-medium text-foreground hover:no-underline">
                Sign in here
              </Link>{" "}
              for the operations console.
            </p>
            <p>
              <Link href="/login" className="underline hover:no-underline">
                All sign-in options
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

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
import { useAuth } from "@/hooks/use-auth";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(3, "Username or email must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().default(false),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function ClientLoginPage() {
  const { user, loginMutation, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

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
      // ignore
    }
  }, [form]);

  useEffect(() => {
    if (!isLoading && user) {
      const redirect = searchParams.get("redirect") ?? "/dashboard";
      router.push(redirect.startsWith("/") ? redirect : `/dashboard?redirect=${redirect}`);
    }
  }, [user, isLoading, router, searchParams]);

  const onSubmit = async (values: LoginFormValues) => {
    try {
      if (values.rememberMe) localStorage.setItem("rememberedUsername", values.username);
      else localStorage.removeItem("rememberedUsername");
      await loginMutation.mutateAsync({
        username: values.username,
        password: values.password,
        rememberMe: values.rememberMe,
      });
      const redirect = searchParams.get("redirect") ?? "/dashboard";
      router.push(redirect.startsWith("/") ? redirect : "/dashboard");
    } catch {
      // toast handled by mutation
    }
  };

  if (!isLoading && user) return null;

  return (
    <div className="flex min-h-screen min-w-0 items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Client login</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sign in to view your dashboard, proposals, invoices, and project updates.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Use the email or username we have on file for your account.</CardDescription>
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
                        <Input placeholder="Your username or email" {...field} />
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
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-center justify-between">
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
                <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 border-t pt-4">
            <p className="text-xs text-muted-foreground text-center">
              Admin or founder?{" "}
              <Link href="/auth" className="underline font-medium text-foreground hover:no-underline">
                Log in here
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

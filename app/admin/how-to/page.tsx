"use client";

import { useAuth, isAuthSuperUser } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  CircleDollarSign,
  FlaskConical,
  Loader2,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReadAloudButton } from "@/components/admin/ReadAloudButton";
import { HowToGuideIllustration } from "@/components/admin/HowToGuideIllustration";
import {
  ADMIN_HOW_TO_GUIDES,
  adminGuidePlainTextForSpeech,
  allGuidesPlainTextForSpeech,
} from "@/lib/adminHowToGuides";

function RichStep({ text }: { text: string }) {
  const segments = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
  return (
    <>
      {segments.map((seg, i) => {
        if (seg.startsWith("**") && seg.endsWith("**")) {
          return (
            <strong key={i} className="font-medium text-foreground">
              {seg.slice(2, -2)}
            </strong>
          );
        }
        if (seg.startsWith("`") && seg.endsWith("`")) {
          return (
            <code key={i} className="text-xs bg-muted/80 px-1.5 py-0.5 rounded border border-border/60">
              {seg.slice(1, -1)}
            </code>
          );
        }
        return <span key={i}>{seg}</span>;
      })}
    </>
  );
}

export default function AdminHowToPage() {
  const { user, isLoading: authLoading } = useAuth();
  const isSuper = isAuthSuperUser(user);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const allSpeechText = allGuidesPlainTextForSpeech(ADMIN_HOW_TO_GUIDES);

  if (authLoading || !user?.isAdmin || !user?.adminApproved) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="container max-w-4xl py-8 px-4 sm:px-6">
        <Button variant="ghost" size="sm" className="mb-6 -ml-2" asChild>
          <Link href="/admin/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Dashboard
          </Link>
        </Button>

        <header className="mb-10 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="font-normal">
              Admin resources
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
            <BookOpen className="h-8 w-8 sm:h-9 sm:w-9 text-primary shrink-0" aria-hidden />
            How-to & guides
          </h1>
          <p className="text-muted-foreground max-w-2xl text-sm sm:text-base leading-relaxed">
            Short guides for everyday work in Ascendra. Skim <strong className="text-foreground font-medium">when to use</strong> first, then
            follow the steps. Tap <strong className="text-foreground font-medium">Listen</strong> to hear a guide read aloud—the{" "}
            <span className="whitespace-nowrap">gear icon</span> next to it lets you choose this device, cloud (OpenAI), or cloud (Gemini) voices. After you change voice options in{" "}
            <Link href="/admin/settings" className="text-primary underline font-medium">
              Settings
            </Link>
            , the next Listen refreshes automatically.
          </p>
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:items-center">
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" className="gap-2">
                <Link href="/admin/site-directory">
                  <Search className="h-4 w-4 shrink-0" aria-hidden />
                  Search all pages
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="gap-2">
                <Link href="/admin/crm/ltv">
                  <CircleDollarSign className="h-4 w-4 shrink-0" aria-hidden />
                  LTV workspace
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="gap-2">
                <Link href="/admin/how-to/experiments">
                  <FlaskConical className="h-4 w-4 shrink-0" aria-hidden />
                  A/B testing tutorial
                </Link>
              </Button>
            </div>
            <ReadAloudButton
              text={`Ascendra admin how-to guides. ${allSpeechText}`}
              label="Listen to all guides"
              variant="secondary"
              className="w-full sm:w-auto"
            />
          </div>
        </header>

        <div className="grid gap-6 sm:gap-8">
          {ADMIN_HOW_TO_GUIDES.map((g) => {
            const Icon = g.icon;
            const cardSpeech = adminGuidePlainTextForSpeech(g);
            return (
              <Card key={g.id} className="border-border/80 shadow-sm overflow-hidden">
                <CardHeader className="pb-2 space-y-1">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex flex-col sm:flex-row gap-4 min-w-0 flex-1">
                      <HowToGuideIllustration guideId={g.id} className="sm:order-last sm:mt-0.5" />
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="rounded-lg bg-primary/10 p-2 text-primary shrink-0">
                          <Icon className="h-5 w-5" aria-hidden />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <CardTitle className="text-lg sm:text-xl leading-snug">{g.title}</CardTitle>
                          <CardDescription className="text-sm leading-relaxed">{g.description}</CardDescription>
                          <p className="text-xs text-muted-foreground pt-1 border-l-2 border-primary/30 pl-2 mt-2">
                            <span className="font-medium text-foreground/80">When to use this: </span>
                            {g.whenToUse}
                          </p>
                        </div>
                      </div>
                    </div>
                    <ReadAloudButton text={cardSpeech} label="Listen to this guide" className="shrink-0 self-start" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-2 pb-6 sm:pb-7">
                  <ol className="list-decimal list-inside space-y-2.5 text-sm text-muted-foreground leading-relaxed marker:text-primary marker:font-medium">
                    {g.steps.map((step, i) => (
                      <li key={i} className="pl-1">
                        <span className="text-foreground/90">
                          <RichStep text={step} />
                        </span>
                      </li>
                    ))}
                  </ol>
                  {g.tips && g.tips.length > 0 && (
                    <div className="rounded-lg bg-muted/40 border border-border/60 px-3 py-2.5 text-xs text-muted-foreground leading-relaxed">
                      <p className="font-medium text-foreground/90 mb-1">Tips from the team</p>
                      <ul className="list-disc list-inside space-y-1">
                        {g.tips.map((t, i) => (
                          <li key={i}>
                            <RichStep text={t} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <Button asChild size="sm" className="gap-2">
                      <Link href={g.href}>Open</Link>
                    </Button>
                    {g.related?.map((r) => (
                      <Button key={r.href} asChild variant="outline" size="sm">
                        <Link href={r.href}>{r.label}</Link>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {isSuper ?
          <p className="mt-10 text-xs text-muted-foreground text-center max-w-lg mx-auto leading-relaxed">
            Platform tips on individual screens load contextual hints from the server. Developer commands:{" "}
            <code className="text-[10px] bg-muted px-1 py-0.5 rounded">npm run check</code>,{" "}
            <code className="text-[10px] bg-muted px-1 py-0.5 rounded">npm run db:push</code>,{" "}
            <code className="text-[10px] bg-muted px-1 py-0.5 rounded">npm run dev</code> (see AGENTS.md).
          </p>
        : <p className="mt-10 text-xs text-muted-foreground text-center max-w-lg mx-auto leading-relaxed">
            Tips on individual screens come from your workspace settings.
          </p>}
      </div>
    </div>
  );
}

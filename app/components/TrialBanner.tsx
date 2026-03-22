"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { Sparkles } from "lucide-react";
import type { TrialClientSummary } from "@shared/userTrial";

function isTrialSummary(x: unknown): x is TrialClientSummary {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return typeof o.showBanner === "boolean" && typeof o.active === "boolean";
}

/**
 * Fixed strip below the site header while the account trial is active.
 */
export function TrialBanner() {
  const { user, isLoading } = useAuth();
  if (isLoading || !user) return null;

  const trial = user.trial;
  if (!isTrialSummary(trial) || !trial.showBanner || !trial.active || !trial.endsAt) return null;

  const endLabel = format(new Date(trial.endsAt), "MMM d, yyyy");
  const days = trial.daysRemaining ?? 0;
  const dayWord = days === 1 ? "day" : "days";

  return (
    <div
      className="fixed left-0 right-0 z-[55] border-b border-emerald-700/40 bg-emerald-950/92 text-emerald-50 shadow-md backdrop-blur-sm dark:border-emerald-600/40 dark:bg-emerald-950/95 top-[calc(env(safe-area-inset-top,0px)+6.75rem)] fold:top-[calc(env(safe-area-inset-top,0px)+7.25rem)] sm:top-[calc(env(safe-area-inset-top,0px)+7.5rem)] md:top-[calc(env(safe-area-inset-top,0px)+8.5rem)] lg:top-[calc(env(safe-area-inset-top,0px)+9.75rem)]"
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex min-w-0 max-w-4xl flex-col items-center justify-center gap-2 px-2 py-2.5 text-center text-[11px] fold:px-3 fold:text-xs sm:flex-row sm:flex-wrap sm:gap-x-3 sm:gap-y-1 sm:px-4 sm:text-sm">
        <span className="inline-flex max-w-full min-w-0 items-center justify-center gap-1.5 break-words font-medium leading-snug">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-emerald-300" aria-hidden />
          <span>
            You&apos;re on a free trial — <strong className="font-semibold">{days}</strong> {dayWord}{" "}
            left (ends {endLabel}).
          </span>
        </span>
        <span className="flex w-full min-w-0 flex-col items-center gap-1 text-emerald-200/90 fold-open:flex-row fold-open:flex-wrap fold-open:justify-center fold-open:gap-x-2 sm:inline sm:w-auto">
          <Link
            href="/dashboard"
            className="inline-flex min-h-[44px] items-center justify-center font-medium text-white underline-offset-2 hover:underline sm:min-h-0"
          >
            Open your dashboard
          </Link>
          <span className="hidden text-emerald-400/80 fold-open:inline" aria-hidden>
            ·
          </span>
          <Link
            href="/strategy-call"
            className="inline-flex min-h-[44px] items-center justify-center font-medium text-white underline-offset-2 hover:underline sm:min-h-0"
          >
            Book a strategy call
          </Link>
        </span>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Crown, Flame, Gift, Rocket, Sparkles, Star } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { NudgeItem } from "@/components/admin/AdminDailyNudge";

type Quest = {
  id: string;
  label: string;
  href: string;
  xp: number;
  icon: React.ReactNode;
};

const DAILY_BONUS_XP = 40;
const MAX_QUESTS = 5;

function hashTodaySeed(userId: number): number {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  const raw = `${y}-${m}-${day}-${userId}`;
  let h = 0;
  for (let i = 0; i < raw.length; i++) {
    h = (h << 5) - h + raw.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function levelForXp(totalXp: number): number {
  return Math.max(1, Math.floor(totalXp / 400) + 1);
}

function xpFloorForLevel(level: number): number {
  return Math.max(0, (level - 1) * 400);
}

function xpCeilForLevel(level: number): number {
  return level * 400;
}

export function AdminGamificationPanel({
  userId,
  items,
}: {
  userId: number;
  items: NudgeItem[];
}) {
  const [claimed, setClaimed] = useState<Record<string, boolean>>({});
  const [bonusClaimed, setBonusClaimed] = useState(false);
  const [baseXp] = useState<number>(() => 240 + (hashTodaySeed(userId) % 420));
  const [streakDays] = useState<number>(() => 2 + (hashTodaySeed(userId + 17) % 9));

  const quests = useMemo<Quest[]>(() => {
    return items.slice(0, MAX_QUESTS).map((item, i) => ({
      id: item.id,
      label: item.label,
      href: item.href,
      xp: 40 + i * 10,
      icon: item.icon,
    }));
  }, [items]);

  const earnedXp = useMemo(() => {
    return quests.reduce((sum, q) => sum + (claimed[q.id] ? q.xp : 0), 0) + (bonusClaimed ? DAILY_BONUS_XP : 0);
  }, [quests, claimed, bonusClaimed]);

  const totalXp = baseXp + earnedXp;
  const level = levelForXp(totalXp);
  const levelFloor = xpFloorForLevel(level);
  const levelCeil = xpCeilForLevel(level);
  const progressPct = Math.max(0, Math.min(100, ((totalXp - levelFloor) / (levelCeil - levelFloor)) * 100));
  const completedCount = quests.filter((q) => claimed[q.id]).length;
  const allComplete = quests.length > 0 && completedCount === quests.length;

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-background to-secondary/10 shadow-sm overflow-hidden">
      <CardHeader className="pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Rocket className="h-4 w-4 text-primary" />
            Ascendra OS mission mode
          </CardTitle>
          <Badge variant="secondary" className="gap-1">
            <Crown className="h-3.5 w-3.5" />
            Level {level}
          </Badge>
        </div>
        <CardDescription>
          Turn daily admin flow into quests. Complete tasks, claim XP, and keep your streak alive.
        </CardDescription>
      </CardHeader>

      <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4">
        <div className="rounded-lg border border-primary/20 bg-background/80 p-3">
          <div className="flex items-center justify-between gap-2 text-sm mb-2">
            <span className="font-medium text-foreground inline-flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
              {totalXp} XP total
            </span>
            <span className="text-muted-foreground">
              {levelFloor} → {levelCeil}
            </span>
          </div>
          <Progress value={progressPct} className="h-2.5" />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Flame className="h-3.5 w-3.5 text-orange-500" />
              {streakDays}-day streak
            </span>
            <span>{completedCount}/{quests.length} quests complete</span>
          </div>
        </div>

        <div className="space-y-2">
          {quests.map((quest) => {
            const done = !!claimed[quest.id];
            return (
              <div
                key={quest.id}
                className={cn(
                  "rounded-lg border p-2.5 flex items-start justify-between gap-2",
                  done ? "border-emerald-500/40 bg-emerald-500/10" : "border-border bg-background/70",
                )}
              >
                <div className="min-w-0">
                  <Link href={quest.href} className="text-sm font-medium text-foreground hover:underline underline-offset-4">
                    {quest.label}
                  </Link>
                  <div className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1.5">
                    <Star className="h-3 w-3 text-primary" />
                    +{quest.xp} XP
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant={done ? "secondary" : "outline"}
                  className="h-8 shrink-0"
                  onClick={() => setClaimed((prev) => ({ ...prev, [quest.id]: !prev[quest.id] }))}
                >
                  {done ? "Claimed" : "Claim XP"}
                </Button>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button
            type="button"
            size="sm"
            variant={allComplete ? "default" : "outline"}
            className="min-h-[40px]"
            disabled={!allComplete || bonusClaimed}
            onClick={() => setBonusClaimed(true)}
          >
            <Gift className="h-4 w-4 mr-1.5" />
            {bonusClaimed ? "Daily bonus claimed" : `Claim daily bonus (+${DAILY_BONUS_XP} XP)`}
          </Button>
          <span className="text-xs text-muted-foreground">Refreshes each day with new quest focus.</span>
        </div>
      </CardContent>
    </Card>
  );
}


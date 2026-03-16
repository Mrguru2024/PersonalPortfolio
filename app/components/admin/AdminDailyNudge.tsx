"use client";

import Link from "next/link";
import { ChevronRight, FileCheck, MessageSquare, FileText, Users, Target, Receipt, Bell } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface NudgeItem {
  id: string;
  label: string;
  href: string;
  count?: number;
  icon: React.ReactNode;
}

interface AdminDailyNudgeProps {
  items: NudgeItem[];
  onStartTour?: () => void;
  showTourCta?: boolean;
}

export function AdminDailyNudge({ items, onStartTour, showTourCta }: AdminDailyNudgeProps) {
  if (items.length === 0 && !showTourCta) return null;

  return (
    <Card className="border-primary/20 bg-primary/5 shadow-sm overflow-hidden">
      <CardHeader className="pb-2 pt-4 px-4 sm:px-6">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          Suggested for you
        </CardTitle>
        <CardDescription>
          Based on your role and current activity. Tackle these to stay on top.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-4">
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="flex items-center justify-between gap-2 rounded-lg py-2 px-3 -mx-3 hover:bg-primary/10 transition-colors text-sm"
              >
                <span className="flex items-center gap-2">
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                  {item.count != null && item.count > 0 && (
                    <span className="text-muted-foreground">({item.count})</span>
                  )}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
        {showTourCta && onStartTour && (
          <div className="mt-3 pt-3 border-t border-primary/20">
            <Button variant="outline" size="sm" className="w-full rounded-lg" onClick={onStartTour}>
              <Bell className="h-4 w-4 mr-2" />
              Take the guided tour again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** Build nudge list from dashboard counts and role. */
export function buildNudgeItems(opts: {
  pendingAssessments: number;
  totalContacts: number;
  unaccessedResume: number;
  isSuperAdmin: boolean;
}): NudgeItem[] {
  const { pendingAssessments, totalContacts, unaccessedResume, isSuperAdmin } = opts;
  const items: NudgeItem[] = [];

  if (pendingAssessments > 0) {
    items.push({
      id: "assessments",
      label: "Review pending assessments",
      href: "/admin/dashboard",
      count: pendingAssessments,
      icon: <FileCheck className="h-4 w-4 shrink-0 text-primary" />,
    });
  }
  if (totalContacts > 0) {
    items.push({
      id: "contacts",
      label: "Check contact form submissions",
      href: "/admin/dashboard",
      count: totalContacts,
      icon: <MessageSquare className="h-4 w-4 shrink-0 text-primary" />,
    });
  }
  if (unaccessedResume > 0) {
    items.push({
      id: "resume",
      label: "View unaccessed resume requests",
      href: "/admin/dashboard",
      count: unaccessedResume,
      icon: <FileText className="h-4 w-4 shrink-0 text-primary" />,
    });
  }

  items.push(
    {
      id: "crm",
      label: "Open CRM (leads & pipeline)",
      href: "/admin/crm",
      icon: <Users className="h-4 w-4 shrink-0 text-primary" />,
    },
    {
      id: "invoices",
      label: "Manage invoices",
      href: "/admin/invoices",
      icon: <Receipt className="h-4 w-4 shrink-0 text-primary" />,
    }
  );

  if (isSuperAdmin) {
    items.push({
      id: "system",
      label: "System health & logs",
      href: "/admin/system",
      icon: <Bell className="h-4 w-4 shrink-0 text-primary" />,
    });
  }

  return items;
}

"use client";

import Link from "next/link";
import {
  ChevronRight,
  FileCheck,
  MessageSquare,
  FileText,
  Users,
  Target,
  Receipt,
  Bell,
  Inbox,
  Activity,
} from "lucide-react";
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
          Based on your operator focus, inbound signals, and queue depth. Each row opens the right admin screen or dashboard tab.
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

/** First nudge when operator profile role focus is set (drives admin “system” priority). */
const OPERATOR_ROLE_NUDGES: Record<string, NudgeItem> = {
  content: {
    id: "op-focus-content",
    label: "Content focus: Content Studio & calendar",
    href: "/admin/content-studio",
    icon: <FileText className="h-4 w-4 shrink-0 text-primary" />,
  },
  growth_marketing: {
    id: "op-focus-growth",
    label: "Growth & marketing: Growth OS hub",
    href: "/admin/growth-os",
    icon: <Target className="h-4 w-4 shrink-0 text-primary" />,
  },
  client_success: {
    id: "op-focus-cs",
    label: "Client success: CRM tasks & pipeline",
    href: "/admin/crm/tasks",
    icon: <Users className="h-4 w-4 shrink-0 text-primary" />,
  },
  technical: {
    id: "op-focus-tech",
    label: "Technical: integrations & health",
    href: "/admin/integrations",
    icon: <Activity className="h-4 w-4 shrink-0 text-primary" />,
  },
  finance: {
    id: "op-focus-finance",
    label: "Finance: invoices & AR",
    href: "/admin/invoices",
    icon: <Receipt className="h-4 w-4 shrink-0 text-primary" />,
  },
  operations: {
    id: "op-focus-ops",
    label: "Operations: lead intake & delivery",
    href: "/admin/lead-intake",
    icon: <Inbox className="h-4 w-4 shrink-0 text-primary" />,
  },
  leadership: {
    id: "op-focus-lead",
    label: "Leadership: operator profile & priorities",
    href: "/admin/operator-profile",
    icon: <Target className="h-4 w-4 shrink-0 text-primary" />,
  },
  general: {
    id: "op-focus-general",
    label: "My operator profile & AI plan",
    href: "/admin/operator-profile",
    icon: <Target className="h-4 w-4 shrink-0 text-primary" />,
  },
};

const DASHBOARD_TAB = {
  assessments: "/admin/dashboard?tab=assessments#admin-dashboard-inbox-tabs",
  contacts: "/admin/dashboard?tab=contacts#admin-dashboard-inbox-tabs",
} as const;

/** Build nudge list from dashboard counts and role. */
export function buildNudgeItems(opts: {
  pendingAssessments: number;
  totalContacts: number;
  isSuperAdmin: boolean;
  /** From /admin/operator-profile — reorders first suggestion by focus role. */
  operatorRoleFocus?: string | null;
  /** Contacts + assessments created in the last 7 days (surface in lead intake). */
  recentInboundWeekCount?: number;
  /** Contact form rows created in the last 7 days (actionable follow-up). */
  recentContactsWeek?: number;
}): NudgeItem[] {
  const {
    pendingAssessments,
    totalContacts,
    isSuperAdmin,
    operatorRoleFocus,
    recentInboundWeekCount = 0,
    recentContactsWeek = 0,
  } = opts;
  const items: NudgeItem[] = [];
  const focus = (operatorRoleFocus || "general").trim();

  if (pendingAssessments > 0) {
    items.push({
      id: "assessments-pending",
      label: "Review pending assessments",
      href: DASHBOARD_TAB.assessments,
      count: pendingAssessments,
      icon: <FileCheck className="h-4 w-4 shrink-0 text-primary" />,
    });
  }

  if (recentContactsWeek > 0) {
    items.push({
      id: "contacts-recent-week",
      label: "New contact submissions this week",
      href: DASHBOARD_TAB.contacts,
      count: recentContactsWeek,
      icon: <MessageSquare className="h-4 w-4 shrink-0 text-primary" />,
    });
  } else if (totalContacts > 0) {
    items.push({
      id: "contacts-inbox",
      label: "Contact form inbox",
      href: DASHBOARD_TAB.contacts,
      count: totalContacts,
      icon: <MessageSquare className="h-4 w-4 shrink-0 text-primary" />,
    });
  }

  items.push({
    id: "crm",
    label: "Open CRM (leads & pipeline)",
    href: "/admin/crm",
    icon: <Users className="h-4 w-4 shrink-0 text-primary" />,
  });

  if (focus !== "finance") {
    items.push({
      id: "invoices",
      label: "Manage invoices",
      href: "/admin/invoices",
      icon: <Receipt className="h-4 w-4 shrink-0 text-primary" />,
    });
  }

  if (isSuperAdmin) {
    items.push({
      id: "system",
      label: "System health & logs",
      href: "/admin/system",
      icon: <Bell className="h-4 w-4 shrink-0 text-primary" />,
    });
  }

  const roleNudge = OPERATOR_ROLE_NUDGES[focus] ?? OPERATOR_ROLE_NUDGES.general;
  if (roleNudge && !items.some((i) => i.id === roleNudge.id)) {
    items.unshift(roleNudge);
  }

  if (recentInboundWeekCount > 0) {
    items.unshift({
      id: "recent-inbound-week",
      label: "New inbound this week — triage in lead intake",
      href: "/admin/lead-intake",
      count: recentInboundWeekCount,
      icon: <Inbox className="h-4 w-4 shrink-0 text-primary" />,
    });
  }

  return items;
}

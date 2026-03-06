import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { isAdmin } from "@/lib/auth-helpers";
import { db } from "@server/db";
import { websiteAudits } from "@shared/schema";
import type { WebsiteAuditSubmission } from "@shared/websiteAuditSchema";

export const dynamic = "force-dynamic";

type WebsiteAuditAdminMeta = {
  internalNotes?: string;
  updatedAt?: string;
  updatedBy?: string;
};

type WebsiteAuditDataWithMeta = WebsiteAuditSubmission & {
  __admin?: WebsiteAuditAdminMeta;
};

function csvEscape(value: unknown): string {
  if (value == null) return "";
  const text = String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function toCsv(items: (typeof websiteAudits.$inferSelect)[]): string {
  const headers = [
    "id",
    "created_at",
    "updated_at",
    "status",
    "name",
    "email",
    "phone",
    "company",
    "role",
    "website_url",
    "business_type",
    "target_audience",
    "top_challenges",
    "primary_goals",
    "primary_conversion_actions",
    "priority_pages",
    "competitors",
    "target_locations",
    "focus_keywords",
    "cms_platform",
    "custom_stack_details",
    "tracking_tools",
    "has_analytics_access",
    "has_search_console_access",
    "running_ads",
    "ad_platforms",
    "monthly_sessions",
    "current_conversion_rate",
    "can_provide_read_only_access",
    "preferred_timeline",
    "preferred_contact_method",
    "additional_context",
    "internal_notes",
  ];

  const rows = items.map((item) => {
    const auditData =
      item.auditData && typeof item.auditData === "object"
        ? (item.auditData as WebsiteAuditDataWithMeta)
        : ({} as WebsiteAuditDataWithMeta);
    const adminMeta =
      auditData.__admin && typeof auditData.__admin === "object"
        ? auditData.__admin
        : {};

    const values: unknown[] = [
      item.id,
      item.createdAt ? new Date(item.createdAt).toISOString() : "",
      item.updatedAt ? new Date(item.updatedAt).toISOString() : "",
      item.status ?? "new",
      item.name,
      item.email,
      item.phone ?? "",
      item.company ?? "",
      item.role ?? "",
      item.websiteUrl,
      auditData.businessType ?? "",
      auditData.targetAudience ?? "",
      auditData.topChallenges ?? "",
      Array.isArray(auditData.primaryGoals) ? auditData.primaryGoals.join(" | ") : "",
      Array.isArray(auditData.primaryConversionActions)
        ? auditData.primaryConversionActions.join(" | ")
        : "",
      Array.isArray(auditData.priorityPages) ? auditData.priorityPages.join(" | ") : "",
      Array.isArray(auditData.competitors) ? auditData.competitors.join(" | ") : "",
      auditData.targetLocations ?? "",
      Array.isArray(auditData.focusKeywords) ? auditData.focusKeywords.join(" | ") : "",
      auditData.cmsPlatform ?? "",
      auditData.customStackDetails ?? "",
      Array.isArray(auditData.trackingTools) ? auditData.trackingTools.join(" | ") : "",
      auditData.hasAnalyticsAccess ? "Yes" : "No",
      auditData.hasSearchConsoleAccess ? "Yes" : "No",
      auditData.runningAds ? "Yes" : "No",
      Array.isArray(auditData.adPlatforms) ? auditData.adPlatforms.join(" | ") : "",
      auditData.monthlySessions ?? "",
      auditData.currentConversionRate ?? "",
      auditData.canProvideReadOnlyAccess ? "Yes" : "No",
      auditData.preferredTimeline ?? "",
      auditData.preferredContactMethod ?? "",
      auditData.additionalContext ?? "",
      adminMeta.internalNotes ?? "",
    ];

    return values.map(csvEscape).join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

function isMissingTableError(error: unknown): boolean {
  const msg = String(error instanceof Error ? error.message : error).toLowerCase();
  return msg.includes("website_audits") || (msg.includes("relation") && msg.includes("does not exist"));
}

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }

    const items = await db
      .select()
      .from(websiteAudits)
      .orderBy(desc(websiteAudits.id));

    const wantsCsv = req.nextUrl.searchParams.get("format")?.toLowerCase() === "csv";
    if (wantsCsv) {
      const csv = toCsv(items);
      const filename = `website-audits-${new Date().toISOString().slice(0, 10)}.csv`;
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    return NextResponse.json({ items, missingTable: false });
  } catch (error: unknown) {
    if (isMissingTableError(error)) {
      return NextResponse.json({
        items: [],
        missingTable: true,
        message:
          "website_audits table is missing. Run `npm run db:push` to create it.",
      });
    }
    console.error("Error fetching website audits:", error);
    return NextResponse.json(
      { error: "Failed to fetch website audits" },
      { status: 500 }
    );
  }
}

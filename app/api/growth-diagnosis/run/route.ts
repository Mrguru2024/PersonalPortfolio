/**
 * POST /api/growth-diagnosis/run
 * Runs the Growth Diagnosis Engine: crawl → extract → rules → verify → score → report.
 */

import { NextRequest, NextResponse } from "next/server";
import { extractFromHtml, getDefaultUrlsToCrawl } from "@/lib/growth-diagnosis/extract";
import { runRules, rulesToIssues } from "@/lib/growth-diagnosis/rules";
import { verifyIssues, getVerificationSummary } from "@/lib/growth-diagnosis/verification";
import {
  computeCategoryScores,
  computeWebsitePerformanceScore,
  computeStartupWebsiteScore,
  buildSummary,
} from "@/lib/growth-diagnosis/scoring";
import { buildDemoReport } from "@/lib/growth-diagnosis/demo-report";
import type { AuditRequest, ExtractedPage, CrawlTargets, ExtractedPageSummary } from "@/lib/growth-diagnosis/types";
import { db } from "@server/db";
import { growthDiagnosisReports } from "@shared/schema";

const CRAWL_TIMEOUT_MS = 12000;
const MAX_PAGES = 8;

function normalizeAuditUrl(input: string): string {
  let url = input.trim();
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  try {
    const u = new URL(url);
    return u.origin + u.pathname.replace(/\/$/, "") || u.origin + "/";
  } catch {
    return url;
  }
}

async function fetchHtml(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CRAWL_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "AscendraGrowthDiagnosis/1.0 (Website audit tool)" },
      redirect: "follow",
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const url = body?.url ? String(body.url).trim() : "";
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const request: AuditRequest = {
      url: normalizeAuditUrl(url),
      businessType: body?.businessType || undefined,
      primaryGoal: body?.primaryGoal || undefined,
      email: body?.email ? String(body.email).trim() : undefined,
      demoMode: Boolean(body?.demoMode),
    };

    if (request.demoMode) {
      const report = buildDemoReport(request);
      return NextResponse.json({ report });
    }

    const origin = new URL(request.url).origin;
    const urlsToCrawl = getDefaultUrlsToCrawl(origin).slice(0, MAX_PAGES);
    const pages: ExtractedPage[] = [];

    for (const pageUrl of urlsToCrawl) {
      const html = await fetchHtml(pageUrl);
      if (html) {
        pages.push(extractFromHtml(html, pageUrl));
      }
    }

    if (pages.length === 0) {
      const report = buildDemoReport({ ...request, demoMode: true });
      return NextResponse.json({
        report,
        message: "We couldn't reach your site right now. Here's a sample report so you can see what a diagnosis looks like.",
      });
    }

    const ruleResults = runRules(pages);
    const issues = rulesToIssues(ruleResults);
    const verifiedIssues = verifyIssues(issues, pages);

    const categoryScores = computeCategoryScores(verifiedIssues, pages);
    const websitePerformanceScore = computeWebsitePerformanceScore(categoryScores);
    const startupWebsiteScore = computeStartupWebsiteScore(categoryScores);
    const businessProfile = request.businessType as "local_service" | "skilled_trades" | "consultant" | "agency" | "startup_saas" | undefined;
    const summary = buildSummary(
      verifiedIssues,
      categoryScores,
      websitePerformanceScore,
      startupWebsiteScore,
      businessProfile
    );

    const urlsRequested = getDefaultUrlsToCrawl(origin).slice(0, MAX_PAGES);
    const crawlTargets: CrawlTargets = {
      urlsRequested,
      urlsAnalyzed: pages.map((p) => p.url),
      pagesAnalyzed: pages.length,
    };

    const verificationSummary = getVerificationSummary(verifiedIssues);
    const verificationSummaryWithLow = {
      ...verificationSummary,
      lowConfidence: verificationSummary.failed,
    };

    const extractedSummaries: ExtractedPageSummary[] = pages.map((p) => ({
      url: p.url,
      titleLength: p.title?.length ?? 0,
      metaDescLength: p.metaDescription?.length ?? 0,
      h1Count: p.h1Count,
      wordCount: p.wordCount,
      ctaCount: p.ctaButtons.length,
      hasForm: p.hasForm,
      hasPhoneLink: p.hasPhoneLink,
      viewportMeta: p.viewportMeta,
      imageCount: p.imageCount,
      imagesWithAlt: p.imagesWithAlt,
      internalLinks: p.internalLinks,
      hasSchema: p.hasSchema,
      trustSignalCount: p.trustSignals.length,
    }));

    const reportId = `audit-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const report = {
      id: reportId,
      request,
      status: "completed" as const,
      createdAt: new Date().toISOString(),
      pagesAnalyzed: pages.length,
      pages,
      issues: verifiedIssues,
      summary,
      websitePerformanceScore,
      startupWebsiteScore,
      crawlTargets,
      verificationSummary: verificationSummaryWithLow,
      extractedSummaries,
    };

    try {
      await db.insert(growthDiagnosisReports).values({
        reportId,
        url: request.url,
        email: request.email ?? null,
        businessType: request.businessType ?? null,
        primaryGoal: request.primaryGoal ?? null,
        requestPayload: request as unknown as Record<string, unknown>,
        reportPayload: report as unknown as Record<string, unknown>,
        status: "completed",
        pagesAnalyzed: pages.length,
        overallScore: summary.overallScore,
      });
    } catch (persistErr) {
      console.warn("Growth diagnosis report persist failed:", persistErr);
    }

    return NextResponse.json({ report, reportId });
  } catch (e) {
    console.error("Growth diagnosis run error:", e);
    return NextResponse.json(
      { error: "Something went wrong. Please try again or use demo mode." },
      { status: 500 }
    );
  }
}

"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Bot,
  CheckCircle2,
  ClipboardList,
  Eye,
  FileStack,
  LayoutDashboard,
  Lightbulb,
  ListTodo,
  Loader2,
  Megaphone,
  PenLine,
  Rocket,
  Sparkles,
  Users,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useVisitorTracking } from "@/lib/useVisitorTracking";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OperationsSummary {
  newDiagnosticsToReview: number;
  qualifiedLeads: number;
  draftCaseStudies: number;
  publishedCaseStudies: number;
  contentMissingKeyElements: number;
  itemsReadyToPublish: number;
}

interface DiagnosticItem {
  id: number;
  reportId: string;
  businessType: string;
  score: number | null;
  revenueOpportunity: "High" | "Medium" | "Low" | "Unknown";
  recommendedSystem: string;
  recommendedSystemDetail: string | null;
  date: string;
  crmContactId: number | null;
}

interface CaseStudyPipelineItem {
  id: number;
  title: string;
  workflowStatus: string;
  completionScore: number;
  missingElements: string[];
  updatedAt: string;
  publicUrl: string | null;
}

interface PublishingQueueItem {
  id: number;
  title: string;
  status: string;
  seoReadiness: string;
  seoReady: boolean;
  lastUpdated: string;
  publicUrl: string | null;
}

interface LeadItem {
  id: number;
  name: string;
  company: string | null;
  source: string;
  score: number | null;
  estimatedValue: number | null;
  status: string;
  updatedAt: string;
  diagnosticPath: string;
}

interface ContentHealth {
  completionScore: number;
  totalAssets: number;
  issueCounts: {
    missingHeadline: number;
    missingResults: number;
    missingVisuals: number;
    missingCta: number;
    missingSeo: number;
  };
}

interface OperationsDashboardData {
  generatedAt: string;
  summary: OperationsSummary;
  diagnostics: DiagnosticItem[];
  caseStudyPipeline: CaseStudyPipelineItem[];
  publishingQueue: PublishingQueueItem[];
  leads: LeadItem[];
  contentHealth: ContentHealth;
}

function formatOpportunity(estimatedValue: number | null, score: number | null): string {
  if (estimatedValue != null) return `$${(estimatedValue / 100).toLocaleString()}`;
  if (score != null) return `Lead score ${score}`;
  return "—";
}

function toTitleCase(value: string): string {
  return value
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function DashboardHeader() {
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-background">
      <CardHeader>
        <CardTitle className="text-2xl sm:text-3xl">Ascendra Operations Dashboard</CardTitle>
        <p className="text-sm text-muted-foreground">
          Manage diagnostics, proof assets, publishing, and lead activity from one place.
        </p>
        <CardDescription className="text-sm sm:text-base text-muted-foreground">
          Everything you need to track, improve, and convert your business systems — in one place.
        </CardDescription>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Review diagnostics, build proof, and turn insights into revenue.
        </p>
      </CardHeader>
    </Card>
  );
}

interface QuickActionCardsProps {
  onActionClick: (action: string, section: string, metadata?: Record<string, unknown>) => void;
}

export function QuickActionCards({ onActionClick }: QuickActionCardsProps) {
  const actions = [
    {
      title: "Review New Diagnostics",
      description: "Route into fresh growth diagnosis submissions.",
      href: "/admin/lead-intake?tab=growth_diagnosis",
      icon: ClipboardList,
      action: "review_new_diagnostics",
    },
    {
      title: "Create Case Study",
      description: "Open Case Study Studio to draft new proof assets.",
      href: "/admin/content-studio/documents",
      icon: PenLine,
      action: "create_case_study",
    },
    {
      title: "Review Qualified Leads",
      description: "Jump to CRM pipeline for high-intent opportunities.",
      href: "/admin/crm/pipeline",
      icon: Users,
      action: "review_qualified_leads",
    },
    {
      title: "Open Publishing Queue",
      description: "Manage staging and public visibility.",
      href: "/admin/content-studio/calendar",
      icon: Rocket,
      action: "open_publishing_queue",
    },
    {
      title: "Generate Content with AI",
      description: "Open AI-assisted editing inside Case Study Studio.",
      href: "/admin/content-studio/documents",
      icon: Sparkles,
      action: "generate_content_with_ai",
    },
  ] as const;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Quick Actions</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {actions.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.title}
              href={item.href}
              onClick={() => onActionClick(item.action, "quick_actions", { href: item.href })}
              className="rounded-xl border bg-card p-4 hover:border-primary/50 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <Icon className="h-5 w-5 text-primary shrink-0" />
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <h3 className="mt-3 text-sm font-semibold leading-tight">{item.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{item.description}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

interface StatCardsProps {
  summary: OperationsSummary;
}

export function StatCards({ summary }: StatCardsProps) {
  const stats = [
    {
      label: "New Diagnostics to Review",
      value: summary.newDiagnosticsToReview,
      icon: LayoutDashboard,
    },
    {
      label: "Qualified Leads",
      value: summary.qualifiedLeads,
      icon: Users,
    },
    {
      label: "Draft Case Studies",
      value: summary.draftCaseStudies,
      icon: FileStack,
    },
    {
      label: "Published Case Studies",
      value: summary.publishedCaseStudies,
      icon: CheckCircle2,
    },
    {
      label: "Content Missing Key Elements",
      value: summary.contentMissingKeyElements,
      icon: Lightbulb,
    },
    {
      label: "Items Ready to Publish",
      value: summary.itemsReadyToPublish,
      icon: Megaphone,
    },
  ] as const;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Operations Summary</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span>{stat.label}</span>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold tabular-nums">{stat.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

interface DiagnosticsTableProps {
  rows: DiagnosticItem[];
  onCreateFollowUp: (crmContactId: number | null) => void;
  onActionClick: (action: string, section: string, metadata?: Record<string, unknown>) => void;
}

export function DiagnosticsTable({
  rows,
  onCreateFollowUp,
  onActionClick,
}: DiagnosticsTableProps) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold">Recent Diagnostic Activity</h2>
        <p className="text-sm text-muted-foreground">Businesses that need attention or follow-up</p>
      </div>
      <Card>
        <CardContent className="pt-4">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No recent diagnostic submissions found.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business Type</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Revenue Opportunity</TableHead>
                  <TableHead>Recommended System</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{toTitleCase(row.businessType)}</TableCell>
                    <TableCell>{row.score ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={row.revenueOpportunity === "High" ? "destructive" : "secondary"}>
                        {row.revenueOpportunity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="font-medium">{row.recommendedSystem}</p>
                        {row.recommendedSystemDetail ? (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {row.recommendedSystemDetail}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(row.date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap justify-end gap-2">
                        <a
                          href={`/api/admin/growth-diagnosis/reports/${row.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() =>
                            onActionClick("view_breakdown", "diagnostic_activity", { reportId: row.id })
                          }
                        >
                          <Button size="sm" variant="outline">
                            View Breakdown
                          </Button>
                        </a>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={row.crmContactId == null}
                          onClick={() => {
                            onActionClick("mark_for_follow_up", "diagnostic_activity", {
                              crmContactId: row.crmContactId,
                            });
                            onCreateFollowUp(row.crmContactId);
                          }}
                        >
                          Mark for Follow-Up
                        </Button>
                        {row.crmContactId ? (
                          <Link href={`/admin/crm/${row.crmContactId}`}>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                onActionClick("open_lead", "diagnostic_activity", {
                                  crmContactId: row.crmContactId,
                                })
                              }
                            >
                              Open Lead
                            </Button>
                          </Link>
                        ) : null}
                        <a
                          href={`/api/admin/growth-diagnosis/reports/${row.id}/export?format=text`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() =>
                            onActionClick("view_recommendation", "diagnostic_activity", {
                              reportId: row.id,
                            })
                          }
                        >
                          <Button size="sm" variant="outline">
                            View Recommendation
                          </Button>
                        </a>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

interface CaseStudyListProps {
  rows: CaseStudyPipelineItem[];
  onPublish: (documentId: number, publish: boolean) => void;
  onDuplicate: (documentId: number) => void;
  onActionClick: (action: string, section: string, metadata?: Record<string, unknown>) => void;
}

export function CaseStudyList({
  rows,
  onPublish,
  onDuplicate,
  onActionClick,
}: CaseStudyListProps) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold">Case Study Pipeline</h2>
        <p className="text-sm text-muted-foreground">
          Turn work into proof and publishable assets
        </p>
      </div>
      <Card>
        <CardContent className="pt-4 space-y-3">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No case-study items in Content Studio yet. Use “Create Case Study” to start the pipeline.
            </p>
          ) : (
            rows.map((row) => (
              <div key={row.id} className="rounded-lg border p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{row.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Updated {format(new Date(row.updatedAt), "MMM d, yyyy h:mm a")}
                    </p>
                  </div>
                  <Badge variant="outline">{toTitleCase(row.workflowStatus)}</Badge>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium">Completion Score: {row.completionScore}%</span>
                  {row.missingElements.length > 0 ? (
                    <span className="text-muted-foreground">
                      Missing: {row.missingElements.join(", ")}
                    </span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400">All key elements covered</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/admin/content-studio/documents/${row.id}`}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onActionClick("edit_case_study", "case_study_pipeline", { id: row.id })}
                    >
                      Edit
                    </Button>
                  </Link>
                  {row.publicUrl ? (
                    <a href={row.publicUrl} target="_blank" rel="noopener noreferrer">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          onActionClick("preview_case_study", "case_study_pipeline", { id: row.id })
                        }
                      >
                        Preview
                      </Button>
                    </a>
                  ) : (
                    <Link href={`/admin/content-studio/documents/${row.id}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          onActionClick("preview_case_study", "case_study_pipeline", { id: row.id })
                        }
                      >
                        Preview
                      </Button>
                    </Link>
                  )}
                  <Button
                    size="sm"
                    onClick={() => {
                      onActionClick("publish_case_study", "case_study_pipeline", { id: row.id });
                      onPublish(row.id, true);
                    }}
                  >
                    Publish
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      onActionClick("duplicate_case_study", "case_study_pipeline", { id: row.id });
                      onDuplicate(row.id);
                    }}
                  >
                    Duplicate
                  </Button>
                  <Link href={`/admin/content-studio/documents/${row.id}`}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        onActionClick("generate_formats", "case_study_pipeline", { id: row.id })
                      }
                    >
                      Generate Formats
                    </Button>
                  </Link>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </section>
  );
}

interface PublishingPanelProps {
  rows: PublishingQueueItem[];
  onPublish: (documentId: number, publish: boolean) => void;
  onActionClick: (action: string, section: string, metadata?: Record<string, unknown>) => void;
}

export function PublishingPanel({ rows, onPublish, onActionClick }: PublishingPanelProps) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold">Publishing &amp; Public Content</h2>
        <p className="text-sm text-muted-foreground">
          Content ready for public visibility or review
        </p>
      </div>
      <Card>
        <CardContent className="pt-4">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Nothing in the publishing queue yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>SEO Readiness</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const isPublished = row.status === "published";
                  return (
                    <TableRow key={row.id}>
                      <TableCell>{row.title}</TableCell>
                      <TableCell>
                        <Badge variant={isPublished ? "default" : "secondary"}>
                          {toTitleCase(row.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={row.seoReady ? "default" : "outline"}>{row.seoReadiness}</Badge>
                      </TableCell>
                      <TableCell>{format(new Date(row.lastUpdated), "MMM d, yyyy h:mm a")}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap justify-end gap-2">
                          {row.publicUrl ? (
                            <a href={row.publicUrl} target="_blank" rel="noopener noreferrer">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  onActionClick("preview_public_page", "publishing_queue", { id: row.id })
                                }
                              >
                                Preview Public Page
                              </Button>
                            </a>
                          ) : (
                            <Link href={`/admin/content-studio/documents/${row.id}`}>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  onActionClick("preview_public_page", "publishing_queue", { id: row.id })
                                }
                              >
                                Preview Public Page
                              </Button>
                            </Link>
                          )}
                          <Button
                            size="sm"
                            onClick={() => {
                              onActionClick(isPublished ? "unpublish" : "publish", "publishing_queue", {
                                id: row.id,
                              });
                              onPublish(row.id, !isPublished);
                            }}
                          >
                            {isPublished ? "Unpublish" : "Publish"}
                          </Button>
                          <Link href={`/admin/content-studio/documents/${row.id}`}>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onActionClick("edit_document", "publishing_queue", { id: row.id })}
                            >
                              Edit
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

interface LeadPanelProps {
  rows: LeadItem[];
  onUpdateStatus: (leadId: number, status: string) => void;
  onCreateFollowUp: (crmContactId: number | null) => void;
  onActionClick: (action: string, section: string, metadata?: Record<string, unknown>) => void;
}

export function LeadPanel({
  rows,
  onUpdateStatus,
  onCreateFollowUp,
  onActionClick,
}: LeadPanelProps) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold">Leads &amp; Opportunities</h2>
        <p className="text-sm text-muted-foreground">
          High-potential leads from diagnostics and funnels
        </p>
      </div>
      <Card>
        <CardContent className="pt-4">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No lead records available.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead / Business</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Score / Opportunity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{row.name}</p>
                        {row.company ? <p className="text-xs text-muted-foreground">{row.company}</p> : null}
                      </div>
                    </TableCell>
                    <TableCell>{toTitleCase(row.source)}</TableCell>
                    <TableCell>{formatOpportunity(row.estimatedValue, row.score)}</TableCell>
                    <TableCell>
                      <Select
                        value={row.status || "new"}
                        onValueChange={(value) => {
                          onActionClick("update_lead_status", "leads_snapshot", {
                            id: row.id,
                            status: value,
                          });
                          onUpdateStatus(row.id, value);
                        }}
                      >
                        <SelectTrigger className="h-8 w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="contacted">Contacted</SelectItem>
                          <SelectItem value="qualified">Qualified</SelectItem>
                          <SelectItem value="proposal">Proposal</SelectItem>
                          <SelectItem value="negotiation">Negotiation</SelectItem>
                          <SelectItem value="won">Won</SelectItem>
                          <SelectItem value="lost">Lost</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap justify-end gap-2">
                        <Link href={`/admin/crm/${row.id}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onActionClick("view_lead", "leads_snapshot", { id: row.id })}
                          >
                            View Lead
                          </Button>
                        </Link>
                        <a href={row.diagnosticPath} target="_blank" rel="noopener noreferrer">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              onActionClick("open_diagnostic", "leads_snapshot", { id: row.id })
                            }
                          >
                            Open Diagnostic
                          </Button>
                        </a>
                        <Button
                          size="sm"
                          onClick={() => {
                            onActionClick("start_follow_up", "leads_snapshot", { id: row.id });
                            onCreateFollowUp(row.id);
                          }}
                        >
                          Start Follow-Up
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

interface AIActionPanelProps {
  onActionClick: (action: string, section: string, metadata?: Record<string, unknown>) => void;
}

export function AIActionPanel({ onActionClick }: AIActionPanelProps) {
  const aiActions = [
    { label: "Generate Case Study Draft", action: "generate_case_study_draft" },
    { label: "Improve Existing Content", action: "improve_existing_content" },
    { label: "Create Social Posts", action: "create_social_posts" },
    { label: "Generate Email Version", action: "generate_email_version" },
    { label: "Create Proposal Snippet", action: "create_proposal_snippet" },
    { label: "Rewrite CTA", action: "rewrite_cta" },
  ] as const;

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold">AI Content Studio</h2>
        <p className="text-sm text-muted-foreground">
          Create, improve, and repurpose content faster
        </p>
      </div>
      <Card>
        <CardContent className="pt-4">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {aiActions.map((item) => (
              <Link
                key={item.label}
                href="/admin/content-studio/documents"
                className="rounded-lg border p-3 flex items-center justify-between gap-2 hover:border-primary/50 hover:bg-muted/30 transition-colors"
                onClick={() => onActionClick(item.action, "ai_content_tools")}
              >
                <span className="text-sm font-medium">{item.label}</span>
                <Bot className="h-4 w-4 text-primary shrink-0" />
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

interface ContentHealthPanelProps {
  health: ContentHealth;
}

export function ContentHealthPanel({ health }: ContentHealthPanelProps) {
  const issues = [
    { key: "Missing headline", value: health.issueCounts.missingHeadline },
    { key: "Missing results", value: health.issueCounts.missingResults },
    { key: "Missing visuals", value: health.issueCounts.missingVisuals },
    { key: "Missing CTA", value: health.issueCounts.missingCta },
    { key: "Missing SEO", value: health.issueCounts.missingSeo },
  ] as const;

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold">Content Readiness</h2>
        <p className="text-sm text-muted-foreground">
          Identify what&apos;s missing before publishing
        </p>
      </div>
      <Card>
        <CardContent className="pt-4 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Completion score</span>
              <span className="tabular-nums">{health.completionScore}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${Math.max(0, Math.min(100, health.completionScore))}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Based on {health.totalAssets} tracked content asset{health.totalAssets === 1 ? "" : "s"}.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
            {issues.map((issue) => (
              <div key={issue.key} className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">{issue.key}</p>
                <p className="text-lg font-semibold tabular-nums">{issue.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

export default function AscendraOperationsDashboard() {
  const { toast } = useToast();
  const router = useRouter();
  const qc = useQueryClient();
  const { track } = useVisitorTracking();

  const { data, isLoading, isError, refetch } = useQuery<OperationsDashboardData>({
    queryKey: ["/api/admin/operations-dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/admin/operations-dashboard", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load operations dashboard");
      return res.json();
    },
    staleTime: 45_000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    track("page_view", {
      pageVisited: "/admin/dashboard",
      section: "operations_dashboard",
      component: "operations_dashboard",
      metadata: { dashboard: "ascendra_operations" },
    });
  }, [track]);

  const onActionClick = (action: string, section: string, metadata: Record<string, unknown> = {}) => {
    track("cta_click", {
      pageVisited: "/admin/dashboard",
      section,
      component: "operations_dashboard",
      metadata: { action, ...metadata },
    });
    if (section === "diagnostic_activity" && action.startsWith("view_")) {
      track("section_engagement", {
        pageVisited: "/admin/dashboard",
        section: "diagnostic_activity",
        component: "operations_dashboard",
        metadata: { action, ...metadata },
      });
    }
  };

  const followUpMutation = useMutation({
    mutationFn: async (input: { contactId: number; source: "diagnostic" | "lead" }) => {
      const due = new Date();
      due.setDate(due.getDate() + 2);
      const res = await fetch("/api/admin/crm/tasks", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: input.contactId,
          type: "follow_up",
          title: "Follow up on operations dashboard opportunity",
          description:
            input.source === "diagnostic"
              ? "Triggered from Recent Diagnostic Activity."
              : "Triggered from Leads & Opportunities snapshot.",
          priority: "high",
          dueAt: due.toISOString(),
        }),
      });
      if (!res.ok) throw new Error("Could not create follow-up task");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Follow-up task created" });
      qc.invalidateQueries({ queryKey: ["/api/admin/crm/tasks"] });
    },
    onError: (error: Error) =>
      toast({ title: "Follow-up failed", description: error.message, variant: "destructive" }),
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({ leadId, status }: { leadId: number; status: string }) => {
      const res = await fetch(`/api/admin/crm/contacts/${leadId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Lead status update failed");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Lead status updated" });
      qc.invalidateQueries({ queryKey: ["/api/admin/operations-dashboard"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/crm/contacts"] });
    },
    onError: (error: Error) =>
      toast({ title: "Update failed", description: error.message, variant: "destructive" }),
  });

  const publishMutation = useMutation({
    mutationFn: async ({ documentId, publish }: { documentId: number; publish: boolean }) => {
      const res = await fetch(`/api/admin/content-studio/documents/${documentId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowStatus: publish ? "published" : "draft",
          visibility: publish ? "public_visible" : "internal_only",
        }),
      });
      if (!res.ok) throw new Error("Publishing update failed");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Publishing state updated" });
      qc.invalidateQueries({ queryKey: ["/api/admin/operations-dashboard"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/content-studio/documents"] });
    },
    onError: (error: Error) =>
      toast({ title: "Publish action failed", description: error.message, variant: "destructive" }),
  });

  const duplicateMutation = useMutation({
    mutationFn: async (documentId: number) => {
      const sourceRes = await fetch(`/api/admin/content-studio/documents/${documentId}`, {
        credentials: "include",
      });
      if (!sourceRes.ok) throw new Error("Could not load source document");
      const source = (await sourceRes.json()) as {
        document?: {
          title: string;
          contentType: string;
          bodyHtml: string;
          bodyMarkdown: string | null;
          excerpt: string | null;
          tags: string[] | null;
          categories: string[] | null;
          personaTags: string[] | null;
          funnelStage: string | null;
          offerSlug: string | null;
          leadMagnetSlug: string | null;
          campaignId: number | null;
          platformTargets: string[] | null;
          visibility: string;
        };
      };
      if (!source.document) throw new Error("Source document not found");

      const createRes = await fetch("/api/admin/content-studio/documents", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentType: source.document.contentType,
          title: `${source.document.title} (Copy)`,
          bodyHtml: source.document.bodyHtml,
          bodyMarkdown: source.document.bodyMarkdown,
          excerpt: source.document.excerpt,
          tags: source.document.tags ?? [],
          categories: source.document.categories ?? [],
          personaTags: source.document.personaTags ?? [],
          funnelStage: source.document.funnelStage,
          offerSlug: source.document.offerSlug,
          leadMagnetSlug: source.document.leadMagnetSlug,
          campaignId: source.document.campaignId,
          platformTargets: source.document.platformTargets ?? [],
          visibility: source.document.visibility,
          workflowStatus: "draft",
        }),
      });
      if (!createRes.ok) throw new Error("Could not create duplicate");
      return createRes.json() as Promise<{ document: { id: number } }>;
    },
    onSuccess: (data) => {
      toast({ title: "Case study duplicated" });
      qc.invalidateQueries({ queryKey: ["/api/admin/operations-dashboard"] });
      if (data?.document?.id) {
        router.push(`/admin/content-studio/documents/${data.document.id}`);
      }
    },
    onError: (error: Error) =>
      toast({ title: "Duplicate failed", description: error.message, variant: "destructive" }),
  });

  const handleCreateFollowUp = (crmContactId: number | null) => {
    if (!crmContactId) return;
    followUpMutation.mutate({ contactId: crmContactId, source: "diagnostic" });
  };

  const handleCreateLeadFollowUp = (crmContactId: number | null) => {
    if (!crmContactId) return;
    followUpMutation.mutate({ contactId: crmContactId, source: "lead" });
  };

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardContent className="py-12 flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Loading operations dashboard...</span>
        </CardContent>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card className="mb-6 border-destructive/40">
        <CardHeader>
          <CardTitle className="text-base">Operations dashboard unavailable</CardTitle>
          <CardDescription>
            We couldn&apos;t load diagnostics, case studies, and lead snapshots right now.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 mb-8" data-tour="operations-dashboard">
      <DashboardHeader />
      <QuickActionCards onActionClick={onActionClick} />
      <StatCards summary={data.summary} />
      <DiagnosticsTable
        rows={data.diagnostics}
        onCreateFollowUp={handleCreateFollowUp}
        onActionClick={onActionClick}
      />
      <CaseStudyList
        rows={data.caseStudyPipeline}
        onPublish={(documentId, publish) => publishMutation.mutate({ documentId, publish })}
        onDuplicate={(documentId) => duplicateMutation.mutate(documentId)}
        onActionClick={onActionClick}
      />
      <PublishingPanel
        rows={data.publishingQueue}
        onPublish={(documentId, publish) => publishMutation.mutate({ documentId, publish })}
        onActionClick={onActionClick}
      />
      <LeadPanel
        rows={data.leads}
        onUpdateStatus={(leadId, status) => updateLeadMutation.mutate({ leadId, status })}
        onCreateFollowUp={handleCreateLeadFollowUp}
        onActionClick={onActionClick}
      />
      <AIActionPanel onActionClick={onActionClick} />
      <ContentHealthPanel health={data.contentHealth} />
      {(followUpMutation.isPending ||
        updateLeadMutation.isPending ||
        publishMutation.isPending ||
        duplicateMutation.isPending) && (
        <div className="fixed bottom-4 right-4 rounded-lg border bg-card px-3 py-2 shadow-lg text-xs text-muted-foreground inline-flex items-center gap-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Syncing operations update...
        </div>
      )}
    </div>
  );
}

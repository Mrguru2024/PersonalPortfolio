import OpenAI from "openai";
import { z } from "zod";
import {
  ADMIN_OPERATOR_ROLE_LABELS,
  type AdminOperatorIntelligencePayload,
  type AdminOperatorRoleSelection,
} from "@shared/schema";

let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai;
}

const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  rationale: z.string().optional(),
  href: z.string().nullable().optional(),
});

const intelligenceSchema = z.object({
  dailyTasks: z.array(taskSchema).max(8),
  weeklyTasks: z.array(taskSchema).max(10),
  tips: z.array(z.string()).max(8),
});

export interface OperatorIntelligenceContext {
  roleSelection: string;
  mission: string | null;
  vision: string | null;
  goals: string | null;
  taskFocus: string | null;
  dashboardStats: {
    pendingAssessments: number;
    totalContacts: number;
    unaccessedResume: number;
  };
}

function roleLabel(role: string): string {
  return ADMIN_OPERATOR_ROLE_LABELS[role as AdminOperatorRoleSelection] ?? role;
}

function extractJsonObject(raw: string): unknown {
  const t = raw.trim();
  const fenced = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1]!.trim() : t;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("No JSON object in model output");
  return JSON.parse(body.slice(start, end + 1));
}

function normalizeIntelligence(
  parsed: z.infer<typeof intelligenceSchema>,
  source: "openai" | "fallback",
): AdminOperatorIntelligencePayload {
  const cleanHref = (h: string | null | undefined) => {
    if (!h || typeof h !== "string") return null;
    const x = h.trim();
    if (!x.startsWith("/")) return null;
    if (x.length > 200) return null;
    return x;
  };

  return {
    dailyTasks: parsed.dailyTasks.map((t, i) => ({
      id: t.id || `d-${i}`,
      title: t.title.slice(0, 280),
      rationale: t.rationale?.slice(0, 400),
      href: cleanHref(t.href ?? null),
    })),
    weeklyTasks: parsed.weeklyTasks.map((t, i) => ({
      id: t.id || `w-${i}`,
      title: t.title.slice(0, 280),
      rationale: t.rationale?.slice(0, 400),
      href: cleanHref(t.href ?? null),
    })),
    tips: parsed.tips.map((x) => x.slice(0, 400)).filter(Boolean),
    generatedAt: new Date().toISOString(),
    source,
  };
}

function buildFallbackIntelligence(ctx: OperatorIntelligenceContext): AdminOperatorIntelligencePayload {
  const { pendingAssessments, totalContacts, unaccessedResume } = ctx.dashboardStats;
  const role = ctx.roleSelection;
  const daily: AdminOperatorIntelligencePayload["dailyTasks"] = [];
  const weekly: AdminOperatorIntelligencePayload["weeklyTasks"] = [];
  const tips: string[] = [];

  if (pendingAssessments > 0) {
    daily.push({
      id: "assessments",
      title: `Clear or update ${pendingAssessments} pending assessment(s)`,
      href: "/admin/dashboard",
      rationale: "Quotes and pipeline depend on timely review.",
    });
  }
  if (totalContacts > 0) {
    daily.push({
      id: "contacts",
      title: "Review new contact form submissions",
      href: "/admin/dashboard",
      rationale: "Speed to lead improves conversion.",
    });
  }
  if (unaccessedResume > 0) {
    daily.push({
      id: "resume",
      title: `Follow up on ${unaccessedResume} resume request(s)`,
      href: "/admin/dashboard",
    });
  }

  if (role === "content") {
    daily.push({
      id: "blog",
      title: "Draft or schedule one piece of content",
      href: "/admin/blog",
      rationale: "Consistency compounds SEO and trust.",
    });
    weekly.push({
      id: "content-calendar",
      title: "Align blog and newsletter themes for the week",
      href: "/admin/newsletters",
    });
    tips.push("Batch-create outlines on low-meeting days to protect deep work.");
  } else if (role === "growth_marketing") {
    daily.push({
      id: "pipeline",
      title: "Scan CRM for stalled deals and set one follow-up",
      href: "/admin/crm/pipeline",
    });
    weekly.push({
      id: "iq",
      title: "Refresh one persona script or lead magnet in Offer + Persona IQ",
      href: "/admin/ascendra-intelligence",
    });
    tips.push("Pair analytics review (/admin/analytics) with one concrete experiment per week.");
  } else if (role === "client_success") {
    daily.push({
      id: "crm-tasks",
      title: "Complete CRM tasks due today",
      href: "/admin/crm/tasks",
    });
    weekly.push({
      id: "checkins",
      title: "Schedule proactive check-ins for at-risk accounts",
      href: "/admin/crm",
    });
    tips.push("Log outcomes in CRM so handoffs stay accurate.");
  } else if (role === "technical") {
    daily.push({
      id: "integrations",
      title: "Check integrations and error logs",
      href: "/admin/integrations",
    });
    weekly.push({
      id: "system",
      title: "Review system health and dependency updates",
      href: "/admin/system",
    });
    tips.push("Document changes in announcements when users are affected.");
  } else if (role === "finance") {
    daily.push({
      id: "invoices",
      title: "Reconcile invoices and payment status",
      href: "/admin/invoices",
    });
    weekly.push({
      id: "forecast",
      title: "Update cash / AR outlook from open assessments",
      href: "/admin/dashboard",
    });
  } else if (role === "operations") {
    daily.push({
      id: "lead-intake",
      title: "Triage lead intake queue",
      href: "/admin/lead-intake",
    });
    weekly.push({
      id: "delivery",
      title: "Review active project commitments and blockers",
      href: "/admin/dashboard",
    });
  } else if (role === "leadership") {
    daily.push({
      id: "dashboard",
      title: "10-minute dashboard scan: pipeline, content, and alerts",
      href: "/admin/dashboard",
    });
    weekly.push({
      id: "strategy",
      title: "Align team on top 3 outcomes for the week",
      href: "/admin/operator-profile",
    });
    tips.push("Keep mission and weekly goals visible in your operator profile—regenerate the AI plan after big shifts.");
  } else {
    daily.push({
      id: "crm",
      title: "Open CRM and clear one actionable item",
      href: "/admin/crm",
    });
    weekly.push({
      id: "funnel",
      title: "Review funnel content or offers for gaps",
      href: "/admin/funnel",
    });
  }

  if (daily.length < 2) {
    daily.push({
      id: "reminders",
      title: "Review platform reminders and snooze or complete",
      href: "/admin/dashboard",
    });
  }

  weekly.push({
    id: "profile-refresh",
    title: "Update operator profile mission/goals and refresh AI plan",
    href: "/admin/operator-profile",
  });

  tips.push(
    `Focus role: ${roleLabel(role)}. Tune mission, vision, and goals in your profile so AI plans stay aligned.`,
  );

  if (ctx.taskFocus?.trim()) {
    tips.push(`Current focus noted: “${ctx.taskFocus.trim().slice(0, 120)}${ctx.taskFocus.length > 120 ? "…" : ""}”.`);
  }

  return normalizeIntelligence(
    {
      dailyTasks: daily.slice(0, 6),
      weeklyTasks: weekly.slice(0, 6),
      tips: tips.slice(0, 6),
    },
    "fallback",
  );
}

export async function generateOperatorIntelligence(
  ctx: OperatorIntelligenceContext,
): Promise<AdminOperatorIntelligencePayload> {
  const client = getOpenAIClient();
  if (!client) {
    return buildFallbackIntelligence(ctx);
  }

  const statsLine = `Dashboard signals: ${ctx.dashboardStats.pendingAssessments} pending assessments, ${ctx.dashboardStats.totalContacts} contact submissions, ${ctx.dashboardStats.unaccessedResume} unaccessed resume requests.`;

  const profileBlock = [
    `Operator focus role: ${roleLabel(ctx.roleSelection)} (${ctx.roleSelection}).`,
    ctx.mission?.trim() ? `Mission: ${ctx.mission.trim().slice(0, 600)}` : "",
    ctx.vision?.trim() ? `Vision: ${ctx.vision.trim().slice(0, 600)}` : "",
    ctx.goals?.trim() ? `Goals: ${ctx.goals.trim().slice(0, 800)}` : "",
    ctx.taskFocus?.trim() ? `Current priority / context: ${ctx.taskFocus.trim().slice(0, 400)}` : "",
    statsLine,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      max_tokens: 1200,
      messages: [
        {
          role: "system",
          content: `You are an executive assistant for an approved admin of a web agency / growth platform (Ascendra).
Output ONLY valid JSON (no markdown) with this exact shape:
{"dailyTasks":[{"id":"string","title":"string","rationale":"optional","href":"optional string or null"}],"weeklyTasks":[same shape],"tips":["short strings"]}
Rules:
- dailyTasks: 3–5 concrete actions doable today; weeklyTasks: 3–6 for this week.
- href must be an internal admin path starting with /admin when you suggest a destination (e.g. /admin/crm, /admin/blog, /admin/invoices). Use null if none.
- Align tasks with the operator's stated role, mission, vision, goals, and dashboard stats. Prioritize clearing pending work when counts are high.
- tips: 3–5 concise coaching tips (one sentence each).
- Be practical; no generic fluff.`,
        },
        {
          role: "user",
          content: profileBlock,
        },
      ],
    });

    const raw = response.choices[0]?.message?.content || "";
    const json = extractJsonObject(raw);
    const parsed = intelligenceSchema.safeParse(json);
    if (!parsed.success) {
      console.warn("[adminOperatorIntelligence] schema parse failed", parsed.error.flatten());
      return buildFallbackIntelligence(ctx);
    }
    return normalizeIntelligence(parsed.data, "openai");
  } catch (e) {
    console.error("[adminOperatorIntelligence] OpenAI error", e);
    return buildFallbackIntelligence(ctx);
  }
}

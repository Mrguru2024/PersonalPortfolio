import { db } from "@server/db";
import {
  aosAgencyProjects,
  aosHvdRegistry,
  aosTaskEvents,
  aosAgencyTasks,
  AOS_HVD_CATEGORY_SLUGS,
} from "@shared/schema";
import { and, asc, eq } from "drizzle-orm";
import type { AgencyOsProjectCreateInput, AgencyOsTaskCreateInput } from "@shared/agencyOsValidation";
import { isKnownCanonicalHvdSlug } from "@shared/agencyOsValidation";

const BUILT_IN_HVD_ROWS: Array<{
  slug: (typeof AOS_HVD_CATEGORY_SLUGS)[number];
  name: string;
  description: string;
  defaultOutcomeHints: string;
  sortOrder: number;
}> = [
  {
    slug: "market_intelligence",
    name: "Market Intelligence",
    description: "Demand, competition, and context that inform positioning and channel choice.",
    defaultOutcomeHints: "Metric examples: qualified conversations/month, ICP clarity score, share of voice proxy.",
    sortOrder: 10,
  },
  {
    slug: "offer_validation",
    name: "Offer Validation",
    description: "Proof the offer, pricing, and packaging match what the market will buy.",
    defaultOutcomeHints: "Conversion rate on offer page, strategy-call show rate, win rate on proposals.",
    sortOrder: 20,
  },
  {
    slug: "conversion_funnel",
    name: "Conversion Funnel",
    description: "Pages and flows that turn attention into intent and booked conversations.",
    defaultOutcomeHints: "Funnel step conversion %, form→call rate, cost per qualified lead.",
    sortOrder: 30,
  },
  {
    slug: "lead_capture_crm",
    name: "Lead Capture + CRM",
    description: "Capture, attribution, and sales follow-up infrastructure.",
    defaultOutcomeHints: "Lead SLA adherence, pipeline coverage, reply time, CRM hygiene score.",
    sortOrder: 40,
  },
  {
    slug: "traffic_acquisition",
    name: "Traffic Acquisition",
    description: "Paid and organic programs that feed the funnel responsibly.",
    defaultOutcomeHints: "CPQL, ROAS (where applicable), impression share, creative iteration velocity.",
    sortOrder: 50,
  },
  {
    slug: "booking_conversion",
    name: "Booking + Conversion",
    description: "Scheduling, sales calls, and bottom-of-funnel conversion.",
    defaultOutcomeHints: "Booked-call rate, show rate, close rate, average contract value.",
    sortOrder: 60,
  },
  {
    slug: "growth_intelligence",
    name: "Growth Intelligence",
    description: "Reporting, experimentation, and feedback loops for decisions.",
    defaultOutcomeHints: "Dashboard adoption, experiment cycle time, insight-to-action latency.",
    sortOrder: 70,
  },
  {
    slug: "revenue_optimization",
    name: "Revenue Optimization",
    description: "Pricing, LTV, retention, and monetization improvements.",
    defaultOutcomeHints: "LTV:CAC, expansion revenue, churn, invoice collection time.",
    sortOrder: 80,
  },
  {
    slug: "content_authority",
    name: "Content + Authority",
    description: "Trust, proof, and topical authority that support conversion and SEO.",
    defaultOutcomeHints: "Organic clicks, branded search lift, content-assisted conversions.",
    sortOrder: 90,
  },
];

export async function ensureAosHvdBuiltIns(): Promise<void> {
  for (const row of BUILT_IN_HVD_ROWS) {
    const existing = await db
      .select({ id: aosHvdRegistry.id })
      .from(aosHvdRegistry)
      .where(eq(aosHvdRegistry.slug, row.slug))
      .limit(1);
    if (existing[0]) continue;
    await db.insert(aosHvdRegistry).values({
      slug: row.slug,
      name: row.name,
      description: row.description,
      defaultOutcomeHints: row.defaultOutcomeHints,
      sortOrder: row.sortOrder,
      isBuiltIn: true,
      updatedAt: new Date(),
    });
  }
}

export async function listAosHvdRegistry() {
  await ensureAosHvdBuiltIns();
  return db.select().from(aosHvdRegistry).orderBy(asc(aosHvdRegistry.sortOrder), asc(aosHvdRegistry.slug));
}

export async function getAosHvdById(id: number) {
  const rows = await db.select().from(aosHvdRegistry).where(eq(aosHvdRegistry.id, id)).limit(1);
  return rows[0];
}

export async function getAosHvdBySlug(slug: string) {
  const rows = await db.select().from(aosHvdRegistry).where(eq(aosHvdRegistry.slug, slug)).limit(1);
  return rows[0];
}

export async function assertHvdSlugRegistered(slug: string): Promise<void> {
  const row = await getAosHvdBySlug(slug);
  if (!row) {
    throw new Error(`HVD slug "${slug}" is not in the registry. Add it under Agency OS → Value (HVD) or use a built-in category.`);
  }
}

export async function createAosHvdRegistryEntry(input: {
  slug: string;
  name: string;
  description?: string | null;
  defaultOutcomeHints?: string | null;
  sortOrder?: number;
}) {
  await ensureAosHvdBuiltIns();
  const dup = await getAosHvdBySlug(input.slug);
  if (dup) {
    throw new Error(`HVD slug "${input.slug}" already exists.`);
  }
  const [row] = await db
    .insert(aosHvdRegistry)
    .values({
      slug: input.slug,
      name: input.name,
      description: input.description ?? null,
      defaultOutcomeHints: input.defaultOutcomeHints ?? null,
      sortOrder: input.sortOrder ?? 100,
      isBuiltIn: false,
      updatedAt: new Date(),
    })
    .returning();
  return row;
}

export async function updateAosHvdRegistryEntry(
  id: number,
  patch: {
    name?: string;
    description?: string | null;
    defaultOutcomeHints?: string | null;
    sortOrder?: number;
  },
) {
  const existing = await getAosHvdById(id);
  if (!existing) throw new Error("HVD entry not found.");
  const [row] = await db
    .update(aosHvdRegistry)
    .set({
      ...patch,
      updatedAt: new Date(),
    })
    .where(eq(aosHvdRegistry.id, id))
    .returning();
  return row;
}

export async function deleteAosHvdRegistryEntry(id: number) {
  const existing = await getAosHvdById(id);
  if (!existing) throw new Error("HVD entry not found.");
  if (existing.isBuiltIn) {
    throw new Error("Built-in HVD categories cannot be deleted. You can edit their descriptions.");
  }
  await db.delete(aosHvdRegistry).where(eq(aosHvdRegistry.id, id));
}

/** Rough overlap flag: new custom slug matches a canonical key without being that slug. */
export function detectLowValueOrOverlapSlug(slug: string, name: string): { warn: boolean; message?: string } {
  const s = slug.toLowerCase();
  const n = name.toLowerCase();
  if (s.includes("todo") || s.includes("misc") || n.includes("miscellaneous")) {
    return { warn: true, message: "Slug/name looks low-value; tie this HVD to a revenue or pipeline outcome." };
  }
  if (!isKnownCanonicalHvdSlug(s) && BUILT_IN_HVD_ROWS.some((b) => b.name.toLowerCase() === n && b.slug !== s)) {
    return { warn: true, message: "Name matches another category; ensure this isn’t a duplicate intent." };
  }
  return { warn: false };
}

export async function createAgencyProjectFromValidated(
  input: AgencyOsProjectCreateInput,
  createdByUserId: number | null,
) {
  await assertHvdSlugRegistered(input.primaryHvdSlug);
  for (const sec of input.secondaryHvdSlugs ?? []) {
    await assertHvdSlugRegistered(sec);
  }
  const [row] = await db
    .insert(aosAgencyProjects)
    .values({
      name: input.name,
      description: input.description ?? null,
      status: input.status ?? "planning",
      health: "on_track",
      progressPercent: 0,
      primaryHvdSlug: input.primaryHvdSlug,
      secondaryHvdSlugs: input.secondaryHvdSlugs ?? [],
      valueContributions: input.valueContributions,
      expectedOutcome: input.expectedOutcome,
      impactMetric: input.impactMetric,
      dataSource: input.dataSource,
      priority: input.priority ?? "medium",
      ownerUserIds: input.ownerUserIds ?? [],
      linkedCrmAccountId: input.linkedCrmAccountId ?? null,
      linkedCrmContactId: input.linkedCrmContactId ?? null,
      linkedCrmDealId: input.linkedCrmDealId ?? null,
      linkedAgreementId: input.linkedAgreementId ?? null,
      createdByUserId,
      updatedAt: new Date(),
    })
    .returning();
  return row;
}

export async function getAgencyTaskById(id: number) {
  const rows = await db.select().from(aosAgencyTasks).where(eq(aosAgencyTasks.id, id)).limit(1);
  return rows[0];
}

export async function createAgencyTaskFromValidated(
  input: AgencyOsTaskCreateInput,
  createdByUserId: number | null,
) {
  await assertHvdSlugRegistered(input.primaryHvdSlug);
  for (const sec of input.secondaryHvdSlugs ?? []) {
    await assertHvdSlugRegistered(sec);
  }
  const now = new Date();
  let dueAt: Date | null = null;
  if (input.dueAt?.trim()) {
    const d = new Date(input.dueAt.trim());
    if (Number.isNaN(d.getTime())) throw new Error("Invalid due date.");
    dueAt = d;
  }
  const [row] = await db
    .insert(aosAgencyTasks)
    .values({
      projectId: input.projectId ?? null,
      milestoneId: input.milestoneId ?? null,
      title: input.title,
      description: input.description ?? null,
      executionRoleId: input.executionRoleId ?? null,
      assigneeUserId: input.assigneeUserId,
      createdByUserId,
      primaryHvdSlug: input.primaryHvdSlug,
      secondaryHvdSlugs: input.secondaryHvdSlugs ?? [],
      valueContributions: input.valueContributions,
      expectedOutcome: input.expectedOutcome,
      impactMetric: input.impactMetric,
      expectedOutput: input.expectedOutput ?? null,
      sopId: input.sopId ?? null,
      playbookId: input.playbookId ?? null,
      status: "pending_acceptance",
      acceptanceUnderstandingConfirmed: false,
      acceptanceResponsibilityConfirmed: false,
      dueAt,
      updatedAt: now,
    })
    .returning();

  await db.insert(aosTaskEvents).values({
    taskId: row.id,
    eventType: "assigned",
    actorUserId: createdByUserId,
    payload: { assigneeUserId: input.assigneeUserId, title: input.title },
    createdAt: now,
  });

  return row;
}

export type TaskAcceptanceAction = "accept" | "decline" | "clarify";

export async function applyAgencyTaskAcceptance(input: {
  taskId: number;
  actorUserId: number;
  action: TaskAcceptanceAction;
  understandingConfirmed?: boolean;
  responsibilityConfirmed?: boolean;
  declineReason?: string;
  clarificationMessage?: string;
  /** Approved admin may act when not the assignee (small-team operations). */
  actorIsApprovedAdmin: boolean;
}) {
  const task = await getAgencyTaskById(input.taskId);
  if (!task) throw new Error("Task not found.");

  const isAssignee = task.assigneeUserId != null && task.assigneeUserId === input.actorUserId;
  if (!isAssignee && !input.actorIsApprovedAdmin) {
    throw new Error("Only the assignee or an approved admin can respond to this task acceptance request.");
  }

  if (task.status !== "pending_acceptance") {
    if (input.action === "accept") throw new Error("Task is not awaiting acceptance.");
    if (input.action === "decline") throw new Error("Decline is only valid while the task awaits acceptance.");
    if (input.action === "clarify") throw new Error("Clarification can only be requested before the task is active.");
  }

  const now = new Date();

  if (input.action === "accept") {
    if (!input.understandingConfirmed || !input.responsibilityConfirmed) {
      throw new Error("Confirm understanding and responsibility before accepting.");
    }
    await db
      .update(aosAgencyTasks)
      .set({
        status: "active",
        acceptanceUnderstandingConfirmed: true,
        acceptanceResponsibilityConfirmed: true,
        acceptedAt: now,
        acceptedByUserId: input.actorUserId,
        declineReason: null,
        clarificationRequest: null,
        updatedAt: now,
      })
      .where(eq(aosAgencyTasks.id, task.id));
    await db.insert(aosTaskEvents).values({
      taskId: task.id,
      eventType: "accepted",
      actorUserId: input.actorUserId,
      payload: { understandingConfirmed: true, responsibilityConfirmed: true },
      createdAt: now,
    });
    return getAgencyTaskById(task.id);
  }

  if (input.action === "decline") {
    const reason = (input.declineReason ?? "").trim();
    if (reason.length < 3) throw new Error("Provide a short reason for declining.");
    await db
      .update(aosAgencyTasks)
      .set({
        status: "declined",
        declineReason: reason,
        acceptanceUnderstandingConfirmed: false,
        acceptanceResponsibilityConfirmed: false,
        acceptedAt: null,
        acceptedByUserId: null,
        updatedAt: now,
      })
      .where(eq(aosAgencyTasks.id, task.id));
    await db.insert(aosTaskEvents).values({
      taskId: task.id,
      eventType: "declined",
      actorUserId: input.actorUserId,
      payload: { reason },
      createdAt: now,
    });
    return getAgencyTaskById(task.id);
  }

  // clarify
  const msg = (input.clarificationMessage ?? "").trim();
  if (msg.length < 5) throw new Error("Describe what needs clarification (at least a few words).");
  await db
    .update(aosAgencyTasks)
    .set({
      clarificationRequest: msg,
      updatedAt: now,
    })
    .where(eq(aosAgencyTasks.id, task.id));
  await db.insert(aosTaskEvents).values({
    taskId: task.id,
    eventType: "clarification_requested",
    actorUserId: input.actorUserId,
    payload: { message: msg },
    createdAt: now,
  });
  return getAgencyTaskById(task.id);
}

export async function listTaskEvents(taskId: number) {
  return db
    .select()
    .from(aosTaskEvents)
    .where(eq(aosTaskEvents.taskId, taskId))
    .orderBy(asc(aosTaskEvents.createdAt));
}

export async function listAgencyTasks(filters?: { projectId?: number; status?: string }) {
  const conditions = [];
  if (filters?.projectId != null) conditions.push(eq(aosAgencyTasks.projectId, filters.projectId));
  if (filters?.status) conditions.push(eq(aosAgencyTasks.status, filters.status));
  if (conditions.length === 0) {
    return db.select().from(aosAgencyTasks).orderBy(asc(aosAgencyTasks.createdAt));
  }
  return db
    .select()
    .from(aosAgencyTasks)
    .where(and(...conditions))
    .orderBy(asc(aosAgencyTasks.createdAt));
}

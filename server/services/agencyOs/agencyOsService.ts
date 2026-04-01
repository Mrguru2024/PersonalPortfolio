import { db } from "@server/db";
import {
  aosAgencyProjects,
  aosHvdRegistry,
  aosTaskEvents,
  aosAgencyTasks,
  aosExecutionRoles,
  aosUserExecutionRoles,
  aosSops,
  aosPlaybooks,
  aosTrainingModules,
  aosProjectPhases,
  aosDeliveryMilestones,
  users,
  AOS_HVD_CATEGORY_SLUGS,
} from "@shared/schema";
import { and, asc, desc, eq } from "drizzle-orm";
import type {
  AgencyOsExecutionRoleCreateInput,
  AgencyOsExecutionRoleUpdateInput,
  AgencyOsMilestoneCreateInput,
  AgencyOsMilestonePatchInput,
  AgencyOsPhaseCreateInput,
  AgencyOsPlaybookCreateInput,
  AgencyOsPlaybookUpdateInput,
  AgencyOsProjectCreateInput,
  AgencyOsProjectPatchInput,
  AgencyOsSopCreateInput,
  AgencyOsSopUpdateInput,
  AgencyOsTaskCreateInput,
  AgencyOsTrainingCreateInput,
  AgencyOsTrainingUpdateInput,
} from "@shared/agencyOsValidation";
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

const BUILT_IN_EXECUTION_ROLES: Array<{
  key: string;
  label: string;
  description: string;
  responsibilities: string[];
  taskTypes: string[];
  systemsUsed: string[];
  aiFocus: string;
  sortOrder: number;
}> = [
  {
    key: "strategist",
    label: "Strategist",
    description: "Positioning, offer, funnel design, and prioritization.",
    responsibilities: ["Shape outcomes", "Sequence work", "Align to HVD"],
    taskTypes: ["strategy", "scoping", "review"],
    systemsUsed: ["CRM notes", "Analytics"],
    aiFocus: "Research synthesis, hypothesis framing, briefing drafts.",
    sortOrder: 10,
  },
  {
    key: "developer",
    label: "Developer",
    description: "Implementation, integrations, and technical reliability.",
    responsibilities: ["Build", "Test", "Ship safely"],
    taskTypes: ["implementation", "bugfix", "integration"],
    systemsUsed: ["Repo", "CI", "Hosting"],
    aiFocus: "Code assist, test ideas, log analysis.",
    sortOrder: 20,
  },
  {
    key: "designer",
    label: "Designer",
    description: "UX/UI, brand cohesion, and conversion-oriented layouts.",
    responsibilities: ["Layouts", "Components", "Visual QA"],
    taskTypes: ["design", "prototype"],
    systemsUsed: ["Figma", "Design tokens"],
    aiFocus: "Copy layout pairing, accessibility checks.",
    sortOrder: 30,
  },
  {
    key: "copywriter",
    label: "Copywriter",
    description: "Messaging, ads, landing copy, and narrative consistency.",
    responsibilities: ["Draft", "Iterate", "Align to offer"],
    taskTypes: ["copy", "script"],
    systemsUsed: ["Docs", "CMS"],
    aiFocus: "Variant generation, headline testing ideas.",
    sortOrder: 40,
  },
  {
    key: "media_buyer",
    label: "Media buyer",
    description: "Paid channel structure, budgets, and creative iteration.",
    responsibilities: ["Campaign setup", "Optimization", "Reporting hooks"],
    taskTypes: ["ppc", "paid_social"],
    systemsUsed: ["Ads platforms", "Pixels"],
    aiFocus: "Query mining, RSA ideas, audience hypotheses.",
    sortOrder: 50,
  },
  {
    key: "analyst",
    label: "Analyst",
    description: "Measurement, dashboards, and experiment readouts.",
    responsibilities: ["Define metrics", "Validate tracking", "Insight delivery"],
    taskTypes: ["reporting", "experiment_analysis"],
    systemsUsed: ["Analytics", "Sheets", "BI"],
    aiFocus: "Anomaly summaries, SQL/helper queries.",
    sortOrder: 60,
  },
  {
    key: "account_lead",
    label: "Account lead",
    description: "Client rhythm, approvals, and delivery coordination.",
    responsibilities: ["Comms", "Cadence", "Risk surfacing"],
    taskTypes: ["client_sync", "approval"],
    systemsUsed: ["Email", "Calls", "CRM"],
    aiFocus: "Summaries, follow-up drafts.",
    sortOrder: 70,
  },
];

export async function ensureAosExecutionRolesBuiltIns(): Promise<void> {
  for (const row of BUILT_IN_EXECUTION_ROLES) {
    const existing = await db
      .select({ id: aosExecutionRoles.id })
      .from(aosExecutionRoles)
      .where(eq(aosExecutionRoles.key, row.key))
      .limit(1);
    if (existing[0]) continue;
    await db.insert(aosExecutionRoles).values({
      key: row.key,
      label: row.label,
      description: row.description,
      responsibilities: row.responsibilities,
      taskTypes: row.taskTypes,
      systemsUsed: row.systemsUsed,
      aiFocus: row.aiFocus,
      sortOrder: row.sortOrder,
      isBuiltIn: true,
      updatedAt: new Date(),
    });
  }
}

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

export async function listAgencyProjects() {
  return db.select().from(aosAgencyProjects).orderBy(desc(aosAgencyProjects.updatedAt));
}

export async function getAgencyProjectById(id: number) {
  const rows = await db.select().from(aosAgencyProjects).where(eq(aosAgencyProjects.id, id)).limit(1);
  return rows[0];
}

export async function getAgencyProjectDetail(id: number) {
  const project = await getAgencyProjectById(id);
  if (!project) return null;
  const phases = await db
    .select()
    .from(aosProjectPhases)
    .where(eq(aosProjectPhases.projectId, id))
    .orderBy(asc(aosProjectPhases.orderIndex), asc(aosProjectPhases.id));
  const milestones = await db
    .select()
    .from(aosDeliveryMilestones)
    .where(eq(aosDeliveryMilestones.projectId, id))
    .orderBy(asc(aosDeliveryMilestones.sortOrder), asc(aosDeliveryMilestones.id));
  const tasks = await listAgencyTasks({ projectId: id });
  return { project, phases, milestones, tasks };
}

export async function updateAgencyProjectFromValidated(id: number, patch: AgencyOsProjectPatchInput) {
  const existing = await getAgencyProjectById(id);
  if (!existing) throw new Error("Project not found.");
  const [row] = await db
    .update(aosAgencyProjects)
    .set({
      ...patch,
      updatedAt: new Date(),
    })
    .where(eq(aosAgencyProjects.id, id))
    .returning();
  return row;
}

export async function createProjectPhase(projectId: number, input: AgencyOsPhaseCreateInput) {
  const p = await getAgencyProjectById(projectId);
  if (!p) throw new Error("Project not found.");
  const [row] = await db
    .insert(aosProjectPhases)
    .values({
      projectId,
      name: input.name,
      description: input.description ?? null,
      orderIndex: input.orderIndex ?? 0,
      updatedAt: new Date(),
    })
    .returning();
  return row;
}

function parseOptionalDate(raw: string | null | undefined): Date | null {
  if (raw == null || !String(raw).trim()) return null;
  const d = new Date(String(raw).trim());
  if (Number.isNaN(d.getTime())) throw new Error("Invalid date.");
  return d;
}

export async function createDeliveryMilestone(projectId: number, input: AgencyOsMilestoneCreateInput) {
  const p = await getAgencyProjectById(projectId);
  if (!p) throw new Error("Project not found.");
  const dueAt = parseOptionalDate(input.dueAt);
  const [row] = await db
    .insert(aosDeliveryMilestones)
    .values({
      projectId,
      phaseId: input.phaseId ?? null,
      name: input.name,
      description: input.description ?? null,
      dueAt,
      sortOrder: input.sortOrder ?? 0,
      updatedAt: new Date(),
    })
    .returning();
  return row;
}

export async function updateDeliveryMilestone(milestoneId: number, patch: AgencyOsMilestonePatchInput) {
  const rows = await db
    .select()
    .from(aosDeliveryMilestones)
    .where(eq(aosDeliveryMilestones.id, milestoneId))
    .limit(1);
  const existing = rows[0];
  if (!existing) throw new Error("Milestone not found.");
  const dueAt =
    patch.dueAt !== undefined
      ? patch.dueAt === null || patch.dueAt === ""
        ? null
        : parseOptionalDate(patch.dueAt)
      : undefined;
  const [row] = await db
    .update(aosDeliveryMilestones)
    .set({
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.description !== undefined ? { description: patch.description } : {}),
      ...(dueAt !== undefined ? { dueAt } : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.approvalState !== undefined ? { approvalState: patch.approvalState } : {}),
      ...(patch.isBlocked !== undefined ? { isBlocked: patch.isBlocked } : {}),
      ...(patch.phaseId !== undefined ? { phaseId: patch.phaseId } : {}),
      ...(patch.sortOrder !== undefined ? { sortOrder: patch.sortOrder } : {}),
      updatedAt: new Date(),
    })
    .where(eq(aosDeliveryMilestones.id, milestoneId))
    .returning();
  return row;
}

export async function listExecutionRoles() {
  await ensureAosExecutionRolesBuiltIns();
  return db.select().from(aosExecutionRoles).orderBy(asc(aosExecutionRoles.sortOrder), asc(aosExecutionRoles.key));
}

export async function getExecutionRoleById(id: number) {
  const rows = await db.select().from(aosExecutionRoles).where(eq(aosExecutionRoles.id, id)).limit(1);
  return rows[0];
}

export async function createExecutionRoleCustom(input: AgencyOsExecutionRoleCreateInput) {
  await ensureAosExecutionRolesBuiltIns();
  const dup = await db
    .select({ id: aosExecutionRoles.id })
    .from(aosExecutionRoles)
    .where(eq(aosExecutionRoles.key, input.key))
    .limit(1);
  if (dup[0]) throw new Error(`Execution role key "${input.key}" already exists.`);
  const [row] = await db
    .insert(aosExecutionRoles)
    .values({
      key: input.key,
      label: input.label,
      description: input.description ?? null,
      responsibilities: input.responsibilities ?? [],
      taskTypes: input.taskTypes ?? [],
      systemsUsed: input.systemsUsed ?? [],
      aiFocus: input.aiFocus ?? null,
      sortOrder: input.sortOrder ?? 100,
      isBuiltIn: false,
      updatedAt: new Date(),
    })
    .returning();
  return row;
}

export async function updateExecutionRole(id: number, patch: AgencyOsExecutionRoleUpdateInput) {
  const existing = await getExecutionRoleById(id);
  if (!existing) throw new Error("Execution role not found.");
  const [row] = await db
    .update(aosExecutionRoles)
    .set({
      ...patch,
      updatedAt: new Date(),
    })
    .where(eq(aosExecutionRoles.id, id))
    .returning();
  return row;
}

export async function deleteExecutionRole(id: number) {
  const existing = await getExecutionRoleById(id);
  if (!existing) throw new Error("Execution role not found.");
  if (existing.isBuiltIn) throw new Error("Built-in execution roles cannot be deleted.");
  await db.delete(aosExecutionRoles).where(eq(aosExecutionRoles.id, id));
}

export async function listUserExecutionRoleRows(userId: number) {
  return db
    .select({
      id: aosUserExecutionRoles.id,
      userId: aosUserExecutionRoles.userId,
      roleId: aosUserExecutionRoles.roleId,
      createdAt: aosUserExecutionRoles.createdAt,
    })
    .from(aosUserExecutionRoles)
    .where(eq(aosUserExecutionRoles.userId, userId));
}

export async function setUserExecutionRoles(userId: number, roleIds: number[]) {
  await ensureAosExecutionRolesBuiltIns();
  const uniqueRoleIds = [...new Set(roleIds)];
  for (const rid of uniqueRoleIds) {
    const r = await getExecutionRoleById(rid);
    if (!r) throw new Error(`Unknown execution role id ${rid}.`);
  }
  await db.delete(aosUserExecutionRoles).where(eq(aosUserExecutionRoles.userId, userId));
  if (uniqueRoleIds.length === 0) return [];
  const now = new Date();
  await db.insert(aosUserExecutionRoles).values(
    uniqueRoleIds.map((roleId) => ({
      userId,
      roleId,
      createdAt: now,
    })),
  );
  return listUserExecutionRoleRows(userId);
}

export async function listApprovedAdminUsersMinimal() {
  return db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
    })
    .from(users)
    .where(and(eq(users.isAdmin, true), eq(users.adminApproved, true)))
    .orderBy(asc(users.username));
}

export async function listSops() {
  return db.select().from(aosSops).orderBy(desc(aosSops.updatedAt));
}

export async function getSopById(id: number) {
  const rows = await db.select().from(aosSops).where(eq(aosSops.id, id)).limit(1);
  return rows[0];
}

export async function createSop(input: AgencyOsSopCreateInput, createdByUserId: number | null) {
  if (input.primaryHvdSlug) await assertHvdSlugRegistered(input.primaryHvdSlug);
  if (input.executionRoleId) {
    const r = await getExecutionRoleById(input.executionRoleId);
    if (!r) throw new Error("Execution role not found for SOP.");
  }
  const [row] = await db
    .insert(aosSops)
    .values({
      title: input.title,
      purpose: input.purpose,
      executionRoleId: input.executionRoleId ?? null,
      primaryHvdSlug: input.primaryHvdSlug ?? null,
      tools: input.tools ?? [],
      steps: input.steps ?? [],
      mistakes: input.mistakes ?? [],
      qaChecklist: input.qaChecklist ?? [],
      successCriteria: input.successCriteria ?? null,
      status: input.status ?? "draft",
      createdByUserId,
      updatedAt: new Date(),
    })
    .returning();
  return row;
}

export async function updateSop(id: number, patch: AgencyOsSopUpdateInput) {
  const existing = await getSopById(id);
  if (!existing) throw new Error("SOP not found.");
  if (patch.primaryHvdSlug) await assertHvdSlugRegistered(patch.primaryHvdSlug);
  if (patch.executionRoleId) {
    const r = await getExecutionRoleById(patch.executionRoleId);
    if (!r) throw new Error("Execution role not found for SOP.");
  }
  const [row] = await db
    .update(aosSops)
    .set({
      ...patch,
      updatedAt: new Date(),
    })
    .where(eq(aosSops.id, id))
    .returning();
  return row;
}

export async function deleteSop(id: number) {
  const existing = await getSopById(id);
  if (!existing) throw new Error("SOP not found.");
  await db.delete(aosSops).where(eq(aosSops.id, id));
}

export async function listPlaybooks() {
  await ensureAosHvdBuiltIns();
  return db.select().from(aosPlaybooks).orderBy(asc(aosPlaybooks.slug));
}

export async function getPlaybookById(id: number) {
  const rows = await db.select().from(aosPlaybooks).where(eq(aosPlaybooks.id, id)).limit(1);
  return rows[0];
}

export async function getPlaybookBySlug(slug: string) {
  const rows = await db.select().from(aosPlaybooks).where(eq(aosPlaybooks.slug, slug)).limit(1);
  return rows[0];
}

export async function createPlaybookCustom(input: AgencyOsPlaybookCreateInput) {
  await ensureAosHvdBuiltIns();
  if (input.primaryHvdSlug) await assertHvdSlugRegistered(input.primaryHvdSlug);
  const dup = await getPlaybookBySlug(input.slug);
  if (dup) throw new Error(`Playbook slug "${input.slug}" already exists.`);
  const [row] = await db
    .insert(aosPlaybooks)
    .values({
      slug: input.slug,
      title: input.title,
      purpose: input.purpose ?? null,
      primaryHvdSlug: input.primaryHvdSlug ?? null,
      steps: input.steps ?? [],
      isBuiltIn: false,
      updatedAt: new Date(),
    })
    .returning();
  return row;
}

export async function updatePlaybook(id: number, patch: AgencyOsPlaybookUpdateInput) {
  const existing = await getPlaybookById(id);
  if (!existing) throw new Error("Playbook not found.");
  if (patch.primaryHvdSlug) await assertHvdSlugRegistered(patch.primaryHvdSlug);
  const [row] = await db
    .update(aosPlaybooks)
    .set({
      ...patch,
      updatedAt: new Date(),
    })
    .where(eq(aosPlaybooks.id, id))
    .returning();
  return row;
}

export async function deletePlaybook(id: number) {
  const existing = await getPlaybookById(id);
  if (!existing) throw new Error("Playbook not found.");
  if (existing.isBuiltIn) throw new Error("Built-in playbooks cannot be deleted.");
  await db.delete(aosPlaybooks).where(eq(aosPlaybooks.id, id));
}

export async function listTrainingModules() {
  return db.select().from(aosTrainingModules).orderBy(asc(aosTrainingModules.sortOrder), asc(aosTrainingModules.slug));
}

export async function getTrainingModuleById(id: number) {
  const rows = await db.select().from(aosTrainingModules).where(eq(aosTrainingModules.id, id)).limit(1);
  return rows[0];
}

export async function createTrainingModule(input: AgencyOsTrainingCreateInput) {
  if (input.filterHvdSlug) await assertHvdSlugRegistered(input.filterHvdSlug);
  const dup = await db
    .select({ id: aosTrainingModules.id })
    .from(aosTrainingModules)
    .where(eq(aosTrainingModules.slug, input.slug))
    .limit(1);
  if (dup[0]) throw new Error(`Training slug "${input.slug}" already exists.`);
  const [row] = await db
    .insert(aosTrainingModules)
    .values({
      slug: input.slug,
      title: input.title,
      summary: input.summary ?? null,
      contentJson: input.contentJson,
      filterRoleKey: input.filterRoleKey ?? null,
      filterHvdSlug: input.filterHvdSlug ?? null,
      sortOrder: input.sortOrder ?? 0,
      isPublished: input.isPublished ?? true,
      updatedAt: new Date(),
    })
    .returning();
  return row;
}

export async function updateTrainingModule(id: number, patch: AgencyOsTrainingUpdateInput) {
  const existing = await getTrainingModuleById(id);
  if (!existing) throw new Error("Training module not found.");
  if (patch.filterHvdSlug) await assertHvdSlugRegistered(patch.filterHvdSlug);
  const [row] = await db
    .update(aosTrainingModules)
    .set({
      ...patch,
      updatedAt: new Date(),
    })
    .where(eq(aosTrainingModules.id, id))
    .returning();
  return row;
}

export async function deleteTrainingModule(id: number) {
  const existing = await getTrainingModuleById(id);
  if (!existing) throw new Error("Training module not found.");
  await db.delete(aosTrainingModules).where(eq(aosTrainingModules.id, id));
}

/** When false (default), only the assignee may accept/decline/clarify. Set AGENCY_OS_ADMIN_TASK_ACCEPTANCE=1 for admin override. */
export function agencyOsAdminTaskAcceptanceAllowed(): boolean {
  const v = process.env.AGENCY_OS_ADMIN_TASK_ACCEPTANCE?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
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
  /** With AGENCY_OS_ADMIN_TASK_ACCEPTANCE, approved admins may act when not the assignee. */
  actorIsApprovedAdmin: boolean;
}) {
  const task = await getAgencyTaskById(input.taskId);
  if (!task) throw new Error("Task not found.");

  const isAssignee = task.assigneeUserId != null && task.assigneeUserId === input.actorUserId;
  const adminMayOverride = input.actorIsApprovedAdmin && agencyOsAdminTaskAcceptanceAllowed();
  if (!isAssignee && !adminMayOverride) {
    throw new Error(
      agencyOsAdminTaskAcceptanceAllowed()
        ? "Only the assignee or an approved admin can respond to this task acceptance request."
        : "Only the task assignee can accept, decline, or request clarification. Set AGENCY_OS_ADMIN_TASK_ACCEPTANCE=1 to allow any approved admin to act for others.",
    );
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

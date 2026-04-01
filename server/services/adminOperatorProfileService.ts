import { db } from "../db";
import { eq } from "drizzle-orm";
import {
  adminOperatorProfiles,
  ADMIN_OPERATOR_ROLE_OPTIONS,
  type AdminOperatorIntelligencePayload,
  type AdminOperatorProfileRow,
} from "@shared/schema";
import { storage } from "../storage";
import { generateOperatorIntelligence, type OperatorIntelligenceContext } from "./adminOperatorIntelligenceService";

/** Live signals for operator AI plans (same sources as admin dashboard inbox). */
export type OperatorDashboardSignals = {
  pendingAssessments: number;
  totalContacts: number;
  crmContactsCount: number;
};

export async function getOperatorIntelligenceDashboardStats(): Promise<OperatorDashboardSignals> {
  const [assessments, legacyContacts, crmContacts] = await Promise.all([
    storage.getAllAssessments(),
    storage.getAllContacts(),
    storage.getCrmContacts().catch(() => []),
  ]);
  return {
    pendingAssessments: assessments.filter((a) => a.status === "pending").length,
    totalContacts: legacyContacts.length,
    crmContactsCount: crmContacts.length,
  };
}

function mergeDashboardSignals(
  base: OperatorDashboardSignals,
  overrides?: Partial<OperatorDashboardSignals>,
): OperatorDashboardSignals {
  if (!overrides) return base;
  return {
    pendingAssessments:
      overrides.pendingAssessments !== undefined ? overrides.pendingAssessments : base.pendingAssessments,
    totalContacts: overrides.totalContacts !== undefined ? overrides.totalContacts : base.totalContacts,
    crmContactsCount:
      overrides.crmContactsCount !== undefined ? overrides.crmContactsCount : base.crmContactsCount,
  };
}

export type OperatorProfileDTO = {
  userId: number;
  roleSelection: string;
  mission: string | null;
  vision: string | null;
  goals: string | null;
  taskFocus: string | null;
  intelligence: AdminOperatorIntelligencePayload | null;
  updatedAt: string;
};

function isValidRole(r: string): boolean {
  return (ADMIN_OPERATOR_ROLE_OPTIONS as readonly string[]).includes(r);
}

function rowToDTO(r: AdminOperatorProfileRow): OperatorProfileDTO {
  return {
    userId: r.userId,
    roleSelection: r.roleSelection,
    mission: r.mission ?? null,
    vision: r.vision ?? null,
    goals: r.goals ?? null,
    taskFocus: r.taskFocus ?? null,
    intelligence: r.intelligenceJson ?? null,
    updatedAt: r.updatedAt.toISOString(),
  };
}

export async function getOperatorProfile(userId: number): Promise<OperatorProfileDTO | null> {
  const [row] = await db
    .select()
    .from(adminOperatorProfiles)
    .where(eq(adminOperatorProfiles.userId, userId))
    .limit(1);
  return row ? rowToDTO(row) : null;
}

export async function getOrCreateOperatorProfile(userId: number): Promise<OperatorProfileDTO> {
  const existing = await getOperatorProfile(userId);
  if (existing) return existing;

  try {
    await db.insert(adminOperatorProfiles).values({
      userId,
      roleSelection: "general",
      updatedAt: new Date(),
    });
  } catch {
    // concurrent create — row may already exist
  }

  const again = await getOperatorProfile(userId);
  if (again) return again;
  throw new Error("Failed to create operator profile");
}

export async function updateOperatorProfile(
  userId: number,
  patch: Partial<{
    roleSelection: string;
    mission: string | null;
    vision: string | null;
    goals: string | null;
    taskFocus: string | null;
  }>,
): Promise<OperatorProfileDTO> {
  await getOrCreateOperatorProfile(userId);

  const role =
    patch.roleSelection !== undefined && isValidRole(patch.roleSelection)
      ? patch.roleSelection
      : undefined;

  await db
    .update(adminOperatorProfiles)
    .set({
      ...(role !== undefined ? { roleSelection: role } : {}),
      ...(patch.mission !== undefined ? { mission: patch.mission } : {}),
      ...(patch.vision !== undefined ? { vision: patch.vision } : {}),
      ...(patch.goals !== undefined ? { goals: patch.goals } : {}),
      ...(patch.taskFocus !== undefined ? { taskFocus: patch.taskFocus } : {}),
      updatedAt: new Date(),
    })
    .where(eq(adminOperatorProfiles.userId, userId));

  const next = await getOperatorProfile(userId);
  if (!next) throw new Error("Operator profile missing after update");
  return next;
}

export async function saveOperatorIntelligence(
  userId: number,
  payload: AdminOperatorIntelligencePayload,
): Promise<OperatorProfileDTO> {
  await getOrCreateOperatorProfile(userId);

  await db
    .update(adminOperatorProfiles)
    .set({
      intelligenceJson: payload,
      updatedAt: new Date(),
    })
    .where(eq(adminOperatorProfiles.userId, userId));

  const next = await getOperatorProfile(userId);
  if (!next) throw new Error("Operator profile missing after intelligence save");
  return next;
}

export async function refreshOperatorIntelligence(
  userId: number,
  overrides?: Partial<OperatorDashboardSignals>,
): Promise<OperatorProfileDTO> {
  const profile = await getOrCreateOperatorProfile(userId);
  const base = await getOperatorIntelligenceDashboardStats();
  const dashboardStats = mergeDashboardSignals(base, overrides);
  const ctx: OperatorIntelligenceContext = {
    roleSelection: profile.roleSelection,
    mission: profile.mission,
    vision: profile.vision,
    goals: profile.goals,
    taskFocus: profile.taskFocus,
    dashboardStats,
  };
  const intelligence = await generateOperatorIntelligence(ctx);
  return saveOperatorIntelligence(userId, intelligence);
}

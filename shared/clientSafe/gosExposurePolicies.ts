/**
 * Policy-driven client-safe payloads for Growth OS.
 * All public/token routes must use these builders — not ad-hoc field picking.
 */

import type { DataVisibilityTier } from "@shared/accessScope";

export const CLIENT_SAFE_RESOURCE_TYPES = [
  "internal_audit_run",
  "internal_cms_document",
  "internal_editorial_calendar_slice",
  "internal_custom_report",
] as const;

export type ClientSafeResourceType = (typeof CLIENT_SAFE_RESOURCE_TYPES)[number];

export function isClientSafeResourceType(v: string): v is ClientSafeResourceType {
  return (CLIENT_SAFE_RESOURCE_TYPES as readonly string[]).includes(v);
}

/** Explicit allow-lists per resource — keys outside this set must not be copied from internal records. */
export const CLIENT_SAFE_FIELD_ALLOWLISTS: Record<ClientSafeResourceType, string[]> = {
  internal_audit_run: [
    "version",
    "resourceType",
    "resourceId",
    "projectKey",
    "runId",
    "completedAt",
    "overallScore",
    "categories",
    "topActions",
  ],
  internal_cms_document: [
    "version",
    "resourceType",
    "resourceId",
    "title",
    "excerpt",
    "contentType",
    "workflowStatus",
    "visibility",
    "publishedAt",
    "scheduledPublishAt",
    "platformTargets",
    "funnelStage",
  ],
  internal_editorial_calendar_slice: [
    "version",
    "resourceType",
    "resourceId",
    "projectKey",
    "windowLabel",
    "entries",
  ],
  internal_custom_report: [
    "version",
    "resourceType",
    "resourceId",
    "headline",
    "sections",
    "generatedAt",
  ],
};

export interface ClientSafeEnvelope {
  version: 1;
  resourceType: ClientSafeResourceType;
  resourceId: string;
  /** How this payload was classified at build time (informational for clients). */
  dataVisibility: DataVisibilityTier;
  /** live | mock — only for research-derived custom reports when applicable */
  dataProvenance?: "live" | "mock";
  payload: Record<string, unknown>;
}

export function pickAllowlistedPayload(
  resourceType: ClientSafeResourceType,
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const allow = CLIENT_SAFE_FIELD_ALLOWLISTS[resourceType];
  const out: Record<string, unknown> = {};
  for (const key of allow) {
    if (key in raw) out[key] = raw[key];
  }
  return out;
}

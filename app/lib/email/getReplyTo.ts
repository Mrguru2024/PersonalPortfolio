/**
 * Reply-To routing for CRM / lead threads (pure — inject fallback from server env).
 */

export type ReplyToResolution = {
  replyTo: string;
  /** Owner used when present */
  source: "owner" | "fallback";
};

export function resolveReplyToForLead(input: {
  ownerUserEmail: string | null | undefined;
  fallbackReplyTo: string;
}): ReplyToResolution {
  const o = input.ownerUserEmail?.trim();
  if (o && o.includes("@")) {
    return { replyTo: o.toLowerCase(), source: "owner" };
  }
  return { replyTo: input.fallbackReplyTo.trim().toLowerCase(), source: "fallback" };
}

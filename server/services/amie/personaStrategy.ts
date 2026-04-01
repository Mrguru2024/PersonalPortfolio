import type { AmieMarketInput } from "./types";

export type PersonaArchetype = "marcus" | "tasha" | "devon" | "andre" | "general";

export function resolvePersonaArchetype(persona: string): PersonaArchetype {
  const p = persona.toLowerCase();
  if (p.includes("marcus")) return "marcus";
  if (p.includes("tasha")) return "tasha";
  if (p.includes("devon")) return "devon";
  if (p.includes("andre")) return "andre";
  return "general";
}

export function buildPersonaStrategy(input: AmieMarketInput): string {
  const archetype = resolvePersonaArchetype(input.persona);
  const lines: string[] = [];

  switch (archetype) {
    case "marcus":
      lines.push(
        "Marcus profile: prioritize emergency and urgent intent routes.",
        "Lead with call-first CTAs, tap-to-call on mobile, and SLA-backed response times.",
        "Keep landing pages lightweight; proof + proximity + speed beat long education.",
      );
      break;
    case "tasha":
      lines.push(
        "Tasha profile: automate booking and confirmation to reduce admin drag.",
        "Layer retention touches (SMS/email) after first job; emphasize reliability and scheduling control.",
      );
      break;
    case "devon":
      lines.push(
        "Devon profile: use validation funnels — micro-commitments before heavy sales.",
        "MVP lead capture: short diagnostic, sample deliverable, or benchmark request.",
      );
      break;
    case "andre":
      lines.push(
        "Andre profile: authority funnels — thought leadership, case studies, and consultant-grade discovery.",
        "Pair rich content with a sharp conversion path (workshop → strategy call → scoped proposal).",
      );
      break;
    default:
      lines.push(
        `Market selection (${input.persona}) maps to a general ICP — align funnel depth with observed pain and ticket size.`,
        "If pain scores trend high, borrow Marcus-style urgency UX; if long cycles, borrow Andre-style authority content.",
      );
  }

  return lines.join("\n");
}

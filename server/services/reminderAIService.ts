/**
 * AI suggestions for admin reminders: next steps based on reminder context.
 * Optional: requires OPENAI_API_KEY.
 */

import OpenAI from "@server/openai/nodeClient";

let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new Error("OPENAI_API_KEY is not set. AI reminder suggestions are disabled.");
  }
  if (!openai) {
    openai = new OpenAI({ apiKey: key });
  }
  return openai;
}

export interface SuggestNextStepsInput {
  title: string;
  body: string | null;
  relatedType: string | null;
  actionUrl: string | null;
}

export interface SuggestNextStepsResult {
  steps: string[];
  summary: string | null;
}

const FALLBACK_STEPS: Record<string, string[]> = {
  task: ["Open the lead and review the task", "Complete or reschedule the task", "Add a note if blocked"],
  contact: ["Open the contact and check recent activity", "Schedule a follow-up or update the pipeline stage"],
  deal: ["Review the deal in the pipeline", "Update stage or add a note with next steps"],
  discovery: ["Open Discovery workspaces and complete prep or run the call", "Capture fit/readiness and create follow-up tasks"],
  proposal_prep: ["Open Proposal prep and complete the checklist", "Validate scope and send proposal when ready"],
  alert: ["Review unread alerts in CRM", "Take action on high-engagement leads first"],
};

/** Suggest 3–5 next steps for this reminder. Returns static steps when OpenAI is not configured. */
export async function suggestNextStepsForReminder(input: SuggestNextStepsInput): Promise<SuggestNextStepsResult> {
  const type = input.relatedType ?? "general";
  const fallback = FALLBACK_STEPS[type] ?? FALLBACK_STEPS.task;

  if (!process.env.OPENAI_API_KEY?.trim()) {
    return { steps: fallback, summary: null };
  }

  try {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a sales operations assistant. Given an admin reminder (task/alert/follow-up), suggest 3-5 very short, actionable next steps the admin can take in the CRM. Be specific to the platform (e.g. 'Open the lead', 'Complete the discovery checklist'). Output a JSON object with keys: \"steps\" (array of strings, 3-5 items) and \"summary\" (one optional sentence). No markdown, no code fence.",
        },
        {
          role: "user",
          content: `Reminder: ${input.title}. ${input.body ?? ""} Type: ${type}. Action: ${input.actionUrl ?? "—"}. Return JSON: { "steps": ["...", ...], "summary": "..." }.`,
        },
      ],
      temperature: 0.4,
      max_tokens: 400,
    });

    const raw = response.choices[0]?.message?.content?.trim() ?? "";
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "");
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;
    const steps = Array.isArray(parsed.steps)
      ? parsed.steps.filter((x): x is string => typeof x === "string" && x.length > 0)
      : fallback;
    const summary = typeof parsed.summary === "string" ? parsed.summary : null;
    return { steps: steps.length > 0 ? steps : fallback, summary };
  } catch {
    return { steps: fallback, summary: null };
  }
}

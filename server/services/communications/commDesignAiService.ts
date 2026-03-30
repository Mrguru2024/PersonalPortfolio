import OpenAI from "@server/openai/nodeClient";

let client: OpenAI | null = null;

function getClient(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;
  if (!client) client = new OpenAI({ apiKey: key });
  return client;
}

export type CommDesignAiIntent = "subject_lines" | "preheader" | "html_section" | "polish_html";

export interface CommDesignAiInput {
  intent: CommDesignAiIntent;
  designName: string;
  subject: string;
  previewText: string;
  htmlSample: string;
  instruction?: string;
}

export type CommDesignAiResult =
  | { ok: true; lines?: string[]; preheader?: string; html?: string; note?: string }
  | { ok: false; error: string };

/**
 * Phase 2 — AI assist for comm email designs (same stack as blog/newsletter admin).
 */
export async function runCommDesignAssist(input: CommDesignAiInput): Promise<CommDesignAiResult> {
  const c = getClient();
  if (!c) return { ok: false, error: "OPENAI_API_KEY is not configured." };

  const model = process.env.OPENAI_COMM_MODEL?.trim() || "gpt-4o-mini";
  const sample = input.htmlSample.replace(/<[^>]+>/g, " ").slice(0, 4000);

  const system =
    input.intent === "subject_lines" ?
      "You write short, credible email subject lines for B2B/service businesses. No spam triggers, no ALL CAPS, no fake urgency."
    : input.intent === "preheader" ?
      "You write invisible preheader / preview text that complements the subject (not duplicate)."
    : input.intent === "html_section" ?
      "You return concise HTML fragments suitable inside marketing email bodies (paragraphs, one CTA link, lists). No full documents, no style blocks."
    : "You lightly edit HTML for clarity and scannability; keep structure; do not remove merge tokens like {{firstName}}.";

  const userParts = [
    `Design name: ${input.designName}`,
    `Current subject: ${input.subject}`,
    `Current preview: ${input.previewText || "(none)"}`,
    `Body text sample: ${sample}`,
  ];
  if (input.instruction?.trim()) userParts.push(`Extra instruction: ${input.instruction.trim()}`);

  let userPrompt = userParts.join("\n");
  if (input.intent === "subject_lines") {
    userPrompt += "\nReturn JSON: { \"lines\": string[] } with exactly 5 distinct subject lines, each under 80 characters.";
  } else if (input.intent === "preheader") {
    userPrompt += "\nReturn JSON: { \"preheader\": string } under 120 characters.";
  } else if (input.intent === "html_section") {
    userPrompt +=
      "\nReturn JSON: { \"html\": string } with one section (e.g. a short paragraph + optional bullet list + one <a href=\"#\">CTA</a>).";
  } else {
    userPrompt += "\nReturn JSON: { \"html\": string } with the improved full body HTML (keep length similar).";
  }

  try {
    const res = await c.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      temperature: 0.5,
      max_tokens: input.intent === "polish_html" ? 4000 : 800,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userPrompt },
      ],
    });
    const text = res.choices[0]?.message?.content?.trim();
    if (!text) return { ok: false, error: "Empty model response" };
    const parsed = JSON.parse(text) as Record<string, unknown>;
    if (input.intent === "subject_lines") {
      const lines = Array.isArray(parsed.lines) ? parsed.lines.map(String).filter(Boolean).slice(0, 8) : [];
      return { ok: true, lines: lines.length ? lines : undefined, note: lines.length ? undefined : "No lines parsed" };
    }
    if (input.intent === "preheader") {
      const preheader = typeof parsed.preheader === "string" ? parsed.preheader : "";
      return { ok: true, preheader: preheader || undefined };
    }
    const html = typeof parsed.html === "string" ? parsed.html : "";
    return { ok: true, html: html || undefined };
  } catch (e) {
    console.error("[commDesignAi]", e);
    return { ok: false, error: e instanceof Error ? e.message : "AI request failed" };
  }
}

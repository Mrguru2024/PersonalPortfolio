/**
 * Optional OpenAI helpers for scheduling UX (admin + public book page).
 */

export type ParsedAvailabilitySuggestion = {
  rules: Array<{
    dayOfWeek: number;
    startTimeLocal: string;
    endTimeLocal: string;
  }>;
  summary: string;
};

const FALLBACK: ParsedAvailabilitySuggestion = {
  rules: [
    { dayOfWeek: 1, startTimeLocal: "09:00", endTimeLocal: "17:00" },
    { dayOfWeek: 2, startTimeLocal: "09:00", endTimeLocal: "17:00" },
    { dayOfWeek: 3, startTimeLocal: "09:00", endTimeLocal: "17:00" },
    { dayOfWeek: 4, startTimeLocal: "09:00", endTimeLocal: "17:00" },
    { dayOfWeek: 5, startTimeLocal: "09:00", endTimeLocal: "17:00" },
  ],
  summary: "Default weekdays 9–5 (set OPENAI_API_KEY for AI parsing).",
};

export async function aiParseAvailabilityDescription(description: string): Promise<ParsedAvailabilitySuggestion> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key || !description.trim()) return { ...FALLBACK, summary: FALLBACK.summary };

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_SCHEDULING_MODEL?.trim() || "gpt-4o-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              'Return JSON only: {"summary":"string","rules":[{"dayOfWeek":0-6,"startTimeLocal":"HH:mm","endTimeLocal":"HH:mm"}]}. dayOfWeek uses JavaScript convention 0=Sunday … 6=Saturday. Times 24h in local business wall clock.',
          },
          { role: "user", content: description.slice(0, 4000) },
        ],
      }),
    });
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) return { ...FALLBACK, summary: "AI returned empty; using defaults." };
    const parsed = JSON.parse(raw) as ParsedAvailabilitySuggestion;
    if (!parsed.rules?.length) return FALLBACK;
    return parsed;
  } catch {
    return { ...FALLBACK, summary: "AI parse failed; using defaults." };
  }
}

export async function aiBookingAssistantReply(input: {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  meetingTypesSummary: string;
}): Promise<string> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    return "Thanks for your interest. Choose a meeting type and a time on the form, or email us if you need help.";
  }
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_SCHEDULING_MODEL?.trim() || "gpt-4o-mini",
      temperature: 0.4,
      max_tokens: 400,
      messages: [
        {
          role: "system",
          content: `You help visitors pick the right meeting on Ascendra's booking page. Be concise (under 120 words). Meeting types available:\n${input.meetingTypesSummary}\nDo not invent times or URLs; direct them to use the date and time picker.`,
        },
        ...input.messages.map((m) => ({ role: m.role, content: m.content.slice(0, 2000) })),
      ],
    }),
  });
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content?.trim() || "Try selecting a meeting type above, then pick a date.";
}

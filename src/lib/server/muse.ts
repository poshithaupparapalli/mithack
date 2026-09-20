import { z } from "zod";

const extractedEventSchema = z.object({
  title: z.string().min(2),
  date: z.string().regex(/^\d{4}(-\d{2})?(-\d{2})?$/),
  datePrecision: z.enum(["year", "month", "day"]),
  scope: z.enum(["canon", "individual"]),
  category: z.enum(["birth", "marriage", "migration", "death", "milestone", "anecdote"]),
  summary: z.string().min(1),
  people: z.array(z.object({ name: z.string(), relationship: z.string().optional() })).default([]),
  location: z.string().optional(),
  confidence: z.number().min(0).max(1).default(0.65),
});

export const extractionSchema = z.object({ events: z.array(extractedEventSchema).max(12) });
export type ExtractedEvent = z.infer<typeof extractedEventSchema>;

async function museJson<T>(system: string, user: string, schema: z.ZodType<T>): Promise<T | null> {
  const baseUrl = process.env.META_MODEL_BASE_URL ?? "https://api.meta.ai/v1";
  const key = process.env.MODEL_API_KEY;
  if (!key) return null;
  try {
    const response = await fetch(`${baseUrl}/responses`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.META_MUSE_MODEL ?? "muse-spark-1.3-contributor",
        input: [{ role: "system", content: system }, { role: "user", content: user }],
        reasoning: { effort: "high", summary: "auto" },
      }),
    });
    if (!response.ok) return null;
    const payload = await response.json();
    const content = payload.output_text ?? payload.output?.flatMap((item: { content?: { text?: string }[] }) => item.content ?? []).map((item: { text?: string }) => item.text).join("") ?? payload;
    return schema.safeParse(typeof content === "string" ? JSON.parse(content) : content).data ?? null;
  } catch { return null; }
}

export async function extractEvents(text: string, people: { name: string; relationship?: string }[], familyContext: string) {
  const result = await museJson(
    "You extract family-history events from a family memory. Return JSON only with an `events` array. Infer the people implicated by the wording and the supplied relationship graph, even if the contributor did not tag anyone manually. Use only roster names or explicitly mentioned new names. Mark lineage-altering events as scope 'canon'; personal stories as 'individual'. Never invent a date.",
    `Memory:\n${text}\n\nPeople already implicated:\n${JSON.stringify(people)}\n\nFamily roster and relationship graph:\n${familyContext}`,
    extractionSchema,
  );
  if (result) return result.events;
  const year = text.match(/\b(18|19|20)\d{2}\b/)?.[0] ?? String(new Date().getFullYear());
  const lower = text.toLowerCase();
  const category = lower.includes("married") || lower.includes("wedding") ? "marriage" : lower.includes("moved") || lower.includes("immigra") ? "migration" : lower.includes("born") ? "birth" : lower.includes("died") ? "death" : "anecdote";
  return [{ title: text.trim().split(/[.!?\n]/)[0]?.slice(0, 80) || "A family memory", date: year, datePrecision: "year" as const, scope: ["marriage", "migration", "birth", "death"].includes(category) ? "canon" as const : "individual" as const, category, summary: text.trim().slice(0, 500), people, confidence: 0.62 }];
}

export async function interviewerQuestion(question: string, context: string) {
  const result = await museJson(
    "You are Muse, a patient, warm family historian speaking to an elderly person. Ask exactly one short conversational question. No preamble, labels, or robotic language.",
    `Missing detail: ${question}\nFamily context: ${context}`,
    z.object({ question: z.string().min(4).max(400) }),
  );
  return result?.question ?? question;
}

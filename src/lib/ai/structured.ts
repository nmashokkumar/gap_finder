import { generateText, Output } from 'ai';
import { z } from 'zod';
import { groq, GROQ_MODEL } from './groq';

/**
 * Generates a typed structured object via AI SDK v7 generateText + Output.object,
 * with a strict-JSON text fallback if the provider's grammar validator rejects an edge case.
 */
export async function generateStructured<T>(schema: z.ZodType<T>, prompt: string): Promise<T> {
  try {
    const result = await generateText({
      model: groq(GROQ_MODEL),
      output: Output.object({ schema }),
      prompt,
    });
    if (result.output !== undefined && result.output !== null) {
      return result.output;
    }
  } catch {
    // Fall through to plain JSON generation + Zod validation
  }

  const fallback = await generateText({
    model: groq(GROQ_MODEL),
    prompt: `${prompt}\n\nIMPORTANT: Respond with ONLY a valid JSON object matching the required structure. Do not include markdown fences or extra text.`,
  });

  const raw = fallback.text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  const jsonStart = raw.indexOf('{');
  const jsonEnd = raw.lastIndexOf('}');
  const sliced = jsonStart >= 0 && jsonEnd > jsonStart ? raw.slice(jsonStart, jsonEnd + 1) : raw;

  const parsed = JSON.parse(sliced);
  return schema.parse(parsed);
}

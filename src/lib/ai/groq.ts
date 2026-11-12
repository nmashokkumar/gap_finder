import { createGroq } from '@ai-sdk/groq';

if (!process.env.GROQ_API_KEY) {
  console.warn('⚠️ GROQ_API_KEY environment variable is not set.');
}

export const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY || '',
});

/**
 * Primary model configured for this Groq workspace:
 * openai/gpt-oss-120b provides 131k context, structured JSON outputs, and fast inference.
 */
export const GROQ_MODEL = 'openai/gpt-oss-120b';

/**
 * Fast model for quick tasks or fallbacks
 */
export const GROQ_FAST_MODEL = 'openai/gpt-oss-20b';

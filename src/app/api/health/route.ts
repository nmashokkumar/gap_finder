import { NextResponse } from 'next/server';
import { groq, GROQ_MODEL } from '@/lib/ai/groq';
import { generateText } from 'ai';

export async function GET() {
  try {
    const hasKey = Boolean(process.env.GROQ_API_KEY);
    if (!hasKey) {
      return NextResponse.json(
        { ok: false, error: 'GROQ_API_KEY is missing' },
        { status: 500 }
      );
    }

    const { text } = await generateText({
      model: groq(GROQ_MODEL),
      prompt: 'Respond with exactly: OK',
    });

    return NextResponse.json({
      ok: true,
      groqConfigured: true,
      model: GROQ_MODEL,
      response: text.trim(),
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to connect to Groq';
    return NextResponse.json(
      {
        ok: false,
        groqConfigured: false,
        error: message,
      },
      { status: 500 }
    );
  }
}

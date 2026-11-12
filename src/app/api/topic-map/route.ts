import { NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { z } from 'zod';
import { groq, GROQ_MODEL } from '@/lib/ai/groq';

const topicMapSchema = z.object({
  topics: z.array(
    z.object({
      id: z.string().describe('Unique kebab-case ID, e.g. supervised-learning'),
      name: z.string().describe('Topic title'),
      subtopics: z.array(z.string()).describe('List of 2-4 subtopics'),
      examFrequency: z.enum(['High', 'Medium', 'Low']).describe('Exam weightage based on past papers'),
      linkedQuestions: z.array(z.string()).describe('Matching past paper questions or exam themes'),
      description: z.string().describe('Brief 1-sentence topic summary'),
    })
  ),
});

export async function POST(req: Request) {
  try {
    const { syllabusText, pastPapersText } = await req.json();

    if (!syllabusText || !syllabusText.trim()) {
      return NextResponse.json(
        { ok: false, error: 'Syllabus text is required' },
        { status: 400 }
      );
    }

    const prompt = `
You are an expert AI curriculum architect for an EdTech diagnostic system.
Analyze the following course Syllabus and Past Examination Papers.

Task:
1. Break down the syllabus into 4 to 6 main topics with their respective subtopics.
2. Cross-reference each topic against the Past Exam Papers to determine its exam frequency (High, Medium, or Low).
3. Extract any specific past-paper question references that belong to each topic.

Syllabus:
"""
${syllabusText.slice(0, 4000)}
"""

Past Examination Papers:
"""
${(pastPapersText || '').slice(0, 3000)}
"""
`;

    const { object } = await generateObject({
      model: groq(GROQ_MODEL),
      schema: topicMapSchema,
      prompt,
    });

    return NextResponse.json({
      ok: true,
      topics: object.topics,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate topic map';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

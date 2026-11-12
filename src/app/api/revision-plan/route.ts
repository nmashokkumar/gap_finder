import { NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { z } from 'zod';
import { groq, GROQ_MODEL } from '@/lib/ai/groq';
import { GapReport, RevisionPlan, TextChunk } from '@/types';
import { retrieveTopK } from '@/lib/rag/retriever';

const planSchema = z.object({
  days: z.array(
    z.object({
      day: z.number().int().min(1),
      theme: z.string().describe('Short clear focus title for the day'),
      allocatedHours: z.number(),
      tasks: z.array(
        z.object({
          id: z.string(),
          topicName: z.string(),
          activity: z.string().describe('Specific study action addressing the diagnostic gap'),
          durationMinutes: z.number().int().min(10),
          sourceReference: z.string().describe('Exact section/page from the provided source citations'),
        })
      ),
    })
  ),
});

export async function POST(req: Request) {
  try {
    const { gapReport, totalDays = 5, hoursPerDay = 2, chunks = [] } = (await req.json()) as {
      gapReport: GapReport;
      totalDays: number;
      hoursPerDay: number;
      chunks?: TextChunk[];
    };

    if (!gapReport || !gapReport.gaps || gapReport.gaps.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Gap Report is required to build a revision plan' },
        { status: 400 }
      );
    }

    const clampedDays = Math.min(Math.max(Number(totalDays) || 3, 1), 14);
    const clampedHours = Math.min(Math.max(Number(hoursPerDay) || 2, 0.5), 8);

    // Retrieve exact section references for each topic in the gap report
    const topicsWithRefs = gapReport.gaps.map((g) => {
      const topChunks = chunks.length > 0 ? retrieveTopK(g.topicName, chunks, 2) : [];
      const refs = topChunks.map(
        (c) => `${c.sectionLabel}${c.pageNumber ? ` (Page ${c.pageNumber})` : ''}`
      );
      return {
        topicName: g.topicName,
        strength: g.strength.toUpperCase(),
        accuracy: `${g.accuracyPercentage}%`,
        examFrequency: g.examFrequency,
        reason: g.diagnosticReason,
        availableReferences: refs.length > 0 ? refs : ['Uploaded Study Notes'],
      };
    });

    const { object } = await generateObject({
      model: groq(GROQ_MODEL),
      schema: planSchema,
      prompt: `
You are an expert study coach creating a personalized, time-boxed revision plan.

Student Schedule Budget:
- Total Days: ${clampedDays} days
- Study Time Per Day: ${clampedHours} hours (${Math.round(clampedHours * 60)} minutes/day)

Prioritization Rules (CRITICAL):
1. WEAK topics (<50%) with HIGH exam frequency MUST appear on Day 1 and receive the largest share of study minutes.
2. MEDIUM topics come next for targeted reinforcement.
3. STRONG topics (>=80%) only get brief rapid-recall checks near the end so the student stops wasting time on what they already know.
4. Every task's durationMinutes in a day should sum closely to ${Math.round(clampedHours * 60)} minutes.
5. Use the exact availableReferences provided for each topic as sourceReference.

Student Gap Diagnosis (already sorted by priority):
${JSON.stringify(topicsWithRefs, null, 2)}
`,
    });

    const plan: RevisionPlan = {
      id: `plan-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      totalDays: clampedDays,
      hoursPerDay: clampedHours,
      days: object.days.slice(0, clampedDays),
    };

    return NextResponse.json({ ok: true, plan });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate revision plan';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

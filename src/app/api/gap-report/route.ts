import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generateStructured } from '@/lib/ai/structured';
import { GapReport, QuizAttempt, TopicGap, TopicNode } from '@/types';

const reasonsSchema = z.object({
  topicDiagnostics: z.array(
    z.object({
      topicId: z.string(),
      diagnosticReason: z
        .string()
        .describe('One crisp, specific sentence explaining what the student missed or mastered in this topic'),
    })
  ),
});

export async function POST(req: Request) {
  try {
    const { attempt, topicMap, previousGapReport } = (await req.json()) as {
      attempt: QuizAttempt;
      topicMap: TopicNode[];
      previousGapReport?: GapReport | null;
    };

    if (!attempt || !attempt.evaluations || attempt.evaluations.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Quiz attempt evaluations are required' },
        { status: 400 }
      );
    }

    // Step 1: Deterministic score calculation in TypeScript (LLM never invents percentages)
    const byTopic = new Map<
      string,
      {
        topicName: string;
        correct: number;
        total: number;
        missedDetails: string[];
      }
    >();

    for (const ev of attempt.evaluations) {
      const entry = byTopic.get(ev.topicId) || {
        topicName: ev.topicName,
        correct: 0,
        total: 0,
        missedDetails: [],
      };
      entry.total += 1;
      if (ev.isCorrect) {
        entry.correct += 1;
      } else {
        entry.missedDetails.push(
          `Missed concept (${ev.citation.sectionLabel}): ${ev.explanation}`
        );
      }
      byTopic.set(ev.topicId, entry);
    }

    const freqLookup = new Map<string, 'High' | 'Medium' | 'Low'>();
    (topicMap || []).forEach((t) => freqLookup.set(t.id, t.examFrequency));

    const testedSummaries = Array.from(byTopic.entries()).map(([topicId, stats]) => {
      const accuracy = Math.round((stats.correct / stats.total) * 100);
      const strength: 'weak' | 'medium' | 'strong' =
        accuracy < 50 ? 'weak' : accuracy < 80 ? 'medium' : 'strong';

      return {
        topicId,
        topicName: stats.topicName,
        accuracy,
        strength,
        correct: stats.correct,
        total: stats.total,
        missedDetails: stats.missedDetails,
        examFrequency: freqLookup.get(topicId) || 'Medium',
      };
    });

    // Step 2: Generate crisp human-readable diagnostic reasons per tested topic via Groq
    const object = await generateStructured(
      reasonsSchema,
      `
You are an academic study doctor writing a concise diagnostic report for a student.
For each topic below, write ONE specific, actionable sentence explaining why the student is Weak, Medium, or Strong based on the exact score and missed concepts provided.

Example style:
- "You got 0 of 2 questions right on Model Evaluation, mainly struggling with Precision vs Recall and the F1 harmonic mean."
- "Strong mastery (2/2 correct) across Backpropagation and ReLU activation functions."

Topic Results:
${JSON.stringify(testedSummaries, null, 2)}
`
    );

    const reasonMap = new Map<string, string>();
    object.topicDiagnostics.forEach((d) => reasonMap.set(d.topicId, d.diagnosticReason));

    const updatedGaps: TopicGap[] = testedSummaries.map((s) => ({
      topicId: s.topicId,
      topicName: s.topicName,
      strength: s.strength,
      accuracyPercentage: s.accuracy,
      attemptedCount: s.total,
      correctCount: s.correct,
      examFrequency: s.examFrequency,
      diagnosticReason:
        reasonMap.get(s.topicId) ||
        `Scored ${s.correct} of ${s.total} (${s.accuracy}%) on ${s.topicName}.`,
    }));

    // Merge with untested topics from previousGapReport if this was a focused re-test
    if (previousGapReport?.gaps) {
      const testedIds = new Set(updatedGaps.map((g) => g.topicId));
      for (const prevGap of previousGapReport.gaps) {
        if (!testedIds.has(prevGap.topicId)) {
          updatedGaps.push(prevGap);
        }
      }
    }

    // Sort: Weak first, then Medium, then Strong; High exam frequency first
    const strengthRank = { weak: 0, medium: 1, strong: 2 };
    const freqRank = { High: 0, Medium: 1, Low: 2 };
    updatedGaps.sort((a, b) => {
      if (strengthRank[a.strength] !== strengthRank[b.strength]) {
        return strengthRank[a.strength] - strengthRank[b.strength];
      }
      return freqRank[a.examFrequency] - freqRank[b.examFrequency];
    });

    const overallScore =
      updatedGaps.length > 0
        ? Math.round(
            updatedGaps.reduce((acc, g) => acc + g.accuracyPercentage, 0) / updatedGaps.length
          )
        : attempt.scorePercentage;

    const report: GapReport = {
      attemptId: attempt.id,
      timestamp: new Date().toISOString(),
      overallScore,
      gaps: updatedGaps,
      weakCount: updatedGaps.filter((g) => g.strength === 'weak').length,
      mediumCount: updatedGaps.filter((g) => g.strength === 'medium').length,
      strongCount: updatedGaps.filter((g) => g.strength === 'strong').length,
    };

    return NextResponse.json({ ok: true, report });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate gap report';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

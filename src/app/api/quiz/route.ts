import { NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { z } from 'zod';
import { groq, GROQ_MODEL } from '@/lib/ai/groq';
import { TopicNode, TextChunk, QuizQuestion } from '@/types';
import { retrieveTopK } from '@/lib/rag/retriever';

const quizOutputSchema = z.object({
  questions: z
    .array(
      z.object({
        question: z.string().describe('The diagnostic question'),
        options: z.array(z.string()).length(4).describe('Exactly 4 distinct options'),
        correctIndex: z.number().int().min(0).max(3).describe('Index of the correct option (0-3)'),
        explanation: z.string().describe('Why the correct option is right and others are wrong, grounded in the text'),
        chunkNumber: z.number().int().min(1).describe('1-based index of the source excerpt used'),
        verbatimExcerpt: z.string().describe('Exact 1-2 sentence quote from that excerpt proving the answer'),
      })
    )
    .min(1)
    .max(3),
});

export async function POST(req: Request) {
  try {
    const { topics, chunks, focusTopicId, focusTopicIds } = (await req.json()) as {
      topics: TopicNode[];
      chunks: TextChunk[];
      focusTopicId?: string;
      focusTopicIds?: string[];
    };

    if (!chunks || chunks.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'No textbook notes or chunks found. Please upload or load material first.' },
        { status: 400 }
      );
    }

    if (!topics || topics.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'No topics found. Please build the Topic Map first.' },
        { status: 400 }
      );
    }

    let targetTopics = topics.slice(0, 4);
    if (focusTopicIds && focusTopicIds.length > 0) {
      const filtered = topics.filter((t) => focusTopicIds.includes(t.id));
      if (filtered.length > 0) targetTopics = filtered;
    } else if (focusTopicId) {
      const filtered = topics.filter((t) => t.id === focusTopicId);
      if (filtered.length > 0) targetTopics = filtered;
    }

    const questionsPerTopic = targetTopics.length <= 2 ? 3 : 2;

    // Run RAG pipeline per topic in parallel for fast response (~1.5s total)
    const perTopicResults = await Promise.all(
      targetTopics.map(async (topic) => {
        // STEP 1 (RETRIEVAL): Fetch top relevant chunks ONLY — no LLM used here
        const retrieved = retrieveTopK(
          `${topic.name} ${topic.subtopics.join(' ')}`,
          chunks,
          3
        );

        const activeChunks = retrieved.length > 0 ? retrieved : chunks.slice(0, 2);
        const numberedContext = activeChunks
          .map(
            (c, i) =>
              `[Excerpt ${i + 1} | ${c.fileName} | ${c.sectionLabel}${c.pageNumber ? ` | Page ${c.pageNumber}` : ''}]\n${c.text}`
          )
          .join('\n\n---\n\n');

        // STEP 2 (GENERATION): Generate MCQs strictly grounded in retrieved chunks
        const prompt = `
You are an expert EdTech diagnostic examiner.
Generate exactly ${questionsPerTopic} distinct multiple-choice questions testing different sub-concepts of the topic: "${topic.name}".

STRICT RAG GROUNDING RULES:
1. Every question, option, and explanation MUST come strictly from the numbered Excerpts below.
2. Do NOT introduce outside facts, formulas, or examples not present in the excerpts.
3. Set chunkNumber to the 1-based Excerpt number you used (1 to ${activeChunks.length}).
4. Copy verbatimExcerpt directly from that Excerpt.

Retrieved Source Excerpts:
"""
${numberedContext.slice(0, 4500)}
"""
`;

        const { object } = await generateObject({
          model: groq(GROQ_MODEL),
          schema: quizOutputSchema,
          prompt,
        });

        return object.questions.slice(0, questionsPerTopic).map((q, idx): QuizQuestion => {
          const chunkIdx = Math.min(Math.max((q.chunkNumber || 1) - 1, 0), activeChunks.length - 1);
          const sourceChunk = activeChunks[chunkIdx];

          return {
            id: `quiz-q-${topic.id}-${Date.now()}-${idx}`,
            topicId: topic.id,
            topicName: topic.name,
            question: q.question,
            options: q.options,
            correctIndex: q.correctIndex,
            explanation: q.explanation,
            citation: {
              chunkId: sourceChunk.id,
              docType: sourceChunk.docType,
              fileName: sourceChunk.fileName,
              sectionLabel: sourceChunk.sectionLabel,
              pageNumber: sourceChunk.pageNumber,
              excerpt: q.verbatimExcerpt || sourceChunk.text.slice(0, 180) + '...',
            },
          };
        });
      })
    );

    const generatedQuestions = perTopicResults.flat();

    return NextResponse.json({
      ok: true,
      questions: generatedQuestions,
      ragGroundingStats: {
        totalQuestions: generatedQuestions.length,
        topicsCovered: targetTopics.length,
        retrievalMethod: 'TF-IDF Vector Cosine Similarity',
        llmModel: GROQ_MODEL,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate quiz';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

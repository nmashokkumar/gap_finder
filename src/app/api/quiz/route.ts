import { NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { z } from 'zod';
import { groq, GROQ_MODEL } from '@/lib/ai/groq';
import { TopicNode, TextChunk, QuizQuestion } from '@/types';
import { retrieveTopK } from '@/lib/rag/retriever';

const quizOutputSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string().describe('The diagnostic question'),
      options: z.array(z.string()).length(4).describe('Exactly 4 options A, B, C, D'),
      correctIndex: z.number().int().min(0).max(3).describe('Index of the correct option (0-3)'),
      explanation: z.string().describe('Explanation of why this answer is correct grounded in the text'),
      verbatimExcerpt: z.string().describe('Exact 1-2 sentence excerpt from the source text that proves the answer'),
    })
  ),
});

export async function POST(req: Request) {
  try {
    const { topics, chunks, focusTopicId } = (await req.json()) as {
      topics: TopicNode[];
      chunks: TextChunk[];
      focusTopicId?: string;
    };

    if (!chunks || chunks.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'No textbook notes/chunks found. Please upload or load material first.' },
        { status: 400 }
      );
    }

    // Determine target topics (either 1 focused weak topic, or up to 5 topics)
    const targetTopics = focusTopicId
      ? topics.filter((t) => t.id === focusTopicId)
      : topics.slice(0, 5);

    const generatedQuestions: QuizQuestion[] = [];

    // RAG Pipeline per topic:
    // Step 1: RETRIEVAL — Fetch top relevant chunks
    // Step 2: GENERATION — Pass chunks to LLM with grounding guardrail
    for (const topic of targetTopics) {
      const retrieved = retrieveTopK(
        `${topic.name} ${topic.subtopics.join(' ')}`,
        chunks,
        2
      );

      const sourceChunk = retrieved[0] || chunks[0];
      const contextText = retrieved.map((r) => r.text).join('\n\n---\n\n');

      const prompt = `
You are an expert diagnostic exam evaluator for an EdTech system.
Generate exactly 1 high-yield diagnostic multiple-choice question for the topic: "${topic.name}".

STRICT RAG GROUNDING RULES:
1. The question and all options MUST be derived strictly from the provided source context below.
2. Do NOT use outside knowledge or ungrounded facts.
3. Provide the exact verbatim sentence from the source text that proves the correct answer.

Source Context:
"""
${contextText.slice(0, 3000)}
"""
`;

      const { object } = await generateObject({
        model: groq(GROQ_MODEL),
        schema: quizOutputSchema,
        prompt,
      });

      if (object.questions.length > 0) {
        const q = object.questions[0];
        generatedQuestions.push({
          id: `quiz-q-${topic.id}-${Date.now()}-${generatedQuestions.length}`,
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
            excerpt: q.verbatimExcerpt || sourceChunk.text.slice(0, 160) + '...',
          },
        });
      }
    }

    return NextResponse.json({
      ok: true,
      questions: generatedQuestions,
      ragGroundingStats: {
        totalQuestions: generatedQuestions.length,
        retrievalMethod: 'TF-IDF Vector Cosine Similarity',
        llmModel: GROQ_MODEL,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate quiz';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

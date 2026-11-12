import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generateStructured } from '@/lib/ai/structured';
import { retrieveTopK } from '@/lib/rag/retriever';
import { TextChunk, TopicNode } from '@/types';

const syllabusExtractionSchema = z.object({
  topics: z.array(
    z.object({
      id: z.string().describe('Unique kebab-case ID, e.g. power-query-etl'),
      name: z.string().describe('Topic title'),
      subtopics: z.array(z.string()).describe('List of 2-4 subtopics'),
      description: z.string().describe('Brief 1-sentence topic summary'),
    })
  ),
});

/**
 * Splits raw past paper text into individual question blocks.
 */
function splitPastPaperQuestions(raw: string): string[] {
  if (!raw || !raw.trim()) return [];
  const blocks = raw
    .split(/(?=(?:Question\s+\d+|Q\.?\s*\d+|\b\d+[.)]\s+))/gi)
    .map((b) => b.replace(/\s+/g, ' ').trim())
    .filter(
      (b) =>
        b.length > 20 &&
        !/^(?:\[Page\s+\d+\]|Module\s+\d+)/i.test(b) &&
        /\?|\bexplain\b|\bstate\b|\bdefine\b|\bderive\b|\bshow\b|\bwhy\b|\bcompare\b|\bdifferentiate\b|\bwrite\b|\bdescribe\b|\bwhat\b|\bhow\b|\blist\b/i.test(
          b
        )
    );
  return blocks;
}

export async function POST(req: Request) {
  try {
    const { syllabusText, pastPapersText, syllabusFileName } = (await req.json()) as {
      syllabusText: string;
      pastPapersText?: string;
      syllabusFileName?: string;
    };

    if (!syllabusText || !syllabusText.trim()) {
      return NextResponse.json(
        { ok: false, error: 'Syllabus text is required' },
        { status: 400 }
      );
    }

    // Step 1 (Generation): Parse structured syllabus topics and subtopics
    const object = await generateStructured(
      syllabusExtractionSchema,
      `Extract 4 to 6 clean, distinct syllabus topics and their subtopics from the syllabus below.\n\nSyllabus:\n"""\n${syllabusText.slice(0, 5000)}\n"""`
    );

    // Step 2 (Retrieval): Map each past-paper question to the best-matching syllabus topic using TF-IDF Cosine Similarity
    const topicChunks: TextChunk[] = object.topics.map((t) => ({
      id: t.id,
      docId: 'syllabus-map',
      docType: 'syllabus',
      fileName: syllabusFileName || 'Uploaded Syllabus',
      sectionLabel: t.name,
      text: `${t.name}. ${t.subtopics.join('. ')}. ${t.description}`,
    }));

    const pastQuestions = splitPastPaperQuestions(pastPapersText || '');
    const linkedByTopic = new Map<string, string[]>();
    object.topics.forEach((t) => linkedByTopic.set(t.id, []));

    for (const qText of pastQuestions) {
      const matches = retrieveTopK(qText, topicChunks, 1);
      if (matches.length > 0) {
        const bestTopicId = matches[0].id;
        linkedByTopic.get(bestTopicId)?.push(qText);
      }
    }

    const enrichedTopics: TopicNode[] = object.topics.map((t) => {
      const linked = linkedByTopic.get(t.id) || [];
      const examFrequency: 'High' | 'Medium' | 'Low' =
        linked.length >= 2 ? 'High' : linked.length === 1 ? 'Medium' : 'Low';

      return {
        id: t.id,
        name: t.name,
        subtopics: t.subtopics,
        description: t.description,
        examFrequency,
        linkedQuestions: linked,
      };
    });

    return NextResponse.json({
      ok: true,
      topics: enrichedTopics,
      mappingMethod: 'TF-IDF Cosine Retrieval over Past Paper Questions',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate topic map';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

import { convertToModelMessages, streamText, UIMessage } from 'ai';
import { groq, GROQ_MODEL } from '@/lib/ai/groq';
import { retrieveTopK } from '@/lib/rag/retriever';
import { TextChunk } from '@/types';

export interface RagSourceMeta {
  chunkId: string;
  fileName: string;
  sectionLabel: string;
  pageNumber?: number;
  score: number;
  excerpt: string;
}

export interface ChatMessageMetadata {
  grounded: boolean;
  sources: RagSourceMeta[];
}

function extractLastUserText(messages: unknown[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i] as {
      role?: string;
      content?: string;
      parts?: Array<{ type?: string; text?: string }>;
    };
    if (msg?.role !== 'user') continue;
    if (Array.isArray(msg.parts)) {
      const text = msg.parts
        .filter((p) => p.type === 'text' && typeof p.text === 'string')
        .map((p) => p.text)
        .join(' ')
        .trim();
      if (text) return text;
    }
    if (typeof msg.content === 'string' && msg.content.trim()) {
      return msg.content.trim();
    }
  }
  return '';
}

function normalizeToUIMessages(rawMessages: unknown[]): Array<Omit<UIMessage, 'id'>> {
  return rawMessages.map((m) => {
    const msg = m as {
      role: 'user' | 'assistant' | 'system';
      content?: string;
      parts?: UIMessage['parts'];
    };
    if (Array.isArray(msg.parts)) {
      return { role: msg.role, parts: msg.parts };
    }
    return {
      role: msg.role,
      parts: [{ type: 'text', text: msg.content || '' }],
    };
  });
}

export async function POST(req: Request) {
  try {
    const { messages = [], chunks = [] } = (await req.json()) as {
      messages: unknown[];
      chunks: TextChunk[];
    };

    const userQuery = extractLastUserText(messages);

    // STEP 1 (RETRIEVAL): Pure-TS vector similarity search over student's uploaded material
    const retrieved = chunks.length > 0 && userQuery ? retrieveTopK(userQuery, chunks, 4) : [];
    const topScore = retrieved[0]?.score ?? 0;
    const isGrounded = retrieved.length > 0 && topScore >= 0.08;

    const sources: RagSourceMeta[] = isGrounded
      ? retrieved.map((c) => ({
          chunkId: c.id,
          fileName: c.fileName,
          sectionLabel: c.sectionLabel,
          pageNumber: c.pageNumber,
          score: c.score,
          excerpt: c.text.slice(0, 180) + (c.text.length > 180 ? '...' : ''),
        }))
      : [];

    const contextBlock = isGrounded
      ? retrieved
          .map(
            (c, i) =>
              `[Source ${i + 1}: ${c.fileName} · ${c.sectionLabel}${c.pageNumber ? ` · Page ${c.pageNumber}` : ''} (Relevance: ${c.score})]\n${c.text}`
          )
          .join('\n\n---\n\n')
      : 'NO RELEVANT UPLOADED MATERIAL FOUND FOR THIS QUERY.';

    const availableSections = Array.from(new Set(chunks.map((c) => c.sectionLabel))).slice(0, 8);

    // STEP 2 (GENERATION): Strict RAG-only system instructions
    const systemPrompt = isGrounded
      ? `You are GapFinder AI's "Explain This Topic" study assistant.
STRICT GROUNDING RULES:
1. Answer the student's question using ONLY the Retrieved Material below.
2. Do NOT bring in outside facts, formulas, or examples from general memory.
3. Always cite the exact section and page in brackets (e.g., [Section 2.2 · Page 42]).
4. Keep explanations clear, calm, and structured for a student revising for exams.
5. If any part of the student's question is not covered in the Retrieved Material, explicitly say: "That specific part is not covered in your uploaded material."

Retrieved Material:
"""
${contextBlock}
"""`
      : `You are GapFinder AI's "Explain This Topic" study assistant, strictly locked to the student's uploaded study material.
No relevant passages were found in the student's uploaded material for their latest question.
Politely refuse to answer from outside knowledge. Say: "I couldn't find information about that in your uploaded study materials. To keep your revision accurate, I only explain concepts present in your notes."
${
  availableSections.length > 0
    ? `Suggest one of these uploaded sections they can ask about instead: ${availableSections.join(', ')}.`
    : 'Remind them to upload or load sample study materials first on Step 1.'
}`;

    const modelMessages = await convertToModelMessages(normalizeToUIMessages(messages));

    const result = streamText({
      model: groq(GROQ_MODEL),
      system: systemPrompt,
      messages: modelMessages,
    });

    return result.toUIMessageStreamResponse({
      messageMetadata: ({ part }): ChatMessageMetadata | undefined => {
        if (part.type === 'start' || part.type === 'finish') {
          return {
            grounded: isGrounded,
            sources,
          };
        }
        return undefined;
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Chat stream error';
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

'use client';

import React, { useEffect, useState } from 'react';
import { Layers, Database, Cpu, ShieldCheck, Search, ArrowRight, FileText } from 'lucide-react';
import { TextChunk, RetrievedChunk } from '@/types';
import { getChunks } from '@/lib/storage/studentStore';
import { retrieveTopK } from '@/lib/rag/retriever';

export default function ArchitecturePage() {
  const [chunks, setChunks] = useState<TextChunk[]>([]);
  const [query, setQuery] = useState('Precision vs Recall');
  const [retrieved, setRetrieved] = useState<RetrievedChunk[]>([]);

  useEffect(() => {
    const loaded = getChunks();
    setChunks(loaded);
    if (loaded.length > 0) {
      setRetrieved(retrieveTopK('Precision vs Recall', loaded, 3));
    }
  }, []);

  const handleRunRetrieval = (q: string) => {
    setQuery(q);
    if (!q.trim() || chunks.length === 0) {
      setRetrieved([]);
      return;
    }
    setRetrieved(retrieveTopK(q, chunks, 3));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-700">
          System Transparency · Mandatory AI Architecture
        </span>
        <h1 className="text-xl font-bold text-stone-900 flex items-center space-x-2">
          <Layers className="w-5 h-5 text-teal-700" />
          <span>How Retrieval &amp; Generation Are Kept Separate</span>
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-3xl">
          GapFinder AI enforces a strict two-stage pipeline so the LLM cannot rely on unverified pre-training memory. Retrieval runs first as pure deterministic math; Generation runs second and only sees the retrieved chunks.
        </p>
      </div>

      {/* Two-Stage Pipeline Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Stage 1: Retrieval */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4 border-t-4 border-t-teal-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
                <Database className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-stone-900">Stage 1: Retrieval (No LLM)</h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-600">
              src/lib/rag/retriever.ts
            </span>
          </div>

          <ul className="text-xs text-stone-600 space-y-2 leading-relaxed">
            <li>
              <strong>1. Ingestion &amp; Chunking:</strong> Uploaded PDFs/text are parsed locally via{' '}
              <code className="bg-stone-100 px-1 rounded">pdfjs-dist</code> and split into metadata-tagged chunks (file, section, page).
            </li>
            <li>
              <strong>2. Vectorization:</strong> Pure TypeScript TF-IDF vectorizer converts chunks and queries into normalized term vectors.
            </li>
            <li>
              <strong>3. Where Retrieval Is Used:</strong>
              <ul className="pl-4 mt-1 space-y-1 list-disc text-stone-500">
                <li>Mapping past-paper questions to syllabus topics (<code className="bg-stone-100 px-1 rounded">/api/topic-map</code>)</li>
                <li>Fetching exact textbook excerpts before creating each quiz question (<code className="bg-stone-100 px-1 rounded">/api/quiz</code>)</li>
                <li>Finding source references for revision plan tasks (<code className="bg-stone-100 px-1 rounded">/api/revision-plan</code>)</li>
                <li>Gating and citing the Explain-This-Topic chatbot (<code className="bg-stone-100 px-1 rounded">/api/chat</code>)</li>
              </ul>
            </li>
          </ul>
        </div>

        {/* Stage 2: Generation */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4 border-t-4 border-t-amber-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
                <Cpu className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-stone-900">Stage 2: Generation (Groq + AI SDK)</h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-600">
              src/app/api/*
            </span>
          </div>

          <ul className="text-xs text-stone-600 space-y-2 leading-relaxed">
            <li>
              <strong>1. Strict Context Boundary:</strong> The LLM only receives the Top-K chunks returned by Stage 1 — never the whole book and never open web knowledge.
            </li>
            <li>
              <strong>2. Similarity Guardrail:</strong> In <code className="bg-stone-100 px-1 rounded">/api/chat</code>, if top Cosine Similarity &lt; 0.08, generation refuses to answer outside facts.
            </li>
            <li>
              <strong>3. Where Generation Is Used:</strong>
              <ul className="pl-4 mt-1 space-y-1 list-disc text-stone-500">
                <li>Structuring syllabus topics via <code className="bg-stone-100 px-1 rounded">generateObject()</code> + Zod</li>
                <li>Formulating grounded MCQs &amp; verbatim excerpts from retrieved chunks</li>
                <li>Writing diagnostic reasons from exact TypeScript accuracy math</li>
                <li>Streaming grounded explanations via <code className="bg-stone-100 px-1 rounded">streamText()</code></li>
              </ul>
            </li>
          </ul>
        </div>
      </div>

      {/* Live Retrieval Verification Inspector */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-stone-900 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              <span>Live Stage-1 Retrieval Proof ({chunks.length} Indexed Chunks)</span>
            </h3>
            <p className="text-xs text-stone-500">
              Inspect the exact Top-3 chunks that Stage 1 passes into Stage 2 for any query.
            </p>
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleRunRetrieval(e.target.value)}
            placeholder="Test a query (e.g. 'Precision vs Recall', 'Backpropagation', 'Cosine Similarity')..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs sm:text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
          />
        </div>

        {chunks.length === 0 ? (
          <p className="text-xs text-stone-500 italic">
            No chunks loaded yet. Load the Sample Dataset or upload notes on the Workspace tab to test live retrieval.
          </p>
        ) : retrieved.length === 0 ? (
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3">
            No matching chunks found above similarity threshold (0.01). In the Explain Chat, Stage 2 will automatically refuse this query rather than hallucinating!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {retrieved.map((chunk, i) => (
              <div
                key={chunk.id}
                className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 text-xs space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-teal-800">Chunk Rank #{i + 1}</span>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                      Cosine: {chunk.score}
                    </span>
                  </div>
                  <p className="font-semibold text-stone-800 flex items-center space-x-1">
                    <FileText className="w-3 h-3 text-stone-500 shrink-0" />
                    <span className="truncate">
                      {chunk.sectionLabel}
                      {chunk.pageNumber ? ` · Page ${chunk.pageNumber}` : ''}
                    </span>
                  </p>
                  <p className="text-stone-600 text-[11px] line-clamp-4 leading-relaxed">
                    {chunk.text}
                  </p>
                </div>
                <div className="pt-2 border-t border-stone-200 text-[10px] text-stone-500 font-mono flex items-center justify-between">
                  <span className="truncate">{chunk.fileName}</span>
                  <ArrowRight className="w-3 h-3 shrink-0" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

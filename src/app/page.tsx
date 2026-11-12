'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Stethoscope, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Layers, 
  Cpu, 
  AlertCircle 
} from 'lucide-react';
import MaterialUploader from '@/components/MaterialUploader';
import TopicMapView from '@/components/TopicMapView';

export default function HomePage() {
  const [health, setHealth] = useState<{
    ok?: boolean;
    model?: string;
    loading: boolean;
    error?: string;
  }>({ loading: true });

  const [, setRefreshKey] = useState(0);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setHealth({
          ok: data.ok,
          model: data.model,
          loading: false,
          error: data.error,
        });
      })
      .catch((err) => {
        setHealth({
          ok: false,
          loading: false,
          error: err?.message || 'Network error',
        });
      });
  }, []);

  const handleDataUpdate = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-8 py-2">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-3xl space-y-4 relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            <span>Hackathon PS 2026 · {`{igebra.ai}`} AI Ready School</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            Find What the Student Doesn’t Know.
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Most study tools wait for students to ask questions. But a student cannot ask about a gap they don’t know they have. GapFinder AI works like a <span className="text-indigo-300 font-semibold">study doctor</span>: ingest curriculum, run grounded diagnostic tests with citations, and prescribe a personalized revision plan.
          </p>

          {/* System Status Pill */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300">LLM Inference:</span>
              {health.loading ? (
                <span className="text-amber-300 animate-pulse">Connecting to Groq...</span>
              ) : health.ok ? (
                <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                  <span>Groq ({health.model})</span>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </span>
              ) : (
                <span className="text-rose-400 font-semibold flex items-center space-x-1">
                  <span>Connection error</span>
                  <AlertCircle className="w-3.5 h-3.5" />
                </span>
              )}
            </div>

            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs text-slate-300">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>RAG Engine: In-Memory Cosine Vectorizer</span>
            </div>
          </div>
        </div>
      </div>

      {/* Step 1: Material Uploader & Ingestion */}
      <MaterialUploader onUpdate={handleDataUpdate} />

      {/* Step 2: Syllabus Topic Map */}
      <TopicMapView onUpdate={handleDataUpdate} />

      {/* Next Step CTA Banner */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200/80 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider flex items-center space-x-1.5 justify-center sm:justify-start">
            <Stethoscope className="w-4 h-4 text-indigo-600" />
            <span>Ready for Diagnosis?</span>
          </span>
          <h3 className="text-sm sm:text-base font-bold text-slate-900">
            Take the Grounded Diagnostic Quiz
          </h3>
          <p className="text-xs text-slate-600 max-w-xl">
            Test yourself with AI questions created strictly from your uploaded textbook chapters. Every question carries verified source citations.
          </p>
        </div>

        <Link
          href="/quiz"
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-indigo-100 transition-all shrink-0"
        >
          <span>Open Diagnostic Quiz</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

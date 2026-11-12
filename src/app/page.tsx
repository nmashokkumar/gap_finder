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

export default function HomePage() {
  const [health, setHealth] = useState<{
    ok?: boolean;
    model?: string;
    loading: boolean;
    error?: string;
  }>({ loading: true });

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

  return (
    <div className="space-y-8 py-4">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-3xl space-y-4 relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            <span>Hackathon PS 2026 · AI Intern Assignment</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Find What the Student Doesn’t Know.
          </h1>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
            Most study tools wait for students to ask questions. But a student cannot ask about a gap they don’t know they have. GapFinder AI works like a <span className="text-indigo-300 font-semibold">study doctor</span>: test, diagnose weaknesses with verifiable citations, and prescribe a personalized revision plan.
          </p>

          {/* System Status Pill */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-black/30 border border-white/10 text-xs">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300">LLM Engine:</span>
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

            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-black/30 border border-white/10 text-xs text-slate-300">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>RAG Engine: In-Memory Cosine Vectorizer</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5-Step Workflow Cards */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center space-x-2">
          <Stethoscope className="w-5 h-5 text-indigo-600" />
          <span>The Diagnostic Loop</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            {
              step: '01',
              title: 'Upload & Map',
              desc: 'Parse syllabus, textbook notes & past papers. Links exam frequency.',
              badge: 'Retrieval',
              color: 'border-blue-200 bg-blue-50/50 text-blue-700',
            },
            {
              step: '02',
              title: 'Diagnostic Quiz',
              desc: 'AI generates questions grounded in retrieved text with page citations.',
              badge: 'RAG Grounded',
              color: 'border-indigo-200 bg-indigo-50/50 text-indigo-700',
            },
            {
              step: '03',
              title: 'Gap Report',
              desc: 'Sorts topics into 🔴 Weak, 🟡 Medium, 🟢 Strong with AI reasoning.',
              badge: 'Diagnosis',
              color: 'border-amber-200 bg-amber-50/50 text-amber-700',
            },
            {
              step: '04',
              title: 'Revision Plan',
              desc: 'Prioritizes weak topics into daily schedule based on student hours.',
              badge: 'Treatment',
              color: 'border-emerald-200 bg-emerald-50/50 text-emerald-700',
            },
            {
              step: '05',
              title: 'Explain & Retest',
              desc: 'RAG tutor answers strictly from notes. Retesting updates the plan.',
              badge: 'Adaptive Loop',
              color: 'border-purple-200 bg-purple-50/50 text-purple-700',
            },
          ].map((item) => (
            <div
              key={item.step}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold tracking-wider text-slate-400 font-mono">
                    STEP {item.step}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${item.color}`}>
                    {item.badge}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm">{item.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Block 1 Status Notification */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Block 1 Complete: Scaffold & API Engine Ready</h4>
            <p className="text-xs text-slate-600 mt-0.5">
              Next.js 14, Tailwind CSS, Vercel AI SDK, Groq LPU API, and shared TypeScript domain models are verified. Ready for Block 2 (Demo Authentication, Student State Storage & Preloaded Sample Material).
            </p>
          </div>
        </div>

        <Link
          href="/login"
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors whitespace-nowrap"
        >
          <span>Ready for Block 2</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

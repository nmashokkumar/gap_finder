'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import MaterialUploader from '@/components/MaterialUploader';
import TopicMapView from '@/components/TopicMapView';
import { getGapReport, getTopicMap } from '@/lib/storage/studentStore';

export default function HomePage() {
  const [healthOk, setHealthOk] = useState<boolean | null>(null);
  const [hasTopics, setHasTopics] = useState(false);
  const [hasReport, setHasReport] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    setHasTopics(getTopicMap().length > 0);
    setHasReport(Boolean(getGapReport()));

    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setHealthOk(Boolean(data.ok)))
      .catch(() => setHealthOk(false));
  }, []);

  const handleUpdate = () => {
    setHasTopics(getTopicMap().length > 0);
    setHasReport(Boolean(getGapReport()));
    setTick((n) => n + 1);
  };

  return (
    <div className="space-y-6">
      {/* Clean Workspace Header */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-stone-900">Study Workspace</h1>
            {healthOk === true && (
              <span className="inline-flex items-center space-x-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" />
                <span>Groq AI Ready</span>
              </span>
            )}
            {healthOk === false && (
              <span className="inline-flex items-center space-x-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
                <AlertCircle className="w-3 h-3" />
                <span>API Check Failed</span>
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-stone-600">
            Upload your syllabus, notes, and past papers to map topics, run a diagnostic test, and find your weak areas.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {hasReport && (
            <Link
              href="/report"
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-800 text-xs font-semibold transition-colors"
            >
              <span>Latest Gap Report</span>
            </Link>
          )}
          {hasTopics && (
            <Link
              href="/quiz"
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold transition-colors"
            >
              <span>Take Diagnostic Quiz</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* Step 1: Material Upload */}
      <MaterialUploader onUpdate={handleUpdate} />

      {/* Step 2: Topic Map */}
      <TopicMapView onUpdate={handleUpdate} />
    </div>
  );
}

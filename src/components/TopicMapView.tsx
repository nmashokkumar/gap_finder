'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  GitFork,
  Sparkles,
  Flame,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  FileQuestion,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { TopicNode } from '@/types';
import { getTopicMap, saveTopicMap, getDocuments } from '@/lib/storage/studentStore';

export default function TopicMapView({ onUpdate }: { onUpdate?: () => void }) {
  const [topics, setTopics] = useState<TopicNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

  useEffect(() => {
    setTopics(getTopicMap());
  }, []);

  const handleGenerateTopicMap = async () => {
    const docs = getDocuments();
    const syllabusDoc = docs.find((d) => d.type === 'syllabus');
    const pastPaperDoc = docs.find((d) => d.type === 'past_paper');

    if (!syllabusDoc || !syllabusDoc.rawText.trim()) {
      setError('Please upload a Syllabus (or click "Load AI/ML Sample Material") above first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/topic-map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          syllabusText: syllabusDoc.rawText,
          pastPapersText: pastPaperDoc?.rawText || '',
        }),
      });

      const data = await res.json();
      if (data.ok && Array.isArray(data.topics)) {
        saveTopicMap(data.topics);
        setTopics(data.topics);
        if (onUpdate) onUpdate();
      } else {
        setError(data.error || 'Failed to build topic map.');
      }
    } catch {
      setError('Network error while connecting to AI service.');
    } finally {
      setIsLoading(false);
    }
  };

  const getFreqColor = (freq: 'High' | 'Medium' | 'Low') => {
    switch (freq) {
      case 'High':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'Medium':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Low':
        return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  return (
    <section className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
        <div>
          <h2 className="text-base font-bold text-stone-900">2. Syllabus Topic Map</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Maps past-paper questions to syllabus topics using retrieval to identify high-weight exam areas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleGenerateTopicMap}
            disabled={isLoading}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:bg-stone-300 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Building Topic Map...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>{topics.length > 0 ? 'Rebuild Topic Map' : 'Build Topic Map'}</span>
              </>
            )}
          </button>

          {topics.length > 0 && (
            <Link
              href="/quiz"
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition-colors"
            >
              <span>Start Diagnostic Quiz</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {topics.length === 0 ? (
        <div className="py-10 text-center space-y-2 bg-stone-50/70 rounded-xl border border-dashed border-stone-200">
          <GitFork className="w-7 h-7 text-stone-300 mx-auto" />
          <p className="text-xs font-semibold text-stone-700">No Topic Map Generated Yet</p>
          <p className="text-[11px] text-stone-500 max-w-sm mx-auto">
            After loading your syllabus and notes above, click &ldquo;Build Topic Map&rdquo; to structure your topics.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {topics.map((t, idx) => {
            const isExpanded = expandedTopic === t.id;
            return (
              <div
                key={t.id}
                className="bg-stone-50/60 border border-stone-200 rounded-xl p-4 space-y-2.5 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-teal-800 font-mono">
                      MODULE 0{idx + 1}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border inline-flex items-center space-x-1 ${getFreqColor(
                        t.examFrequency
                      )}`}
                    >
                      {t.examFrequency === 'High' && <Flame className="w-3 h-3 text-rose-600" />}
                      <span>{t.examFrequency} Exam Weight</span>
                    </span>
                  </div>

                  <h3 className="font-bold text-stone-900 text-sm">{t.name}</h3>
                  {t.description && (
                    <p className="text-xs text-stone-600 leading-relaxed">{t.description}</p>
                  )}

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {t.subtopics.map((sub, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white border border-stone-200 text-stone-700"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>

                {t.linkedQuestions && t.linkedQuestions.length > 0 && (
                  <div className="pt-2 border-t border-stone-200/80">
                    <button
                      type="button"
                      onClick={() => setExpandedTopic(isExpanded ? null : t.id)}
                      className="text-[11px] font-semibold text-stone-700 hover:text-stone-900 flex items-center justify-between w-full cursor-pointer"
                    >
                      <span className="flex items-center space-x-1">
                        <FileQuestion className="w-3.5 h-3.5 text-teal-700" />
                        <span>Matched Past-Paper Questions ({t.linkedQuestions.length})</span>
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {isExpanded && (
                      <ul className="mt-2 space-y-1.5 text-[11px] text-stone-600 pl-2.5 border-l-2 border-teal-300">
                        {t.linkedQuestions.map((q, i) => (
                          <li key={i}>{q}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

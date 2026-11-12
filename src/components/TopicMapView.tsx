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
  RefreshCw 
} from 'lucide-react';
import { TopicNode } from '@/types';
import { 
  getTopicMap, 
  saveTopicMap, 
  getDocuments 
} from '@/lib/storage/studentStore';

export default function TopicMapView({ onUpdate }: { onUpdate?: () => void }) {
  const [topics, setTopics] = useState<TopicNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

  useEffect(() => {
    setTopics(getTopicMap());
  }, []);

  const handleGenerateTopicMap = async () => {
    const docs = getDocuments();
    const syllabusDoc = docs.find((d) => d.type === 'syllabus');
    const pastPaperDoc = docs.find((d) => d.type === 'past_paper');

    if (!syllabusDoc || !syllabusDoc.rawText.trim()) {
      alert('Please upload or load a Syllabus first in Step 1!');
      return;
    }

    setIsLoading(true);
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
        alert(data.error || 'Failed to generate topic map');
      }
    } catch (err) {
      console.error(err);
      alert('Error communicating with AI service');
    } finally {
      setIsLoading(false);
    }
  };

  const getFreqColor = (freq: 'High' | 'Medium' | 'Low') => {
    switch (freq) {
      case 'High':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Low':
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <GitFork className="w-5 h-5 text-indigo-600" />
            <span>Step 2: Syllabus Topic Map & Exam Weightage</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Structured breakdown of curriculum modules linked to historical exam frequency.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleGenerateTopicMap}
            disabled={isLoading}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Analyzing Syllabus with Groq...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>{topics.length > 0 ? 'Regenerate Topic Map' : 'Build Topic Map with AI'}</span>
              </>
            )}
          </button>

          {topics.length > 0 && (
            <Link
              href="/quiz"
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <span>Take Diagnostic Quiz</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>

      {topics.length === 0 ? (
        <div className="py-10 text-center space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <GitFork className="w-8 h-8 text-slate-300 mx-auto" />
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-700">No Topic Map Generated Yet</p>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Make sure you have uploaded or loaded a Syllabus in Step 1, then click &ldquo;Build Topic Map with AI&rdquo;.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topics.map((t, idx) => {
            const isExpanded = expandedTopic === t.id;
            return (
              <div
                key={t.id}
                className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 space-y-3 flex flex-col justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-indigo-700 font-mono">
                      TOPIC 0{idx + 1}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center space-x-1 ${getFreqColor(
                        t.examFrequency
                      )}`}
                    >
                      {t.examFrequency === 'High' && <Flame className="w-3 h-3 text-rose-500" />}
                      <span>{t.examFrequency} Exam Weight</span>
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm">{t.name}</h3>
                  {t.description && (
                    <p className="text-xs text-slate-500 leading-relaxed">{t.description}</p>
                  )}

                  {/* Subtopics Pills */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {t.subtopics.map((sub, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Linked Past Paper Questions Accordion */}
                {t.linkedQuestions && t.linkedQuestions.length > 0 && (
                  <div className="pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setExpandedTopic(isExpanded ? null : t.id)}
                      className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 flex items-center justify-between w-full"
                    >
                      <span className="flex items-center space-x-1">
                        <FileQuestion className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Past Paper Questions ({t.linkedQuestions.length})</span>
                      </span>
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    {isExpanded && (
                      <ul className="mt-2 space-y-1.5 text-[11px] text-slate-600 pl-2 border-l-2 border-indigo-200">
                        {t.linkedQuestions.map((q, i) => (
                          <li key={i} className="line-clamp-2">
                            &bull; {q}
                          </li>
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
    </div>
  );
}

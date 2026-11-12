'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { TrendingUp, ArrowRight, Award, Target, RefreshCw } from 'lucide-react';
import { QuizAttempt, GapReport } from '@/types';
import { getQuizAttempts, getGapReport } from '@/lib/storage/studentStore';

export default function ProgressPage() {
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [gapReport, setGapReport] = useState<GapReport | null>(null);

  useEffect(() => {
    setAttempts(getQuizAttempts());
    setGapReport(getGapReport());
  }, []);

  if (attempts.length === 0) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <div className="bg-white border border-stone-200 rounded-2xl p-10 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center mx-auto">
            <TrendingUp className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-stone-900">No Quiz Attempts Recorded Yet</h1>
          <p className="text-sm text-stone-500 max-w-md mx-auto">
            Take your first diagnostic quiz to start tracking your topic-level improvement across attempts.
          </p>
          <Link
            href="/quiz"
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold transition-colors"
          >
            <span>Take Diagnostic Quiz</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const chartData = attempts.map((att, idx) => ({
    name: `Attempt ${idx + 1}`,
    score: att.scorePercentage,
    correct: att.correctQuestions,
    total: att.totalQuestions,
    date: new Date(att.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }));

  const firstScore = attempts[0].scorePercentage;
  const latestScore = attempts[attempts.length - 1].scorePercentage;
  const delta = latestScore - firstScore;

  // Build per-topic history across attempts
  const topicHistoryMap = new Map<
    string,
    { topicId: string; topicName: string; scores: Array<{ attemptNum: number; pct: number }> }
  >();

  attempts.forEach((att, idx) => {
    const perTopicInAttempt = new Map<string, { name: string; correct: number; total: number }>();
    att.evaluations.forEach((ev) => {
      const curr = perTopicInAttempt.get(ev.topicId) || {
        name: ev.topicName,
        correct: 0,
        total: 0,
      };
      curr.total += 1;
      if (ev.isCorrect) curr.correct += 1;
      perTopicInAttempt.set(ev.topicId, curr);
    });

    perTopicInAttempt.forEach((val, topicId) => {
      const existing = topicHistoryMap.get(topicId) || {
        topicId,
        topicName: val.name,
        scores: [],
      };
      existing.scores.push({
        attemptNum: idx + 1,
        pct: Math.round((val.correct / val.total) * 100),
      });
      topicHistoryMap.set(topicId, existing);
    });
  });

  const topicHistory = Array.from(topicHistoryMap.values());

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-700">
            Step 5 · Learning Trajectory
          </span>
          <h1 className="text-xl font-bold text-stone-900 mt-0.5 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-teal-700" />
            <span>Progress Dashboard</span>
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Track measurable improvement across diagnostic attempts and re-tests.
          </p>
        </div>

        <Link
          href="/quiz?focus=weak"
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold transition-colors self-start sm:self-center"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Take Another Attempt</span>
        </Link>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-stone-200 rounded-2xl p-4">
          <span className="text-[11px] text-stone-500">Total Attempts</span>
          <p className="text-2xl font-bold text-stone-900 mt-0.5">{attempts.length}</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-2xl p-4">
          <span className="text-[11px] text-stone-500">Latest Quiz Score</span>
          <p className="text-2xl font-bold text-teal-700 mt-0.5">{latestScore}%</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-2xl p-4">
          <span className="text-[11px] text-stone-500">Score Change</span>
          <p
            className={`text-2xl font-bold mt-0.5 ${
              delta > 0 ? 'text-emerald-700' : delta < 0 ? 'text-rose-700' : 'text-stone-700'
            }`}
          >
            {delta > 0 ? `+${delta}%` : `${delta}%`}
          </p>
        </div>
        <div className="bg-white border border-stone-200 rounded-2xl p-4">
          <span className="text-[11px] text-stone-500">Strong Topics</span>
          <p className="text-2xl font-bold text-emerald-700 mt-0.5">
            {gapReport ? `${gapReport.strongCount}/${gapReport.gaps.length}` : '—'}
          </p>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-stone-900 flex items-center space-x-2">
            <Award className="w-4 h-4 text-teal-700" />
            <span>Score Progression Across Attempts</span>
          </h2>
          <span className="text-[11px] text-stone-500">0% – 100% Scale</span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0f766e" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#0f766e" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#57534e' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#57534e' }} unit="%" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e7e5e4',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#0f766e"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#scoreFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Topic-Level Progression */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-stone-900 flex items-center space-x-2">
          <Target className="w-4 h-4 text-teal-700" />
          <span>Topic-Level Improvement History</span>
        </h2>

        <div className="divide-y divide-stone-100">
          {topicHistory.map((item) => {
            const first = item.scores[0]?.pct ?? 0;
            const latest = item.scores[item.scores.length - 1]?.pct ?? 0;
            const currentGap = gapReport?.gaps.find((g) => g.topicId === item.topicId);

            return (
              <div
                key={item.topicId}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <p className="font-bold text-stone-900 text-sm">{item.topicName}</p>
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-stone-600">
                    {item.scores.map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-stone-100 border border-stone-200 font-mono"
                      >
                        Attempt {s.attemptNum}: {s.pct}%
                      </span>
                    ))}
                    {item.scores.length > 1 && latest > first && (
                      <span className="text-emerald-700 font-semibold ml-1">
                        (+{latest - first}% improved)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {currentGap && (
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                        currentGap.strength === 'weak'
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : currentGap.strength === 'medium'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      {currentGap.strength === 'weak'
                        ? '🔴 Weak'
                        : currentGap.strength === 'medium'
                        ? '🟡 Medium'
                        : '🟢 Strong'}
                    </span>
                  )}
                  <Link
                    href={`/quiz?focus=${encodeURIComponent(item.topicId)}`}
                    className="px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-700 font-semibold transition-colors"
                  >
                    Re-test
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

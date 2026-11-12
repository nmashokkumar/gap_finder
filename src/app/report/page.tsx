'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Stethoscope,
  Calendar,
  Clock,
  RefreshCw,
  ArrowRight,
  MessageSquare,
  CheckCircle2,
  XCircle,
  BookOpen,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { GapReport, QuizAttempt, RevisionPlan } from '@/types';
import {
  getLatestAttempt,
  getTopicMap,
  getGapReport,
  getPreviousGapReport,
  saveGapReport,
  getRevisionPlan,
  saveRevisionPlan,
  getChunks,
} from '@/lib/storage/studentStore';

export default function ReportPage() {
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [gapReport, setGapReport] = useState<GapReport | null>(null);
  const [prevReport, setPrevReport] = useState<GapReport | null>(null);
  const [plan, setPlan] = useState<RevisionPlan | null>(null);

  const [daysAvailable, setDaysAvailable] = useState(5);
  const [hoursPerDay, setHoursPerDay] = useState(2);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPlanning, setIsPlanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({});

  const generatePlan = useCallback(
    async (reportToUse: GapReport, days: number, hours: number) => {
      setIsPlanning(true);
      setError(null);
      try {
        const chunks = getChunks();
        const res = await fetch('/api/revision-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gapReport: reportToUse,
            totalDays: days,
            hoursPerDay: hours,
            chunks,
          }),
        });
        const data = await res.json();
        if (data.ok && data.plan) {
          saveRevisionPlan(data.plan);
          setPlan(data.plan);
        } else {
          setError(data.error || 'Could not generate revision plan.');
        }
      } catch {
        setError('Network error while generating revision plan.');
      } finally {
        setIsPlanning(false);
      }
    },
    []
  );

  const runGapAnalysis = useCallback(
    async (latest: QuizAttempt, existingPrev: GapReport | null) => {
      setIsAnalyzing(true);
      setError(null);
      try {
        const topicMap = getTopicMap();
        const res = await fetch('/api/gap-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            attempt: latest,
            topicMap,
            previousGapReport: existingPrev,
          }),
        });
        const data = await res.json();
        if (data.ok && data.report) {
          saveGapReport(data.report);
          setGapReport(data.report);
          setPrevReport(getPreviousGapReport());
          // Auto-generate or refresh the personalized revision plan when diagnosis updates
          await generatePlan(data.report, daysAvailable, hoursPerDay);
        } else {
          setError(data.error || 'Failed to analyze quiz results.');
        }
      } catch {
        setError('Network error while generating gap report.');
      } finally {
        setIsAnalyzing(false);
      }
    },
    [daysAvailable, hoursPerDay, generatePlan]
  );

  useEffect(() => {
    const latest = getLatestAttempt();
    const savedReport = getGapReport();
    const savedPrev = getPreviousGapReport();
    const savedPlan = getRevisionPlan();

    setAttempt(latest);
    setPrevReport(savedPrev);
    if (savedPlan) {
      setPlan(savedPlan);
      setDaysAvailable(savedPlan.totalDays);
      setHoursPerDay(savedPlan.hoursPerDay);
    }

    if (latest) {
      if (!savedReport || savedReport.attemptId !== latest.id) {
        runGapAnalysis(latest, savedReport);
      } else {
        setGapReport(savedReport);
      }
    }
  }, [runGapAnalysis]);

  const toggleTask = (taskId: string) => {
    setCheckedTasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  // Compute improvements compared to previous gap report
  const improvements =
    gapReport && prevReport
      ? gapReport.gaps
          .map((curr) => {
            const old = prevReport.gaps.find((p) => p.topicId === curr.topicId);
            if (!old) return null;
            if (curr.accuracyPercentage > old.accuracyPercentage) {
              return {
                topicName: curr.topicName,
                oldPct: old.accuracyPercentage,
                newPct: curr.accuracyPercentage,
                oldStrength: old.strength,
                newStrength: curr.strength,
              };
            }
            return null;
          })
          .filter((item): item is NonNullable<typeof item> => item !== null)
      : [];

  if (!attempt) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <div className="bg-white border border-stone-200 rounded-2xl p-10 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center mx-auto">
            <Stethoscope className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-stone-900">No Diagnosis Available Yet</h1>
          <p className="text-sm text-stone-500 max-w-md mx-auto">
            Complete a diagnostic quiz first so GapFinder AI can identify your weak topics and prescribe a personalized revision plan.
          </p>
          <Link
            href="/quiz"
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold transition-colors"
          >
            <span>Go to Diagnostic Quiz</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const strengthBadge = (strength: 'weak' | 'medium' | 'strong') => {
    if (strength === 'weak') {
      return {
        label: 'Weak · Needs Work',
        dot: 'bg-rose-500',
        pill: 'bg-rose-50 text-rose-800 border-rose-200',
        border: 'border-l-4 border-l-rose-500',
      };
    }
    if (strength === 'medium') {
      return {
        label: 'Medium · Developing',
        dot: 'bg-amber-500',
        pill: 'bg-amber-50 text-amber-800 border-amber-200',
        border: 'border-l-4 border-l-amber-500',
      };
    }
    return {
      label: 'Strong · Mastered',
      dot: 'bg-emerald-500',
      pill: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      border: 'border-l-4 border-l-emerald-500',
    };
  };

  const hasWeakOrMedium = gapReport ? gapReport.weakCount + gapReport.mediumCount > 0 : false;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-700">
            Step 3 · Study Doctor Diagnosis
          </span>
          <h1 className="text-xl font-bold text-stone-900 mt-0.5">
            Knowledge Gap Report & Revision Plan
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Based on your latest quiz ({attempt.correctQuestions}/{attempt.totalQuestions} correct ·{' '}
            {attempt.scorePercentage}%).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hasWeakOrMedium && (
            <Link
              href="/quiz?focus=weak"
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold transition-colors shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Re-test Weak Topics</span>
            </Link>
          )}
          <Link
            href="/quiz"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-semibold transition-colors"
          >
            <span>Full Re-test</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-4 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Plan Updated / Improvement Banner */}
      {improvements.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start space-x-3">
          <TrendingUp className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-emerald-900">
              Progress Detected — Your Gap Report & Revision Plan Updated
            </p>
            <p className="text-emerald-800">
              {improvements
                .map(
                  (im) =>
                    `${im.topicName}: ${im.oldPct}% (${im.oldStrength}) → ${im.newPct}% (${im.newStrength})`
                )
                .join(' · ')}
            </p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isAnalyzing && (
        <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center space-y-2">
          <div className="w-6 h-6 border-2 border-teal-700 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-medium text-stone-600">
            Analyzing your quiz answers and preparing topic-level diagnosis...
          </p>
        </div>
      )}

      {/* Gap Report Cards */}
      {gapReport && !isAnalyzing && (
        <div className="space-y-4">
          {/* Summary Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-stone-200 rounded-2xl p-4">
              <span className="text-[11px] text-stone-500">Overall Mastery</span>
              <p className="text-2xl font-bold text-stone-900 mt-0.5">{gapReport.overallScore}%</p>
            </div>
            <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4">
              <span className="text-[11px] text-rose-700 font-medium">Weak Topics</span>
              <p className="text-2xl font-bold text-rose-800 mt-0.5">{gapReport.weakCount}</p>
            </div>
            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4">
              <span className="text-[11px] text-amber-800 font-medium">Medium Topics</span>
              <p className="text-2xl font-bold text-amber-900 mt-0.5">{gapReport.mediumCount}</p>
            </div>
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4">
              <span className="text-[11px] text-emerald-700 font-medium">Strong Topics</span>
              <p className="text-2xl font-bold text-emerald-800 mt-0.5">{gapReport.strongCount}</p>
            </div>
          </div>

          {/* Topic Diagnosis List */}
          <div className="space-y-3">
            {gapReport.gaps.map((gap) => {
              const badge = strengthBadge(gap.strength);
              return (
                <div
                  key={gap.topicId}
                  className={`bg-white border border-stone-200 rounded-2xl p-5 shadow-xs ${badge.border} flex flex-col md:flex-row md:items-center justify-between gap-4`}
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center space-x-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${badge.pill}`}
                      >
                        <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                        <span>{badge.label}</span>
                      </span>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">
                        {gap.correctCount}/{gap.attemptedCount} correct ({gap.accuracyPercentage}%)
                      </span>
                      <span className="text-[11px] text-stone-500">
                        Exam Weight: <strong className="text-stone-700">{gap.examFrequency}</strong>
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-stone-900">{gap.topicName}</h3>
                    <p className="text-xs text-stone-600 leading-relaxed">{gap.diagnosticReason}</p>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <Link
                      href={`/chat?topic=${encodeURIComponent(gap.topicName)}`}
                      className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-800 text-xs font-semibold transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-teal-700" />
                      <span>Explain Topic</span>
                    </Link>
                    <Link
                      href={`/quiz?focus=${encodeURIComponent(gap.topicId)}`}
                      className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 text-xs font-semibold transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Re-test</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Personalized Revision Plan */}
      {gapReport && !isAnalyzing && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-100">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900 flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-teal-700" />
                <span>Personalized Revision Plan</span>
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Prioritizes weak & high-exam-weight topics first within your exact available study time.
              </p>
            </div>

            {/* Study Time Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center space-x-1.5 text-xs text-stone-600 bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                <span>Days:</span>
                <input
                  type="number"
                  min={1}
                  max={14}
                  value={daysAvailable}
                  onChange={(e) => setDaysAvailable(Number(e.target.value) || 1)}
                  className="w-10 bg-transparent font-bold text-stone-900 focus:outline-none text-center"
                />
              </label>

              <label className="flex items-center space-x-1.5 text-xs text-stone-600 bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                <span>Hrs/day:</span>
                <input
                  type="number"
                  min={0.5}
                  max={8}
                  step={0.5}
                  value={hoursPerDay}
                  onChange={(e) => setHoursPerDay(Number(e.target.value) || 1)}
                  className="w-10 bg-transparent font-bold text-stone-900 focus:outline-none text-center"
                />
              </label>

              <button
                type="button"
                onClick={() => generatePlan(gapReport, daysAvailable, hoursPerDay)}
                disabled={isPlanning}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:bg-stone-300 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isPlanning ? 'Updating Plan...' : 'Update Plan'}</span>
              </button>
            </div>
          </div>

          {isPlanning && (
            <div className="py-8 text-center text-xs text-stone-500">
              Scheduling your weak topics into a {daysAvailable}-day study plan...
            </div>
          )}

          {plan && !isPlanning && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plan.days.map((dayItem) => (
                <div
                  key={dayItem.day}
                  className="bg-stone-50/70 border border-stone-200 rounded-2xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-stone-200/80 pb-2">
                    <div>
                      <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider">
                        Day {dayItem.day}
                      </span>
                      <h3 className="text-sm font-bold text-stone-900">{dayItem.theme}</h3>
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white border border-stone-200 text-stone-700">
                      {dayItem.allocatedHours} hrs
                    </span>
                  </div>

                  <div className="space-y-2">
                    {dayItem.tasks.map((task) => {
                      const isDone = !!checkedTasks[task.id];
                      return (
                        <div
                          key={task.id}
                          onClick={() => toggleTask(task.id)}
                          className={`p-3 rounded-xl border text-xs transition-all cursor-pointer flex items-start space-x-2.5 ${
                            isDone
                              ? 'bg-emerald-50/50 border-emerald-200 text-stone-400 line-through'
                              : 'bg-white border-stone-200 hover:border-teal-300 text-stone-800'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isDone}
                            onChange={() => {}}
                            className="mt-0.5 accent-teal-700 rounded cursor-pointer"
                          />
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-stone-900">{task.topicName}</span>
                              <span className="text-[10px] font-mono text-stone-500 shrink-0">
                                {task.durationMinutes} min
                              </span>
                            </div>
                            <p className="text-[11px] text-stone-600 leading-snug">{task.activity}</p>
                            <p className="text-[10px] text-teal-700 font-medium flex items-center space-x-1">
                              <BookOpen className="w-3 h-3 shrink-0" />
                              <span>{task.sourceReference}</span>
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Collapsible Question-by-Question Answer Review */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
        <button
          type="button"
          onClick={() => setShowReview(!showReview)}
          className="w-full flex items-center justify-between text-xs sm:text-sm font-bold text-stone-800 cursor-pointer"
        >
          <span>Answer-by-Answer Evaluation & Source Citations ({attempt.evaluations.length})</span>
          {showReview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showReview && (
          <div className="mt-4 space-y-3 pt-4 border-t border-stone-100">
            {attempt.evaluations.map((ev, idx) => (
              <div
                key={ev.questionId}
                className={`p-4 rounded-xl border text-xs space-y-2 ${
                  ev.isCorrect
                    ? 'bg-emerald-50/40 border-emerald-200'
                    : 'bg-rose-50/40 border-rose-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-800">
                    Q{idx + 1} · {ev.topicName}
                  </span>
                  {ev.isCorrect ? (
                    <span className="inline-flex items-center space-x-1 text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Correct</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 text-rose-700 font-semibold">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Incorrect</span>
                    </span>
                  )}
                </div>
                <p className="text-stone-700 leading-relaxed">{ev.explanation}</p>
                <div className="text-[11px] text-teal-800 bg-white/80 px-3 py-2 rounded-lg border border-stone-200">
                  <strong>Citation:</strong> {ev.citation.fileName} · {ev.citation.sectionLabel}
                  {ev.citation.pageNumber ? ` (Page ${ev.citation.pageNumber})` : ''} — &ldquo;
                  {ev.citation.excerpt}&rdquo;
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

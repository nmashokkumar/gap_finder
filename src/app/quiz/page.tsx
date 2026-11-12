'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  HelpCircle,
  Sparkles,
  CheckCircle2,
  XCircle,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Check,
  AlertCircle,
} from 'lucide-react';
import { QuizQuestion, AnswerEvaluation, QuizAttempt } from '@/types';
import {
  getTopicMap,
  getChunks,
  saveQuizAttempt,
  getLatestAttempt,
  getGapReport,
} from '@/lib/storage/studentStore';

function QuizRunner() {
  const searchParams = useSearchParams();
  const focusParam = searchParams.get('focus') || '';

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [latestAttempt, setLatestAttempt] = useState<QuizAttempt | null>(null);
  const [showCitation, setShowCitation] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const attempt = getLatestAttempt();
    if (attempt) {
      setLatestAttempt(attempt);
    }
  }, []);

  const handleGenerateQuiz = async () => {
    const topics = getTopicMap();
    const chunks = getChunks();

    if (chunks.length === 0) {
      setError('No textbook notes found. Go to Workspace and upload material or load the sample dataset first.');
      return;
    }

    if (topics.length === 0) {
      setError('No Topic Map found. Go to Workspace and click "Build Topic Map" first.');
      return;
    }

    let focusTopicId: string | undefined;
    let focusTopicIds: string[] | undefined;

    if (focusParam === 'weak') {
      const report = getGapReport();
      if (report) {
        const weakAndMed = report.gaps
          .filter((g) => g.strength === 'weak' || g.strength === 'medium')
          .map((g) => g.topicId);
        if (weakAndMed.length > 0) {
          focusTopicIds = weakAndMed;
        }
      }
    } else if (focusParam) {
      focusTopicId = focusParam;
    }

    setIsLoading(true);
    setError(null);
    setIsSubmitted(false);
    setSelectedAnswers({});
    setCurrentIndex(0);

    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topics,
          chunks,
          focusTopicId,
          focusTopicIds,
        }),
      });

      const data = await res.json();
      if (data.ok && Array.isArray(data.questions) && data.questions.length > 0) {
        setQuestions(data.questions);
      } else {
        setError(data.error || 'Failed to generate diagnostic quiz.');
      }
    } catch {
      setError('Network error while generating quiz questions.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAnswer = (qId: string, optIndex: number) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [qId]: optIndex }));
  };

  const handleSubmitQuiz = () => {
    const total = questions.length;
    let correctCount = 0;
    const evaluations: AnswerEvaluation[] = [];

    for (const q of questions) {
      const chosen = selectedAnswers[q.id] ?? -1;
      const isCorrect = chosen === q.correctIndex;
      if (isCorrect) correctCount++;

      evaluations.push({
        questionId: q.id,
        topicId: q.topicId,
        topicName: q.topicName,
        selectedIndex: chosen,
        correctIndex: q.correctIndex,
        isCorrect,
        explanation: q.explanation,
        citation: q.citation,
      });
    }

    const scorePercentage = Math.round((correctCount / total) * 100);

    const attempt: QuizAttempt = {
      id: `attempt-${Date.now()}`,
      timestamp: new Date().toISOString(),
      scorePercentage,
      totalQuestions: total,
      correctQuestions: correctCount,
      evaluations,
    };

    saveQuizAttempt(attempt);
    setLatestAttempt(attempt);
    setIsSubmitted(true);
  };

  const currentQ = questions[currentIndex];
  const answeredCount = questions.filter((q) => selectedAnswers[q.id] !== undefined).length;
  const progressPercent =
    questions.length > 0 ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-700">
              Diagnostic Assessment
            </span>
            {focusParam && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                {focusParam === 'weak' ? 'Weak Topics Re-Test' : 'Focused Re-Test'}
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-stone-900 mt-0.5">
            RAG-Grounded Diagnostic Quiz
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Every question is generated strictly from your uploaded material and includes source citations.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGenerateQuiz}
          disabled={isLoading}
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:bg-stone-300 text-white text-xs font-semibold transition-colors cursor-pointer shrink-0 self-start sm:self-center"
        >
          {isLoading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Preparing Questions...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>{questions.length > 0 ? 'New Quiz' : 'Start Diagnostic Quiz'}</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-4 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <Link href="/" className="underline font-semibold shrink-0">
            Go to Workspace
          </Link>
        </div>
      )}

      {/* Empty State */}
      {questions.length === 0 && !isLoading && (
        <div className="bg-white border border-stone-200 rounded-2xl p-10 text-center space-y-4 shadow-xs">
          <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center mx-auto">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-stone-900">Ready to Find Knowledge Gaps</h2>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              Click &ldquo;Start Diagnostic Quiz&rdquo; above to generate questions grounded in your uploaded syllabus and textbook notes.
            </p>
          </div>

          {latestAttempt && (
            <div className="pt-4 border-t border-stone-100 max-w-sm mx-auto text-left bg-stone-50 p-4 rounded-xl">
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                Most Recent Attempt
              </span>
              <div className="flex items-center justify-between mt-1 text-xs">
                <span className="text-stone-600">
                  {latestAttempt.correctQuestions}/{latestAttempt.totalQuestions} correct
                </span>
                <span className="font-bold text-teal-800">{latestAttempt.scorePercentage}%</span>
              </div>
              <Link
                href="/report"
                className="mt-2.5 inline-flex items-center space-x-1 text-xs font-semibold text-teal-700 hover:underline"
              >
                <span>Open Gap Report &amp; Plan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Active Quiz Card */}
      {questions.length > 0 && currentQ && (
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="bg-white border border-stone-200 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs text-stone-600 font-medium">
              <span>
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span>
                {answeredCount}/{questions.length} answered
              </span>
            </div>
            <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-700 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
                {currentQ.topicName}
              </span>
              <span className="text-[11px] text-stone-400">
                {selectedAnswers[currentQ.id] !== undefined ? 'Answered' : 'Select one option'}
              </span>
            </div>

            <h2 className="text-base sm:text-lg font-bold text-stone-900 leading-snug">
              {currentQ.question}
            </h2>

            <div className="space-y-2.5">
              {currentQ.options.map((option, optIdx) => {
                const isSelected = selectedAnswers[currentQ.id] === optIdx;
                const isCorrect = isSubmitted && optIdx === currentQ.correctIndex;
                const isWrongSelected = isSubmitted && isSelected && !isCorrect;

                let cardStyle = 'border-stone-200 bg-white hover:border-teal-400 hover:bg-stone-50';
                if (isSelected && !isSubmitted) {
                  cardStyle = 'border-teal-700 bg-teal-50/50';
                } else if (isCorrect) {
                  cardStyle = 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-semibold';
                } else if (isWrongSelected) {
                  cardStyle = 'border-rose-400 bg-rose-50/70 text-rose-950';
                }

                return (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => handleSelectAnswer(currentQ.id, optIdx)}
                    className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-between ${cardStyle}`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 rounded-full border border-stone-300 bg-white flex items-center justify-center font-bold text-stone-600 text-xs shrink-0">
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span>{option}</span>
                    </div>

                    {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                    {isWrongSelected && <XCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Source Citation */}
            <div className="pt-3 border-t border-stone-100 space-y-2">
              <button
                type="button"
                onClick={() =>
                  setShowCitation((prev) => ({
                    ...prev,
                    [currentQ.id]: !prev[currentQ.id],
                  }))
                }
                className="text-xs font-semibold text-teal-700 hover:text-teal-900 inline-flex items-center space-x-1.5 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>
                  {showCitation[currentQ.id] ? 'Hide Source Citation' : 'View Source Citation'}:{' '}
                  {currentQ.citation.sectionLabel}
                  {currentQ.citation.pageNumber ? ` (Page ${currentQ.citation.pageNumber})` : ''}
                </span>
              </button>

              {showCitation[currentQ.id] && (
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-stone-500 font-mono">
                    <span className="font-semibold text-stone-800">{currentQ.citation.fileName}</span>
                    <span>
                      {currentQ.citation.pageNumber
                        ? `Page ${currentQ.citation.pageNumber}`
                        : currentQ.citation.sectionLabel}
                    </span>
                  </div>
                  <blockquote className="italic text-stone-700 border-l-2 border-teal-600 pl-3 leading-relaxed">
                    &ldquo;{currentQ.citation.excerpt}&rdquo;
                  </blockquote>
                </div>
              )}

              {isSubmitted && (
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 text-xs space-y-1">
                  <span className="font-bold text-stone-900">Why this answer:</span>
                  <p className="text-stone-700 leading-relaxed">{currentQ.explanation}</p>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="inline-flex items-center space-x-1 px-3.5 py-2 rounded-xl border border-stone-200 hover:bg-stone-50 disabled:opacity-40 text-xs font-semibold text-stone-700 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <div className="flex items-center space-x-2">
                {currentIndex < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))
                    }
                    className="inline-flex items-center space-x-1 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold cursor-pointer"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : !isSubmitted ? (
                  <button
                    type="button"
                    onClick={handleSubmitQuiz}
                    disabled={!allAnswered}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:bg-stone-300 disabled:cursor-not-allowed text-white text-xs font-semibold cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>
                      {allAnswered
                        ? 'Submit Quiz & Diagnose'
                        : `Answer all (${answeredCount}/${questions.length})`}
                    </span>
                  </button>
                ) : (
                  <Link
                    href="/report"
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold"
                  >
                    <span>Open Gap Report &amp; Plan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Post-Submit Banner */}
      {isSubmitted && latestAttempt && (
        <div className="bg-teal-900 rounded-2xl p-5 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="space-y-0.5 text-center sm:text-left">
            <span className="text-[11px] text-teal-200 font-semibold uppercase tracking-wider">
              Quiz Complete
            </span>
            <h3 className="text-base font-bold">
              Score: {latestAttempt.correctQuestions}/{latestAttempt.totalQuestions} (
              {latestAttempt.scorePercentage}%)
            </h3>
            <p className="text-xs text-teal-100">
              View your topic-level Gap Report and personalized revision schedule.
            </p>
          </div>

          <Link
            href="/report"
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-white text-teal-900 hover:bg-stone-100 text-xs font-bold transition-colors shrink-0"
          >
            <span>View Gap Report &amp; Plan</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}

export default function QuizPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center text-xs text-stone-500">
          Loading diagnostic quiz...
        </div>
      }
    >
      <QuizRunner />
    </Suspense>
  );
}

'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  HelpCircle, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  BookOpen, 
  ArrowRight, 
  ArrowLeft,
  Check
} from 'lucide-react';
import { QuizQuestion, AnswerEvaluation, QuizAttempt } from '@/types';
import { 
  getTopicMap, 
  getChunks, 
  saveQuizAttempt, 
  getLatestAttempt 
} from '@/lib/storage/studentStore';

function QuizRunner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const focusTopicId = searchParams.get('focus') || undefined;

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
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
      alert('Please upload or load study materials in Step 1 first!');
      router.push('/');
      return;
    }

    if (topics.length === 0) {
      alert('Please generate a Topic Map in Step 2 first!');
      router.push('/');
      return;
    }

    setIsLoading(true);
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
        }),
      });

      const data = await res.json();
      if (data.ok && Array.isArray(data.questions) && data.questions.length > 0) {
        setQuestions(data.questions);
      } else {
        alert(data.error || 'Failed to generate quiz questions');
      }
    } catch (err) {
      console.error(err);
      alert('Error contacting quiz generator API');
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
  const progressPercent = questions.length > 0 ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0;
  const allAnswered = questions.length > 0 && questions.every((q) => selectedAnswers[q.id] !== undefined);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
              <span>Step 2: Diagnostic Assessment</span>
            </h1>
            {focusTopicId && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                Focus Re-Test
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            100% RAG-grounded questions generated strictly from your uploaded materials with exact source citations.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGenerateQuiz}
          disabled={isLoading}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer shrink-0"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Generating Questions with Groq...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>{questions.length > 0 ? 'Regenerate Quiz' : 'Start Diagnostic Quiz'}</span>
            </>
          )}
        </button>
      </div>

      {/* No Quiz Active State */}
      {questions.length === 0 && !isLoading && (
        <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mx-auto">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-slate-800">Ready to Diagnose Knowledge Gaps?</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Click &ldquo;Start Diagnostic Quiz&rdquo; above. The AI will retrieve the most relevant sections from your uploaded textbook notes and formulate grounded test questions.
            </p>
          </div>

          {latestAttempt && (
            <div className="pt-4 border-t border-slate-100 max-w-md mx-auto text-left bg-slate-50 p-4 rounded-2xl">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Previous Attempt</span>
              <div className="flex items-center justify-between mt-1 text-xs">
                <span className="text-slate-500">{new Date(latestAttempt.timestamp).toLocaleTimeString()}</span>
                <span className="font-bold text-indigo-600">{latestAttempt.scorePercentage}% Score</span>
              </div>
              <Link
                href="/report"
                className="mt-3 block text-center text-xs font-semibold text-indigo-600 hover:underline"
              >
                View Latest Gap Report & Plan &rarr;
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Active Quiz Runner */}
      {questions.length > 0 && currentQ && (
        <div className="space-y-6">
          {/* Progress Indicator */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>Question {currentIndex + 1} of {questions.length}</span>
              <span className="text-indigo-600 font-bold">{progressPercent}% Completed</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
                {currentQ.topicName}
              </span>
              <span className="text-xs text-slate-400">
                {selectedAnswers[currentQ.id] !== undefined ? 'Answered' : 'Not Answered'}
              </span>
            </div>

            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
              {currentQ.question}
            </h2>

            {/* Options List */}
            <div className="space-y-3">
              {currentQ.options.map((option, optIdx) => {
                const isSelected = selectedAnswers[currentQ.id] === optIdx;
                const isCorrect = isSubmitted && optIdx === currentQ.correctIndex;
                const isWrongSelected = isSubmitted && isSelected && !isCorrect;

                let cardStyle = 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50';
                if (isSelected && !isSubmitted) {
                  cardStyle = 'border-indigo-600 bg-indigo-50/50 shadow-sm';
                } else if (isCorrect) {
                  cardStyle = 'border-emerald-500 bg-emerald-50/70 text-emerald-900 font-semibold';
                } else if (isWrongSelected) {
                  cardStyle = 'border-rose-400 bg-rose-50/70 text-rose-900';
                }

                return (
                  <div
                    key={optIdx}
                    onClick={() => handleSelectAnswer(currentQ.id, optIdx)}
                    className={`p-4 rounded-2xl border text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-between ${cardStyle}`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center font-bold text-slate-600 text-xs shrink-0">
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span>{option}</span>
                    </div>

                    {isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
                    {isWrongSelected && <XCircle className="w-5 h-5 text-rose-600 shrink-0" />}
                  </div>
                );
              })}
            </div>

            {/* Citation & Grounding Evidence Card (Mandatory Requirement) */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <button
                type="button"
                onClick={() =>
                  setShowCitation((prev) => ({
                    ...prev,
                    [currentQ.id]: !prev[currentQ.id],
                  }))
                }
                className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 flex items-center space-x-1.5 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>
                  Source Citation: {currentQ.citation.sectionLabel}{' '}
                  {currentQ.citation.pageNumber ? `(Page ${currentQ.citation.pageNumber})` : ''}
                </span>
              </button>

              {showCitation[currentQ.id] && (
                <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-2xl p-4 text-xs space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span className="font-semibold text-indigo-900">Document Source: {currentQ.citation.fileName}</span>
                    <span>{currentQ.citation.pageNumber ? `Page ${currentQ.citation.pageNumber}` : 'Source Excerpt'}</span>
                  </div>
                  <blockquote className="italic text-slate-700 border-l-2 border-indigo-400 pl-3 leading-relaxed">
                    &ldquo;{currentQ.citation.excerpt}&rdquo;
                  </blockquote>
                </div>
              )}

              {/* Submitted Explanation */}
              {isSubmitted && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-1 mt-3">
                  <span className="font-bold text-slate-800">Evaluation Explanation:</span>
                  <p className="text-slate-600 leading-relaxed">{currentQ.explanation}</p>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 text-xs font-semibold text-slate-700 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <div className="flex items-center space-x-2">
                {currentIndex < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-colors"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : !isSubmitted ? (
                  <button
                    type="button"
                    onClick={handleSubmitQuiz}
                    disabled={!allAnswered}
                    className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md shadow-emerald-100 transition-all cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Submit Diagnostic Quiz</span>
                  </button>
                ) : (
                  <Link
                    href="/report"
                    className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100 transition-all cursor-pointer"
                  >
                    <span>View Gap Report & Plan</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submitted Result Banner */}
      {isSubmitted && latestAttempt && (
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-3xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-xs text-indigo-300 font-semibold uppercase tracking-wider">Diagnosis Ready</span>
            <h3 className="text-lg font-bold">
              Score: {latestAttempt.correctQuestions} / {latestAttempt.totalQuestions} ({latestAttempt.scorePercentage}%)
            </h3>
            <p className="text-xs text-slate-300">
              Your answers have been evaluated. Head to the Gap Report to see weak areas and your custom revision timetable.
            </p>
          </div>

          <Link
            href="/report"
            className="inline-flex items-center space-x-2 px-5 py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs sm:text-sm font-bold shadow-md transition-all shrink-0"
          >
            <span>Open Gap Report & Plan</span>
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
        <div className="min-h-[50vh] flex items-center justify-center text-xs text-slate-500">
          Loading diagnostic quiz...
        </div>
      }
    >
      <QuizRunner />
    </Suspense>
  );
}

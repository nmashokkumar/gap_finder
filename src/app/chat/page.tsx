'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, UIMessage } from 'ai';
import {
  MessageSquare,
  Send,
  BookOpen,
  AlertCircle,
  ShieldAlert,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { TextChunk, TopicGap, TopicNode } from '@/types';
import { getChunks, getGapReport, getTopicMap } from '@/lib/storage/studentStore';
import type { ChatMessageMetadata } from '@/app/api/chat/route';

function ChatWorkspace() {
  const searchParams = useSearchParams();
  const initialTopic = searchParams.get('topic') || '';

  const [chunks, setChunks] = useState<TextChunk[]>([]);
  const [suggestedTopics, setSuggestedTopics] = useState<
    Array<{ label: string; strength?: 'weak' | 'medium' | 'strong' }>
  >([]);
  const [inputValue, setInputValue] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, error, setMessages } = useChat<
    UIMessage<ChatMessageMetadata>
  >({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
  });

  useEffect(() => {
    const loadedChunks = getChunks();
    setChunks(loadedChunks);

    const gapReport = getGapReport();
    const topicMap: TopicNode[] = getTopicMap();

    if (gapReport && gapReport.gaps.length > 0) {
      setSuggestedTopics(
        gapReport.gaps.map((g: TopicGap) => ({
          label: g.topicName,
          strength: g.strength,
        }))
      );
    } else if (topicMap.length > 0) {
      setSuggestedTopics(topicMap.map((t) => ({ label: t.name })));
    }

    if (initialTopic) {
      setInputValue(
        `Explain "${initialTopic}" clearly using only my uploaded textbook notes.`
      );
    }
  }, [initialTopic]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  const isBusy = status === 'submitted' || status === 'streaming';

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend ?? inputValue).trim();
    if (!text || isBusy) return;

    if (!textToSend) setInputValue('');
    await sendMessage(
      { text },
      {
        body: { chunks },
      }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend();
  };

  const getMessageText = (msg: UIMessage<ChatMessageMetadata>): string => {
    return msg.parts
      .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map((p) => p.text)
      .join('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-700">
            Step 4 · Grounded RAG Tutor
          </span>
          <h1 className="text-xl font-bold text-stone-900 mt-0.5 flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-teal-700" />
            <span>Explain-This-Topic Assistant</span>
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Answers strictly from your uploaded materials ({chunks.length} indexed chunks). Out-of-scope questions are refused.
          </p>
        </div>

        {messages.length > 0 && (
          <button
            type="button"
            onClick={() => setMessages([])}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-medium text-stone-600 hover:bg-stone-50 cursor-pointer self-start sm:self-center"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Chat</span>
          </button>
        )}
      </div>

      {chunks.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3 text-xs text-amber-900">
            <AlertCircle className="w-5 h-5 text-amber-700 shrink-0" />
            <span>
              No study material is loaded yet. Upload notes or load the sample dataset on the Workspace first so the assistant has material to retrieve from.
            </span>
          </div>
          <Link
            href="/"
            className="px-3.5 py-2 rounded-xl bg-teal-700 text-white text-xs font-semibold shrink-0"
          >
            Go to Workspace
          </Link>
        </div>
      )}

      {/* Quick Topic Pills */}
      {suggestedTopics.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold text-stone-500">Ask about a topic:</span>
          {suggestedTopics.map((t, idx) => {
            const pillColor =
              t.strength === 'weak'
                ? 'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100'
                : t.strength === 'medium'
                ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50';

            return (
              <button
                key={idx}
                type="button"
                disabled={isBusy}
                onClick={() =>
                  handleSend(`Explain "${t.label}" clearly using my uploaded notes.`)
                }
                className={`text-xs font-medium px-3 py-1 rounded-full border transition-colors cursor-pointer ${pillColor}`}
              >
                {t.strength === 'weak' ? '🔴 ' : t.strength === 'medium' ? '🟡 ' : ''}
                {t.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Chat Stream Window */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm flex flex-col h-[520px]">
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-3 px-4">
              <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-1 max-w-md">
                <p className="text-sm font-bold text-stone-800">
                  Ask Anything Covered in Your Notes
                </p>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Try asking: &ldquo;Why is Binary Cross-Entropy used instead of MSE for Logistic Regression?&rdquo; or test the guardrail by asking an unrelated trivia question.
                </p>
              </div>
            </div>
          )}

          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            const text = getMessageText(msg);
            const meta = msg.metadata;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-2`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                    isUser
                      ? 'bg-teal-700 text-white'
                      : 'bg-stone-50 border border-stone-200 text-stone-800'
                  }`}
                >
                  {text}
                </div>

                {/* Assistant Citations or Out-of-Scope Refusal Badge */}
                {!isUser && meta && (
                  <div className="max-w-[85%] space-y-1.5">
                    {meta.grounded && meta.sources && meta.sources.length > 0 ? (
                      <div className="bg-teal-50/60 border border-teal-200/80 rounded-xl p-3 space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 flex items-center space-x-1">
                          <BookOpen className="w-3 h-3" />
                          <span>Retrieved Source Citations ({meta.sources.length})</span>
                        </span>
                        <div className="space-y-1">
                          {meta.sources.map((src, i) => (
                            <div
                              key={`${src.chunkId}-${i}`}
                              className="text-[11px] text-stone-700 bg-white/90 px-2.5 py-1.5 rounded-lg border border-stone-200/80"
                            >
                              <div className="flex items-center justify-between font-semibold text-teal-900">
                                <span>
                                  {src.fileName} · {src.sectionLabel}
                                  {src.pageNumber ? ` (Page ${src.pageNumber})` : ''}
                                </span>
                                <span className="font-mono text-[10px] text-stone-500">
                                  Sim: {src.score}
                                </span>
                              </div>
                              <p className="text-stone-500 italic mt-0.5 line-clamp-2">
                                &ldquo;{src.excerpt}&rdquo;
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="inline-flex items-center space-x-1.5 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                        <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                        <span>No matching section in uploaded material — outside knowledge blocked</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {isBusy && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex items-start">
              <div className="bg-stone-50 border border-stone-200 rounded-2xl px-4 py-2.5 text-xs text-stone-500 animate-pulse">
                Retrieving relevant passages &amp; generating grounded answer...
              </div>
            </div>
          )}

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 text-xs">
              Error: {error.message}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleSubmit}
          className="p-3 border-t border-stone-200 bg-stone-50/70 rounded-b-2xl flex items-center space-x-2"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask a question about your uploaded syllabus or notes..."
            disabled={isBusy}
            className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 bg-white text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
          />
          <button
            type="submit"
            disabled={isBusy || !inputValue.trim()}
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:bg-stone-300 text-white text-xs font-semibold transition-colors cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Ask</span>
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center text-xs text-stone-500">
          Loading Explain-This-Topic assistant...
        </div>
      }
    >
      <ChatWorkspace />
    </Suspense>
  );
}

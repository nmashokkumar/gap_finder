'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

function normalizeMathDelimiters(text: string): string {
  return text
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, inner) => `$$${inner}$$`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, inner) => `$${inner}$`);
}

export default function MarkdownMessage({ content }: { content: string }) {
  const normalized = normalizeMathDelimiters(content);

  return (
    <div className="prose prose-sm prose-stone max-w-none break-words text-xs sm:text-sm leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-base font-bold text-stone-900 mt-3 mb-1.5">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm sm:text-base font-bold text-stone-900 mt-3 mb-1.5">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs sm:text-sm font-bold text-stone-900 mt-2.5 mb-1">{children}</h3>
          ),
          p: ({ children }) => <p className="mb-2 last:mb-0 text-stone-800">{children}</p>,
          ul: ({ children }) => (
            <ul className="list-disc pl-5 mb-2 space-y-1 text-stone-800">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 mb-2 space-y-1 text-stone-800">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          strong: ({ children }) => (
            <strong className="font-semibold text-stone-950">{children}</strong>
          ),
          code: ({ children, className }) => {
            const isBlock = Boolean(className);
            return isBlock ? (
              <code className="block bg-stone-900 text-stone-100 p-3 rounded-xl text-xs font-mono overflow-x-auto my-2">
                {children}
              </code>
            ) : (
              <code className="bg-stone-200/70 text-stone-900 px-1.5 py-0.5 rounded text-[11px] font-mono">
                {children}
              </code>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-teal-600 pl-3 italic text-stone-600 my-2">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-2">
              <table className="min-w-full border border-stone-200 text-xs">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-stone-200 bg-stone-100 px-2.5 py-1.5 text-left font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-stone-200 px-2.5 py-1.5">{children}</td>
          ),
        }}
      >
        {normalized}
      </ReactMarkdown>
    </div>
  );
}

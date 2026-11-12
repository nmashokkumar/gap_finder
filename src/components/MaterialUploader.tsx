'use client';

import React, { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';
import { DocumentType, StudyDocument, TextChunk } from '@/types';
import {
  getDocuments,
  saveDocument,
  getChunks,
  saveChunks,
  loadSampleDataset,
} from '@/lib/storage/studentStore';
import { extractTextFromFile } from '@/lib/pdf/extractPdfText';
import { chunkDocument } from '@/lib/rag/chunker';

const UPLOAD_CONFIG: {
  type: DocumentType;
  title: string;
  subtitle: string;
  placeholder: string;
}[] = [
  {
    type: 'syllabus',
    title: '1. Syllabus',
    subtitle: 'Course topics and module outline',
    placeholder: 'Paste your syllabus topics here (e.g. Module 1: Supervised Learning...)',
  },
  {
    type: 'notes',
    title: '2. Textbook & Notes',
    subtitle: 'Chapters and notes for grounded quizzes & explanations',
    placeholder: 'Paste textbook chapters, definitions, or lecture notes here...',
  },
  {
    type: 'past_paper',
    title: '3. Past Papers',
    subtitle: 'Previous exam questions to measure topic frequency',
    placeholder: 'Paste past exam questions here to map them to syllabus topics...',
  },
];

export default function MaterialUploader({ onUpdate }: { onUpdate?: () => void }) {
  const [documents, setDocuments] = useState<StudyDocument[]>([]);
  const [chunks, setChunks] = useState<TextChunk[]>([]);
  const [activeTab, setActiveTab] = useState<DocumentType>('syllabus');
  const [textInput, setTextInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null
  );

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setDocuments(getDocuments());
    setChunks(getChunks());
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: DocumentType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setStatusMessage(null);
    try {
      const extractedText = await extractTextFromFile(file);
      const docId = `doc-${type}-${Date.now()}`;

      const newDoc: StudyDocument = {
        id: docId,
        type,
        fileName: file.name,
        rawText: extractedText,
        uploadedAt: new Date().toISOString(),
      };

      saveDocument(newDoc);

      const newChunks = chunkDocument(docId, type, file.name, extractedText);
      const existingChunks = getChunks().filter((c) => c.docType !== type);
      saveChunks([...existingChunks, ...newChunks]);

      refreshData();
      setStatusMessage({
        type: 'ok',
        text: `Indexed "${file.name}" into ${newChunks.length} searchable sections.`,
      });
      if (onUpdate) onUpdate();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Could not extract readable text from file. Try pasting text instead.';
      setStatusMessage({ type: 'err', text: message });
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  const handleTextSubmit = (type: DocumentType) => {
    if (!textInput.trim()) return;

    setIsProcessing(true);
    setStatusMessage(null);
    const docId = `doc-${type}-${Date.now()}`;
    const fileName = `${type.replace('_', '-')}-notes.txt`;

    const newDoc: StudyDocument = {
      id: docId,
      type,
      fileName,
      rawText: textInput.trim(),
      uploadedAt: new Date().toISOString(),
    };

    saveDocument(newDoc);

    const newChunks = chunkDocument(docId, type, fileName, textInput.trim());
    const existingChunks = getChunks().filter((c) => c.docType !== type);
    saveChunks([...existingChunks, ...newChunks]);

    setTextInput('');
    refreshData();
    setIsProcessing(false);
    setStatusMessage({
      type: 'ok',
      text: `Saved & indexed ${newChunks.length} sections for ${type.replace('_', ' ')}.`,
    });
    if (onUpdate) onUpdate();
  };

  const handleLoadSample = () => {
    const res = loadSampleDataset();
    refreshData();
    setStatusMessage({
      type: 'ok',
      text: `Loaded AI/ML sample curriculum (${res.documents.length} files, ${res.chunks.length} indexed sections).`,
    });
    if (onUpdate) onUpdate();
  };

  return (
    <section className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
        <div>
          <h2 className="text-base font-bold text-stone-900">1. Study Materials</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Upload PDF or text files ({documents.length} files · {chunks.length} indexed sections)
          </p>
        </div>

        <button
          type="button"
          onClick={handleLoadSample}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold transition-colors cursor-pointer shrink-0 self-start sm:self-center"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
          <span>Load AI/ML Sample Material</span>
        </button>
      </div>

      {/* 3 Material Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {UPLOAD_CONFIG.map((config) => {
          const doc = documents.find((d) => d.type === config.type);
          const isSelected = activeTab === config.type;

          return (
            <button
              key={config.type}
              type="button"
              onClick={() => setActiveTab(config.type)}
              className={`text-left p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'border-teal-700 bg-teal-50/40'
                  : 'border-stone-200 hover:border-stone-300 bg-white'
              }`}
            >
              <div className="space-y-1 w-full">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-900">{config.title}</span>
                  {doc ? (
                    <span className="inline-flex items-center space-x-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Ready</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-stone-400">Optional / Empty</span>
                  )}
                </div>
                <p className="text-[11px] text-stone-500 leading-snug">{config.subtitle}</p>
              </div>

              {doc && (
                <div className="mt-2.5 pt-2 border-t border-stone-100 text-[11px] text-stone-600 flex items-center space-x-1 truncate font-mono w-full">
                  <FileText className="w-3 h-3 text-teal-700 shrink-0" />
                  <span className="truncate">{doc.fileName}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Uploader Box */}
      <div className="bg-stone-50/80 border border-stone-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold text-stone-800">
            Add {UPLOAD_CONFIG.find((c) => c.type === activeTab)?.title}
          </span>
          <label className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-stone-100 border border-stone-200 text-xs font-medium text-stone-700 transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-teal-700" />
            <span>{isProcessing ? 'Reading PDF...' : 'Choose PDF or TXT File'}</span>
            <input
              type="file"
              accept=".pdf,.txt,.md"
              onChange={(e) => handleFileUpload(e, activeTab)}
              disabled={isProcessing}
              className="hidden"
            />
          </label>
        </div>

        <textarea
          rows={3}
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder={UPLOAD_CONFIG.find((c) => c.type === activeTab)?.placeholder}
          className="w-full p-3 rounded-xl border border-stone-200 bg-white text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
        />

        <div className="flex items-center justify-between gap-3">
          <div className="text-xs">
            {statusMessage && (
              <span
                className={`inline-flex items-center space-x-1.5 ${
                  statusMessage.type === 'ok' ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {statusMessage.type === 'ok' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                )}
                <span>{statusMessage.text}</span>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleTextSubmit(activeTab)}
            disabled={isProcessing || !textInput.trim()}
            className="px-4 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 disabled:bg-stone-300 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors cursor-pointer shrink-0"
          >
            Save Pasted Text
          </button>
        </div>
      </div>
    </section>
  );
}

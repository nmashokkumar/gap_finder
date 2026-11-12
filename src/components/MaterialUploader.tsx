'use client';

import React, { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle2, Sparkles, AlertCircle, X, Trash2 } from 'lucide-react';
import { DocumentType, StudyDocument, TextChunk } from '@/types';
import {
  getDocuments,
  saveDocument,
  removeDocument,
  clearAllStudentData,
  getChunks,
  saveChunks,
  loadSampleDataset,
  isSampleDatasetActive,
} from '@/lib/storage/studentStore';
import { extractTextFromFile } from '@/lib/pdf/extractPdfText';
import { chunkDocument } from '@/lib/rag/chunker';

const UPLOAD_CONFIG: {
  type: DocumentType;
  title: string;
  subtitle: string;
  placeholder: string;
  defaultPastedName: string;
}[] = [
  {
    type: 'syllabus',
    title: '1. Syllabus',
    subtitle: 'Course modules and topic outline',
    placeholder: 'Paste your syllabus topics here (e.g. Module 1: Data Ingestion, Module 2: Modeling...)',
    defaultPastedName: 'Custom_Syllabus.txt',
  },
  {
    type: 'notes',
    title: '2. Textbook & Notes',
    subtitle: 'Chapters and notes for grounded quizzes & chat',
    placeholder: 'Paste textbook chapters, definitions, or lecture notes here...',
    defaultPastedName: 'Custom_Notes.txt',
  },
  {
    type: 'past_paper',
    title: '3. Past Papers',
    subtitle: 'Previous exam questions to measure topic frequency',
    placeholder: 'Paste past exam questions here to map them to syllabus topics...',
    defaultPastedName: 'Custom_Past_Papers.txt',
  },
];

export default function MaterialUploader({ onUpdate }: { onUpdate?: () => void }) {
  const [documents, setDocuments] = useState<StudyDocument[]>([]);
  const [chunks, setChunks] = useState<TextChunk[]>([]);
  const [activeTab, setActiveTab] = useState<DocumentType>('syllabus');
  const [textInput, setTextInput] = useState('');
  const [processingType, setProcessingType] = useState<DocumentType | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null
  );

  const refreshData = () => {
    setDocuments(getDocuments());
    setChunks(getChunks());
  };

  useEffect(() => {
    refreshData();
    window.addEventListener('gapfinder-state-changed', refreshData);
    return () => window.removeEventListener('gapfinder-state-changed', refreshData);
  }, []);

  const processFile = async (file: File, type: DocumentType) => {
    setProcessingType(type);
    setActiveTab(type);
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
        text: `Indexed "${file.name}" (${newChunks.length} searchable sections).`,
      });
      if (onUpdate) onUpdate();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Could not extract readable text from file. Try pasting text instead.';
      setStatusMessage({ type: 'err', text: message });
    } finally {
      setProcessingType(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: DocumentType) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    await processFile(file, type);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, type: DocumentType) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await processFile(file, type);
  };

  const handleRemoveDoc = (e: React.MouseEvent, type: DocumentType, fileName: string) => {
    e.stopPropagation();
    removeDocument(type);
    refreshData();
    setStatusMessage({
      type: 'ok',
      text: `Removed "${fileName}".`,
    });
    if (onUpdate) onUpdate();
  };

  const handleTextSubmit = (type: DocumentType) => {
    if (!textInput.trim()) return;

    setProcessingType(type);
    setStatusMessage(null);
    const config = UPLOAD_CONFIG.find((c) => c.type === type);
    const docId = `doc-${type}-${Date.now()}`;
    const fileName = config?.defaultPastedName || `${type.replace('_', '-')}.txt`;

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
    setProcessingType(null);
    setStatusMessage({
      type: 'ok',
      text: `Saved "${fileName}" (${newChunks.length} sections).`,
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

  const handleClearAll = () => {
    clearAllStudentData();
    refreshData();
    setStatusMessage({
      type: 'ok',
      text: 'Cleared all files. Upload your own PDF or TXT files below.',
    });
    if (onUpdate) onUpdate();
  };

  const sampleActive = isSampleDatasetActive();
  const isBusy = processingType !== null;
  const activeConfig = UPLOAD_CONFIG.find((c) => c.type === activeTab)!;
  const activeDoc = documents.find((d) => d.type === activeTab);

  return (
    <section className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
        <div>
          <h2 className="text-base font-bold text-stone-900">1. Study Materials</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Upload your own PDF or TXT files ({documents.length} files · {chunks.length} indexed sections)
            {sampleActive && ' · Sample active'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
          {documents.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="inline-flex items-center space-x-1 px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-stone-500" />
              <span>Clear All</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleLoadSample}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold transition-colors cursor-pointer shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            <span>Load AI/ML Sample Material</span>
          </button>
        </div>
      </div>

      {/* 3 Material Upload Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {UPLOAD_CONFIG.map((config) => {
          const doc = documents.find((d) => d.type === config.type);
          const isSelected = activeTab === config.type;
          const isCardBusy = processingType === config.type;

          return (
            <div
              key={config.type}
              onClick={() => setActiveTab(config.type)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, config.type)}
              className={`text-left p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                isSelected
                  ? 'border-teal-700 bg-teal-50/40'
                  : 'border-stone-200 hover:border-stone-300 bg-white'
              }`}
            >
              <div className="space-y-1 w-full">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-stone-900">{config.title}</span>
                  {doc ? (
                    <span className="inline-flex items-center space-x-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{doc.id.startsWith('doc-sample-') ? 'Sample' : 'Ready'}</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-stone-400">Empty</span>
                  )}
                </div>
                <p className="text-[11px] text-stone-500 leading-snug">{config.subtitle}</p>
              </div>

              <div className="space-y-2 pt-2 border-t border-stone-100">
                {doc && (
                  <div className="text-[11px] text-stone-700 flex items-center justify-between gap-1.5 font-mono">
                    <div className="flex items-center space-x-1 truncate">
                      <FileText className="w-3 h-3 text-teal-700 shrink-0" />
                      <span className="truncate" title={doc.fileName}>
                        {doc.fileName}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleRemoveDoc(e, config.type, doc.fileName)}
                      title={`Remove ${doc.fileName}`}
                      className="p-0.5 rounded text-stone-400 hover:text-rose-700 hover:bg-rose-50 shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <label
                  onClick={(e) => e.stopPropagation()}
                  className="w-full inline-flex items-center justify-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-white hover:bg-stone-100 border border-stone-200 text-[11px] font-semibold text-stone-700 transition-colors cursor-pointer"
                >
                  <Upload className="w-3 h-3 text-teal-700" />
                  <span>
                    {isCardBusy
                      ? 'Reading file...'
                      : doc
                      ? 'Replace PDF / TXT'
                      : 'Upload PDF / TXT'}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
                    onChange={(e) => handleFileUpload(e, config.type)}
                    disabled={isBusy}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          );
        })}
      </div>

      {/* Paste / Drop Box for Active Slot */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleDrop(e, activeTab)}
        className="bg-stone-50/80 border border-stone-200 rounded-xl p-4 space-y-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2 text-xs">
            <span className="font-semibold text-stone-800">Or paste text for {activeConfig.title}</span>
            {activeDoc && (
              <span className="text-[11px] font-mono text-stone-500 truncate max-w-[220px]">
                ({activeDoc.fileName})
              </span>
            )}
          </div>
          <label className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-stone-100 border border-stone-200 text-xs font-medium text-stone-700 transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-teal-700" />
            <span>{isBusy ? 'Reading file...' : 'Choose PDF or TXT File'}</span>
            <input
              type="file"
              accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
              onChange={(e) => handleFileUpload(e, activeTab)}
              disabled={isBusy}
              className="hidden"
            />
          </label>
        </div>

        <textarea
          rows={3}
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder={activeConfig.placeholder}
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
            disabled={isBusy || !textInput.trim()}
            className="px-4 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 disabled:bg-stone-300 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors cursor-pointer shrink-0"
          >
            Save Pasted Text
          </button>
        </div>
      </div>
    </section>
  );
}

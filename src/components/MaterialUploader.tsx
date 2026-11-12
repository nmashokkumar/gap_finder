'use client';

import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  Search, 
  Sparkles, 
  Layers, 
  ChevronDown, 
  ChevronUp,
  BookOpen
} from 'lucide-react';
import { DocumentType, StudyDocument, TextChunk, RetrievedChunk } from '@/types';
import { 
  getDocuments, 
  saveDocument, 
  getChunks, 
  saveChunks, 
  loadSampleDataset 
} from '@/lib/storage/studentStore';
import { extractTextFromFile } from '@/lib/pdf/extractPdfText';
import { chunkDocument } from '@/lib/rag/chunker';
import { retrieveTopK } from '@/lib/rag/retriever';

const UPLOAD_CONFIG: {
  type: DocumentType;
  title: string;
  subtitle: string;
  placeholder: string;
}[] = [
  {
    type: 'syllabus',
    title: '1. Syllabus & Topic List',
    subtitle: 'Course outline, modules, and subtopics',
    placeholder: 'Paste syllabus topics here (e.g. Module 1: Supervised Learning...)',
  },
  {
    type: 'notes',
    title: '2. Textbook Chapters & Notes',
    subtitle: 'Core study material the quiz will be grounded in',
    placeholder: 'Paste textbook chapter excerpts, formulas, or lecture notes here...',
  },
  {
    type: 'past_paper',
    title: '3. Past Question Papers',
    subtitle: 'Previous exam questions to determine topic weightage',
    placeholder: 'Paste past exam questions here to identify high-frequency topics...',
  },
];

export default function MaterialUploader({ onUpdate }: { onUpdate?: () => void }) {
  const [documents, setDocuments] = useState<StudyDocument[]>([]);
  const [chunks, setChunks] = useState<TextChunk[]>([]);
  const [activeTab, setActiveTab] = useState<DocumentType>('syllabus');
  const [textInput, setTextInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [testResults, setTestResults] = useState<RetrievedChunk[]>([]);
  const [showChunkViewer, setShowChunkViewer] = useState(false);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    const docs = getDocuments();
    const ch = getChunks();
    setDocuments(docs);
    setChunks(ch);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: DocumentType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
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

      // Slices notes and materials into chunks
      const newChunks = chunkDocument(docId, type, file.name, extractedText);
      const existingChunks = getChunks().filter((c) => c.docType !== type);
      const allChunks = [...existingChunks, ...newChunks];
      saveChunks(allChunks);

      refreshData();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Failed to process file', err);
      alert('Error extracting file text. Please try pasting raw text instead.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTextSubmit = (type: DocumentType) => {
    if (!textInput.trim()) return;

    setIsProcessing(true);
    const docId = `doc-${type}-${Date.now()}`;
    const fileName = `${type.toUpperCase()}_Text_Entry.txt`;

    const newDoc: StudyDocument = {
      id: docId,
      type,
      fileName,
      rawText: textInput,
      uploadedAt: new Date().toISOString(),
    };

    saveDocument(newDoc);

    const newChunks = chunkDocument(docId, type, fileName, textInput);
    const existingChunks = getChunks().filter((c) => c.docType !== type);
    const allChunks = [...existingChunks, ...newChunks];
    saveChunks(allChunks);

    setTextInput('');
    refreshData();
    setIsProcessing(false);
    if (onUpdate) onUpdate();
  };

  const handleLoadSample = () => {
    loadSampleDataset();
    refreshData();
    if (onUpdate) onUpdate();
  };

  const handleSearchTest = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setTestResults([]);
      return;
    }
    const results = retrieveTopK(query, chunks, 3);
    setTestResults(results);
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Upload className="w-5 h-5 text-indigo-600" />
              <span>Step 1: Ingest Study Materials</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload your Syllabus, Notes, and Past Exam Papers (PDF or text). All quizzes and plans will be grounded here.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLoadSample}
            className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200/80 transition-all cursor-pointer shrink-0"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Load AI/ML Sample Dataset</span>
          </button>
        </div>

        {/* Material Type Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {UPLOAD_CONFIG.map((config) => {
            const isUploaded = documents.some((d) => d.type === config.type);
            const doc = documents.find((d) => d.type === config.type);
            const isSelected = activeTab === config.type;

            return (
              <div
                key={config.type}
                onClick={() => setActiveTab(config.type)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/40 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">{config.title}</span>
                    {isUploaded ? (
                      <span className="flex items-center space-x-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Ready</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Empty</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">{config.subtitle}</p>
                </div>

                {doc && (
                  <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-600 flex items-center space-x-1 truncate font-mono">
                    <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="truncate">{doc.fileName}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Tab Upload Form */}
        {activeTab && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Upload or Paste: {UPLOAD_CONFIG.find((c) => c.type === activeTab)?.title}
              </span>
              <label className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 transition-colors cursor-pointer shadow-sm">
                <Upload className="w-3.5 h-3.5 text-indigo-600" />
                <span>Upload PDF / TXT</span>
                <input
                  type="file"
                  accept=".pdf,.txt,.md"
                  onChange={(e) => handleFileUpload(e, activeTab)}
                  disabled={isProcessing}
                  className="hidden"
                />
              </label>
            </div>

            <div className="space-y-2">
              <textarea
                rows={4}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={UPLOAD_CONFIG.find((c) => c.type === activeTab)?.placeholder}
                className="w-full p-3.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => handleTextSubmit(activeTab)}
                  disabled={isProcessing || !textInput.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  {isProcessing ? 'Processing...' : 'Save & Index Material'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Document Status Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-center">
            <span className="text-[11px] text-slate-500">Documents Ingested</span>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{documents.length}</p>
          </div>
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-center">
            <span className="text-[11px] text-slate-500">RAG Semantic Chunks</span>
            <p className="text-lg font-bold text-indigo-600 mt-0.5">{chunks.length}</p>
          </div>
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-center">
            <span className="text-[11px] text-slate-500">Syllabus Status</span>
            <p className={`text-xs font-bold mt-1.5 ${documents.some((d) => d.type === 'syllabus') ? 'text-emerald-600' : 'text-amber-600'}`}>
              {documents.some((d) => d.type === 'syllabus') ? 'Ready ✓' : 'Pending'}
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-center">
            <span className="text-[11px] text-slate-500">Notes & Past Papers</span>
            <p className={`text-xs font-bold mt-1.5 ${documents.some((d) => d.type === 'notes') ? 'text-emerald-600' : 'text-amber-600'}`}>
              {documents.some((d) => d.type === 'notes') ? 'Ready ✓' : 'Pending'}
            </p>
          </div>
        </div>
      </div>

      {/* RAG Retrieval Tester & Chunk Inspector (Mandatory Proof of RAG) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>RAG Retrieval Debug Inspector (Pure Cosine Similarity)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Test how the vector engine finds relevant excerpts from your notes before any LLM generates an answer.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowChunkViewer(!showChunkViewer)}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center space-x-1"
          >
            <span>{showChunkViewer ? 'Hide Chunks' : `View All Chunks (${chunks.length})`}</span>
            {showChunkViewer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Live Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchTest(e.target.value)}
            placeholder="Type a concept to test retrieval (e.g. 'Recall', 'Sigmoid', 'Overfitting', 'Backpropagation')..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Retrieved Chunks Results */}
        {searchQuery.trim() && (
          <div className="space-y-3 pt-2">
            <span className="text-xs font-semibold text-slate-600">
              Top Retrieved Source Chunks for &ldquo;{searchQuery}&rdquo;:
            </span>

            {testResults.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No matching chunks found above threshold.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {testResults.map((chunk, idx) => (
                  <div
                    key={chunk.id}
                    className="bg-indigo-50/50 border border-indigo-200/80 rounded-xl p-3.5 text-xs space-y-2 flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-indigo-900">Rank #{idx + 1}</span>
                        <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 font-mono text-[10px] font-semibold">
                          Cosine: {chunk.score}
                        </span>
                      </div>
                      <p className="text-[11px] font-semibold text-slate-800 flex items-center space-x-1">
                        <BookOpen className="w-3 h-3 text-indigo-600 shrink-0" />
                        <span className="truncate">{chunk.sectionLabel} {chunk.pageNumber ? `(Page ${chunk.pageNumber})` : ''}</span>
                      </p>
                      <p className="text-slate-600 line-clamp-4 leading-relaxed font-sans text-[11px]">
                        {chunk.text}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-indigo-100 text-[10px] text-slate-500 font-mono truncate">
                      {chunk.fileName}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* All Chunks Drawer */}
        {showChunkViewer && (
          <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
            {chunks.map((c, i) => (
              <div key={c.id} className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span className="font-semibold text-indigo-600">Chunk #{i + 1} · {c.sectionLabel}</span>
                  <span>{c.pageNumber ? `Page ${c.pageNumber}` : c.docType}</span>
                </div>
                <p className="text-slate-700 line-clamp-2 text-[11px]">{c.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

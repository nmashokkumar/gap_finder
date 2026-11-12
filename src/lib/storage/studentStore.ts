'use client';

import { 
  StudentProfile, 
  StudyDocument, 
  TextChunk, 
  TopicNode, 
  QuizAttempt, 
  GapReport, 
  RevisionPlan 
} from '@/types';
import { SAMPLE_SYLLABUS, SAMPLE_NOTES, SAMPLE_PAST_PAPERS } from '@/data/sampleMaterial';

const PROFILE_KEY = 'gapfinder_profile';
const STATE_PREFIX = 'gapfinder_state_';

export const DEMO_PROFILE: StudentProfile = {
  email: 'demo@gapfinder.ai',
  name: 'Demo Student (igebra.ai)',
  isDemo: true,
};

function isClient(): boolean {
  return typeof window !== 'undefined';
}

function getStorageKey(email: string): string {
  return `${STATE_PREFIX}${email.toLowerCase().trim()}`;
}

interface StudentState {
  documents: StudyDocument[];
  chunks: TextChunk[];
  topicMap: TopicNode[];
  attempts: QuizAttempt[];
  gapReport: GapReport | null;
  previousGapReport: GapReport | null;
  revisionPlan: RevisionPlan | null;
}

const DEFAULT_STATE: StudentState = {
  documents: [],
  chunks: [],
  topicMap: [],
  attempts: [],
  gapReport: null,
  previousGapReport: null,
  revisionPlan: null,
};

export function getCurrentStudent(): StudentProfile | null {
  if (!isClient()) return DEMO_PROFILE;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function loginStudent(email: string, name?: string): StudentProfile {
  const profile: StudentProfile = {
    email: email.trim(),
    name: name?.trim() || (email === DEMO_PROFILE.email ? DEMO_PROFILE.name : email.split('@')[0]),
    isDemo: email.trim().toLowerCase() === DEMO_PROFILE.email,
  };
  if (isClient()) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }
  return profile;
}

export function logoutStudent(): void {
  if (isClient()) {
    localStorage.removeItem(PROFILE_KEY);
  }
}

function loadState(): StudentState {
  if (!isClient()) return DEFAULT_STATE;
  try {
    const student = getCurrentStudent() || DEMO_PROFILE;
    const raw = localStorage.getItem(getStorageKey(student.email));
    if (!raw) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch (err) {
    console.error('Failed to load student state', err);
    return DEFAULT_STATE;
  }
}

function persistState(state: StudentState): void {
  if (!isClient()) return;
  try {
    const student = getCurrentStudent() || DEMO_PROFILE;
    localStorage.setItem(getStorageKey(student.email), JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save student state', err);
  }
}

// Documents
export function getDocuments(): StudyDocument[] {
  return loadState().documents;
}

export function saveDocument(doc: StudyDocument): void {
  const state = loadState();
  const existingIndex = state.documents.findIndex((d) => d.id === doc.id);
  if (existingIndex >= 0) {
    state.documents[existingIndex] = doc;
  } else {
    state.documents.push(doc);
  }
  persistState(state);
}

// Chunks
export function getChunks(): TextChunk[] {
  return loadState().chunks;
}

export function saveChunks(newChunks: TextChunk[]): void {
  const state = loadState();
  state.chunks = newChunks;
  persistState(state);
}

// Topic Map
export function getTopicMap(): TopicNode[] {
  return loadState().topicMap;
}

export function saveTopicMap(topics: TopicNode[]): void {
  const state = loadState();
  state.topicMap = topics;
  persistState(state);
}

// Quiz Attempts
export function getQuizAttempts(): QuizAttempt[] {
  return loadState().attempts;
}

export function getLatestAttempt(): QuizAttempt | null {
  const attempts = getQuizAttempts();
  return attempts.length > 0 ? attempts[attempts.length - 1] : null;
}

export function saveQuizAttempt(attempt: QuizAttempt): void {
  const state = loadState();
  state.attempts.push(attempt);
  persistState(state);
}

// Gap Report
export function getGapReport(): GapReport | null {
  return loadState().gapReport;
}

export function getPreviousGapReport(): GapReport | null {
  return loadState().previousGapReport;
}

export function saveGapReport(report: GapReport): void {
  const state = loadState();
  if (state.gapReport && state.gapReport.attemptId !== report.attemptId) {
    state.previousGapReport = state.gapReport;
  }
  state.gapReport = report;
  persistState(state);
}

// Revision Plan
export function getRevisionPlan(): RevisionPlan | null {
  return loadState().revisionPlan;
}

export function saveRevisionPlan(plan: RevisionPlan): void {
  const state = loadState();
  state.revisionPlan = plan;
  persistState(state);
}

// Helper to chunk sample notes into rich TextChunks with metadata
function parseSampleNotesIntoChunks(notesText: string): TextChunk[] {
  const chunks: TextChunk[] = [];
  const sections = notesText.split(/\[(.*?)\]/g);

  // Pattern matches: [Chapter 1: Supervised ML · Section 1.1 · Page 14]
  for (let i = 1; i < sections.length; i += 2) {
    const header = sections[i].trim();
    const body = sections[i + 1]?.trim() || '';
    if (!body) continue;

    const pageMatch = header.match(/Page\s+(\d+)/i);
    const pageNum = pageMatch ? parseInt(pageMatch[1], 10) : undefined;
    const cleanSection = header.replace(/·?\s*Page\s+\d+/i, '').trim();

    chunks.push({
      id: `sample-chunk-${chunks.length + 1}`,
      docId: 'doc-sample-notes',
      docType: 'notes',
      fileName: 'AI_ML_Textbook_Notes.pdf',
      sectionLabel: cleanSection || header,
      pageNumber: pageNum,
      text: body,
    });
  }

  return chunks;
}

// Load Preloaded Sample Dataset
export function loadSampleDataset(): { documents: StudyDocument[]; chunks: TextChunk[] } {
  const now = new Date().toISOString();

  const documents: StudyDocument[] = [
    {
      id: 'doc-sample-syllabus',
      type: 'syllabus',
      fileName: 'AI_ML_Syllabus.txt',
      rawText: SAMPLE_SYLLABUS,
      uploadedAt: now,
    },
    {
      id: 'doc-sample-notes',
      type: 'notes',
      fileName: 'AI_ML_Textbook_Notes.pdf',
      rawText: SAMPLE_NOTES,
      uploadedAt: now,
      pageCount: 92,
    },
    {
      id: 'doc-sample-past-papers',
      type: 'past_paper',
      fileName: 'AI_ML_Past_Papers_2023_2025.txt',
      rawText: SAMPLE_PAST_PAPERS,
      uploadedAt: now,
    },
  ];

  const chunks = parseSampleNotesIntoChunks(SAMPLE_NOTES);

  const state = loadState();
  state.documents = documents;
  state.chunks = chunks;
  persistState(state);

  return { documents, chunks };
}

// Clear state
export function clearAllStudentData(): void {
  const state = loadState();
  state.documents = [];
  state.chunks = [];
  state.topicMap = [];
  state.attempts = [];
  state.gapReport = null;
  state.previousGapReport = null;
  state.revisionPlan = null;
  persistState(state);
}

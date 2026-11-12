/**
 * GapFinder AI - Central Domain Types
 * Single source of truth for RAG data models, Quiz, Gap Report & Revision Plan.
 */

export type DocumentType = 'syllabus' | 'notes' | 'past_paper';

export interface StudyDocument {
  id: string;
  type: DocumentType;
  fileName: string;
  rawText: string;
  uploadedAt: string;
  pageCount?: number;
}

export interface TextChunk {
  id: string;
  docId: string;
  docType: DocumentType;
  fileName: string;
  sectionLabel: string;
  pageNumber?: number;
  text: string;
}

export interface RetrievedChunk extends TextChunk {
  score: number;
}

export interface Citation {
  chunkId: string;
  docType: DocumentType;
  fileName: string;
  sectionLabel: string;
  pageNumber?: number;
  excerpt: string;
}

export interface TopicNode {
  id: string;
  name: string;
  subtopics: string[];
  examFrequency: 'High' | 'Medium' | 'Low';
  linkedQuestions?: string[];
  description?: string;
}

export interface QuizQuestion {
  id: string;
  topicId: string;
  topicName: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  citation: Citation;
}

export interface AnswerEvaluation {
  questionId: string;
  topicId: string;
  topicName: string;
  selectedIndex: number;
  correctIndex: number;
  isCorrect: boolean;
  explanation: string;
  citation: Citation;
}

export interface QuizAttempt {
  id: string;
  timestamp: string;
  scorePercentage: number;
  totalQuestions: number;
  correctQuestions: number;
  evaluations: AnswerEvaluation[];
}

export interface TopicGap {
  topicId: string;
  topicName: string;
  strength: 'weak' | 'medium' | 'strong';
  accuracyPercentage: number;
  attemptedCount: number;
  correctCount: number;
  diagnosticReason: string;
  examFrequency: 'High' | 'Medium' | 'Low';
}

export interface GapReport {
  attemptId: string;
  timestamp: string;
  overallScore: number;
  gaps: TopicGap[];
  weakCount: number;
  mediumCount: number;
  strongCount: number;
}

export interface RevisionTask {
  id: string;
  topicName: string;
  activity: string;
  durationMinutes: number;
  sourceReference: string;
}

export interface RevisionDay {
  day: number;
  theme: string;
  allocatedHours: number;
  tasks: RevisionTask[];
}

export interface RevisionPlan {
  id: string;
  generatedAt: string;
  totalDays: number;
  hoursPerDay: number;
  days: RevisionDay[];
}

export interface StudentProfile {
  email: string;
  name: string;
  isDemo: boolean;
}

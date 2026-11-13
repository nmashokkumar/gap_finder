# backend/models/schemas.py
# Purpose: Define data models using Pydantic.
# Why we need this: Pydantic ensures every request and response has valid types,
# preventing runtime bugs and giving clear error messages if data is missing.

from typing import List, Optional, Literal
from pydantic import BaseModel, Field


# -------------------------------------------------------------
# 1. Study Materials & Text Chunks
# -------------------------------------------------------------
# What it does: Represents one paragraph or section sliced from a textbook or syllabus.
# Why we need it: LLMs cannot read an entire 500-page book at once. We break it into small chunks.
class TextChunk(BaseModel):
    id: str = Field(description="Unique identifier for the chunk, e.g., chunk-1")
    docId: str = Field(description="ID of the parent document, e.g., doc-notes-1")
    docType: Literal["syllabus", "notes", "past_paper"] = Field(description="Type of document")
    fileName: str = Field(description="Original file name, e.g., AI_Notes.pdf")
    sectionLabel: str = Field(description="Chapter or section heading, e.g., Chapter 1: Search")
    pageNumber: Optional[int] = Field(default=None, description="Page number where this text was found")
    text: str = Field(description="The actual text content of this chunk")


# -------------------------------------------------------------
# 2. Topic Map
# -------------------------------------------------------------
# What it does: Represents a syllabus topic with its subtopics and exam frequency.
# Why we need it: Organizes what the student needs to learn and checks how often it appears in exams.
class TopicNode(BaseModel):
    id: str = Field(description="Unique kebab-case ID, e.g., supervised-learning")
    name: str = Field(description="Topic title, e.g., Supervised Learning")
    subtopics: List[str] = Field(default_factory=list, description="List of sub-concepts")
    description: str = Field(description="One-sentence summary of the topic")
    examFrequency: Literal["High", "Medium", "Low"] = Field(
        default="Medium", description="How often this appears in past papers"
    )
    linkedQuestions: List[str] = Field(
        default_factory=list, description="Past exam questions matched to this topic"
    )


# -------------------------------------------------------------
# 3. Source Citation
# -------------------------------------------------------------
# What it does: Stores the exact proof of where an answer came from.
# Why we need it: Eliminates hallucinations! Proves the AI is citing real student materials.
class Citation(BaseModel):
    chunkId: str = Field(description="ID of the source chunk")
    docType: str = Field(description="Document type, e.g., notes")
    fileName: str = Field(description="Name of the file cited")
    sectionLabel: str = Field(description="Chapter or section heading")
    pageNumber: Optional[int] = Field(default=None, description="Source page number")
    excerpt: str = Field(description="Exact 1-2 sentence quote proving the answer")


# -------------------------------------------------------------
# 4. Diagnostic Quiz Question
# -------------------------------------------------------------
# What it does: Represents a multiple-choice question generated strictly from notes.
# Why we need it: Tests the student to find what they know and what they don't know.
class QuizQuestion(BaseModel):
    id: str = Field(description="Unique question ID")
    topicId: str = Field(description="Topic ID this question belongs to")
    topicName: str = Field(description="Topic title")
    question: str = Field(description="The question text")
    options: List[str] = Field(description="List of 4 distinct choices")
    correctIndex: int = Field(description="Index of the correct answer (0, 1, 2, or 3)")
    explanation: str = Field(description="Why the correct option is right based on the text")
    citation: Citation = Field(description="Exact source citation proving the answer")


# -------------------------------------------------------------
# 5. Quiz Evaluation & Attempt
# -------------------------------------------------------------
# What it does: Stores what option the student selected and whether it was correct.
# Why we need it: Used by the Gap Analyzer to calculate exact topic-level accuracy.
class AnswerEvaluation(BaseModel):
    questionId: str
    topicId: str
    topicName: str
    selectedIndex: int
    correctIndex: int
    isCorrect: bool
    explanation: str
    citation: Citation


class QuizAttempt(BaseModel):
    id: str
    timestamp: str
    scorePercentage: int
    totalQuestions: int
    correctQuestions: int
    evaluations: List[AnswerEvaluation]


# -------------------------------------------------------------
# 6. Gap Report
# -------------------------------------------------------------
# What it does: Classifies student knowledge into Weak (<50%), Medium (50-79%), or Strong (>=80%).
# Why we need it: The core problem statement! Pinpoints the student's exact blind spots.
class TopicGap(BaseModel):
    topicId: str
    topicName: str
    strength: Literal["weak", "medium", "strong"]
    accuracyPercentage: int
    attemptedCount: int
    correctCount: int
    examFrequency: Literal["High", "Medium", "Low"]
    diagnosticReason: str


class GapReport(BaseModel):
    id: str
    generatedAt: str
    attemptId: str
    overallScore: int
    totalGapsIdentified: int
    gaps: List[TopicGap]
    recommendedFocusTopic: Optional[str] = None


# -------------------------------------------------------------
# 7. Adaptive Revision Plan
# -------------------------------------------------------------
# What it does: A day-by-day study schedule prioritized by weak topics.
# Why we need it: Guides the student on what to study first so they don't waste time on strong areas.
class RevisionTask(BaseModel):
    id: str
    topicName: str
    activity: str
    durationMinutes: int
    sourceReference: str


class RevisionDay(BaseModel):
    day: int
    theme: str
    allocatedHours: float
    tasks: List[RevisionTask]


class RevisionPlan(BaseModel):
    id: str
    generatedAt: str
    totalDays: int
    hoursPerDay: float
    days: List[RevisionDay]

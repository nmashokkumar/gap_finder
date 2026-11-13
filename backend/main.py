# backend/main.py
# Purpose: FastAPI web server exposing clean REST endpoints for the AI engine.
# Why we need this: Connects the Next.js student UI to the Python RAG backend.
# Every endpoint is simple, fast, and fully typed using Pydantic.

import os
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.models.schemas import (
    TopicNode,
    TextChunk,
    QuizQuestion,
    GapReport,
    RevisionPlan,
)
from backend.services.ai_service import (
    generate_topic_map,
    generate_grounded_quiz,
    generate_gap_report,
    generate_revision_plan,
    chat_explain_topic,
)

app = FastAPI(
    title="GapFinder AI - Python RAG Backend",
    description="Deterministic Retrieval & Grounded Generation engine for student gap diagnosis",
    version="1.0.0",
)

# Enable CORS so Next.js frontend can call FastAPI directly
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------------------------------------------
# Request Schemas for the API Endpoints
# -------------------------------------------------------------
class TopicMapRequest(BaseModel):
    syllabusText: str
    pastPapersText: Optional[str] = ""
    syllabusFileName: Optional[str] = "Syllabus"


class QuizRequest(BaseModel):
    topics: List[TopicNode]
    chunks: List[TextChunk]
    focusTopicId: Optional[str] = None
    focusTopicIds: Optional[List[str]] = None


class GapReportRequest(BaseModel):
    attempt: Dict[str, Any]
    topicMap: List[TopicNode]
    previousGapReport: Optional[Any] = None


class RevisionPlanRequest(BaseModel):
    gapReport: GapReport
    totalDays: Optional[int] = 5
    hoursPerDay: Optional[float] = 2.0
    chunks: Optional[List[TextChunk]] = None


class ChatRequest(BaseModel):
    prompt: Optional[str] = None
    messages: Optional[List[Dict[str, Any]]] = None
    chunks: Optional[List[TextChunk]] = None


# -------------------------------------------------------------
# 1. Health Check Endpoint
# What it does: Verifies that the Python AI server is online and Groq is ready.
# -------------------------------------------------------------
@app.get("/api/health")
def health_check():
    has_key = bool(os.getenv("GROQ_API_KEY"))
    return {"ok": True, "service": "GapFinder AI Python Backend", "groqReady": has_key}


# -------------------------------------------------------------
# 2. Topic Map Endpoint
# What it does: Builds syllabus topics and links past-paper questions using Cosine Retrieval.
# -------------------------------------------------------------
@app.post("/api/topic-map")
def create_topic_map(req: TopicMapRequest):
    if not req.syllabusText.strip():
        raise HTTPException(status_code=400, detail="Syllabus text is required")

    topics = generate_topic_map(
        syllabus_text=req.syllabusText,
        past_papers_text=req.pastPapersText or "",
        file_name=req.syllabusFileName or "Syllabus",
    )
    return {
        "ok": True,
        "topics": topics,
        "mappingMethod": "TF-IDF Cosine Retrieval over Past Paper Questions",
    }


# -------------------------------------------------------------
# 3. Grounded Diagnostic Quiz Endpoint
# What it does: Retrieves top chunks per topic and generates MCQs strictly grounded in excerpts.
# -------------------------------------------------------------
@app.post("/api/quiz")
def create_quiz(req: QuizRequest):
    if not req.chunks:
        raise HTTPException(status_code=400, detail="No chunks found. Upload study materials first.")
    if not req.topics:
        raise HTTPException(status_code=400, detail="No topics found. Build topic map first.")

    focus_ids = req.focusTopicIds or ([req.focusTopicId] if req.focusTopicId else None)
    questions = generate_grounded_quiz(
        topics=req.topics,
        chunks=req.chunks,
        focus_topic_ids=focus_ids,
    )

    if not questions:
        raise HTTPException(status_code=500, detail="Could not generate questions from materials.")

    return {
        "ok": True,
        "questions": questions,
        "ragGroundingStats": {
            "totalQuestions": len(questions),
            "retrievalMethod": "TF-IDF Vector Cosine Similarity",
            "groundedExcerptsCount": len(questions),
        },
    }


# -------------------------------------------------------------
# 4. Gap Report Endpoint
# What it does: Analyzes student answers, scores each topic, and classifies Weak / Medium / Strong.
# -------------------------------------------------------------
@app.post("/api/gap-report")
def create_gap_report(req: GapReportRequest):
    evaluations = req.attempt.get("evaluations", [])
    if not evaluations:
        raise HTTPException(status_code=400, detail="Quiz attempt evaluations required.")

    attempt_id = req.attempt.get("id", "attempt-1")
    report = generate_gap_report(
        evaluations=evaluations,
        topic_map=req.topicMap,
        attempt_id=attempt_id,
    )
    return {"ok": True, "gapReport": report}


# -------------------------------------------------------------
# 5. Personalized Revision Plan Endpoint
# What it does: Creates an adaptive day-by-day plan prioritizing weak topics with citations.
# -------------------------------------------------------------
@app.post("/api/revision-plan")
def create_revision_plan(req: RevisionPlanRequest):
    plan = generate_revision_plan(
        gap_report=req.gapReport,
        total_days=req.totalDays or 5,
        hours_per_day=req.hoursPerDay or 2.0,
        chunks=req.chunks,
    )
    return {"ok": True, "plan": plan}


# -------------------------------------------------------------
# 6. Explain-This-Topic RAG Chat Endpoint
# What it does: Checks similarity guardrail and answers questions grounded strictly in notes.
# -------------------------------------------------------------
@app.post("/api/chat")
def chat_endpoint(req: ChatRequest):
    # Extract query either from prompt or from the latest message in messages list
    query = req.prompt or ""
    chat_history = []
    if req.messages:
        for m in req.messages:
            role = m.get("role", "user")
            content = m.get("content") or ""
            if isinstance(content, list):
                # handle multi-part content
                content = " ".join([p.get("text", "") for p in content if isinstance(p, dict)])
            chat_history.append({"role": role, "content": content})
        if chat_history and not query:
            query = chat_history[-1]["content"]

    chunks = req.chunks or []
    if not chunks:
        return {
            "text": "Please upload study materials on the Workspace first so I have notes to answer from.",
            "sources": [],
            "outOfScope": True,
        }

    response = chat_explain_topic(query=query, chunks=chunks, chat_history=chat_history)
    return response


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)

# backend/services/ai_service.py
# Purpose: Connects to Groq Cloud API using the official Groq Python SDK.
# Why we need this: Generates grounded diagnostic questions, structured syllabus topics,
# gap analysis reasons, and streaming explanations using strict prompts and schemas.

import os
import json
import re
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from groq import Groq

from backend.models.schemas import (
    TopicNode,
    TextChunk,
    QuizQuestion,
    Citation,
    GapReport,
    TopicGap,
    RevisionPlan,
    RevisionDay,
    RevisionTask,
)
from backend.rag.retriever import retrieve_top_k, check_retrieval_guardrail

# Load environment variables from .env.local
load_dotenv(".env.local")
load_dotenv(".env")

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = "openai/gpt-oss-120b"

client = Groq(api_key=GROQ_API_KEY)


# -------------------------------------------------------------
# 1. Build Topic Map from Uploaded Syllabus
# -------------------------------------------------------------
# What it does:
#   1. Sends the syllabus text to Groq to extract clean modules/topics.
#   2. Matches each past-paper question to the best syllabus topic using Cosine Similarity.
#   3. Assigns Exam Frequency (High / Medium / Low) based on question count.
# -------------------------------------------------------------
def generate_topic_map(syllabus_text: str, past_papers_text: str = "", file_name: str = "Syllabus") -> List[TopicNode]:
    prompt = f"""Extract 4 to 6 clean, distinct syllabus topics and their subtopics from the syllabus below.
Respond with ONLY a JSON object containing a "topics" list.

Format:
{{
  "topics": [
    {{
      "id": "kebab-case-id",
      "name": "Topic Title",
      "subtopics": ["Subtopic 1", "Subtopic 2"],
      "description": "One sentence summary"
    }}
  ]
}}

Syllabus:
\"\"\"
{syllabus_text[:5000]}
\"\"\"
"""
    completion = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        temperature=0.1,
    )

    raw_json = completion.choices[0].message.content or "{}"
    data = json.loads(raw_json)
    extracted_topics = data.get("topics", [])

    # Step 2: Convert topics to TextChunk objects so we can run Cosine Similarity against past exam questions
    topic_chunks = [
        TextChunk(
            id=t.get("id", f"top-{i}"),
            docId="syllabus-map",
            docType="syllabus",
            fileName=file_name,
            sectionLabel=t.get("name", ""),
            text=f"{t.get('name', '')}. {' '.join(t.get('subtopics', []))}. {t.get('description', '')}",
        )
        for i, t in enumerate(extracted_topics)
    ]

    # Step 3: Split past-paper questions and map them using Cosine Retrieval
    past_questions = _split_past_questions(past_papers_text)
    linked_by_topic: Dict[str, List[str]] = {t.id: [] for t in topic_chunks}

    for q in past_questions:
        matches = retrieve_top_k(q, topic_chunks, k=1)
        if matches and matches[0][1] > 0.05:
            best_id = matches[0][0].id
            linked_by_topic[best_id].append(q)

    # Step 4: Build enriched TopicNode objects
    nodes: List[TopicNode] = []
    for t in extracted_topics:
        t_id = t.get("id", "")
        linked = linked_by_topic.get(t_id, [])
        freq = "High" if len(linked) >= 2 else ("Medium" if len(linked) == 1 else "Low")
        nodes.append(
            TopicNode(
                id=t_id,
                name=t.get("name", ""),
                subtopics=t.get("subtopics", []),
                description=t.get("description", ""),
                examFrequency=freq,
                linkedQuestions=linked,
            )
        )

    return nodes


# -------------------------------------------------------------
# 2. Generate Grounded Diagnostic Quiz
# -------------------------------------------------------------
# What it does:
#   1. For each topic, retrieves the top 3 relevant paragraphs from uploaded notes.
#   2. Instructs Groq to write MCQs derived STRICTLY from those paragraphs.
#   3. Attaches exact verbatim quotes, chapter titles, and page numbers as citations.
# -------------------------------------------------------------
def generate_grounded_quiz(
    topics: List[TopicNode],
    chunks: List[TextChunk],
    focus_topic_ids: Optional[List[str]] = None,
) -> List[QuizQuestion]:
    # Filter notes chunks specifically
    notes_chunks = [c for c in chunks if c.docType == "notes"]
    pool = notes_chunks if notes_chunks else chunks

    target_topics = topics[:4]
    if focus_topic_ids:
        filtered = [t for t in topics if t.id in focus_topic_ids]
        if filtered:
            target_topics = filtered

    questions_per_topic = 3 if len(target_topics) <= 2 else 2
    all_questions: List[QuizQuestion] = []

    for topic in target_topics:
        # STEP 1 (RETRIEVAL): Fetch top 3 matching chunks for this topic
        query = f"{topic.name} {' '.join(topic.subtopics)}"
        matches = retrieve_top_k(query, pool, k=3)
        active_chunks = [m[0] for m in matches] if matches else pool[:2]

        # Format numbered excerpts for strict context bounding
        context_blocks = []
        for i, c in enumerate(active_chunks):
            page_info = f" | Page {c.pageNumber}" if c.pageNumber else ""
            context_blocks.append(f"[Excerpt {i+1} | {c.fileName} | {c.sectionLabel}{page_info}]\n{c.text}")
        context_str = "\n\n---\n\n".join(context_blocks)

        prompt = f"""You are an expert diagnostic examiner.
Generate exactly {questions_per_topic} distinct multiple-choice questions testing the topic: "{topic.name}".

STRICT RAG GROUNDING RULES:
1. Every question, option, and explanation MUST come strictly from the numbered Excerpts below.
2. Provide exactly 4 distinct options per question.
3. correctIndex must be the 0-based index (0, 1, 2, or 3) of the correct option.
4. Set chunkNumber to the 1-based index (1 to {len(active_chunks)}) of the Excerpt used.
5. Copy verbatimExcerpt directly from that Excerpt as proof.

Respond with ONLY this JSON format:
{{
  "questions": [
    {{
      "question": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Why this option is correct based on the text",
      "chunkNumber": 1,
      "verbatimExcerpt": "Exact sentence quote from the text."
    }}
  ]
}}

Retrieved Source Excerpts:
\"\"\"
{context_str[:4500]}
\"\"\"
"""
        try:
            completion = client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                temperature=0.2,
            )
            data = json.loads(completion.choices[0].message.content or "{}")
            raw_qs = data.get("questions", [])

            for idx, q in enumerate(raw_qs[:questions_per_topic]):
                chunk_num = max(1, min(int(q.get("chunkNumber", 1)), len(active_chunks)))
                source_chunk = active_chunks[chunk_num - 1]
                options = q.get("options", [])[:4]
                correct_idx = max(0, min(int(q.get("correctIndex", 0)), len(options) - 1))

                all_questions.append(
                    QuizQuestion(
                        id=f"q-{topic.id}-{len(all_questions) + 1}",
                        topicId=topic.id,
                        topicName=topic.name,
                        question=q.get("question", ""),
                        options=options,
                        correctIndex=correct_idx,
                        explanation=q.get("explanation", ""),
                        citation=Citation(
                            chunkId=source_chunk.id,
                            docType=source_chunk.docType,
                            fileName=source_chunk.fileName,
                            sectionLabel=source_chunk.sectionLabel,
                            pageNumber=source_chunk.pageNumber,
                            excerpt=q.get("verbatimExcerpt") or source_chunk.text[:160] + "...",
                        ),
                    )
                )
        except Exception as e:
            print(f"Error generating quiz for {topic.name}: {e}")
            continue

    return all_questions


# -------------------------------------------------------------
# 3. Analyze Quiz Results & Generate Diagnostic Gap Report
# -------------------------------------------------------------
# What it does:
#   1. Calculates exact math accuracy in Python (Total Correct / Total Attempted * 100).
#   2. Classifies strength into Weak (<50%), Medium (50-79%), or Strong (>=80%).
#   3. Generates concise, human diagnostic reasons for each topic.
# -------------------------------------------------------------
def generate_gap_report(
    evaluations: List[Any],
    topic_map: List[TopicNode],
    attempt_id: str,
) -> GapReport:
    # Step 1: Compute statistics per topic using standard Python dictionaries
    stats_by_topic: Dict[str, Dict[str, Any]] = {}
    for ev in evaluations:
        t_id = ev.get("topicId") or getattr(ev, "topicId", "unknown")
        t_name = ev.get("topicName") or getattr(ev, "topicName", "Topic")
        is_corr = ev.get("isCorrect") or getattr(ev, "isCorrect", False)

        if t_id not in stats_by_topic:
            stats_by_topic[t_id] = {
                "name": t_name,
                "correct": 0,
                "total": 0,
                "missed_explanations": [],
            }
        stats_by_topic[t_id]["total"] += 1
        if is_corr:
            stats_by_topic[t_id]["correct"] += 1
        else:
            explanation = ev.get("explanation") or getattr(ev, "explanation", "")
            stats_by_topic[t_id]["missed_explanations"].append(explanation)

    freq_map = {t.id: t.examFrequency for t in topic_map}

    # Step 2: Format summaries for AI diagnostic reason generation
    summaries = []
    for t_id, data in stats_by_topic.items():
        total = data["total"]
        correct = data["correct"]
        accuracy = round((correct / total) * 100) if total > 0 else 0
        strength = "weak" if accuracy < 50 else ("medium" if accuracy < 80 else "strong")
        summaries.append(
            {
                "topicId": t_id,
                "topicName": data["name"],
                "accuracy": accuracy,
                "strength": strength,
                "correct": correct,
                "total": total,
                "examFrequency": freq_map.get(t_id, "Medium"),
                "missed": data["missed_explanations"][:2],
            }
        )

    # Step 3: Ask Groq for 1 crisp sentence explaining why the student is weak/medium/strong
    prompt = f"""You are an academic study doctor. Write ONE specific, actionable sentence for each topic explaining what the student mastered or missed.
Respond with ONLY JSON format:
{{
  "diagnostics": [
    {{"topicId": "id", "reason": "1-sentence diagnostic reason"}}
  ]
}}

Topic Statistics:
{json.dumps(summaries, indent=2)}
"""
    reason_lookup = {}
    try:
        completion = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.2,
        )
        diag_data = json.loads(completion.choices[0].message.content or "{}")
        for item in diag_data.get("diagnostics", []):
            reason_lookup[item.get("topicId")] = item.get("reason")
    except Exception:
        pass

    # Step 4: Build GapReport object
    gaps: List[TopicGap] = []
    for s in summaries:
        t_id = s["topicId"]
        fallback_reason = f"Scored {s['correct']}/{s['total']} ({s['accuracy']}%) in this topic."
        gaps.append(
            TopicGap(
                topicId=t_id,
                topicName=s["topicName"],
                strength=s["strength"],
                accuracyPercentage=s["accuracy"],
                attemptedCount=s["total"],
                correctCount=s["correct"],
                examFrequency=s["examFrequency"],
                diagnosticReason=reason_lookup.get(t_id, fallback_reason),
            )
        )

    # Sort gaps: Weak first, then Medium, then Strong
    priority_order = {"weak": 0, "medium": 1, "strong": 2}
    gaps.sort(key=lambda g: (priority_order[g.strength], -1 if g.examFrequency == "High" else 0))

    total_q = sum(s["total"] for s in summaries)
    total_c = sum(s["correct"] for s in summaries)
    overall_score = round((total_c / total_q) * 100) if total_q > 0 else 0

    return GapReport(
        id=f"report-{attempt_id}",
        generatedAt="now",
        attemptId=attempt_id,
        overallScore=overall_score,
        totalGapsIdentified=len([g for g in gaps if g.strength != "strong"]),
        gaps=gaps,
        recommendedFocusTopic=gaps[0].topicName if gaps else None,
    )


# -------------------------------------------------------------
# 4. Generate Personalized Adaptive Revision Plan
# -------------------------------------------------------------
# What it does:
#   1. Looks at the Gap Report and student study budget (days & hours/day).
#   2. Puts weak topics with high exam weight on Day 1.
#   3. Allocates study minutes and attaches exact textbook citations.
# -------------------------------------------------------------
def generate_revision_plan(
    gap_report: GapReport,
    total_days: int = 5,
    hours_per_day: float = 2.0,
    chunks: Optional[List[TextChunk]] = None,
) -> RevisionPlan:
    clamped_days = max(1, min(total_days, 14))
    clamped_hours = max(0.5, min(hours_per_day, 8.0))

    # Pull citations for each topic from chunks
    topic_summaries = []
    chunks_pool = chunks or []
    for g in gap_report.gaps:
        top_chunks = retrieve_top_k(g.topicName, chunks_pool, k=2) if chunks_pool else []
        refs = [f"{c[0].sectionLabel} (Page {c[0].pageNumber})" if c[0].pageNumber else c[0].sectionLabel for c in top_chunks]
        topic_summaries.append(
            {
                "topicName": g.topicName,
                "strength": g.strength.upper(),
                "accuracy": f"{g.accuracyPercentage}%",
                "examFrequency": g.examFrequency,
                "reason": g.diagnosticReason,
                "sourceReferences": refs or ["Uploaded Study Notes"],
            }
        )

    prompt = f"""You are an expert study coach creating a prioritized revision schedule.
Student Time Budget:
- Total Days: {clamped_days} days
- Study Time Per Day: {clamped_hours} hours ({int(clamped_hours * 60)} minutes/day)

Prioritization Rules:
1. WEAK topics (<50%) with HIGH exam frequency MUST appear on Day 1 with highest study minutes.
2. MEDIUM topics come next for reinforcement.
3. STRONG topics (>=80%) only get brief rapid-recall checks on the final day.
4. Each day's tasks should sum closely to {int(clamped_hours * 60)} minutes.

Respond with ONLY JSON format:
{{
  "days": [
    {{
      "day": 1,
      "theme": "Day focus title",
      "allocatedHours": {clamped_hours},
      "tasks": [
        {{
          "id": "task-1",
          "topicName": "Topic Name",
          "activity": "Specific study action addressing the gap",
          "durationMinutes": 45,
          "sourceReference": "Section from sourceReferences"
        }}
      ]
    }}
  ]
}}

Student Gap Diagnosis:
{json.dumps(topic_summaries, indent=2)}
"""
    completion = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        temperature=0.2,
    )
    data = json.loads(completion.choices[0].message.content or "{}")
    raw_days = data.get("days", [])

    days: List[RevisionDay] = []
    for d in raw_days[:clamped_days]:
        tasks = [
            RevisionTask(
                id=t.get("id", f"t-{len(days)}-{i}"),
                topicName=t.get("topicName", ""),
                activity=t.get("activity", ""),
                durationMinutes=int(t.get("durationMinutes", 30)),
                sourceReference=t.get("sourceReference", "Uploaded Notes"),
            )
            for i, t in enumerate(d.get("tasks", []))
        ]
        days.append(
            RevisionDay(
                day=int(d.get("day", len(days) + 1)),
                theme=d.get("theme", f"Day {len(days) + 1} Revision"),
                allocatedHours=float(d.get("allocatedHours", clamped_hours)),
                tasks=tasks,
            )
        )

    return RevisionPlan(
        id=f"plan-{gap_report.id}",
        generatedAt="now",
        totalDays=clamped_days,
        hoursPerDay=clamped_hours,
        days=days,
    )


# -------------------------------------------------------------
# 5. Explain-This-Topic RAG Chat with Guardrails
# -------------------------------------------------------------
# What it does:
#   1. Runs the cosine similarity guardrail.
#   2. If query similarity < 0.08, refuses to answer (stops hallucinations!).
#   3. Otherwise, generates a grounded explanation with citations.
# -------------------------------------------------------------
def chat_explain_topic(
    query: str,
    chunks: List[TextChunk],
    chat_history: Optional[List[Dict[str, str]]] = None,
) -> Dict[str, Any]:
    # STEP 1: Guardrail check using NumPy Cosine Similarity
    is_safe, best_score, matches = check_retrieval_guardrail(query, chunks, threshold=0.08)

    if not is_safe or not matches:
        return {
            "text": (
                "⚠️ **Out of Scope**: This topic is not covered in your uploaded syllabus or textbook notes. "
                "GapFinder AI only answers questions grounded strictly in your study materials."
            ),
            "sources": [],
            "outOfScope": True,
            "relevanceScore": best_score,
        }

    # STEP 2: Grounded generation with retrieved context
    top_chunks = [m[0] for m in matches]
    context_str = "\n\n---\n\n".join(
        [f"[Source {i+1}: {c.fileName} · {c.sectionLabel}]\n{c.text}" for i, c in enumerate(top_chunks)]
    )

    system_prompt = f"""You are GapFinder AI, a patient academic tutor.
Explain the concept requested by the student clearly and thoroughly.

STRICT GROUNDING RULES:
1. Answer ONLY using facts from the numbered Sources below.
2. If a detail is not in the sources, do not mention it.
3. Include inline citations to the sources (e.g., "[Source 1]").

Study Sources:
\"\"\"
{context_str[:4000]}
\"\"\"
"""
    messages = [{"role": "system", "content": system_prompt}]
    if chat_history:
        messages.extend(chat_history[-4:])
    messages.append({"role": "user", "content": query})

    completion = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=messages,
        temperature=0.3,
    )

    answer_text = completion.choices[0].message.content or ""
    sources = [
        {
            "chunkId": c.id,
            "fileName": c.fileName,
            "sectionLabel": c.sectionLabel,
            "pageNumber": c.pageNumber,
            "score": round(score, 3),
        }
        for c, score in matches
    ]

    return {
        "text": answer_text,
        "sources": sources,
        "outOfScope": False,
        "relevanceScore": best_score,
    }


# Helper function to split past-paper questions
def _split_past_questions(raw: str) -> List[str]:
    if not raw or not raw.strip():
        return []
    blocks = re.split(r"(?=(?:Question\s+\d+|Q\.?\s*\d+|\b\d+[.)]\s+))", raw, flags=re.IGNORECASE)
    cleaned = []
    for b in blocks:
        clean_b = re.sub(r"\s+", " ", b).strip()
        if len(clean_b) > 20 and re.search(r"\?|\bexplain\b|\bdefine\b|\bwhy\b|\bhow\b|\bcompare\b", clean_b, re.IGNORECASE):
            cleaned.append(clean_b)
    return cleaned

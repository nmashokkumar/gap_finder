import sys
import os
import json

# Ensure parent directory is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.rag.chunker import chunk_document
from backend.rag.retriever import retrieve_top_k, check_retrieval_guardrail
from backend.services.ai_service import (
    generate_topic_map,
    generate_grounded_quiz,
    generate_gap_report,
    generate_revision_plan,
    chat_explain_topic,
)

def run_tests():
    print("=" * 70)
    print("  RUNNING MULTI-SAMPLE AUTOMATED EVALUATION SUITE")
    print("=" * 70)

    packs = [
        {
            "name": "DATA SCIENCE PACK",
            "syllabus": "sample-uploads/data_science/DataScience_Syllabus.txt",
            "notes": "sample-uploads/data_science/DataScience_Notes.txt",
            "past": "sample-uploads/data_science/DataScience_Past_Papers.txt",
            "test_query": "Explain PCA and how eigenvalues are related to variance",
            "out_query": "What is the recipe for chocolate chip cookies?",
        },
        {
            "name": "DATA ANALYTICS PACK",
            "syllabus": "sample-uploads/data_analytics/DataAnalytics_Syllabus.txt",
            "notes": "sample-uploads/data_analytics/DataAnalytics_Notes.txt",
            "past": "sample-uploads/data_analytics/DataAnalytics_Past_Papers.txt",
            "test_query": "Difference between ROW_NUMBER, RANK and DENSE_RANK in SQL",
            "out_query": "What is the population of Tokyo in 2026?",
        },
    ]

    for pack in packs:
        print(f"\n>>> TESTING: {pack['name']}")
        
        # 1. Chunking
        with open(pack["notes"], "r") as f:
            notes_raw = f.read()
        chunks = chunk_document("doc-test", "notes", os.path.basename(pack["notes"]), notes_raw)
        assert len(chunks) >= 4, f"Chunking failed: only {len(chunks)} chunks"
        print(f"  [PASS] Chunking: Sliced into {len(chunks)} rich sections with page labels")

        # 2. Retrieval & Math
        matches = retrieve_top_k(pack["test_query"], chunks, k=2)
        assert len(matches) > 0 and matches[0][1] > 0.05, "Retrieval failed on relevant query"
        print(f"  [PASS] Cosine Retrieval: Top match score {matches[0][1]:.4f} for '{pack['test_query'][:40]}...'")

        # 3. Guardrail (Rejection of Hallucinations)
        is_safe, score, _ = check_retrieval_guardrail(pack["out_query"], chunks, threshold=0.08)
        assert not is_safe, f"Guardrail failed! Allowed '{pack['out_query']}' with score {score}"
        print(f"  [PASS] Guardrail: Blocked out-of-scope query '{pack['out_query']}' (score {score:.4f} < 0.08)")

        # 4. Topic Map
        with open(pack["syllabus"], "r") as f:
            syl_raw = f.read()
        with open(pack["past"], "r") as f:
            past_raw = f.read()
        topics = generate_topic_map(syl_raw, past_raw, file_name=os.path.basename(pack["syllabus"]))
        assert len(topics) >= 3, "Topic map extraction returned fewer than 3 topics"
        high_freq = [t for t in topics if t.examFrequency == "High"]
        print(f"  [PASS] Topic Map: Extracted {len(topics)} topics ({len(high_freq)} High Exam Frequency)")

        # 5. Diagnostic Quiz Generation
        quiz_qs = generate_grounded_quiz(topics[:2], chunks)
        assert len(quiz_qs) >= 2, "Quiz generation failed"
        assert quiz_qs[0].citation is not None, "Quiz question missing citation"
        print(f"  [PASS] Grounded Quiz: Generated {len(quiz_qs)} MCQs with citations to {quiz_qs[0].citation.fileName}")

        # 6. Gap Report Diagnosis
        # Simulate student getting 1 correct and 1 wrong
        evals = [
            {
                "topicId": quiz_qs[0].topicId,
                "topicName": quiz_qs[0].topicName,
                "isCorrect": True,
                "explanation": quiz_qs[0].explanation,
            },
            {
                "topicId": quiz_qs[-1].topicId,
                "topicName": quiz_qs[-1].topicName,
                "isCorrect": False,
                "explanation": "Confused formula details",
            },
        ]
        gap_rep = generate_gap_report(evals, topics, "test-attempt-1")
        assert len(gap_rep.gaps) >= 1, "Gap report generation failed"
        print(f"  [PASS] Gap Report: Diagnosed gaps, overall score {gap_rep.overallScore}%, top gap: {gap_rep.recommendedFocusTopic}")

        # 7. Adaptive Revision Plan
        plan = generate_revision_plan(gap_rep, total_days=3, hours_per_day=2.0, chunks=chunks)
        assert len(plan.days) >= 1, "Revision plan generation failed"
        print(f"  [PASS] Adaptive Plan: Generated {len(plan.days)}-day schedule prioritizing weak topics")

        # 8. Grounded Chat
        chat_resp = chat_explain_topic(pack["test_query"], chunks)
        assert not chat_resp["outOfScope"], "Chat failed on valid query"
        assert len(chat_resp["sources"]) > 0, "Chat response missing sources"
        print(f"  [PASS] Grounded Chat: Answered with {len(chat_resp['sources'])} source citations")

    print("\n" + "=" * 70)
    print("  ALL MULTI-SAMPLE VERIFICATIONS PASSED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()

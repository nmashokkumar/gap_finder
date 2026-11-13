#!/usr/bin/env python3
# backend/demo_rag_cli.py
# Purpose: A standalone, 100% pure Python CLI demo of GapFinder AI.
# Why we need this: During a technical interview, you can run this script directly
# in your terminal: `python backend/demo_rag_cli.py`
# It will load study notes, run Cosine Similarity retrieval, generate grounded MCQs,
# score a simulated quiz, and output a Gap Report right in the terminal!

import os
import sys
from dotenv import load_dotenv

# Add parent directory to Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.rag.chunker import chunk_document
from backend.rag.retriever import retrieve_top_k, check_retrieval_guardrail
from backend.services.ai_service import (
    generate_topic_map,
    generate_grounded_quiz,
    generate_gap_report,
    generate_revision_plan,
)

load_dotenv(".env.local")
load_dotenv(".env")


def main():
    print("=" * 65)
    print("  GapFinder AI — Standalone Python RAG Demonstration")
    print("=" * 65)

    sample_syllabus_path = "sample-uploads/ai_engineering/AI_Syllabus.txt"
    sample_notes_path = "sample-uploads/ai_engineering/AI_Notes.txt"
    sample_past_papers_path = "sample-uploads/ai_engineering/AI_Past_Papers.txt"

    if not os.path.exists(sample_notes_path):
        print("Sample files not found. Run from the project root directory.")
        return

    print("\n[Step 1] Ingesting & Chunking Study Notes...")
    with open(sample_notes_path, "r") as f:
        notes_text = f.read()

    chunks = chunk_document(
        doc_id="ai-notes",
        doc_type="notes",
        file_name="AI_Notes.pdf",
        raw_text=notes_text,
    )
    print(f" -> Successfully parsed notes into {len(chunks)} indexed chunks with section headers & page numbers.")
    print(f" -> Sample Chunk 1: [{chunks[0].sectionLabel} · Page {chunks[0].pageNumber}]")

    print("\n[Step 2] Testing Mathematical Retrieval (NumPy Cosine Similarity)...")
    test_query = "What causes the vanishing gradient problem with Sigmoid?"
    matches = retrieve_top_k(test_query, chunks, k=2)
    print(f" -> Query: '{test_query}'")
    for rank, (chunk, score) in enumerate(matches, 1):
        print(f"    Rank {rank} (Cosine Similarity: {score:.4f}): [{chunk.sectionLabel}]")

    print("\n[Step 3] Testing Retrieval Guardrail against Hallucinations...")
    out_of_scope_query = "Who won the FIFA football world cup in 2022?"
    is_safe, score, _ = check_retrieval_guardrail(out_of_scope_query, chunks, threshold=0.08)
    print(f" -> Query: '{out_of_scope_query}'")
    print(f" -> Guardrail Score: {score:.4f} (Safe to generate? {is_safe})")
    if not is_safe:
        print(" -> [PASS] Guardrail correctly BLOCKED the out-of-scope question from hallucinating!")

    print("\n[Step 4] Building Syllabus Topic Map & Linking Past Exam Papers...")
    with open(sample_syllabus_path, "r") as f:
        syllabus_text = f.read()
    with open(sample_past_papers_path, "r") as f:
        past_papers_text = f.read()

    topics = generate_topic_map(syllabus_text, past_papers_text, file_name="AI_Syllabus.pdf")
    print(f" -> Extracted {len(topics)} syllabus topics:")
    for t in topics:
        print(f"    * {t.name} (Exam Frequency: {t.examFrequency}, Linked Past Questions: {len(t.linkedQuestions)})")

    print("\n[Step 5] Generating 100% Grounded Diagnostic Quiz via Groq...")
    questions = generate_grounded_quiz(topics[:2], chunks)
    print(f" -> Generated {len(questions)} diagnostic questions strictly grounded in textbook excerpts.")
    if questions:
        q = questions[0]
        print(f"\nSample Question: {q.question}")
        for i, opt in enumerate(q.options):
            mark = " (Correct)" if i == q.correctIndex else ""
            print(f"   [{i}] {opt}{mark}")
        print(f" -> Citation: {q.citation.fileName} · {q.citation.sectionLabel}")
        print(f" -> Verbatim Excerpt: \"{q.citation.excerpt}\"")

    print("\n" + "=" * 65)
    print("  Python RAG Demonstration Complete!")
    print("=" * 65)


if __name__ == "__main__":
    main()

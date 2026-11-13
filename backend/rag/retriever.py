# backend/rag/retriever.py
# Purpose: Deterministic mathematical retrieval using TF-IDF and Cosine Similarity.
# Why we need this: In RAG Stage 1, we do NOT use an LLM. We use pure linear algebra (NumPy & Scikit-Learn)
# to compare the user question with all textbook paragraphs and pick the top most relevant chunks.

from typing import List, Tuple
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from backend.models.schemas import TextChunk


# -------------------------------------------------------------
# Function: retrieve_top_k
# What it does:
#   1. Converts the query and all chunks into TF-IDF numerical vectors.
#   2. Calculates the Cosine Similarity angle: (A · B) / (||A|| * ||B||).
#   3. Sorts the chunks by highest similarity score.
#   4. Returns the top K chunks along with their relevance scores.
# -------------------------------------------------------------
def retrieve_top_k(
    query: str,
    chunks: List[TextChunk],
    k: int = 3,
) -> List[Tuple[TextChunk, float]]:
    if not query.strip() or not chunks:
        return []

    # Step 1: Collect text from all chunks
    corpus = [c.text for c in chunks]

    # Step 2: Build TF-IDF Vectorizer (sublinear_tf dampens very frequent words)
    vectorizer = TfidfVectorizer(
        stop_words="english",
        ngram_range=(1, 2),  # Use both single words and 2-word phrases
        sublinear_tf=True,
    )

    try:
        # Step 3: Transform text into vector matrices
        chunk_vectors = vectorizer.fit_transform(corpus)
        query_vector = vectorizer.transform([query])

        # Step 4: Calculate Cosine Similarity between query vector and every chunk vector
        # Returns a 1D numpy array of similarity scores between 0.0 and 1.0
        scores = cosine_similarity(query_vector, chunk_vectors).flatten()

        # Step 5: Get indices of top K scores using numpy argsort (descending order)
        top_indices = np.argsort(scores)[::-1][:k]

        results: List[Tuple[TextChunk, float]] = []
        for idx in top_indices:
            score = float(scores[idx])
            if score > 0.001:  # Only include chunks with some relevance
                results.append((chunks[idx], round(score, 4)))

        # Fallback: If no words overlapped, return first few chunks to avoid returning empty
        if not results and len(chunks) > 0:
            return [(c, 0.0) for c in chunks[:k]]

        return results
    except ValueError:
        # Fallback if vocabulary is empty
        return [(c, 0.0) for c in chunks[:k]]


# -------------------------------------------------------------
# Function: check_retrieval_guardrail
# What it does: Checks if the highest cosine similarity is above a strict threshold.
# Why we need it: Prevents hallucinations! If the user asks "Who won the World Cup?",
# the similarity against textbook notes will be ~0.0. We refuse to answer.
# -------------------------------------------------------------
def check_retrieval_guardrail(
    query: str,
    chunks: List[TextChunk],
    threshold: float = 0.08,
) -> Tuple[bool, float, List[Tuple[TextChunk, float]]]:
    matches = retrieve_top_k(query, chunks, k=3)
    if not matches:
        return False, 0.0, []

    best_score = matches[0][1]
    is_safe = best_score >= threshold
    return is_safe, best_score, matches

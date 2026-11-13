# backend/rag/chunker.py
# Purpose: Splits raw textbook and syllabus text into clean, searchable chunks.
# Why we need this: In RAG, an AI cannot read a giant document all at once.
# We cut the document into bite-sized paragraphs while keeping the chapter titles and page numbers attached.

import re
from typing import List
from backend.models.schemas import TextChunk


# -------------------------------------------------------------
# Function: chunk_document
# What it does: Takes a raw document text and breaks it into smaller TextChunk objects.
# How it works:
#   1. First, it looks for section marks like [Chapter 1 · Section 1.1 · Page 14].
#   2. If those exist, it uses those as natural chapter boundaries.
#   3. If it is plain text, it slices the text every ~300 words with a 40-word overlap.
# -------------------------------------------------------------
def chunk_document(
    doc_id: str,
    doc_type: str,
    file_name: str,
    raw_text: str,
    max_words: int = 350,
    overlap_words: int = 40,
) -> List[TextChunk]:
    if not raw_text or not raw_text.strip():
        return []

    # Check if the document has explicit section markers like [Chapter 1 ... Page 14]
    section_pattern = re.compile(r"\[([^\]\n]*Section\s+[\d.]+[^\]\n]*)\]", re.IGNORECASE)
    matches = list(section_pattern.finditer(raw_text))

    if len(matches) >= 2:
        # Use explicit section markers for high-precision citation
        return _chunk_by_section_tags(doc_id, doc_type, file_name, raw_text, matches)

    # Otherwise, split by sliding window paragraph blocks
    return _chunk_by_sliding_window(doc_id, doc_type, file_name, raw_text, max_words, overlap_words)


# -------------------------------------------------------------
# Helper: _chunk_by_section_tags
# What it does: Splits text at "[Chapter X · Section Y · Page Z]" markers.
# -------------------------------------------------------------
def _chunk_by_section_tags(
    doc_id: str,
    doc_type: str,
    file_name: str,
    raw_text: str,
    matches: list,
) -> List[TextChunk]:
    chunks: List[TextChunk] = []

    for i, match in enumerate(matches):
        header_text = match.group(1).strip()
        start_idx = match.end()
        end_idx = matches[i + 1].start() if i + 1 < len(matches) else len(raw_text)

        body_text = raw_text[start_idx:end_idx].strip()
        if not body_text:
            continue

        # Extract page number if present (e.g., "Page 14")
        page_match = re.search(r"Page\s+(\d+)", header_text, re.IGNORECASE)
        page_num = int(page_match.group(1)) if page_match else None

        # Clean header for display (remove page number to keep label clean)
        clean_label = re.sub(r"·?\s*Page\s+\d+", "", header_text, flags=re.IGNORECASE).strip()

        chunks.append(
            TextChunk(
                id=f"{doc_id}-chunk-{len(chunks) + 1}",
                docId=doc_id,
                docType=doc_type,
                fileName=file_name,
                sectionLabel=clean_label or header_text,
                pageNumber=page_num,
                text=body_text,
            )
        )

    return chunks


# -------------------------------------------------------------
# Helper: _chunk_by_sliding_window
# What it does: Slices plain text into ~300 word chunks with overlap.
# Why overlap? If a sentence sits on the boundary between two chunks,
# the overlap prevents the meaning from being cut in half.
# -------------------------------------------------------------
def _chunk_by_sliding_window(
    doc_id: str,
    doc_type: str,
    file_name: str,
    raw_text: str,
    max_words: int,
    overlap_words: int,
) -> List[TextChunk]:
    chunks: List[TextChunk] = []
    paragraphs = [p.strip() for p in raw_text.split("\n\n") if p.strip()]

    current_words: List[str] = []
    chunk_index = 1

    for para in paragraphs:
        # Check for page markers embedded in PDF text like "[Page 2]"
        page_match = re.search(r"\[Page\s+(\d+)\]", para, re.IGNORECASE)
        page_num = int(page_match.group(1)) if page_match else None

        words = para.split()
        if len(current_words) + len(words) <= max_words:
            current_words.extend(words)
        else:
            if current_words:
                chunks.append(
                    TextChunk(
                        id=f"{doc_id}-chunk-{chunk_index}",
                        docId=doc_id,
                        docType=doc_type,
                        fileName=file_name,
                        sectionLabel=f"Section {chunk_index}",
                        pageNumber=page_num,
                        text=" ".join(current_words),
                    )
                )
                chunk_index += 1
                # Keep the last few words for overlap
                current_words = current_words[-overlap_words:] + words
            else:
                current_words = words

    if current_words:
        chunks.append(
            TextChunk(
                id=f"{doc_id}-chunk-{chunk_index}",
                docId=doc_id,
                docType=doc_type,
                fileName=file_name,
                sectionLabel=f"Section {chunk_index}",
                pageNumber=None,
                text=" ".join(current_words),
            )
        )

    return chunks

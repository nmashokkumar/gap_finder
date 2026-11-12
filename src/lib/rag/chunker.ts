import { DocumentType, TextChunk } from '@/types';

/**
 * Splits document text into structured semantic chunks with citation metadata.
 * Safe against inline square brackets such as DAX formulas ([Total Sales], DimDate[Date]).
 */
export function chunkDocument(
  docId: string,
  docType: DocumentType,
  fileName: string,
  rawText: string,
  maxWords = 260,
  overlapWords = 40
): TextChunk[] {
  if (!rawText || !rawText.trim()) return [];

  // 1. Check for explicit [Chapter/Section ... Page N] markers
  const sectionHeaderRegex = /\[([^\]\n]*Section\s+[\d.]+[^\]\n]*)\]/gi;
  if (sectionHeaderRegex.test(rawText)) {
    const customChunks = parseSectionMarkedText(docId, docType, fileName, rawText);
    if (customChunks.length > 0) return customChunks;
  }

  // 2. Split by [Page N] markers if present (from PDF extraction) or treat as Page 1
  const pageBlocks = rawText.split(/\[Page\s+(\d+)\]/i);
  const pages: Array<{ pageNum: number; body: string }> = [];

  if (pageBlocks.length > 1) {
    for (let i = 1; i < pageBlocks.length; i += 2) {
      const pageNum = parseInt(pageBlocks[i], 10) || 1;
      const body = pageBlocks[i + 1]?.trim() || '';
      if (body) pages.push({ pageNum, body });
    }
  } else {
    pages.push({ pageNum: 1, body: rawText.trim() });
  }

  // 3. Window each page's text into clean <= maxWords chunks with overlap
  const chunks: TextChunk[] = [];
  let chunkIndex = 1;

  for (const page of pages) {
    const words = page.body.split(/\s+/).filter(Boolean);
    if (words.length === 0) continue;

    let start = 0;
    while (start < words.length) {
      const slice = words.slice(start, start + maxWords);
      const chunkText = slice.join(' ').trim();

      if (chunkText.length > 20) {
        chunks.push({
          id: `${docId}-chunk-${chunkIndex++}`,
          docId,
          docType,
          fileName,
          sectionLabel: extractSectionTitle(chunkText) || `Page ${page.pageNum} · Part ${chunks.length + 1}`,
          pageNumber: page.pageNum,
          text: chunkText,
        });
      }

      if (start + maxWords >= words.length) break;
      start += Math.max(maxWords - overlapWords, 50);
    }
  }

  return chunks;
}

function parseSectionMarkedText(
  docId: string,
  docType: DocumentType,
  fileName: string,
  text: string
): TextChunk[] {
  const chunks: TextChunk[] = [];
  // Remove standalone [Page N] tags injected by pdf.js so they don't pollute bodies
  const cleaned = text.replace(/\[Page\s+\d+\]\s*/gi, '');
  const parts = cleaned.split(/\[([^\]\n]*Section\s+[\d.]+[^\]\n]*)\]/gi);

  for (let i = 1; i < parts.length; i += 2) {
    const header = parts[i].trim();
    const body = parts[i + 1]?.trim() || '';
    if (!body) continue;

    const pageMatch = header.match(/Page\s+(\d+)/i);
    const pageNum = pageMatch ? parseInt(pageMatch[1], 10) : undefined;
    const cleanSection = header.replace(/·?\s*Page\s+\d+/i, '').trim();

    chunks.push({
      id: `${docId}-chunk-${chunks.length + 1}`,
      docId,
      docType,
      fileName,
      sectionLabel: cleanSection || header,
      pageNumber: pageNum,
      text: body,
    });
  }

  return chunks;
}

function extractSectionTitle(text: string): string | null {
  const firstLine = text.split('\n')[0].trim();
  const headingMatch = firstLine.match(/(?:CHAPTER|MODULE|SECTION)\s+[\d.]+[^.\n]*/i);
  if (headingMatch) {
    return headingMatch[0].slice(0, 65).trim();
  }
  if (firstLine.startsWith('#')) {
    return firstLine.replace(/^#+\s*/, '').slice(0, 65).trim();
  }
  return null;
}

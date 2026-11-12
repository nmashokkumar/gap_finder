import { DocumentType, TextChunk } from '@/types';

/**
 * Splits document text into structured semantic chunks with citation metadata.
 */
export function chunkDocument(
  docId: string,
  docType: DocumentType,
  fileName: string,
  rawText: string,
  maxWords = 350,
  overlapWords = 50
): TextChunk[] {
  if (!rawText || !rawText.trim()) return [];

  // If text already has explicit [Header · Section · Page] markers, chunk by markers first
  if (rawText.includes('[') && rawText.includes('Section') && rawText.includes('Page')) {
    const customChunks = parseMarkedText(docId, docType, fileName, rawText);
    if (customChunks.length > 0) return customChunks;
  }

  // Fallback: Split by paragraphs or double newlines
  const paragraphs = rawText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 20);

  const chunks: TextChunk[] = [];
  let currentWords: string[] = [];
  let chunkIndex = 1;
  let estimatedPage = 1;

  for (let i = 0; i < paragraphs.length; i++) {
    const pWords = paragraphs[i].split(/\s+/);

    // Update estimated page roughly every 350 words
    estimatedPage = Math.floor((chunks.length * maxWords) / 400) + 1;

    if (currentWords.length + pWords.length > maxWords && currentWords.length > 0) {
      const chunkText = currentWords.join(' ');
      chunks.push({
        id: `${docId}-chunk-${chunkIndex++}`,
        docId,
        docType,
        fileName,
        sectionLabel: extractSectionTitle(chunkText) || `Section ${chunkIndex - 1}`,
        pageNumber: estimatedPage,
        text: chunkText,
      });

      // Retain overlap
      currentWords = currentWords.slice(-overlapWords);
    }

    currentWords.push(...pWords);
  }

  if (currentWords.length > 0) {
    const chunkText = currentWords.join(' ');
    chunks.push({
      id: `${docId}-chunk-${chunkIndex++}`,
      docId,
      docType,
      fileName,
      sectionLabel: extractSectionTitle(chunkText) || `Section ${chunkIndex - 1}`,
      pageNumber: estimatedPage,
      text: chunkText,
    });
  }

  return chunks;
}

function parseMarkedText(
  docId: string,
  docType: DocumentType,
  fileName: string,
  text: string
): TextChunk[] {
  const chunks: TextChunk[] = [];
  const parts = text.split(/\[(.*?)\]/g);

  for (let i = 1; i < parts.length; i += 2) {
    const header = parts[i].trim();
    const body = parts[i + 1]?.trim() || '';
    if (!body) continue;

    const pageMatch = header.match(/Page\s+(\d+)/i);
    const pageNum = pageMatch ? parseInt(pageMatch[1], 10) : undefined;

    const sectionMatch = header.match(/Section\s+([\d.]+)/i);
    const sectionLabel = sectionMatch ? `Section ${sectionMatch[1]}` : header;

    chunks.push({
      id: `${docId}-chunk-${chunks.length + 1}`,
      docId,
      docType,
      fileName,
      sectionLabel,
      pageNumber: pageNum,
      text: body,
    });
  }

  return chunks;
}

function extractSectionTitle(text: string): string | null {
  const line = text.split('\n')[0].trim();
  if (line.startsWith('#') || line.toUpperCase().includes('MODULE') || line.toUpperCase().includes('CHAPTER')) {
    return line.replace(/^#+\s*/, '').slice(0, 60);
  }
  return null;
}

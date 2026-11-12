'use client';

/**
 * Client-Side Text Extraction supporting PDF, TXT, and Markdown files.
 * Uses local /pdf.worker.min.mjs so it works cleanly offline, locally, and on Vercel.
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();

  // Direct text/markdown files
  if (
    fileName.endsWith('.txt') ||
    fileName.endsWith('.md') ||
    fileName.endsWith('.json') ||
    file.type.startsWith('text/')
  ) {
    return cleanExtractedText(await file.text());
  }

  // PDF files via Mozilla pdfjs-dist
  if (fileName.endsWith('.pdf') || file.type === 'application/pdf') {
    const pdfjs = await import('pdfjs-dist');
    if (typeof window !== 'undefined') {
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    }

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    let fullText = '';
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: unknown) => {
          const strItem = item as { str?: string };
          return strItem.str || '';
        })
        .join(' ');

      if (pageText.trim()) {
        fullText += `\n\n[Page ${pageNum}]\n${pageText}`;
      }
    }

    const cleaned = cleanExtractedText(fullText);
    if (!cleaned) {
      throw new Error(
        'No readable text found in this PDF (it may be a scanned image). Please paste the text or use a text-based PDF.'
      );
    }
    return cleaned;
  }

  return cleanExtractedText(await file.text());
}

export function cleanExtractedText(rawText: string): string {
  return rawText
    .replace(/Page\s+\d+\s+of\s+\d+/gi, '')
    .replace(/\r\n|\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

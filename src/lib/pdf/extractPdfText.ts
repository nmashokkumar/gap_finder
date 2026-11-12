'use client';

/**
 * Client-Side Text Extraction supporting PDF, TXT, and Markdown files.
 * Eliminates serverless payload limits and C++ native binary issues on Vercel.
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();

  // If text or markdown, read directly via browser FileReader API
  if (fileName.endsWith('.txt') || fileName.endsWith('.md') || fileName.endsWith('.json') || file.type.startsWith('text/')) {
    return await file.text();
  }

  // If PDF, use pdfjs-dist
  if (fileName.endsWith('.pdf') || file.type === 'application/pdf') {
    try {
      const pdfjs = await import('pdfjs-dist');
      // Set worker source
      if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
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

        fullText += `\n\n[Page ${pageNum}]\n${pageText}`;
      }

      return cleanExtractedText(fullText);
    } catch (pdfErr) {
      console.warn('PDF parsing fallback to raw text stream', pdfErr);
      const text = await file.text();
      return cleanExtractedText(text);
    }
  }

  return await file.text();
}

export function cleanExtractedText(rawText: string): string {
  return rawText
    .replace(/Page\s+\d+\s+of\s+\d+/gi, '')
    .replace(/\r\n|\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

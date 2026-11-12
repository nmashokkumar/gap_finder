import { TextChunk, RetrievedChunk } from '@/types';

const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from',
  'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself',
  'his', 'how', 'i', 'if', 'in', 'into', 'is', 'isn', 'it', 'its', 'itself', 'just', 'me', 'more',
  'most', 'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only', 'or', 'other',
  'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'should', 'so', 'some', 'such',
  'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they',
  'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasn', 'we',
  'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'would', 'you',
  'your', 'yours', 'yourself', 'yourselves'
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9_\-\s]/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

function computeTF(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  if (tokens.length === 0) return tf;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    tf.set(token, (tf.get(token) || 0) + 1);
  }

  // Normalize
  tf.forEach((count, token) => {
    tf.set(token, count / tokens.length);
  });

  return tf;
}

function computeIDF(allChunksTokens: string[][]): Map<string, number> {
  const idf = new Map<string, number>();
  const totalDocs = allChunksTokens.length;
  if (totalDocs === 0) return idf;

  const docCountForToken = new Map<string, number>();
  for (let i = 0; i < allChunksTokens.length; i++) {
    const tokens = allChunksTokens[i];
    const unique = new Set(tokens);
    unique.forEach((token) => {
      docCountForToken.set(token, (docCountForToken.get(token) || 0) + 1);
    });
  }

  docCountForToken.forEach((count, token) => {
    idf.set(token, Math.log(1 + totalDocs / count));
  });

  return idf;
}

function cosineSimilarity(
  v1: Map<string, number>,
  v2: Map<string, number>
): number {
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  v1.forEach((val) => {
    norm1 += val * val;
  });

  v2.forEach((val) => {
    norm2 += val * val;
  });

  if (norm1 === 0 || norm2 === 0) return 0;

  v1.forEach((val1, token) => {
    const val2 = v2.get(token);
    if (val2) {
      dotProduct += val1 * val2;
    }
  });

  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

/**
 * Pure-TypeScript Top-K Vector Retrieval with Cosine Similarity.
 * 100% deterministic, zero external API latency, works identically in browser & serverless.
 */
export function retrieveTopK(
  query: string,
  chunks: TextChunk[],
  topK = 4
): RetrievedChunk[] {
  if (!query || chunks.length === 0) return [];

  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  const chunkTokensList = chunks.map((c) => tokenize(`${c.sectionLabel} ${c.text}`));
  const idf = computeIDF(chunkTokensList);

  // Compute Query TF-IDF Vector
  const queryTF = computeTF(queryTokens);
  const queryVec = new Map<string, number>();
  queryTF.forEach((tf, token) => {
    const idfVal = idf.get(token) || Math.log(1 + chunks.length);
    queryVec.set(token, tf * idfVal);
  });

  // Score each chunk
  const scoredChunks: RetrievedChunk[] = chunks.map((chunk, index) => {
    const cTokens = chunkTokensList[index];
    const cTF = computeTF(cTokens);
    const cVec = new Map<string, number>();

    cTF.forEach((tf, token) => {
      const idfVal = idf.get(token) || 1;
      cVec.set(token, tf * idfVal);
    });

    const score = cosineSimilarity(queryVec, cVec);

    return {
      ...chunk,
      score: Math.round(score * 1000) / 1000,
    };
  });

  // Sort descending by score
  return scoredChunks
    .filter((c) => c.score > 0.01)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

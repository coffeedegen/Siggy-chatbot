/**
 * Local vector search using cosine similarity.
 * Loads embeddings from /knowledge/embeddings.json and returns top-k chunks.
 */

import path from "path";
import fs from "fs";
import { getEmbedding } from "./openai";

export interface EmbeddingChunk {
  text: string;
  embedding: number[];
  source?: string;
}

export interface StoredEmbeddings {
  chunks: EmbeddingChunk[];
}

const EMBEDDINGS_PATH = path.join(process.cwd(), "knowledge", "embeddings.json");

/**
 * Load embeddings from knowledge/embeddings.json.
 */
export function loadEmbeddings(): StoredEmbeddings {
  const fullPath = path.resolve(EMBEDDINGS_PATH);
  if (!fs.existsSync(fullPath)) {
    return { chunks: [] };
  }
  const raw = fs.readFileSync(fullPath, "utf-8");
  return JSON.parse(raw) as StoredEmbeddings;
}

/**
 * Cosine similarity between two vectors (assumes same length, normalized optional).
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Search stored embeddings by query: embed query, rank by cosine similarity, return top k chunks.
 */
export async function searchChunks(
  query: string,
  topK: number = 5
): Promise<{ text: string; source?: string; score: number }[]> {
  const stored = loadEmbeddings();
  if (stored.chunks.length === 0) return [];

  const queryEmbedding = await getEmbedding(query);
  const withScores = stored.chunks.map((chunk) => ({
    text: chunk.text,
    source: chunk.source,
    score: cosineSimilarity(chunk.embedding, queryEmbedding),
  }));

  withScores.sort((a, b) => b.score - a.score);
  return withScores.slice(0, topK).map(({ text, source, score }) => ({
    text,
    source,
    score,
  }));
}

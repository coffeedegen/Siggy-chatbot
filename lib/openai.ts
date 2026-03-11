/**
 * OpenAI client and helpers for chat and embeddings.
 * Uses OPENAI_API_KEY from environment.
 */

import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  console.warn(
    "OPENAI_API_KEY is not set. Chat and embeddings will fail at runtime."
  );
}

export const openai = new OpenAI({
  apiKey:process.env.OPENAI_API_KEY ?? "",
});

/** Model used for chat completions (Siggy). */
export const CHAT_MODEL = "gpt-4o-mini";

/** Model used for embeddings (RAG). */
export const EMBEDDING_MODEL = "text-embedding-3-small";

/**
 * Generate embedding vector for a single text using OpenAI.
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text.trim().slice(0, 8191),
  });
  return response.data[0].embedding;
}

/**
 * Generate embeddings for multiple texts in one API call (batch).
 */
export async function getEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const input = texts.map((t) => t.trim().slice(0, 8191));
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input,
  });
  const sorted = [...response.data].sort((a, b) => a.index - b.index);
  return sorted.map((d) => d.embedding);
}

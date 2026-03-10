/**
 * Creates embeddings for all .txt files in /knowledge (excluding embeddings.json).
 * Chunks text into 500-800 character segments, generates embeddings via OpenAI,
 * and saves to knowledge/embeddings.json.
 *
 * Run: npx tsx scripts/createEmbeddings.ts
 * Requires: OPENAI_API_KEY
 */

import fs from "fs";
import path from "path";
import { getEmbeddings } from "../lib/openai";
import type { EmbeddingChunk, StoredEmbeddings } from "../lib/vectorSearch";

const KNOWLEDGE_DIR = path.join(process.cwd(), "knowledge");
const MIN_CHUNK = 500;
const MAX_CHUNK = 800;
const OVERLAP = 100;

function readTextFiles(dir: string): { content: string; source: string }[] {
  const files: { content: string; source: string }[] = [];
  if (!fs.existsSync(dir)) {
    console.warn("Knowledge directory not found:", dir);
    return files;
  }
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".txt")) continue;
    const fullPath = path.join(dir, entry.name);
    const content = fs.readFileSync(fullPath, "utf-8").trim();
    if (content.length > 0) {
      files.push({ content, source: entry.name });
    }
  }
  return files;
}

/**
 * Split text into overlapping chunks of roughly MIN_CHUNK to MAX_CHUNK characters.
 */
function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;
  const normalized = text.replace(/\s+/g, " ").trim();
  while (start < normalized.length) {
    let end = Math.min(start + MAX_CHUNK, normalized.length);
    if (end < normalized.length) {
      const lastSpace = normalized.lastIndexOf(" ", end);
      if (lastSpace > start) end = lastSpace;
    }
    const chunk = normalized.slice(start, end).trim();
    if (chunk.length >= MIN_CHUNK || chunks.length === 0) {
      chunks.push(chunk);
    }
    start = end - (end < normalized.length ? OVERLAP : 0);
    if (start >= end) start = end;
  }
  return chunks.filter(Boolean);
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY is required. Set it and run again.");
    process.exit(1);
  }

  const sources = readTextFiles(KNOWLEDGE_DIR);
  if (sources.length === 0) {
    console.error("No .txt files found in knowledge/. Add ritual docs and run again.");
    process.exit(1);
  }

  const allChunks: { text: string; source: string }[] = [];
  for (const { content, source } of sources) {
    const chunks = chunkText(content);
    for (const text of chunks) {
      allChunks.push({ text, source });
    }
  }

  console.log(`Chunked ${sources.length} file(s) into ${allChunks.length} chunks. Generating embeddings...`);

  const batchSize = 50;
  const chunksWithEmbeddings: EmbeddingChunk[] = [];

  for (let i = 0; i < allChunks.length; i += batchSize) {
    const batch = allChunks.slice(i, i + batchSize);
    const texts = batch.map((b) => b.text);
    const embeddings = await getEmbeddings(texts);
    for (let j = 0; j < batch.length; j++) {
      chunksWithEmbeddings.push({
        text: batch[j].text,
        source: batch[j].source,
        embedding: embeddings[j],
      });
    }
    console.log(`Embedded ${Math.min(i + batchSize, allChunks.length)} / ${allChunks.length}`);
  }

  const output: StoredEmbeddings = { chunks: chunksWithEmbeddings };
  const outPath = path.join(KNOWLEDGE_DIR, "embeddings.json");
  fs.writeFileSync(outPath, JSON.stringify(output, null, 0), "utf-8");
  console.log("Saved embeddings to", outPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

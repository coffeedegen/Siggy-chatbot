import fs from "fs";
import path from "path";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const KNOWLEDGE_DIR = path.join(process.cwd(), "knowledge");
const OUTPUT_FILE = path.join(process.cwd(), "knowledge", "embeddings.json");
const CHUNK_SIZE = 500; // characters per chunk

function chunkText(text: string, size: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += size) {
    const chunk = text.slice(i, i + size).trim();
    if (chunk) chunks.push(chunk);
  }
  return chunks;
}

async function ingest() {
  const files = fs.readdirSync(KNOWLEDGE_DIR).filter((f) => f.endsWith(".txt"));
  console.log(`Found ${files.length} files:`, files);

  const allChunks: { text: string; embedding: number[]; source: string }[] = [];

  for (const file of files) {
    const filePath = path.join(KNOWLEDGE_DIR, file);
    const text = fs.readFileSync(filePath, "utf-8");
    const chunks = chunkText(text, CHUNK_SIZE);

    console.log(`Processing ${file}: ${chunks.length} chunks...`);

    for (const chunk of chunks) {
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: chunk,
      });

      allChunks.push({
        text: chunk,
        embedding: response.data[0].embedding,
        source: file,
      });
    }

    console.log(`✅ Done: ${file}`);
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify({ chunks: allChunks }, null, 2));
  console.log(`\n✅ Saved ${allChunks.length} chunks to embeddings.json`);
}

ingest().catch(console.error);
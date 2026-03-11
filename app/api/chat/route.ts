/**
 * Chat API: receives user message, runs RAG (vector search + context),
 * then sends to OpenAI with Siggy system prompt and returns the reply.
 */

import { NextRequest, NextResponse } from "next/server";
import { openai, CHAT_MODEL } from "@/lib/openai";
import { searchChunks } from "@/lib/vectorSearch";
import { buildSystemMessage } from "@/lib/siggyPrompt";

const TOP_K_CHUNKS = 5;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured" },
        { status: 503 }
      );
    }

    // 1. Vector search: get top 5 relevant chunks from Ritual docs
    const results = await searchChunks(message, TOP_K_CHUNKS);
    const contextChunks = results.map((r) => r.text);

    // 2. Build system message with Siggy persona + RAG context
    const systemContent = buildSystemMessage(contextChunks);

    // 3. Call OpenAI with system prompt, context, and user message
    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        { role: "system", content: systemContent }, // ✅ was SIGGY_PROMPT (undefined)
        { role: "user", content: message }
      ],
      max_completion_tokens: 1024,
    });

    const reply =
      completion.choices[0]?.message?.content?.trim() ??
      "I seem to have lost my train of thought. Try again?";

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Chat API error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: message || "Failed to get response" },
      { status: 500 }
    );
  }
}
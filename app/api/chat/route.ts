import { NextRequest, NextResponse } from "next/server";
import { openai, CHAT_MODEL } from "@/lib/openai";
import { searchChunks } from "@/lib/vectorSearch";
import { buildSystemMessage } from "@/lib/siggyPrompt";

const TOP_K_CHUNKS = 5;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const history: { role: "user" | "assistant"; content: string }[] = Array.isArray(body.history) ? body.history : [];

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 503 });
    }

    const results = await searchChunks(message, TOP_K_CHUNKS);
    const contextChunks = results.map((r) => r.text);
    const systemContent = buildSystemMessage(contextChunks);

    const stream = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        { role: "system", content: systemContent },
        ...history.slice(-10), // keep last 10 messages for context
        { role: "user", content: message },
      ],
      max_tokens: 1024,
      temperature: 0.7,
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content ?? "";
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    console.error("Chat API error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
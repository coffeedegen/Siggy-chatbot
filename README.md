# Siggy – The Celestial Architect

A production-ready AI chatbot that answers questions about the **Ritual Network** using Retrieval-Augmented Generation (RAG). Siggy is a void-black cat persona who believes Ritual is the technological embodiment of cosmic order.

## Project Structure

```
/app
  /api/chat/route.ts    # Chat API: RAG + OpenAI
  layout.tsx
  page.tsx              # Chat UI
  globals.css
/lib
  siggyPrompt.ts        # Siggy system prompt + context builder
  vectorSearch.ts       # Load embeddings, cosine similarity, top-k search
  openai.ts             # OpenAI client, getEmbedding(s)
/scripts
  createEmbeddings.ts   # Chunk knowledge .txt → embed → save embeddings.json
/knowledge
  *.txt                 # Ritual documentation (plain text)
  embeddings.json       # Generated embeddings (run script to populate)
```



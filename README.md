# Siggy – The Celestial Architect

A production-ready AI chatbot that answers questions about the **Ritual Network** using Retrieval-Augmented Generation (RAG). Siggy is a void-black cat persona who believes Ritual is the technological embodiment of cosmic order.

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **TailwindCSS**
- **OpenAI API** (chat: `gpt-4o-mini`, embeddings: `text-embedding-3-small`)
- **Local vector search** (cosine similarity, no external vector DB)
- **RAG**: load docs → chunk → embed → store in `knowledge/embeddings.json` → retrieve top 5 chunks per query → generate with Siggy system prompt

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

## 1. How to Generate Embeddings

Embeddings are required for RAG. The repo ships with an empty `knowledge/embeddings.json`. To fill it:

1. **Set your OpenAI API key** (see “Run the chatbot” below).
2. **Install dependencies** (once):  
   `npm install`
3. **Run the embeddings script**:
   ```bash
   npm run embeddings
   ```
   This script:
   - Reads all `.txt` files from `/knowledge` (e.g. `ritual-core-technology.txt`, `ritual-ai-systems.txt`, etc.).
   - Splits text into chunks of 500–800 characters (with overlap).
   - Calls OpenAI `text-embedding-3-small` for each chunk.
   - Writes `knowledge/embeddings.json`.

Run `npm run embeddings` again whenever you add or change files in `/knowledge`.

## 2. How to Run the Chatbot

1. **Clone and install**
   ```bash
   cd Siggy-chatbot
   npm install
   ```

2. **Configure environment**
   - Copy `.env.local.example` to `.env.local`.
   - Set `OPENAI_API_KEY=sk-your-key` in `.env.local`.

3. **Generate embeddings** (if not done already)
   ```bash
   npm run embeddings
   ```

4. **Start the dev server**
   ```bash
   npm run dev
   ```

5. **Open** [http://localhost:3000](http://localhost:3000) and chat with Siggy.

## 3. How to Deploy to Vercel

1. **Push the project to a Git repo** (e.g. GitHub).  
   Ensure `knowledge/embeddings.json` is committed (it is not in `.gitignore`). If the file is large, you can add it to the repo or generate it in a build step (see below).

2. **Import the project in Vercel**
   - Go to [vercel.com](https://vercel.com) → Add New → Project.
   - Import your repository and leave the default Next.js settings.

3. **Set environment variable**
   - In the project → Settings → Environment Variables, add:
   - **Name:** `OPENAI_API_KEY`  
   - **Value:** your OpenAI API key  
   - Apply to Production (and Preview if you want).

4. **Deploy**
   - Trigger a deploy (e.g. “Deploy” or push to the connected branch).  
   - The app will run at `https://your-project.vercel.app`.

**Note:** `knowledge/embeddings.json` is read at runtime. Either commit the generated file so it’s included in the Vercel build, or add a custom build step that runs `npm run embeddings` before `next build` (and ensure the key is available in the build environment).

## Persona (Siggy)

- Void-black cat, “The Celestial Architect.”
- Grew up with a wizard; prefers stars over scrolls; sees Ritual as the technological embodiment of cosmic order.
- Intelligent, witty, playful, dry humor, enthusiastic about Ritual.
- Pivots conversations about AI, blockchain, smart contracts, ML, crypto, agents toward Ritual.
- Uses cosmic metaphors; **never uses em dashes** in replies.

## License

MIT.

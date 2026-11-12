# GapFinder AI — Find What the Student Doesn’t Know

> **Hackathon PS 2026 · `{igebra.ai}` / AI Ready School AI Intern Assignment**

Most study tools wait for a student to ask a question—but a student cannot ask about a knowledge gap they don't know they have. **GapFinder AI** acts like a **study doctor**: it ingests a student's syllabus, notes, and past exam papers, runs a grounded diagnostic quiz, diagnoses weak areas with verifiable citations, and builds an adaptive revision plan.

---

## Core Diagnostic Loop

```
Upload Material (PDF or Text: Syllabus + Notes + Past Papers)
       ↓
  Topic Map (Syllabus breakdown + Retrieval-mapped past-paper frequency)
       ↓
Diagnostic Quiz (100% RAG-grounded MCQs with exact page/section citations)
       ↓
Answer Evaluation & Gap Report (🔴 Weak / 🟡 Medium / 🟢 Strong + reasons)
       ↓
Personalized Revision Plan (Ordered by weakness + exam weight + user time)
       ↓
Explain-This-Topic RAG Chat & Progress Dashboard
       ↓
Re-test Weak Topics → Gap Report & Plan Automatically Update
```

---

## Demo Credentials (Ready for Evaluators)

- **Email**: `demo@gapfinder.ai`
- **Password**: `demo1234`
- **1-Click Access**: Click **"Sign In as Demo Student"** on `/login`, then click **"Load AI/ML Sample Material"** in the Workspace or Navbar.

---

## Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js 14 (App Router, TypeScript) | Frontend pages + serverless API routes |
| **Styling** | Tailwind CSS + Lucide Icons | Clean, calm, distraction-free student UI |
| **AI SDK** | Vercel AI SDK (`ai`, `@ai-sdk/groq`, `@ai-sdk/react`) | `generateObject` (Zod schemas) & `streamText` + `useChat` |
| **LLM Inference** | Groq Cloud (`openai/gpt-oss-120b`) | Sub-second structured JSON & streaming inference |
| **RAG Engine** | Pure-TS TF-IDF Vectorizer + Cosine Similarity | Zero-latency deterministic retrieval with chunk citations |
| **PDF Parsing** | Mozilla `pdfjs-dist` (Browser-side) | Parses PDFs cleanly on client without serverless size limits |
| **Analytics** | Recharts | Attempt-by-attempt progress visualization |
| **Persistence** | Student-scoped `localStorage` | Saves documents, attempts, gap reports, and plans across reloads |

---

## How Retrieval & Generation Are Kept Separate (Mandatory Architecture)

GapFinder AI enforces a strict two-stage separation so the LLM cannot hallucinate from general pre-training memory:

### 1. Where Retrieval Is Used (`src/lib/rag/retriever.ts` & `src/lib/rag/chunker.ts`) — **Zero LLM Calls**
- **Ingestion**: Uploaded PDFs/text are split into metadata-tagged chunks (`fileName`, `sectionLabel`, `pageNumber`, `text`).
- **Past-Paper Mapping (`/api/topic-map`)**: Individual past-paper questions are matched to syllabus topics using TF-IDF Cosine Similarity to calculate exam frequency.
- **Quiz Grounding (`/api/quiz`)**: For each topic, `retrieveTopK()` fetches the Top-3 matching textbook chunks *before* calling the LLM.
- **Revision References (`/api/revision-plan`)**: Retrieves exact textbook sections for each weak topic.
- **Chat Guardrail (`/api/chat`)**: Runs `retrieveTopK(userQuery, chunks, 4)`. If top cosine similarity `< 0.08`, the query is flagged as out-of-scope.

### 2. Where Generation Is Used (`src/app/api/*`) — **Strict Context Boundary**
- **Topic Structuring (`/api/topic-map`)**: Extracts syllabus topics/subtopics via `generateObject()` + Zod.
- **Question Formulation (`/api/quiz`)**: Receives *only* the retrieved chunks for that topic and outputs MCQs with a `verbatimExcerpt` and `chunkNumber` citation.
- **Diagnostic Reasoning (`/api/gap-report`)**: Exact topic accuracy (`correct / total`) is computed deterministically in TypeScript; Groq writes only the human-readable diagnostic summary.
- **Schedule Synthesis (`/api/revision-plan`)**: Organizes Weak → Medium → Strong topics into the student's exact `days × hours/day` budget.
- **Streaming Explanations (`/api/chat`)**: Uses `streamText()` with strict instructions to cite `[Section · Page]` and refuse queries when Retrieval finds no match.

You can also inspect live Stage-1 Retrieval scores directly inside the app under the **How RAG Works** tab (`/architecture`).

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                  # Study Workspace (Material Upload + Topic Map)
│   ├── login/page.tsx            # Demo Login & Session Gate
│   ├── quiz/page.tsx             # RAG-Grounded Diagnostic Quiz Runner
│   ├── report/page.tsx           # Gap Report (🔴🟡🟢) + Adaptive Revision Plan
│   ├── chat/page.tsx             # Explain-This-Topic Streaming RAG Assistant
│   ├── progress/page.tsx         # Progress Dashboard (Recharts)
│   ├── architecture/page.tsx     # Live Retrieval vs Generation Inspector
│   └── api/
│       ├── health/route.ts       # Groq API health check
│       ├── topic-map/route.ts    # Syllabus parsing + retrieval-backed past-paper mapping
│       ├── quiz/route.ts         # Grounded MCQ generation with citations
│       ├── gap-report/route.ts   # Topic accuracy math + diagnostic reasoning
│       ├── revision-plan/route.ts# Time-budgeted priority revision schedule
│       └── chat/route.ts         # Streaming RAG chat with similarity refusal
├── components/
│   ├── AuthGuard.tsx
│   ├── MaterialUploader.tsx
│   ├── Navbar.tsx
│   └── TopicMapView.tsx
├── data/sampleMaterial.ts        # Preloaded AI & Machine Learning curriculum
├── lib/
│   ├── ai/groq.ts                # Groq provider configuration
│   ├── pdf/extractPdfText.ts     # Client-side PDF.js text extractor
│   ├── rag/chunker.ts            # Metadata-preserving document chunker
│   ├── rag/retriever.ts          # TF-IDF Vectorizer + Cosine Similarity
│   └── storage/studentStore.ts   # Student-scoped persistence
└── types/index.ts                # Shared TypeScript interfaces
```

---

## Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variable
cp .env.example .env.local
# Add your free Groq API key from https://console.groq.com:
# GROQ_API_KEY=gsk_...

# 3. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploy on Vercel

1. Push this repository to GitHub.
2. Import the repository at [vercel.com/new](https://vercel.com/new).
3. Add `GROQ_API_KEY` under **Project Settings → Environment Variables**.
4. Click **Deploy**.

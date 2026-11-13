# GapFinder AI — Find What the Student Doesn’t Know

> **{igebra.ai} / AI Ready School — AI Intern Assignment Submission**  
> **Problem Statement**: Diagnostic AI Study Companion (PS: GapFinder AI)

Most study tools wait for a student to ask a question—but a student cannot ask about a gap they don't know they have. **GapFinder AI** acts like an **academic diagnostic doctor**: it ingests a student's syllabus, textbook notes, and past exam question papers, constructs a topic map, runs a 100% RAG-grounded diagnostic quiz, diagnoses topic-level weaknesses with exact citations, and builds a time-boxed, adaptive revision plan.

---

## Key Features

1. **Multi-Source Material Ingestion**: Upload custom PDF or TXT files for **Syllabus**, **Textbook Notes**, and **Past Papers** with client-side text extraction.
2. **Topic Mapping via Cosine Retrieval**: Automatically extracts core syllabus topics and maps past-paper questions using vector similarity to determine high-weight exam topics.
3. **100% RAG-Grounded Diagnostic Quiz**: Generates multiple-choice diagnostic questions strictly grounded in retrieved excerpts, each tagged with verbatim quotes, section labels, and page numbers.
4. **Diagnostic Gap Report**: Computes exact percentage accuracy per topic and classifies weaknesses into 🔴 **Weak** (<50%), 🟡 **Medium** (50-79%), and 🟢 **Strong** (≥80%) with human-readable diagnostic reasons.
5. **Adaptive Revision Plan**: Time-boxed day-by-day revision schedule prioritizing weak topics with high exam frequency, automatically pulling exact textbook citations.
6. **Explain-This-Topic Grounded Chat**: Interactive tutor with mathematical cosine similarity guardrails (refuses out-of-scope questions) and streaming markdown/KaTeX formula rendering.
7. **Progress Tracking**: Historical score progression across multiple diagnostic attempts with trend analytics.
8. **Pre-Bundled Sample Study Packs**: Includes ready-to-test curriculum files for **Artificial Intelligence**, **Data Science**, **Data Analytics**, and **Microsoft Power BI**.

---

## System Architecture: Strict Separation of Retrieval & Generation

GapFinder AI enforces a strict two-stage pipeline to guarantee zero hallucinations:

```
[Uploaded Materials: PDF / TXT]
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│ STAGE 1: DETERMINISTIC RETRIEVAL (Zero LLM Involvement)     │
│  - Document Chunking with Section & Page Preservation       │
│  - TF-IDF Vector Space Model & Vocabulary Indexing          │
│  - Cosine Similarity Matching: (u · v) / (||u|| * ||v||)    │
│  - Strict Relevance Guardrail (Refuses queries if score < θ)│
└─────────────────────────────────────────────────────────────┘
            │
            ▼ [Top-K Retrieved Excerpts with Citations]
┌─────────────────────────────────────────────────────────────┐
│ STAGE 2: AUGMENTED GENERATION (Groq Cloud LLM)              │
│  - Strict context-bounded prompts                           │
│  - Structured JSON extraction (Zod schemas)                 │
│  - Grounded MCQ generation with verbatim citation quotes    │
│  - Diagnostic reason formulation                            │
└─────────────────────────────────────────────────────────────┘
            │
            ▼
[Student Diagnosis: Weak Topics + Adaptive Plan + Explanations]
```

---

## Repository Structure

```
.
├── src/
│   ├── app/                      # Next.js App Router pages & API routes
│   │   ├── api/
│   │   │   ├── chat/             # Streaming RAG grounded tutor endpoint
│   │   │   ├── gap-report/       # Topic-level weakness diagnosis endpoint
│   │   │   ├── quiz/             # RAG-grounded diagnostic MCQ generation
│   │   │   ├── revision-plan/    # Time-boxed adaptive plan generator
│   │   │   └── topic-map/        # Syllabus parsing & past-paper mapping
│   │   ├── architecture/         # Interactive system transparency & retrieval inspector
│   │   ├── chat/                 # Explain-This-Topic RAG chat interface
│   │   ├── login/                # Authentication screen (demo student login)
│   │   ├── progress/             # Historical score progression dashboard
│   │   ├── quiz/                 # Diagnostic test runner with citation inspector
│   │   └── report/               # Gap report diagnosis & revision plan view
│   ├── components/               # UI components (Uploader, TopicMap, MarkdownMessage)
│   ├── lib/
│   │   ├── ai/                   # Groq model configurations & structured helpers
│   │   ├── pdf/                  # Client-side PDF text extraction
│   │   ├── rag/                  # Chunker & TF-IDF Cosine Similarity retriever
│   │   └── storage/              # Student state management & localStorage persistence
│   └── types/                    # TypeScript interfaces for full-stack type safety
├── sample-uploads/               # Pre-generated PDF & TXT test packs
│   ├── ai_engineering/           # AI, Deep Learning & Transformer study materials
│   ├── data_science/             # EDA, Regression, Clustering & Model evaluation
│   ├── data_analytics/           # SQL Window functions, Kimball DWH & SaaS KPIs
│   └── powerbi/                  # Power BI, DAX & Power Query study materials
└── README.md
```

---

## Local Setup & Quick Start

### 1. Prerequisites
- Node.js 18+ or 20+
- A free Groq API key from [console.groq.com](https://console.groq.com)

### 2. Installation
```bash
git clone git@github.com:nmashokkumar/gap_finder.git
cd gap_finder
npm install
```

### 3. Environment Configuration
Create a `.env.local` file in the root directory:
```env
GROQ_API_KEY=your_groq_api_key_here
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Evaluator Walkthrough (1-Click Demo)

1. Navigate to `/login` and click **"Sign In as Demo Student"**.
2. On the **Workspace** (`/`), click **"Load AI/ML Sample Material"** (or upload your own PDF/TXT files from `sample-uploads/`).
3. Click **"Build Topic Map"** to view syllabus modules and linked past-paper exam frequencies.
4. Click **"Start Diagnostic Quiz"** &rarr; answer the generated questions &rarr; submit to view your **Gap Report**.
5. Inspect your identified **Weak**, **Medium**, and **Strong** topics along with the customized **Day-by-Day Revision Plan**.
6. Open **Explain Chat** (`/chat`) to ask questions grounded strictly in your uploaded materials.
7. Open **How RAG Works** (`/architecture`) to test live vector retrieval and inspect how Stage 1 (Deterministic Math) and Stage 2 (Generation) are strictly separated.

---

## License
MIT License. Built for the **{igebra.ai} AI Intern Evaluation 2026**.

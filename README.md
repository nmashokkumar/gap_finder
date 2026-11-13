# GapFinder AI — Find What the Student Doesn’t Know

> **{igebra.ai} / AI Ready School — AI Intern Assignment Submission 2026**  
> **Problem Statement**: Diagnostic AI Study Companion (GapFinder AI)  
> **Live Demo**: Ready for 1-Click Vercel Deployment

---

## 1. The Problem: The Revision Blind Spot

When preparing for exams or technical interviews, students almost always revise what they already know. They re-read familiar textbook chapters and skip difficult ones. More critically: **a student cannot ask a standard chatbot about a knowledge gap they don’t know they have.** 

Standard study tools wait passively for the student to ask a question. This leads to wasted revision time, false confidence, and missed concepts on exam day.

---

## 2. The Solution: GapFinder AI (Study Doctor)

**GapFinder AI acts like an academic diagnostic doctor rather than a passive chatbot.** Instead of waiting for questions, it:
1. **Maps the Curriculum**: Ingests the student's own syllabus, lecture notes, and past exam question papers.
2. **Conducts a Grounded Diagnostic Test**: Generates multiple-choice diagnostic questions grounded 100% in the uploaded textbook notes with exact page and section citations.
3. **Diagnoses Knowledge Gaps**: Analyzes the student's answers, calculates topic accuracy, and classifies topics into **🔴 Weak (<50%)**, **🟡 Medium (50-79%)**, and **🟢 Strong (≥80%)**.
4. **Prescribes an Adaptive Revision Schedule**: Creates a time-boxed, prioritized daily revision plan that focuses the student's study hours strictly on their high-exam-weight weak areas.
5. **Provides Guardrailed Explanations**: Features an "Explain-This-Topic" assistant with strict cosine similarity guardrails that refuses out-of-scope queries to eliminate hallucinations.

---

## 3. Technology Stack

| Layer | Technologies Used | Purpose |
| :--- | :--- | :--- |
| **AI & RAG Engine** | **Python 3**, `NumPy`, `Scikit-Learn`, `Pandas`, `Groq SDK` | Deterministic TF-IDF vector retrieval, Cosine Similarity math, chunking, and hallucination guardrails. |
| **Backend API** | **FastAPI**, `Uvicorn`, `Pydantic v2` | Fully-typed REST API endpoints for syllabus mapping, diagnostic quizzes, gap reports, and revision planning. |
| **Frontend UI** | **Next.js 14 (App Router)**, **TypeScript**, `Tailwind CSS`, `Lucide Icons` | Clean, calm, distraction-free student workspace with zero clutter. |
| **Inference LLM** | **Groq Cloud** (`openai/gpt-oss-120b`) | Sub-second structured JSON extraction and context-grounded text generation. |
| **PDF Extraction** | Mozilla `pdfjs-dist` (Client-side) | Client-side parsing allowing unlimited-size student PDF uploads without server limits. |
| **Data Analytics** | `Recharts` | Historical score progression and diagnostic attempt trend charts. |
| **Deployment** | **Vercel** + **Uvicorn / Serverless** | 1-Click cloud deployment for instant evaluator testing. |

---

## 4. System Architecture: Separation of Retrieval & Generation

GapFinder AI enforces a strict two-stage pipeline so the LLM cannot hallucinate from general pre-training memory:

```
[Student Uploads: Syllabus, Notes, Past Exam Papers (PDF/TXT)]
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ STAGE 1: DETERMINISTIC RETRIEVAL (Pure Python Math)         │
│  - Document Chunking preserving Chapter Headers & Pages     │
│  - TF-IDF Vectorization (Scikit-Learn & NumPy)              │
│  - Cosine Similarity Matching: (A · B) / (||A|| * ||B||)    │
│  - Strict Guardrail: Cosine score < 0.08 blocks generation  │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼ [Top-K Retrieved Excerpts + Citations]
┌─────────────────────────────────────────────────────────────┐
│ STAGE 2: AUGMENTED GENERATION (Groq Cloud LLM)              │
│  - Injects retrieved excerpts as strict context boundary    │
│  - Generates diagnostic MCQs with verbatim citation quotes  │
│  - Evaluates student answers and calculates gap accuracy    │
│  - Formulates day-by-day prioritized revision schedule      │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
[Diagnostic Gap Report: 🔴 Weak / 🟡 Medium / 🟢 Strong + Daily Plan]
```

---

## 5. Repository Structure

```
.
├── backend/                      # Pure Python AI & RAG Backend
│   ├── main.py                   # FastAPI application with REST endpoints
│   ├── demo_rag_cli.py           # Standalone terminal demo script for technical interviews
│   ├── test_suite.py             # Automated multi-sample verification suite
│   ├── requirements.txt          # Python library dependencies (numpy, sklearn, groq, etc.)
│   ├── models/
│   │   └── schemas.py            # Pydantic data models with 12th-grade plain English comments
│   ├── rag/
│   │   ├── chunker.py            # Chapter & page-aware document chunker
│   │   └── retriever.py          # TF-IDF Cosine Similarity retriever & guardrails
│   └── services/
│       └── ai_service.py         # Groq LLM integration for quizzes, gaps & revision plans
├── sample-uploads/               # Pre-packaged curriculum test sets (PDF & TXT)
│   ├── ai_engineering/           # AI, Deep Learning, Transformers & RAG study materials
│   ├── data_science/             # EDA, Regression, Clustering & Model evaluation
│   ├── data_analytics/           # SQL Window functions, Kimball DWH & SaaS KPIs
│   └── powerbi/                  # Power BI, DAX & Power Query materials
├── src/                          # Next.js 14 frontend workspace & evaluator UI
│   ├── app/                      # Workspace, Quiz, Gap Report, Chat & Architecture pages
│   └── components/               # Clean UI components (MaterialUploader, TopicMapView, etc.)
├── next.config.mjs               # Proxies frontend /api/* calls to FastAPI backend
└── README.md
```

---

## 6. Local Quick Start (For Evaluators & Developers)

### Step 1: Clone the Repository
```bash
git clone https://github.com/nmashokkumar/gap_finder.git
cd gap_finder
```

### Step 2: Configure Environment
Create a `.env.local` file in the root directory:
```env
GROQ_API_KEY=your_groq_api_key_here
```

### Step 3: Run the Python AI Engine (Terminal 1)
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.main:app --port 8000 --reload
```

### Step 4: Run the Frontend UI (Terminal 2)
```bash
npm install
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 7. Fast Terminal Demonstration (For Technical Interviews)

If an interviewer asks you to demonstrate the RAG pipeline directly without opening a browser:
```bash
python backend/demo_rag_cli.py
```
This single command:
1. Loads curriculum notes from `sample-uploads/`.
2. Chunks the text preserving chapter headers and page numbers.
3. Runs **NumPy Cosine Similarity retrieval** on a sample student question.
4. Tests the **Hallucination Guardrail** against an out-of-scope question (proves it gets blocked).
5. Extracts syllabus topics and links past-paper questions.
6. Generates a grounded multiple-choice diagnostic question with verbatim citations.

---

## 8. 1-Click Vercel Deployment

1. Import your `gap_finder` GitHub repository into **[Vercel](https://vercel.com)**.
2. In the Vercel Project Settings, add one Environment Variable:
   - **Key**: `GROQ_API_KEY`
   - **Value**: `your_groq_api_key`
3. Click **Deploy**. Vercel will build the frontend and serve the application globally with a live URL.

---

## 9. Fallback & Safe Tagging
The original pure-TypeScript implementation is permanently preserved under Git tag **`v1.0.0-typescript-stable`** and branch **`typescript-stable`**, ensuring 100% rollback capability at any time.

---

## License
MIT License. Developed for the **{igebra.ai} AI Intern Evaluation 2026**.

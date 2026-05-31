# InterviewAI — AI-Powered Interview Copilot

A full-stack SaaS application that helps non-technical hiring managers run structured, AI-evaluated interviews. Upload a resume, get tailored questions, record answers live, and receive a detailed report.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | Node.js, Express.js |
| AI | OpenRouter → Gemini 2.5 Flash (questions/report) + Groq Llama 3.3 70B (live eval) |
| Voice | Web Speech API (browser-native, free) |
| Storage | In-memory (dev) · Supabase (production) |

---

## Prerequisites

- Node.js 18+
- A free OpenRouter API key → https://openrouter.ai/keys

---

## Setup & Run

### 1. Clone / extract the project

```bash
cd interview-copilot
```

### 2. Set up the backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env` and add your OpenRouter API key:
```
OPENROUTER_API_KEY=sk-or-your-key-here
```

Start the backend:
```bash
npm run dev
```

Backend runs on → http://localhost:4000

### 3. Set up the frontend

Open a new terminal:
```bash
cd frontend
npm install
```

The `.env.local` file is already configured to point to `http://localhost:4000`.

Start the frontend:
```bash
npm run dev
```

Frontend runs on → http://localhost:3000

### 4. Open the app

Visit http://localhost:3000 in Chrome or Edge (required for voice recording).

---

## How to Use

1. **Homepage** → http://localhost:3000 — Marketing landing page
2. **Setup** → Click "Start your first interview" or go to `/setup`
   - Enter candidate name and role
   - Upload resume (PDF/DOCX/TXT) — optional but improves questions
   - Paste job description
   - Click "Generate questions"
3. **Live Interview** → `/interview/[id]`
   - Questions appear one at a time
   - Click **🎙 Record** and the candidate speaks
   - Click **⏹ Stop** when done
   - Click **Evaluate** — AI scores in ~1 second
   - Follow-up suggestions appear on the right panel
   - Click **Next question →** to proceed
4. **Report** → `/report/[id]`
   - Full evaluation with competency scores, verdict, red flags
   - Print or share via browser print function
5. **Dashboard** → `/dashboard` — All past sessions

---

## Project Structure

```
interview-copilot/
├── frontend/                    # Next.js application
│   ├── app/
│   │   ├── page.tsx             # Homepage (marketing)
│   │   ├── dashboard/page.tsx   # Session list
│   │   ├── setup/page.tsx       # Create interview
│   │   ├── interview/[id]/      # Live interview
│   │   └── report/[id]/         # Post-interview report
│   └── lib/api.ts               # Backend API client
│
└── backend/                     # Express API
    └── src/
        ├── index.js             # Entry point
        ├── routes/              # API routes
        │   ├── session.js       # Session management
        │   ├── questions.js     # Question generation
        │   ├── answers.js       # Answer evaluation
        │   └── report.js        # Report generation
        └── services/
            ├── llm.js           # OpenRouter (Gemini + Groq)
            ├── parser.js        # PDF/DOCX text extraction
            └── store.js         # In-memory session store
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/session/create` | Create session + parse resume |
| GET | `/api/session` | List all sessions |
| GET | `/api/session/:id` | Get session details |
| DELETE | `/api/session/:id` | Delete session |
| POST | `/api/questions/generate` | Generate questions (Gemini) |
| GET | `/api/questions/:sessionId` | Get questions |
| POST | `/api/answers/evaluate` | Evaluate answer (Groq) |
| POST | `/api/answers/skip` | Skip a question |
| POST | `/api/report/generate` | Generate full report (Gemini) |
| GET | `/api/report/:sessionId` | Get report |
| GET | `/api/health` | Health check |

---

## Environment Variables

### backend/.env
```
OPENROUTER_API_KEY=sk-or-...     # Required — get at openrouter.ai/keys
PORT=4000
FRONTEND_URL=http://localhost:3000
```

### frontend/.env.local
```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

## Free Tier Limits

| Service | Free Limit | Your Usage Per Interview |
|---------|-----------|--------------------------|
| OpenRouter | 200 req/day | ~13 requests |
| Gemini 2.5 Flash | 1,500 req/day | ~3 requests |
| Groq Llama 3.3 70B | Unlimited via OpenRouter | ~10 requests |
| Web Speech API | Free (browser) | Unlimited |

You get approximately **15 free interviews per day** on the free tier.

---

## Voice Recording Note

Voice recording uses the **Web Speech API** which is:
- ✅ Supported: Chrome, Edge, Safari (desktop)
- ❌ Not supported: Firefox

For production, replace with Deepgram or AssemblyAI for better accuracy and wider browser support.

---

## Production Deployment

### Frontend → Vercel
```bash
cd frontend
vercel deploy
```

### Backend → Railway
```bash
cd backend
railway up
```

Update `FRONTEND_URL` in backend `.env` and `NEXT_PUBLIC_API_URL` in frontend `.env.local` with production URLs.

### Persistent Storage → Supabase

For production, replace the in-memory store (`backend/src/services/store.js`) with Supabase calls. Database schema:

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  candidate_name TEXT NOT NULL,
  role TEXT NOT NULL,
  seniority TEXT,
  jd_text TEXT,
  resume_text TEXT,
  extra_context TEXT,
  status TEXT DEFAULT 'setup',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  position INT,
  question TEXT NOT NULL,
  category TEXT,
  rubric TEXT,
  time_guide TEXT
);

CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  question_id INT,
  transcript TEXT,
  score INT,
  strength TEXT,
  gap TEXT,
  follow_up TEXT,
  sentiment TEXT,
  skipped BOOLEAN DEFAULT false,
  manual_notes TEXT,
  answered_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE UNIQUE,
  overall_score NUMERIC(3,1),
  verdict TEXT,
  summary TEXT,
  strengths JSONB,
  gaps JSONB,
  red_flags JSONB,
  next_steps JSONB,
  competencies JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## License

MIT — build freely, ship confidently.
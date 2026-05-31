[1mdiff --git a/README.md b/README.md[m
[1mindex b1820a6..36ceda1 100644[m
[1m--- a/README.md[m
[1m+++ b/README.md[m
[36m@@ -1 +1,262 @@[m
[31m-# Interview-Copilot[m
\ No newline at end of file[m
[32m+[m[32m# InterviewAI — AI-Powered Interview Copilot[m
[32m+[m
[32m+[m[32mA full-stack SaaS application that helps non-technical hiring managers run structured, AI-evaluated interviews. Upload a resume, get tailored questions, record answers live, and receive a detailed report.[m
[32m+[m
[32m+[m[32m---[m
[32m+[m
[32m+[m[32m## Tech Stack[m
[32m+[m
[32m+[m[32m| Layer | Technology |[m
[32m+[m[32m|-------|-----------|[m
[32m+[m[32m| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |[m
[32m+[m[32m| Backend | Node.js, Express.js |[m
[32m+[m[32m| AI | OpenRouter → Gemini 2.5 Flash (questions/report) + Groq Llama 3.3 70B (live eval) |[m
[32m+[m[32m| Voice | Web Speech API (browser-native, free) |[m
[32m+[m[32m| Storage | In-memory (dev) · Supabase (production) |[m
[32m+[m
[32m+[m[32m---[m
[32m+[m
[32m+[m[32m## Prerequisites[m
[32m+[m
[32m+[m[32m- Node.js 18+[m
[32m+[m[32m- A free OpenRouter API key → https://openrouter.ai/keys[m
[32m+[m
[32m+[m[32m---[m
[32m+[m
[32m+[m[32m## Setup & Run[m
[32m+[m
[32m+[m[32m### 1. Clone / extract the project[m
[32m+[m
[32m+[m[32m```bash[m
[32m+[m[32mcd interview-copilot[m
[32m+[m[32m```[m
[32m+[m
[32m+[m[32m### 2. Set up the backend[m
[32m+[m
[32m+[m[32m```bash[m
[32m+[m[32mcd backend[m
[32m+[m[32mnpm install[m
[32m+[m[32mcp .env.example .env[m
[32m+[m[32m```[m
[32m+[m
[32m+[m[32mEdit `backend/.env` and add your OpenRouter API key:[m
[32m+[m[32m```[m
[32m+[m[32mOPENROUTER_API_KEY=sk-or-your-key-here[m
[32m+[m[32m```[m
[32m+[m
[32m+[m[32mStart the backend:[m
[32m+[m[32m```bash[m
[32m+[m[32mnpm run dev[m
[32m+[m[32m```[m
[32m+[m
[32m+[m[32mBackend runs on → http://localhost:4000[m
[32m+[m
[32m+[m[32m### 3. Set up the frontend[m
[32m+[m
[32m+[m[32mOpen a new terminal:[m
[32m+[m[32m```bash[m
[32m+[m[32mcd frontend[m
[32m+[m[32mnpm install[m
[32m+[m[32m```[m
[32m+[m
[32m+[m[32mThe `.env.local` file is already configured to point to `http://localhost:4000`.[m
[32m+[m
[32m+[m[32mStart the frontend:[m
[32m+[m[32m```bash[m
[32m+[m[32mnpm run dev[m
[32m+[m[32m```[m
[32m+[m
[32m+[m[32mFrontend runs on → http://localhost:3000[m
[32m+[m
[32m+[m[32m### 4. Open the app[m
[32m+[m
[32m+[m[32mVisit http://localhost:3000 in Chrome or Edge (required for voice recording).[m
[32m+[m
[32m+[m[32m---[m
[32m+[m
[32m+[m[32m## How to Use[m
[32m+[m
[32m+[m[32m1. **Homepage** → http://localhost:3000 — Marketing landing page[m
[32m+[m[32m2. **Setup** → Click "Start your first interview" or go to `/setup`[m
[32m+[m[32m   - Enter candidate name and role[m
[32m+[m[32m   - Upload resume (PDF/DOCX/TXT) — optional but improves questions[m
[32m+[m[32m   - Paste job description[m
[32m+[m[32m   - Click "Generate questions"[m
[32m+[m[32m3. **Live Interview** → `/interview/[id]`[m
[32m+[m[32m   - Questions appear one at a time[m
[32m+[m[32m   - Click **🎙 Record** and the candidate speaks[m
[32m+[m[32m   - Click **⏹ Stop** when done[m
[32m+[m[32m   - Click **Evaluate** — AI scores in ~1 second[m
[32m+[m[32m   - Follow-up suggestions appear on the right panel[m
[32m+[m[32m   - Click **Next question →** to proceed[m
[32m+[m[32m4. **Report** → `/report/[id]`[m
[32m+[m[32m   - Full evaluation with competency scores, verdict, red flags[m
[32m+[m[32m   - Print or share via browser print function[m
[32m+[m[32m5. **Dashboard** → `/dashboard` — All past sessions[m
[32m+[m
[32m+[m[32m---[m
[32m+[m
[32m+[m[32m## Project Structure[m
[32m+[m
[32m+[m[32m```[m
[32m+[m[32minterview-copilot/[m
[32m+[m[32m├── frontend/                    # Next.js application[m
[32m+[m[32m│   ├── app/[m
[32m+[m[32m│   │   ├── page.tsx             # Homepage (marketing)[m
[32m+[m[32m│   │   ├── dashboard/page.tsx   # Session list[m
[32m+[m[32m│   │   ├── setup/page.tsx       # Create interview[m
[32m+[m[32m│   │   ├── interview/[id]/      # Live interview[m
[32m+[m[32m│   │   └── report/[id]/         # Post-interview report[m
[32m+[m[32m│   └── lib/api.ts               # Backend API client[m
[32m+[m[32m│[m
[32m+[m[32m└── backend/                     # Express API[m
[32m+[m[32m    └── src/[m
[32m+[m[32m        ├── index.js             # Entry point[m
[32m+[m[32m        ├── routes/              # API routes[m
[32m+[m[32m        │   ├── session.js       # Session management[m
[32m+[m[32m        │   ├── questions.js     # Question generation[m
[32m+[m[32m        │   ├── answers.js       # Answer evaluation[m
[32m+[m[32m        │   └── report.js        # Report generation[m
[32m+[m[32m        └── services/[m
[32m+[m[32m            ├── llm.js           # OpenRouter (Gemini + Groq)[m
[32m+[m[32m            ├── parser.js        # PDF/DOCX text extraction[m
[32m+[m[32m            └── store.js         # In-memory session store[m
[32m+[m[32m```[m
[32m+[m
[32m+[m[32m---[m
[32m+[m
[32m+[m[32m## API Endpoints[m
[32m+[m
[32m+[m[32m| Method | Endpoint | Description |[m
[32m+[m[32m|--------|----------|-------------|[m
[32m+[m[32m| POST | `/api/session/create` | Create session + parse resume |[m
[32m+[m[32m| GET | `/api/session` | List all sessions |[m
[32m+[m[32m| GET | `/api/session/:id` | Get session details |[m
[32m+[m[32m| DELETE | `/api/session/:id` | Delete session |[m
[32m+[m[32m| POST | `/api/questions/generate` | Generate questions (Gemini) |[m
[32m+[m[32m| GET | `/api/questions/:sessionId` | Get questions |[m
[32m+[m[32m| POST | `/api/answers/evaluate` | Evaluate answer (Groq) |[m
[32m+[m[32m| POST | `/api/answers/skip` | Skip a question |[m
[32m+[m[32m| POST | `/api/report/generate` | Generate full report (Gemini) |[m
[32m+[m[32m| GET | `/api/report/:sessionId` | Get report |[m
[32m+[m[32m| GET | `/api/health` | Health check |[m
[32m+[m
[32m+[m[32m---[m
[32m+[m
[32m+[m[32m## Environment Variables[m
[32m+[m
[32m+[m[32m### backend/.env[m
[32m+[m[32m```[m
[32m+[m[32mOPENROUTER_API_KEY=sk-or-...     # Required — get at openrouter.ai/keys[m
[32m+[m[32mPORT=4000[m
[32m+[m[32mFRONTEND_URL=http://localhost:3000[m
[32m+[m[32m```[m
[32m+[m
[32m+[m[32m### frontend/.env.local[m
[32m+[m[32m```[m
[32m+[m[32mNEXT_PUBLIC_API_URL=http://localhost:4000[m
[32m+[m[32m```[m
[32m+[m
[32m+[m[32m---[m
[32m+[m
[32m+[m[32m## Free Tier Limits[m
[32m+[m
[32m+[m[32m| Service | Free Limit | Your Usage Per Interview |[m
[32m+[m[32m|---------|-----------|--------------------------|[m
[32m+[m[32m| OpenRouter | 200 req/day | ~13 requests |[m
[32m+[m[32m| Gemini 2.5 Flash | 1,500 req/day | ~3 requests |[m
[32m+[m[32m| Groq Llama 3.3 70B | Unlimited via OpenRouter | ~10 requests |[m
[32m+[m[32m| Web Speech API | Free (browser) | Unlimited |[m
[32m+[m
[32m+[m[32mYou get approximately **15 free interviews per day** on the free tier.[m
[32m+[m
[32m+[m[32m---[m
[32m+[m
[32m+[m[32m## Voice Recording Note[m
[32m+[m
[32m+[m[32mVoice recording uses the **Web Speech API** which is:[m
[32m+[m[32m- ✅ Supported: Chrome, Edge, Safari (desktop)[m
[32m+[m[32m- ❌ Not supported: Firefox[m
[32m+[m
[32m+[m[32mFor production, replace with Deepgram or AssemblyAI for better accuracy and wider browser support.[m
[32m+[m
[32m+[m[32m---[m
[32m+[m
[32m+[m[32m## Production Deployment[m
[32m+[m
[32m+[m[32m### Frontend → Vercel[m
[32m+[m[32m```bash[m
[32m+[m[32mcd frontend[m
[32m+[m[32mvercel deploy[m
[32m+[m[32m```[m
[32m+[m
[32m+[m[32m### Backend → Railway[m
[32m+[m[32m```bash[m
[32m+[m[32mcd backend[m
[32m+[m[32mrailway up[m
[32m+[m[32m```[m
[32m+[m
[32m+[m[32mUpdate `FRONTEND_URL` in backend `.env` and `NEXT_PUBLIC_API_URL` in frontend `.env.local` with production URLs.[m
[32m+[m
[32m+[m[32m### Persistent Storage → Supabase[m
[32m+[m
[32m+[m[32mFor production, replace the in-memory store (`backend/src/services/store.js`) with Supabase calls. Database schema:[m
[32m+[m
[32m+[m[32m```sql[m
[32m+[m[32mCREATE TABLE sessions ([m
[32m+[m[32m  id UUID PRIMARY KEY,[m
[32m+[m[32m  candidate_name TEXT NOT NULL,[m
[32m+[m[32m  role TEXT NOT NULL,[m
[32m+[m[32m  seniority TEXT,[m
[32m+[m[32m  jd_text TEXT,[m
[32m+[m[32m  resume_text TEXT,[m
[32m+[m[32m  extra_context TEXT,[m
[32m+[m[32m  status TEXT DEFAULT 'setup',[m
[32m+[m[32m  created_at TIMESTAMPTZ DEFAULT now()[m
[32m+[m[32m);[m
[32m+[m
[32m+[m[32mCREATE TABLE questions ([m
[32m+[m[32m  id SERIAL PRIMARY KEY,[m
[32m+[m[32m  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,[m
[32m+[m[32m  position INT,[m
[32m+[m[32m  question TEXT NOT NULL,[m
[32m+[m[32m  category TEXT,[m
[32m+[m[32m  rubric TEXT,[m
[32m+[m[32m  time_guide TEXT[m
[32m+[m[32m);[m
[32m+[m
[32m+[m[32mCREATE TABLE answers ([m
[32m+[m[32m  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),[m
[32m+[m[32m  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,[m
[32m+[m[32m  question_id INT,[m
[32m+[m[32m  transcript TEXT,[m
[32m+[m[32m  score INT,[m
[32m+[m[32m  strength TEXT,[m
[32m+[m[32m  gap TEXT,[m
[32m+[m[32m  follow_up TEXT,[m
[32m+[m[32m  sentiment TEXT,[m
[32m+[m[32m  skipped BOOLEAN DEFAULT false,[m
[32m+[m[32m  manual_notes TEXT,[m
[32m+[m[32m  answered_at TIMESTAMPTZ DEFAULT now()[m
[32m+[m[32m);[m
[32m+[m
[32m+[m[32mCREATE TABLE reports ([m
[32m+[m[32m  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),[m
[32m+[m[32m  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE UNIQUE,[m
[32m+[m[32m  overall_score NUMERIC(3,1),[m
[32m+[m[32m  verdict TEXT,[m
[32m+[m[32m  summary TEXT,[m
[32m+[m[32m  strengths JSONB,[m
[32m+[m[32m  gaps JSONB,[m
[32m+[m[32m  red_flags JSONB,[m
[32m+[m[32m  next_steps JSONB,[m
[32m+[m[32m  competencies JSONB,[m
[32m+[m[32m  created_at TIMESTAMPTZ DEFAULT now()[m
[32m+[m[32m);[m
[32m+[m[32m```[m
[32m+[m
[32m+[m[32m---[m
[32m+[m
[32m+[m[32m## License[m
[32m+[m
[32m+[m[32mMIT — build freely, ship confidently.[m
\ No newline at end of file[m

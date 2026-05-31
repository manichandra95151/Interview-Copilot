# CopilotHire — AI Interview Copilot

AI-powered interview assistant for non-technical hiring managers. Upload a resume, generate tailored questions, record answers live, and get a structured evaluation report.

## Architecture

```
Next.js frontend (Vercel)   →   Express backend (Railway)   →   Supabase (PostgreSQL)
                                                             →   OpenRouter (LLMs)
Google OAuth (NextAuth)
```

## New in this version

- **Google OAuth** via NextAuth — managers sign in with Google, sessions are user-scoped
- **Supabase database** — all sessions, questions, answers, and reports persist in PostgreSQL
- **Clickable follow-up questions** — AI-suggested follow-ups can now be activated with one click, showing the follow-up as the active question in the interview panel

---

## Quick start

### 1. Supabase setup

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `backend/src/db/schema.sql`
3. Copy your **Project URL** and **service_role secret key** from Settings → API

### 2. Google OAuth setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project → Enable "Google+ API" → Create OAuth 2.0 credentials
3. Add authorised redirect URI: `http://localhost:3000/api/auth/callback/google` (and your prod URL)
4. Copy your Client ID and Client Secret

### 3. Backend

```bash
cd backend
cp .env.example .env
# Fill in: OPENROUTER_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET, FRONTEND_URL
npm install
npm run dev
```

### 4. Frontend

```bash
cd frontend
cp .env.example .env
# Fill in: NEXT_PUBLIC_API_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, JWT_SECRET
# JWT_SECRET must match the backend .env JWT_SECRET exactly
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — click **Sign in** and authenticate with Google.

---

## How it works

1. **Sign in** with Google
2. **Setup** — upload candidate resume (PDF/DOCX/TXT), enter job description and role context
3. **Generate questions** — AI creates 10 tailored questions with rubrics
4. **Live interview** — ask each question, press Record, candidate speaks, AI evaluates in real-time
5. **Follow-up** — if AI suggests a follow-up, click "Ask this follow-up →" to use it as the active question
6. **Report** — structured verdict, competency scores, strengths, gaps, red flags, and next steps

---

## Environment variables

### Backend `.env`
| Variable | Description |
|---|---|
| `OPENROUTER_API_KEY` | Your OpenRouter key |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `JWT_SECRET` | Secret for signing JWTs (share with frontend) |
| `PORT` | API port (default 4000) |
| `FRONTEND_URL` | Frontend URL for CORS |

### Frontend `.env`
| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API URL |
| `NEXTAUTH_SECRET` | Random secret for NextAuth (generate with `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Frontend URL |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `JWT_SECRET` | Same as backend JWT_SECRET |

---

## Supabase schema (summary)

- `sessions` — interview sessions (linked to user by `user_id`)
- `questions` — questions per session
- `answers` — evaluated answers (score, strength, gap, follow_up, sentiment)
- `reports` — final reports (overall_score, verdict, competencies, etc.)

Row-level security is enabled; the backend uses the service role key which bypasses RLS.

---

## Deployment

**Backend → Railway**
- Set all env vars in Railway dashboard
- Deploy as Node.js service

**Frontend → Vercel**
- Set all env vars in Vercel dashboard
- Add production callback URL to Google OAuth console: `https://your-domain.vercel.app/api/auth/callback/google`

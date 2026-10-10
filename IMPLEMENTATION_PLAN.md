# CopilotHire — MVP Implementation Plan

**Date:** October 10, 2026
**Confirmed stack decisions:**
- **Audio:** Deepgram live streaming (WebSocket, real-time captions)
- **Backend:** Separate Express server (Railway/Render) + Next.js frontend on Vercel
- **Auth:** Supabase Auth (email/password + Google OAuth; candidates join via signed link)
- **AI:** Claude API (Haiku 4.5 real-time, Sonnet/Opus for reports) with prompt caching
- **RAG:** Supabase pgvector + Voyage AI embeddings
- **Email:** Gmail API

---

## 0. MVP SCOPE (what we're building)

| # | Feature | Who | Priority |
|---|---------|-----|----------|
| 1 | Signup / Login | Recruiter | Critical |
| 2 | Resume pool upload + RAG matching to JD | Recruiter | Critical |
| 3 | Schedule interview + email invite (Gmail API) | Recruiter | Critical |
| 4 | Join interview (lobby + device check) | Recruiter + Candidate | Critical |
| 5 | Live audio interview + real-time transcription | Both | Critical |
| 6 | AI assistance (questions, follow-ups, gaps, live scoring) | Recruiter | Critical |
| 7 | Post-interview report (strengths, gaps, verdict) | Recruiter | Critical |
| 8 | Share report via secure link | Recruiter | High |

---

## 1. TARGET ARCHITECTURE

```
┌─────────────────────────┐         ┌──────────────────────────┐
│   Next.js (Vercel)       │         │  Express API (Railway)    │
│  - Marketing/landing     │  HTTPS  │  - REST: sessions, RAG,   │
│  - Recruiter dashboard   │ ──────► │    questions, reports,    │
│  - Setup / schedule      │         │    scheduling, email      │
│  - Interview room (UI)   │         │  - WS: /ws/interview      │
│  - Candidate join page   │ ◄─────► │    (audio relay + live    │
│  - Report + shared view  │   WSS   │    transcription + AI)    │
└───────────┬──────────────┘         └─────────┬─────────────────┘
            │                                   │
            │ Supabase Auth (JWT)               │ service role
            ▼                                   ▼
      ┌───────────────────────────────────────────────┐
      │              Supabase (Postgres)               │
      │  auth.users │ sessions │ candidates │ questions │
      │  answers │ reports │ resume_embeddings (pgvector)│
      │  interview_schedule │ audit_logs                │
      │  Storage bucket: resumes/, recordings/          │
      └───────────────────────────────────────────────┘
            │              │               │
            ▼              ▼               ▼
      Deepgram WS    Claude API       Voyage AI       Gmail API
      (STT stream)   (reasoning)      (embeddings)    (invites)
```

**Data flow — live interview:**
1. Browser captures mic audio (MediaRecorder / AudioWorklet) → streams PCM chunks over WSS to Express.
2. Express relays chunks to Deepgram streaming WS → receives interim + final transcripts.
3. Final transcript segments pushed back to both clients (recruiter + candidate views).
4. On answer boundary, Express calls Claude (Haiku) → follow-up suggestion + gap flags + live score → pushed to recruiter only.
5. Everything persisted to Supabase.

---

## 2. SECURITY & AUTH (Supabase Auth migration)

### Why migrate
Current setup uses NextAuth + a shared JWT with a `'changeme'` fallback and an `isAuth` bypass flag — both must go. Supabase Auth gives us email/password, Google OAuth, magic links, and native RLS via `auth.uid()`.

### Auth model
- **Recruiter** → Supabase account (email/password or Google). JWT issued by Supabase.
- **Candidate** → NO account. Receives a signed, single-use interview token by email. Joining validates the token + optionally a 6-digit code; a short-lived scoped JWT is minted for the interview room only.
- **Backend** → verifies Supabase JWT on every REST/WS request; uses service role for privileged writes.

### Hardening checklist
- [ ] Remove `JWT_SECRET || 'changeme'` fallback and the `isAuth` bypass entirely.
- [ ] Verify Supabase JWT with the project's JWKS (RS256) in Express middleware.
- [ ] Per-user rate limiting (not just global 200/15min).
- [ ] Zod validation on every request body.
- [ ] Generic error messages to client; full errors to server logs only.
- [ ] Signed, expiring URLs for resume/recording downloads from Storage.
- [ ] CSRF protection on state-changing routes.
- [ ] Candidate interview tokens: single-use, expiring, scoped to one session.

---

## 3. DATABASE SCHEMA (v4)

```sql
-- Recruiters are auth.users (managed by Supabase Auth). user_id = auth.uid()

-- Candidate pool (per recruiter)
create table candidates (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  email         text,
  resume_text   text,
  resume_path   text,            -- Storage path
  created_at    timestamptz default now()
);

-- Resume embeddings for RAG (pgvector)
create extension if not exists vector;
create table resume_embeddings (
  id            uuid primary key default gen_random_uuid(),
  candidate_id  uuid references candidates(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  chunk         text not null,
  embedding     vector(1024),    -- Voyage voyage-3 dimension
  created_at    timestamptz default now()
);
create index on resume_embeddings using ivfflat (embedding vector_cosine_ops);

-- Interview sessions
create table sessions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  candidate_id        uuid references candidates(id) on delete set null,
  candidate_name      text not null,
  candidate_email     text,
  role                text not null,
  seniority           text default 'Mid-level',
  jd_text             text,
  resume_text         text,
  extra_context       text,
  custom_competencies jsonb,
  status              text default 'draft',  -- draft|scheduled|live|completed|cancelled
  scheduled_at        timestamptz,
  join_token          text unique,           -- candidate join link
  join_code           text,                  -- optional 6-digit
  share_token         text unique,           -- public report link
  deleted_at          timestamptz,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);
create index idx_sessions_user_created on sessions(user_id, created_at desc);
create index idx_sessions_status on sessions(status);

create table questions (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid references sessions(id) on delete cascade,
  question_idx int not null,
  question     text not null,
  category     text,
  rubric       text,
  time_guide   text,
  created_at   timestamptz default now()
);
create index idx_questions_session on questions(session_id, question_idx);

create table answers (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid references sessions(id) on delete cascade,
  question_id  uuid references questions(id) on delete cascade,
  transcript   text,
  manual_notes text,
  score        int,
  strength     text,
  gap          text,
  follow_up    text,
  sentiment    text,
  skipped      boolean default false,
  answered_at  timestamptz default now(),
  unique (session_id, question_id)
);
create index idx_answers_session on answers(session_id);

create table reports (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid references sessions(id) on delete cascade unique,
  overall_score numeric(4,2),
  verdict       text,
  summary       text,
  strengths     jsonb,
  gaps          jsonb,
  red_flags     jsonb,
  next_steps    jsonb,
  competencies  jsonb,
  extra_data    jsonb,
  created_at    timestamptz default now()
);

create table audit_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid,
  action        text not null,
  resource_type text,
  resource_id   uuid,
  metadata      jsonb,
  created_at    timestamptz default now()
);
```

### RLS policies (owner-scoped + public share)
```sql
alter table candidates enable row level security;
alter table sessions   enable row level security;
alter table questions  enable row level security;
alter table answers    enable row level security;
alter table reports    enable row level security;

create policy "own candidates" on candidates
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own sessions" on sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "public report via share_token" on sessions
  for select using (share_token is not null);
-- (mirror public-select policies for questions/answers/reports as before)
```
> Backend uses the **service role** for writes (bypasses RLS); RLS protects any direct client reads.

---

## 4. FOLDER STRUCTURE

### Frontend (`frontend/`)
```
app/
  (marketing)/
    page.tsx                  # landing
  (auth)/
    login/page.tsx
    signup/page.tsx
  (app)/
    layout.tsx                # authed shell (sidebar/nav)
    dashboard/page.tsx
    candidates/page.tsx       # resume pool + RAG matching
    setup/page.tsx            # create session
    schedule/[id]/page.tsx    # schedule + send invite
    interview/[id]/page.tsx   # recruiter interview room
    report/[id]/page.tsx
  join/[token]/page.tsx       # candidate lobby + interview room (no auth)
  report/shared/[token]/page.tsx
  layout.tsx
  globals.css
components/
  ui/                         # Button, Input, Card, Dialog, Toast, Badge, Spinner
  interview/                  # QuestionPanel, LiveTranscript, AIInsights, ScoreRing, Recorder
  candidates/                 # ResumeUploader, MatchList, MatchCard
  layout/                     # Nav, Sidebar, UserMenu
lib/
  supabase/
    client.ts                 # browser client
    server.ts                 # server component client
  api.ts                      # typed REST client
  ws.ts                       # interview WebSocket hook
  hooks/                      # useRecorder, useToast, useSession
  types.ts
middleware.ts                 # route protection via Supabase session
```

### Backend (`backend/`)
```
src/
  index.js                    # express + ws server bootstrap
  config/
    env.js                    # validated env (zod)
  middleware/
    auth.js                   # verify Supabase JWT (JWKS)
    validate.js               # zod request validation
    rateLimit.js
    error.js                  # central error handler
  routes/
    auth.js                   # candidate token mint/verify
    candidates.js             # upload, list, RAG match
    session.js
    question.js
    answer.js
    report.js
    schedule.js               # schedule + email invite
  ws/
    interview.js              # WS: audio relay, Deepgram, Claude
  services/
    supabase.js
    claude.js                 # Claude API wrapper + prompt caching
    deepgram.js               # streaming STT
    voyage.js                 # embeddings
    gmail.js                  # Gmail API send
    parser.js                 # resume text extraction
    rag.js                    # embed + similarity search + rerank
    store.js                  # DB access
  prompts/
    questions.js
    evaluate.js
    report.js
```

---

## 5. UI REDESIGN DIRECTION

**Keep:** the purple (`#6C47FF`) brand, Inter font, light aesthetic.
**Upgrade:**
- Design tokens in `globals.css` (spacing, radius, shadow, motion scales).
- A real component library (`components/ui/`) instead of inline Tailwind everywhere.
- Motion with **Framer Motion**: page transitions, staggered list entrances, score-ring fill, live-transcript fade-in, modal spring. Respect `prefers-reduced-motion`.
- **Toasts** (success/error) replacing silent `console.error`.
- Skeleton loaders for async states (question gen, report gen, RAG match).
- Authed app shell: left sidebar (Dashboard, Candidates, Sessions) + top bar (user menu).
- **Interview room**: 3-pane — question list | live transcript (large, animated) | AI insights (score, follow-up, gaps). Clear REC indicator, timer, mic level meter.
- **Candidate join**: calm, branded lobby — device/mic check, "waiting for host", then a focused single-pane room (no AI scoring visible to candidate).
- Report: print/PDF-friendly layout + export button.

---

## 6. PHASED DELIVERY

### Phase 1 — Foundation & Auth (Critical)
- [ ] Supabase Auth: signup/login (email+Google), middleware route protection.
- [ ] New DB schema v4 + RLS + indexes + pgvector.
- [ ] Backend JWT verification via Supabase JWKS; remove `changeme`/`isAuth`.
- [ ] Zod validation + central error handler + per-user rate limit.
- [ ] Component library + design tokens + toasts (UI redesign base).

### Phase 2 — Candidates & RAG (Critical)
- [ ] Resume pool upload (bulk), parse, store in Storage + DB.
- [ ] Voyage embeddings + pgvector similarity search.
- [ ] Claude rerank of top matches with written justification.
- [ ] Candidates UI: upload, match list vs a JD, create session from match.

### Phase 3 — Scheduling & Email (Critical)
- [ ] Schedule interview (date/time, candidate email).
- [ ] Gmail API: send branded invite with join link + code.
- [ ] Candidate join page: token validation, lobby, device check.

### Phase 4 — Live Audio Interview (Critical)
- [ ] WebSocket server + browser recorder (AudioWorklet).
- [ ] Deepgram streaming integration + live transcript to both views.
- [ ] Claude real-time (Haiku): follow-ups, gaps, live score to recruiter.
- [ ] Recruiter controls: next/skip/ask-custom/manual notes.

### Phase 5 — Reports & Polish (High)
- [ ] Claude report generation (Sonnet/Opus) with prompt caching.
- [ ] Report UI + PDF export + secure share link.
- [ ] Framer Motion pass, skeletons, empty states, final QA.

---

## 7. ENVIRONMENT VARIABLES (new)

**Backend**
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=            # or JWKS URL for RS256
ANTHROPIC_API_KEY=
DEEPGRAM_API_KEY=
VOYAGE_API_KEY=
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
GMAIL_REFRESH_TOKEN=
FRONTEND_URL=
PORT=4000
```

**Frontend**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_WS_URL=
```

---

## 8. COST ESTIMATE (rough, per 30-min interview)

| Service | Usage | Cost |
|---|---|---|
| Deepgram Nova-2 | ~30 min streaming | ~$0.13 |
| Claude (Haiku real-time) | ~20 calls, cached context | ~$0.05 |
| Claude (Sonnet report) | 1 call | ~$0.03 |
| Voyage embeddings | per resume batch | ~$0.01 |
| **Total** | per interview | **~$0.20–0.25** |

---

## 9. OPEN ITEMS / DECISIONS REMAINING

- [ ] Recording storage: keep audio recordings or transcript-only? (storage cost + privacy)
- [ ] Candidate consent / privacy notice before recording (legal — recommended).
- [ ] Gmail API: OAuth refresh-token flow vs. a service account with domain delegation.
- [ ] Framer Motion vs. CSS-only animation (Framer recommended for the interview room).

---

**Next action:** On approval, I start **Phase 1** (Supabase Auth + schema v4 + backend hardening + UI component base). Each phase will be a reviewable set of changes.

-- ============================================================
-- CopilotHire V4 — Supabase schema (Supabase Auth + pgvector)
-- Run this in: Supabase Dashboard → SQL Editor
--
-- Recruiters are rows in auth.users (managed by Supabase Auth).
-- Everywhere we use `user_id uuid references auth.users(id)` and
-- RLS keys off auth.uid(). The backend uses the service role key,
-- which bypasses RLS for privileged writes.
-- ============================================================

-- ─── Migrating from v3? Uncomment and run this block ONCE first. ───
-- ⚠️ Destructive: drops old v3 tables (data tied to NextAuth text user_ids
--    is not reusable under Supabase Auth). Then run the rest of this file.
-- drop table if exists reports           cascade;
-- drop table if exists answers           cascade;
-- drop table if exists questions         cascade;
-- drop table if exists resume_embeddings cascade;
-- drop table if exists sessions          cascade;
-- drop table if exists candidates        cascade;
-- drop table if exists audit_logs        cascade;

create extension if not exists vector;

-- ─── Candidates (resume pool, per recruiter) ────────────────
create table if not exists candidates (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  email        text,
  resume_text  text,
  resume_path  text,                         -- Supabase Storage path
  deleted_at   timestamptz,
  created_at   timestamptz default now()
);
create index if not exists idx_candidates_user on candidates(user_id, created_at desc);

-- ─── Resume embeddings (RAG) ─────────────────────────────────
-- voyage-3 / voyage-3-large output 1024-dim vectors.
create table if not exists resume_embeddings (
  id           uuid primary key default gen_random_uuid(),
  candidate_id uuid references candidates(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  chunk        text not null,
  embedding    vector(1024),
  created_at   timestamptz default now()
);
create index if not exists idx_resume_embeddings_ivfflat
  on resume_embeddings using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index if not exists idx_resume_embeddings_user on resume_embeddings(user_id);

-- ─── Sessions (interviews) ───────────────────────────────────
create table if not exists sessions (
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
  status              text default 'draft',   -- draft|scheduled|live|completed|cancelled
  scheduled_at        timestamptz,
  join_token          text unique,            -- candidate join link token
  join_code           text,                   -- optional 6-digit code
  share_token         text unique,            -- public report link
  deleted_at          timestamptz,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);
create index if not exists idx_sessions_user_created on sessions(user_id, created_at desc);
create index if not exists idx_sessions_status       on sessions(status);
create index if not exists idx_sessions_scheduled    on sessions(scheduled_at);

-- ─── Questions ───────────────────────────────────────────────
create table if not exists questions (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid references sessions(id) on delete cascade,
  question_idx int not null,
  question     text not null,
  category     text,
  rubric       text,
  time_guide   text,
  created_at   timestamptz default now()
);
create index if not exists idx_questions_session on questions(session_id, question_idx);

-- ─── Answers ─────────────────────────────────────────────────
create table if not exists answers (
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
create index if not exists idx_answers_session on answers(session_id);

-- ─── Reports ─────────────────────────────────────────────────
create table if not exists reports (
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

-- ─── Audit logs ──────────────────────────────────────────────
create table if not exists audit_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid,
  action        text not null,
  resource_type text,
  resource_id   uuid,
  metadata      jsonb,
  created_at    timestamptz default now()
);
create index if not exists idx_audit_user on audit_logs(user_id, created_at desc);

-- audit_logs is backend-only (written via service role, which bypasses RLS).
-- Enable RLS with NO policies so no anon/authenticated client can read it.
alter table audit_logs enable row level security;

-- ============================================================
-- RAG similarity search function (cosine distance)
-- Returns best-matching candidates for a given JD embedding.
-- ============================================================
create or replace function match_resumes(
  query_embedding vector(1024),
  match_user_id   uuid,
  match_count     int default 10
)
returns table (
  candidate_id uuid,
  similarity   float
)
language sql stable
as $$
  select
    re.candidate_id,
    1 - (re.embedding <=> query_embedding) as similarity
  from resume_embeddings re
  where re.user_id = match_user_id
  group by re.candidate_id, re.embedding
  order by re.embedding <=> query_embedding
  limit match_count;
$$;

-- ============================================================
-- Row-level security
-- ============================================================
alter table candidates        enable row level security;
alter table resume_embeddings enable row level security;
alter table sessions          enable row level security;
alter table questions         enable row level security;
alter table answers           enable row level security;
alter table reports           enable row level security;

-- Owner-scoped full access
create policy "own candidates" on candidates
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own embeddings" on resume_embeddings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own sessions" on sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own questions" on questions
  for all using (session_id in (select id from sessions where user_id = auth.uid()))
  with check (session_id in (select id from sessions where user_id = auth.uid()));

create policy "own answers" on answers
  for all using (session_id in (select id from sessions where user_id = auth.uid()))
  with check (session_id in (select id from sessions where user_id = auth.uid()));

create policy "own reports" on reports
  for all using (session_id in (select id from sessions where user_id = auth.uid()))
  with check (session_id in (select id from sessions where user_id = auth.uid()));

-- Public read access via share_token (for shared report pages)
create policy "public session via share_token" on sessions
  for select using (share_token is not null);

create policy "public questions via share_token" on questions
  for select using (session_id in (select id from sessions where share_token is not null));

create policy "public answers via share_token" on answers
  for select using (session_id in (select id from sessions where share_token is not null));

create policy "public reports via share_token" on reports
  for select using (session_id in (select id from sessions where share_token is not null));

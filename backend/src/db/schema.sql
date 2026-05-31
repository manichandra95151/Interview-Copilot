-- ============================================================
-- CopilotHire V3 — Supabase schema
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Sessions table
create table if not exists sessions (
  id             uuid primary key default gen_random_uuid(),
  user_id        text not null,
  candidate_name text not null,
  role           text not null,
  seniority      text default 'Mid-level',
  jd_text        text,
  resume_text    text,
  extra_context  text,
  status         text default 'setup',
  share_token    text unique,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- Questions table
create table if not exists questions (
  id           serial primary key,
  session_id   uuid references sessions(id) on delete cascade,
  question_idx int not null,
  question     text not null,
  category     text,
  rubric       text,
  time_guide   text,
  created_at   timestamptz default now()
);

-- Answers table
create table if not exists answers (
  id           serial primary key,
  session_id   uuid references sessions(id) on delete cascade,
  question_id  int not null,
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

-- Reports table
create table if not exists reports (
  id            serial primary key,
  session_id    uuid references sessions(id) on delete cascade unique,
  overall_score numeric(4,2),
  verdict       text,
  summary       text,
  strengths     jsonb,
  gaps          jsonb,
  red_flags     jsonb,
  next_steps    jsonb,
  competencies  jsonb,
  created_at    timestamptz default now()
);

-- Row-level security
alter table sessions enable row level security;
alter table questions enable row level security;
alter table answers   enable row level security;
alter table reports   enable row level security;

-- Service role bypasses RLS automatically
-- Public share token policy (no auth needed for shared reports)
create policy "Public report view via share_token"
  on sessions for select
  using (share_token is not null);

create policy "Public questions via share_token"
  on questions for select
  using (session_id in (select id from sessions where share_token is not null));

create policy "Public answers via share_token"
  on answers for select
  using (session_id in (select id from sessions where share_token is not null));

create policy "Public reports via share_token"
  on reports for select
  using (session_id in (select id from sessions where share_token is not null));
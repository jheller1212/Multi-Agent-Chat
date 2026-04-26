-- ──────────────────────────────────────────────
-- SPEC-01: Named experiment configurations
-- ──────────────────────────────────────────────
create table if not exists public.experiments (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users on delete cascade not null,
  name            text not null,
  condition_label text not null default '',
  description     text not null default '',
  config          jsonb not null,         -- full bot/research config payload
  run_count       integer not null default 0,
  last_run_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.experiments enable row level security;

create policy "own_experiments"
  on public.experiments for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists experiments_user_created_idx
  on public.experiments (user_id, created_at desc);

-- Link conversation runs to an experiment (nullable, fully backwards-compatible)
alter table public.conversations
  add column if not exists experiment_id uuid references public.experiments on delete set null;

-- ──────────────────────────────────────────────
-- SPEC-07: System-prompt version history
-- ──────────────────────────────────────────────
create table if not exists public.prompt_versions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users on delete cascade not null,
  bot_slot   smallint not null check (bot_slot in (1, 2)),
  content    text not null,
  hash       text not null,   -- djb2 hex for dedup & CSV tracking
  label      text not null default '',
  created_at timestamptz not null default now()
);

alter table public.prompt_versions enable row level security;

create policy "own_prompt_versions"
  on public.prompt_versions for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists prompt_versions_lookup_idx
  on public.prompt_versions (user_id, bot_slot, created_at desc);

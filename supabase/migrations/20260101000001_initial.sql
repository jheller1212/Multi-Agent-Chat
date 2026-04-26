-- AI2AI-Chat initial schema
-- Run this in the Supabase SQL editor (Project → SQL Editor → New query)

-- Enable UUID generation (usually already enabled on Supabase)
create extension if not exists "pgcrypto";

-- ──────────────────────────────────────────────
-- Conversations
-- ──────────────────────────────────────────────
create table if not exists public.conversations (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references auth.users not null,
  title               text,                        -- first user message (snippet)
  model1_type         text not null,
  model1_version      text not null,
  model1_temperature  float not null,
  model1_max_tokens   int not null,
  model2_type         text not null,
  model2_version      text not null,
  model2_temperature  float not null,
  model2_max_tokens   int not null,
  interaction_limit   int not null default 5,
  created_at          timestamptz not null default now()
);

alter table public.conversations enable row level security;

-- Users can only see and modify their own conversations
create policy "own_conversations"
  on public.conversations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ──────────────────────────────────────────────
-- Messages
-- ──────────────────────────────────────────────
create table if not exists public.messages (
  id                uuid primary key default gen_random_uuid(),
  conversation_id   uuid references public.conversations on delete cascade not null,
  role              text not null default 'assistant',  -- 'user' | 'assistant'
  model             text not null default '',           -- bot name / provider label
  content           text not null,
  word_count        int not null default 0,
  time_taken        int not null default 0,             -- milliseconds
  created_at        timestamptz not null default now()
);

alter table public.messages enable row level security;

-- Messages are accessible if the parent conversation belongs to the user
create policy "own_messages"
  on public.messages for all
  using (
    conversation_id in (
      select id from public.conversations where user_id = auth.uid()
    )
  )
  with check (
    conversation_id in (
      select id from public.conversations where user_id = auth.uid()
    )
  );

-- Fast lookups by conversation
create index if not exists messages_conversation_id_idx
  on public.messages (conversation_id, created_at);

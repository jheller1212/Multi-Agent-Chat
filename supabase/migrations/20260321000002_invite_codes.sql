create table if not exists public.organizer_invite_codes (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  created_by  uuid references auth.users(id),
  used_by     uuid references auth.users(id),
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);

alter table public.organizer_invite_codes enable row level security;
-- Service role only, no RLS policies

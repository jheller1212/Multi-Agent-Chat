-- Encrypted API key storage (one row per user, entire vault encrypted as single blob)
create table if not exists public.api_keys (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null unique,
  encrypted   text not null,
  updated_at  timestamptz not null default now()
);

alter table public.api_keys enable row level security;

create policy "Users can manage own api_keys"
  on public.api_keys for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Track which users signed up via workshop links
create table if not exists workshop_signups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workshop_code text not null,
  created_at timestamptz not null default now()
);

alter table workshop_signups enable row level security;
-- No RLS policies: only accessible via service role

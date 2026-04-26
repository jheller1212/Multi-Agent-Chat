create table if not exists public.workshops (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  name        text not null,
  welcome     text not null default '',
  api_key     text not null,
  provider    text not null default 'gpt4',
  scenario    jsonb,
  config      jsonb,
  active      boolean not null default true,
  created_by  uuid references auth.users(id),
  created_at  timestamptz not null default now()
);

alter table public.workshops enable row level security;
-- No RLS policies = only service role (edge functions) can access.

-- Workshop organizers: any email in this table can create/manage workshops
create table if not exists public.workshop_organizers (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  added_by    uuid references auth.users(id),
  created_at  timestamptz not null default now()
);

alter table public.workshop_organizers enable row level security;
-- No RLS policies = only service role (edge functions) can access.

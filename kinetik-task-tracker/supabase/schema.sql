-- Run this once in the Supabase SQL editor for your project.

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  person text not null check (person in ('Tahmina','Hasnat','Nitol','Hridoy')),
  task text default '',
  jira_link text default '',
  updated_at timestamptz default now(),
  unique (date, person)
);

-- Keep updated_at current on every change.
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- Row level security. This app has no login system, so it uses the
-- Supabase anon key and opens read/write to anyone with that key.
-- Fine for a small internal team behind a private URL; add real auth
-- (Supabase Auth + a policy scoped to auth.uid()) if you need to lock
-- this down further.
alter table public.tasks enable row level security;

drop policy if exists "Allow anon full access" on public.tasks;
create policy "Allow anon full access" on public.tasks
  for all
  using (true)
  with check (true);

create table if not exists public.searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  query text not null,
  results jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, query)
);

alter table public.searches enable row level security;

create policy "own searches select" on public.searches for select using (auth.uid() = user_id);
create policy "own searches insert" on public.searches for insert with check (auth.uid() = user_id);
create policy "own searches update" on public.searches for update using (auth.uid() = user_id);
create policy "own searches delete" on public.searches for delete using (auth.uid() = user_id);

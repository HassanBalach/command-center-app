create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  place_id text not null,
  name text not null,
  address text,
  phone text,
  website text,
  rating numeric,
  reviews integer,
  score integer not null default 0,
  audit jsonb,
  stage text not null default 'new'
    check (stage in ('new','contacted','replied','won','lost')),
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, place_id)
);

alter table public.leads enable row level security;

create policy "own leads select" on public.leads for select using (auth.uid() = user_id);
create policy "own leads insert" on public.leads for insert with check (auth.uid() = user_id);
create policy "own leads update" on public.leads for update using (auth.uid() = user_id);
create policy "own leads delete" on public.leads for delete using (auth.uid() = user_id);

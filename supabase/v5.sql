create table if not exists public.money_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null check (kind in ('in', 'out')),
  name text not null check (char_length(name) between 1 and 24),
  position int not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, kind, name)
);

alter table public.money_categories enable row level security;

create policy "own categories select" on public.money_categories for select using (auth.uid() = user_id);
create policy "own categories insert" on public.money_categories for insert with check (auth.uid() = user_id);
create policy "own categories update" on public.money_categories for update using (auth.uid() = user_id);
create policy "own categories delete" on public.money_categories for delete using (auth.uid() = user_id);

-- Starter categories are added once per user, then they are fully theirs to edit.
alter table public.settings add column if not exists money_seeded boolean not null default false;

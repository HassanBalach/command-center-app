create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null check (kind in ('in', 'out')),
  amount numeric(12, 2) not null check (amount > 0),
  category text not null,
  note text,
  occurred_on date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_date on public.transactions (user_id, occurred_on desc);

alter table public.transactions enable row level security;

create policy "own transactions select" on public.transactions for select using (auth.uid() = user_id);
create policy "own transactions insert" on public.transactions for insert with check (auth.uid() = user_id);
create policy "own transactions update" on public.transactions for update using (auth.uid() = user_id);
create policy "own transactions delete" on public.transactions for delete using (auth.uid() = user_id);

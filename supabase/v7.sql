-- Per-user feature access. Users can only READ their own row; only you (SQL editor) can grant.
create table if not exists public.access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  leads boolean not null default false
);

alter table public.access enable row level security;
create policy "own access select" on public.access for select using (auth.uid() = user_id);

-- Grant yourself the lead tools.
insert into public.access (user_id, leads)
select id, true from auth.users where email = 'hassanqazy113@gmail.com'
on conflict (user_id) do update set leads = true;

-- To give a friend leads later:
--   insert into public.access (user_id, leads) select id, true from auth.users where email = 'friend@example.com'
--   on conflict (user_id) do update set leads = true;

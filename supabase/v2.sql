alter table public.leads add column if not exists follow_up date;

create table if not exists public.settings (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  service text not null default 'build websites that bring in more customers',
  pitch_template text not null default 'Hi {name} team, I noticed {problem}. I {service} and can show you how I would fix it. Would you like a quick look?',
  country_code text not null default '92',
  updated_at timestamptz not null default now()
);

alter table public.settings enable row level security;

create policy "own settings select" on public.settings for select using (auth.uid() = user_id);
create policy "own settings insert" on public.settings for insert with check (auth.uid() = user_id);
create policy "own settings update" on public.settings for update using (auth.uid() = user_id);

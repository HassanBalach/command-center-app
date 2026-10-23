alter table public.leads add column if not exists kind text not null default 'lead';


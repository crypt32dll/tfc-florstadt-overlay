-- TFC Florstadt Overlay rooms table
-- Run in Supabase SQL editor (Free plan)

create table if not exists public.rooms (
  id text primary key,
  pin_hash text not null,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.rooms enable row level security;

-- Overlay / Lab: public read for realtime
create policy "rooms_select_anon"
  on public.rooms
  for select
  to anon, authenticated
  using (true);

-- No insert/update/delete for anon — only service role via Next.js

alter publication supabase_realtime add table public.rooms;

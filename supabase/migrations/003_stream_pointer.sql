-- Stable OBS master pointer: /overlay/live resolves to room_id
create table if not exists public.stream_pointer (
  id text primary key default 'live',
  room_id text not null references public.rooms (id) on delete cascade,
  updated_at timestamptz not null default now()
);

alter table public.stream_pointer enable row level security;

-- Overlay clients may read the live pointer (no pin)
create policy "stream_pointer_select_anon"
  on public.stream_pointer
  for select
  to anon, authenticated
  using (true);

-- Hide pin_hash from anon/authenticated SELECT (Realtime + client).
-- Service role (Next.js) still reads the full row.

revoke select on public.rooms from anon, authenticated;
grant select (id, state, updated_at) on public.rooms to anon, authenticated;

-- Ensure RLS policy still allows those columns
drop policy if exists "rooms_select_anon" on public.rooms;
create policy "rooms_select_anon"
  on public.rooms
  for select
  to anon, authenticated
  using (true);

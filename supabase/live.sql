-- Live game state (team up next + shared 60s timer) — run once in Supabase SQL Editor (after schema.sql).
create table if not exists live_state (
  id int primary key default 1 check (id = 1),
  team text,                -- s1..s4 or null
  started_at timestamptz,   -- null = not running
  seconds int not null default 60,
  updated_at timestamptz default now()
);
insert into live_state (id) values (1) on conflict (id) do nothing;

alter table live_state enable row level security;
drop policy if exists "read live" on live_state;
create policy "read live" on live_state for select using (true);

-- Admin: choose the team that's up; p_start = true starts the 60s countdown, false stops/resets it
create or replace function admin_set_live(p_admin text, p_team text, p_start boolean) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not is_admin(p_admin) then raise exception 'Not authorised'; end if;
  update live_state set team = p_team, started_at = case when p_start then now() else null end, updated_at = now() where id = 1;
end $$;

do $$ begin
  alter publication supabase_realtime add table live_state;
exception when duplicate_object then null; end $$;

notify pgrst, 'reload schema';

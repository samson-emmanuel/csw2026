-- Scoreboard — run once in Supabase SQL Editor (after schema.sql).
-- One row per game; s1..s4 = Trailblazers, Pathfinders, Roadrunners, Milestones.

create table if not exists games (
  id uuid primary key default gen_random_uuid(),
  day text not null,
  n int not null,
  name text not null,
  s1 numeric, s2 numeric, s3 numeric, s4 numeric,
  updated_at timestamptz default now()
);

alter table games enable row level security;
drop policy if exists "read games" on games;
create policy "read games" on games for select using (true);

-- Start every day with Game 1–10 (only if that day has no games yet)
insert into games (day, n, name)
select d, g, 'Game ' || g
from unnest(array['Day 1','Day 2','Day 3','Day 4','Day 5','Day 6']) d, generate_series(1, 10) g
where not exists (select 1 from games x where x.day = d);

create or replace function admin_add_game(p_admin text, p_day text, p_name text) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare next_n int;
begin
  if not is_admin(p_admin) then raise exception 'Not authorised'; end if;
  select coalesce(max(n), 0) + 1 into next_n from games where day = p_day;
  insert into games (day, n, name) values (p_day, next_n, coalesce(nullif(trim(p_name), ''), 'Game ' || next_n));
end $$;

create or replace function admin_save_game(p_admin text, p_id uuid, p_name text, p_s1 numeric, p_s2 numeric, p_s3 numeric, p_s4 numeric) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not is_admin(p_admin) then raise exception 'Not authorised'; end if;
  update games set name = trim(p_name), s1 = p_s1, s2 = p_s2, s3 = p_s3, s4 = p_s4, updated_at = now() where id = p_id;
end $$;

create or replace function admin_delete_game(p_admin text, p_id uuid) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not is_admin(p_admin) then raise exception 'Not authorised'; end if;
  delete from games where id = p_id;
end $$;

do $$ begin
  alter publication supabase_realtime add table games;
exception when duplicate_object then null; end $$;

notify pgrst, 'reload schema';

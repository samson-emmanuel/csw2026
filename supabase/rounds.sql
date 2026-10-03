-- Game rounds — run once in Supabase SQL Editor (after scores.sql).
-- Each game can have any number of rounds; a game's score = the sum of its rounds.
-- s1..s4 = Trailblazers, Pathfinders, Pacesetters, Milestones.

create table if not exists rounds (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  n int not null,
  s1 numeric, s2 numeric, s3 numeric, s4 numeric,
  updated_at timestamptz default now()
);

alter table rounds enable row level security;
drop policy if exists "read rounds" on rounds;
create policy "read rounds" on rounds for select using (true);

-- Move any scores already typed on a game into its Round 1 (runs once; safe to re-run)
insert into rounds (game_id, n, s1, s2, s3, s4)
select g.id, 1, g.s1, g.s2, g.s3, g.s4 from games g
where (g.s1 is not null or g.s2 is not null or g.s3 is not null or g.s4 is not null)
  and not exists (select 1 from rounds r where r.game_id = g.id);
update games set s1 = null, s2 = null, s3 = null, s4 = null;

-- Every game starts with a Round 1 ready to score
insert into rounds (game_id, n) select g.id, 1 from games g where not exists (select 1 from rounds r where r.game_id = g.id);

-- New games also get a Round 1 automatically
create or replace function admin_add_game(p_admin text, p_day text, p_name text) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare next_n int; new_id uuid;
begin
  if not is_admin(p_admin) then raise exception 'Not authorised'; end if;
  select coalesce(max(n), 0) + 1 into next_n from games where day = p_day;
  insert into games (day, n, name) values (p_day, next_n, coalesce(nullif(trim(p_name), ''), 'Game ' || next_n)) returning id into new_id;
  insert into rounds (game_id, n) values (new_id, 1);
end $$;

create or replace function admin_rename_game(p_admin text, p_id uuid, p_name text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not is_admin(p_admin) then raise exception 'Not authorised'; end if;
  update games set name = coalesce(nullif(trim(p_name), ''), name), updated_at = now() where id = p_id;
end $$;

create or replace function admin_add_round(p_admin text, p_game uuid) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not is_admin(p_admin) then raise exception 'Not authorised'; end if;
  insert into rounds (game_id, n) select p_game, coalesce(max(n), 0) + 1 from rounds where game_id = p_game;
end $$;

create or replace function admin_save_round(p_admin text, p_id uuid, p_s1 numeric, p_s2 numeric, p_s3 numeric, p_s4 numeric) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not is_admin(p_admin) then raise exception 'Not authorised'; end if;
  update rounds set s1 = p_s1, s2 = p_s2, s3 = p_s3, s4 = p_s4, updated_at = now() where id = p_id;
end $$;

create or replace function admin_delete_round(p_admin text, p_id uuid) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not is_admin(p_admin) then raise exception 'Not authorised'; end if;
  delete from rounds where id = p_id;
end $$;

do $$ begin
  alter publication supabase_realtime add table rounds;
exception when duplicate_object then null; end $$;

notify pgrst, 'reload schema';

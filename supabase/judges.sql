-- Judged rounds (e.g. Karaoke: 3 judges per team) — run once in Supabase SQL Editor (after rounds.sql).
-- Each judge's score is kept; the team's round score = j1 + j2 + j3 (shown on the Scoreboard).
create table if not exists judge_scores (
  round_id uuid not null references rounds(id) on delete cascade,
  team text not null check (team in ('s1', 's2', 's3', 's4')),
  j1 numeric, j2 numeric, j3 numeric,
  updated_at timestamptz default now(),
  primary key (round_id, team)
);
alter table judge_scores enable row level security;
drop policy if exists "read judge scores" on judge_scores;
create policy "read judge scores" on judge_scores for select using (true);

create or replace function admin_save_judges(p_admin text, p_round uuid, p_team text, p_j1 numeric, p_j2 numeric, p_j3 numeric) returns numeric
language plpgsql security definer set search_path = public, extensions as $$
declare total numeric;
begin
  if not is_admin(p_admin) then raise exception 'Not authorised'; end if;
  if p_team not in ('s1', 's2', 's3', 's4') then raise exception 'Unknown team'; end if;
  insert into judge_scores (round_id, team, j1, j2, j3) values (p_round, p_team, p_j1, p_j2, p_j3)
  on conflict (round_id, team) do update set j1 = excluded.j1, j2 = excluded.j2, j3 = excluded.j3, updated_at = now();
  total := case when p_j1 is null and p_j2 is null and p_j3 is null then null else coalesce(p_j1, 0) + coalesce(p_j2, 0) + coalesce(p_j3, 0) end;
  execute format('update rounds set %I = $1, updated_at = now() where id = $2', p_team) using total, p_round;
  return total;
end $$;

notify pgrst, 'reload schema';

-- Judge names (shared; editable by admins)
create or replace function judge_names() returns text
language sql stable security definer set search_path = public as $$
  select coalesce((select value from settings where key = 'judge_names'), 'Judge 1|Judge 2|Judge 3')
$$;
create or replace function admin_set_judge_names(p_admin text, p_names text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not is_admin(p_admin) then raise exception 'Not authorised'; end if;
  insert into settings values ('judge_names', p_names) on conflict (key) do update set value = excluded.value;
end $$;
notify pgrst, 'reload schema';

-- Live updates for the Karaoke board
do $$ begin
  alter publication supabase_realtime add table judge_scores;
exception when duplicate_object then null; end $$;
notify pgrst, 'reload schema';

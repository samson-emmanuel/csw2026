-- Award / deduct points from the challenge timer — run once in Supabase SQL Editor (after rounds.sql).
-- Adds p_delta (e.g. 10 or -1) to one team's score in one round.
create or replace function admin_add_points(p_admin text, p_round uuid, p_team text, p_delta numeric) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not is_admin(p_admin) then raise exception 'Not authorised'; end if;
  if p_team not in ('s1', 's2', 's3', 's4') then raise exception 'Unknown team'; end if;
  execute format('update rounds set %I = coalesce(%I, 0) + $1, updated_at = now() where id = $2', p_team, p_team)
    using p_delta, p_round;
end $$;

notify pgrst, 'reload schema';

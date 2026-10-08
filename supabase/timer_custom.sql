-- Custom timer length + bonus time — run once in Supabase SQL Editor (after live.sql).
-- Start the shared countdown from any number of seconds
create or replace function admin_start_live(p_admin text, p_team text, p_seconds int) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not is_admin(p_admin) then raise exception 'Not authorised'; end if;
  if p_seconds < 1 or p_seconds > 3600 then raise exception 'Seconds must be between 1 and 3600'; end if;
  update live_state set team = p_team, seconds = p_seconds, started_at = now(), updated_at = now() where id = 1;
end $$;

-- Add (or remove, if negative) seconds to the running countdown, e.g. a 20s bonus
create or replace function admin_add_time(p_admin text, p_seconds int) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not is_admin(p_admin) then raise exception 'Not authorised'; end if;
  update live_state set seconds = greatest(1, seconds + p_seconds), updated_at = now() where id = 1;
end $$;

notify pgrst, 'reload schema';

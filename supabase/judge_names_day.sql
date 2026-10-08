-- Judge names per day — run once in Supabase SQL Editor (after judges.sql).
-- Keeps the names used so far as Day 3's record, so changing today's names doesn't relabel yesterday.
insert into settings (key, value)
select 'judge_names:Day 3', value from settings where key = 'judge_names'
on conflict (key) do nothing;

-- Names for a day; falls back to the shared default if that day has none yet
create or replace function judge_names_for(p_day text) returns text
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select value from settings where key = 'judge_names:' || p_day),
    (select value from settings where key = 'judge_names'),
    'Judge 1|Judge 2|Judge 3')
$$;

create or replace function admin_set_judge_names_day(p_admin text, p_day text, p_names text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not is_admin(p_admin) then raise exception 'Not authorised'; end if;
  insert into settings values ('judge_names:' || p_day, p_names) on conflict (key) do update set value = excluded.value;
end $$;

notify pgrst, 'reload schema';

-- Commitment Wall without sign-in — run once in Supabase SQL Editor (after pledges.sql).
-- One pledge per name: posting again with the same name updates it (and sends it back for approval).
create unique index if not exists pledges_name_lower on pledges (lower(name));

create or replace function save_pledge_open(p_name text, p_pledge text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if char_length(trim(coalesce(p_name, ''))) < 2 then raise exception 'Please enter your name'; end if;
  insert into pledges (name, pledge) values (left(trim(p_name), 80), trim(p_pledge))
  on conflict (lower(name)) do update set pledge = excluded.pledge, approved = false, updated_at = now();
end $$;

notify pgrst, 'reload schema';

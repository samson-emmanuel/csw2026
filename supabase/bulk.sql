-- Bulk approval — run once in Supabase SQL Editor.
-- p_kind: 'photos' | 'notes' | 'pledges'. Approves everything currently waiting of that kind.
create or replace function admin_approve_all(p_admin text, p_kind text) returns int
language plpgsql security definer set search_path = public, extensions as $$
declare n int;
begin
  if not is_admin(p_admin) then raise exception 'Not authorised'; end if;
  if p_kind = 'photos' then update photos set approved = true where not approved;
  elsif p_kind = 'notes' then update notes set approved = true where not approved;
  elsif p_kind = 'pledges' then update pledges set approved = true where not approved;
  else raise exception 'Unknown kind'; end if;
  get diagnostics n = row_count;
  return n;
end $$;

notify pgrst, 'reload schema';

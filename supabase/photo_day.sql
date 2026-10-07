-- Let admins move a photo to a different day — run once in Supabase SQL Editor.
create or replace function admin_set_photo_day(p_admin text, p_id uuid, p_day text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not is_admin(p_admin) then raise exception 'Not authorised'; end if;
  if p_day not in ('Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Finale') then raise exception 'Unknown day'; end if;
  update photos set day = p_day where id = p_id;
end $$;

notify pgrst, 'reload schema';

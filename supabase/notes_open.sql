-- Gratitude Wall without sign-in — run once in Supabase SQL Editor (after schema.sql).
-- Anyone can post a note to any colleague (picked from the list or typed); admins can still delete notes.
create or replace function post_note_open(p_to text, p_message text, p_color text, p_from text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if char_length(trim(coalesce(p_to, ''))) < 2 then raise exception 'Recipient name required'; end if;
  insert into notes (to_name, message, from_name, color)
  values (left(trim(p_to), 80), trim(p_message), nullif(trim(left(coalesce(p_from, ''), 60)), ''), coalesce(nullif(p_color, ''), 'yellow'));
end $$;

notify pgrst, 'reload schema';

 -- Snapshots without sign-in — run once in Supabase SQL Editor (after photos.sql).
-- Anyone can upload; every photo still waits for admin approval before it shows.

-- Valid day and room left (max 1000 photos per day, as a safety cap)
create or replace function upload_room(p_day text) returns boolean
language sql security definer set search_path = public as $$
  select p_day in ('Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Finale')
     and (select count(*) from photos where day = p_day) < 1000
$$;

-- Called only by the Apps Script (needs the upload secret)
create or replace function add_photo_open(p_secret text, p_drive_id text, p_day text, p_caption text, p_name text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from settings where key = 'upload_secret' and value = p_secret) then raise exception 'Not authorised'; end if;
  insert into photos (drive_id, day, caption, uploader)
  values (p_drive_id, p_day, nullif(trim(p_caption), ''), coalesce(nullif(trim(p_name), ''), 'CX Team'));
end $$;

-- Live updates for the Snapshots page
do $$ begin
  alter publication supabase_realtime add table photos;
exception when duplicate_object then null; end $$;

notify pgrst, 'reload schema';

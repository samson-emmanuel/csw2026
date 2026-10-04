-- Gratitude notes need admin approval before they show — run once in Supabase SQL Editor (after notes_open.sql).
alter table notes add column if not exists approved boolean not null default false;
-- Notes already on the wall stay visible (runs only when the column is first added)
do $$ begin
  if not exists (select 1 from settings where key = 'notes_approval_v1') then
    update notes set approved = true;
    insert into settings values ('notes_approval_v1', 'done');
  end if;
end $$;

drop policy if exists "read notes" on notes;
create policy "read notes" on notes for select using (approved);

create or replace function admin_list_notes(p_admin text) returns setof notes
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not is_admin(p_admin) then raise exception 'Not authorised'; end if;
  return query select * from notes order by approved, created_at desc;
end $$;

create or replace function admin_set_note(p_admin text, p_id uuid, p_approved boolean) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not is_admin(p_admin) then raise exception 'Not authorised'; end if;
  update notes set approved = p_approved where id = p_id;
end $$;

notify pgrst, 'reload schema';

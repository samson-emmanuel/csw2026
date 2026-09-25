-- Commitment Wall — run once in Supabase SQL Editor (after schema.sql).

create table if not exists pledges (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid unique references staff(id) on delete cascade,
  name text not null,
  pledge text not null check (char_length(pledge) between 3 and 200),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Pledges only show on the wall after an admin approves them
alter table pledges add column if not exists approved boolean not null default false;

alter table pledges enable row level security;
drop policy if exists "read pledges" on pledges;
create policy "read pledges" on pledges for select using (approved);

-- One pledge per staff member: creates it, or updates it (an edit goes back for approval)
create or replace function save_pledge(p_email text, p_code text, p_pledge text) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare s staff;
begin
  select * into s from staff where email = lower(trim(p_email)) and passcode_hash = crypt(upper(trim(p_code)), passcode_hash);
  if s.id is null then raise exception 'Invalid email or passcode'; end if;
  insert into pledges (staff_id, name, pledge) values (s.id, s.name, trim(p_pledge))
  on conflict (staff_id) do update set pledge = excluded.pledge, name = excluded.name, approved = false, updated_at = now();
end $$;

-- Lets a signed-in staff member see their own pledge, even while it awaits approval
create or replace function my_pledge(p_email text, p_code text) returns table (pledge text, approved boolean)
language sql security definer set search_path = public, extensions as $$
  select p.pledge, p.approved from pledges p join staff s on s.id = p.staff_id
  where s.email = lower(trim(p_email)) and s.passcode_hash = crypt(upper(trim(p_code)), s.passcode_hash)
$$;

create or replace function admin_list_pledges(p_admin text) returns setof pledges
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not is_admin(p_admin) then raise exception 'Not authorised'; end if;
  return query select * from pledges order by approved, created_at;
end $$;

create or replace function admin_set_pledge(p_admin text, p_id uuid, p_approved boolean) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not is_admin(p_admin) then raise exception 'Not authorised'; end if;
  update pledges set approved = p_approved where id = p_id;
end $$;

create or replace function admin_delete_pledge(p_admin text, p_id uuid) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not is_admin(p_admin) then raise exception 'Not authorised'; end if;
  delete from pledges where id = p_id;
end $$;

do $$ begin
  alter publication supabase_realtime add table pledges;
exception when duplicate_object then null; end $$;

notify pgrst, 'reload schema';

-- Gratitude Wall — run once in Supabase: SQL Editor → New query → paste → Run
-- Change the admin passcode on the line marked CHANGE-ME before running.

create extension if not exists pgcrypto with schema extensions;

create table if not exists staff (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  passcode_hash text not null,
  created_at timestamptz default now()
);

create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  to_name text not null,
  message text not null check (char_length(message) between 1 and 280),
  from_name text,
  color text not null default 'yellow',
  staff_id uuid references staff(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists settings (key text primary key, value text not null);

-- Browser (anon) can only read notes; everything else goes through the functions below
alter table staff enable row level security;
alter table notes enable row level security;
alter table settings enable row level security;
drop policy if exists "read notes" on notes;
create policy "read notes" on notes for select using (true);

insert into settings values ('admin_hash', extensions.crypt('228863', extensions.gen_salt('bf')))
on conflict (key) do update set value = excluded.value;

create or replace function is_admin(p_admin text) returns boolean
language sql security definer set search_path = public, extensions as $$
  select exists (select 1 from settings where key = 'admin_hash' and value = crypt(p_admin, value))
$$;

create or replace function staff_names() returns table (name text)
language sql security definer set search_path = public as $$
  select name from staff order by name
$$;

create or replace function login(p_email text, p_code text) returns text
language sql security definer set search_path = public, extensions as $$
  select name from staff where email = lower(trim(p_email)) and passcode_hash = crypt(upper(trim(p_code)), passcode_hash)
$$;

create or replace function post_note(p_email text, p_code text, p_to text, p_message text, p_color text, p_anon boolean) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare s staff;
begin
  select * into s from staff where email = lower(trim(p_email)) and passcode_hash = crypt(upper(trim(p_code)), passcode_hash);
  if s.id is null then raise exception 'Invalid email or passcode'; end if;
  if not exists (select 1 from staff where name = p_to) then raise exception 'Unknown recipient'; end if;
  insert into notes (to_name, message, from_name, color, staff_id)
  values (p_to, trim(p_message), case when p_anon then null else s.name end, p_color, s.id);
end $$;

-- Admin: add a staff member (or reset their passcode if the email exists). Returns the new passcode.
create or replace function admin_add_staff(p_admin text, p_name text, p_email text) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare code text := upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8));
begin
  if not is_admin(p_admin) then raise exception 'Not authorised'; end if;
  insert into staff (name, email, passcode_hash) values (trim(p_name), lower(trim(p_email)), crypt(code, gen_salt('bf')))
  on conflict (email) do update set name = excluded.name, passcode_hash = excluded.passcode_hash;
  return code;
end $$;

create or replace function admin_list_staff(p_admin text) returns table (id uuid, name text, email text, created_at timestamptz)
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not is_admin(p_admin) then raise exception 'Not authorised'; end if;
  return query select s.id, s.name, s.email, s.created_at from staff s order by s.name;
end $$;

create or replace function admin_remove_staff(p_admin text, p_id uuid) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not is_admin(p_admin) then raise exception 'Not authorised'; end if;
  delete from staff where id = p_id;
end $$;

create or replace function admin_delete_note(p_admin text, p_id uuid) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not is_admin(p_admin) then raise exception 'Not authorised'; end if;
  delete from notes where id = p_id;
end $$;

-- Live updates on the wall
do $$ begin
  alter publication supabase_realtime add table notes;
exception when duplicate_object then null; end $$;

-- ==========================================
-- E-BATTA MANAGEMENT SYSTEM - DATABASE SETUP
-- ==========================================

-- USERS TABLE
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  emp_code text unique, -- removed not null for trigger compatibility, HR fills later
  email text unique,
  name text,
  role text check (role in ('HR','Manager','Employee')) default 'Employee',
  designation text,
  grade text,
  catg_code text,
  grade_code text,
  site text,
  batta_amount numeric(10,2) default 0,
  manager_id uuid references public.users(id),
  active boolean default true,
  created_at timestamptz default now()
);

-- BATTA ENTRIES TABLE
create table if not exists public.batta_entries (
  id uuid primary key default gen_random_uuid(),
  emp_id uuid not null references public.users(id) on delete cascade,
  date date not null,
  particulars text not null,
  day_night text check (day_night in ('Day', 'Night')) default 'Day',
  time text,
  reject_reason text,
  approved_amount numeric(10,2),
  manager_id uuid references public.users(id),
  status text default 'pending'
         check (status in ('pending','approved','rejected')),
  approved_by uuid references public.users(id),
  created_at timestamptz default now(),
  constraint unique_emp_date_shift unique (emp_id, date, day_night)
);

-- RLS POLICIES
alter table public.users enable row level security;
alter table public.batta_entries enable row level security;

-- Users: Everyone can read basic user directory profiles
drop policy if exists "read all profiles" on public.users;
create policy "read all profiles" on public.users
  for select using (true);

-- Helper function to check role without recursion
-- security definer + search_path = public bypasses RLS on the table
create or replace function public.check_is_hr()
returns boolean 
language plpgsql 
security definer 
set search_path = public
as $$
begin
  return exists (
    select 1 from users where id = auth.uid() and role = 'HR'
  );
end;
$$;

-- Users: HR full access
drop policy if exists "hr full users" on public.users;
create policy "hr full users" on public.users
  for all using (public.check_is_hr());

-- Batta: employee own rows
drop policy if exists "employee own entries" on public.batta_entries;
create policy "employee own entries" on public.batta_entries
  for all using (emp_id = auth.uid());

-- Batta: manager sees and updates team entries
drop policy if exists "manager team entries" on public.batta_entries;
create policy "manager team entries" on public.batta_entries
  for select using (manager_id = auth.uid());

drop policy if exists "manager approve reject" on public.batta_entries;
create policy "manager approve reject" on public.batta_entries
  for update using (manager_id = auth.uid())
  with check (status in ('approved','rejected'));

-- Batta: HR full access
drop policy if exists "hr full batta" on public.batta_entries;
create policy "hr full batta" on public.batta_entries
  for all using (public.check_is_hr());

-- TRIGGER FOR AUTH SYNC
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, role, emp_code, active, batta_amount, site)
  values (
    new.id, 
    new.email,
    coalesce(new.raw_user_meta_data->>'name', 'New Member'), 
    coalesce(new.raw_user_meta_data->>'role', 'Employee'),
    'EMP' || floor(random() * 1000000)::text,
    true,
    0,
    'Site pending'
  );
  return new;
exception when others then
  -- Prevent trigger failure from blocking account creation if needed, 
  -- but here we want to know why it fails. 
  -- We'll log it if possible or just ensure no nulls in mandatory fields.
  raise notice 'Error in handle_new_user trigger: %', sqlerrm;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

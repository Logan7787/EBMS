-- 1. Update the role check constraint in users table
-- We first need to drop the existing constraint and add the new one
alter table public.users 
drop constraint if exists users_role_check;

alter table public.users 
add constraint users_role_check 
check (role in ('HR','Manager','Employee','accounts'));

-- 2. Add RLS policy for accounts to read batta entries
-- Accounts should be able to see all entries for reporting
drop policy if exists "accounts read all batta" on public.batta_entries;
create policy "accounts read all batta" on public.batta_entries
  for select using (
    exists (
      select 1 from public.users 
      where id = auth.uid() and role = 'accounts'
    )
  );

-- 3. Add RLS policy for accounts to read users
-- Necessary for joining employee data in reports
drop policy if exists "accounts read all users" on public.users;
create policy "accounts read all users" on public.users
  for select using (
    exists (
      select 1 from public.users 
      where id = auth.uid() and role = 'accounts'
    )
  );

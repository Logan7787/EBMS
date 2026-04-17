-- 1. Update the role check constraint in users table
-- We first need to drop the existing constraint and add the new one including 'supercheck'
alter table public.users 
drop constraint if exists users_role_check;

alter table public.users 
add constraint users_role_check 
check (role in ('HR','Manager','Employee','accounts','supercheck'));

-- 2. Add RLS policy for supercheck to read batta entries
-- Supercheck should be able to see all entries for reporting across all sites
drop policy if exists "supercheck read all batta" on public.batta_entries;
create policy "supercheck read all batta" on public.batta_entries
  for select using (
    exists (
      select 1 from public.users 
      where id = auth.uid() and role = 'supercheck'
    )
  );

-- 3. Add RLS policy for supercheck to read users
-- Necessary for joining employee data in reports
drop policy if exists "supercheck read all users" on public.users;
create policy "supercheck read all users" on public.users
  for select using (
    exists (
      select 1 from public.users 
      where id = auth.uid() and role = 'supercheck'
    )
  );

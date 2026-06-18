-- 1. Safely drop any check constraints on the status column of batta_entries
do $$
declare
    r record;
begin
    for r in 
        select conname 
        from pg_constraint con
        join pg_class cl on cl.oid = con.conrelid
        join pg_namespace ns on ns.oid = cl.relnamespace
        where ns.nspname = 'public' 
          and cl.relname = 'batta_entries' 
          and con.contype = 'c' 
          and pg_get_constraintdef(con.oid) like '%status%'
    loop
        execute 'alter table public.batta_entries drop constraint ' || quote_ident(r.conname);
    end loop;
end $$;

-- 2. Add the new status check constraint containing pending_supercheck
alter table public.batta_entries 
  add constraint batta_entries_status_check 
  check (status in ('pending_supercheck', 'pending', 'approved', 'rejected'));

-- 3. Set default value for new entries to pending_supercheck
alter table public.batta_entries 
  alter column status set default 'pending_supercheck';

-- 4. Add the verified_by column referencing users table
alter table public.batta_entries 
  add column if not exists verified_by uuid references public.users(id);

-- 5. Add RLS policy for supercheck to update entries (needed for verification edits)
drop policy if exists "supercheck update batta" on public.batta_entries;
create policy "supercheck update batta" on public.batta_entries
  for update using (
    exists (
      select 1 from public.users 
      where id = auth.uid() and role = 'supercheck'
    )
  );

-- 6. Also drop and recreate the select policy for supercheck to ensure full read permissions
drop policy if exists "supercheck read all batta" on public.batta_entries;
create policy "supercheck read all batta" on public.batta_entries
  for select using (
    exists (
      select 1 from public.users 
      where id = auth.uid() and role = 'supercheck'
    )
  );

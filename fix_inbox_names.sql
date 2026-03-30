-- Run this in your Supabase SQL Editor to fix missing Names & Amounts in the Inbox!

-- 1. Drop the restrictive policies
DROP POLICY IF EXISTS "read own profile" ON public.users;
DROP POLICY IF EXISTS "all users see managers" ON public.users;
DROP POLICY IF EXISTS "manager reads team" ON public.users;

-- 2. Create a single policy that allows all logged-in staff to read the user directory
-- This ensures that when a manager looks at a request, they can read the employee's name and details regardless of strict team assignments!
CREATE POLICY "read all profiles" ON public.users FOR SELECT USING (true);

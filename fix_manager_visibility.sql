-- Run this in your Supabase SQL Editor to fix the Reporting Manager dropdown for employees

-- This policy allows ALL authenticated users to see the names of Managers and HR staff in the dropdowns.
DROP POLICY IF EXISTS "all users see managers" ON public.users;
CREATE POLICY "all users see managers" ON public.users
  FOR SELECT USING (role IN ('Manager', 'HR'));

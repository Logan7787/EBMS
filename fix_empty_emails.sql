-- Run this in your Supabase SQL Editor to fix the empty email issue

-- 1. Add email column to public.users if it doesn't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email text unique;

-- 2. Backfill existing emails from auth.users
UPDATE public.users pu
SET email = au.email
FROM auth.users au
WHERE pu.id = au.id AND pu.email IS NULL;

-- 3. Replace the trigger function to save emails for new users going forward
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, emp_code, active, batta_amount, site)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New Member'), 
    COALESCE(NEW.raw_user_meta_data->>'role', 'Employee'),
    'EMP' || floor(random() * 1000000)::text,
    true,
    0,
    'Site pending'
  );
  RETURN NEW;
EXCEPTION WHEN others THEN
  -- Prevent trigger failure from blocking account creation if needed, 
  -- but here we want to know why it fails. 
  RAISE NOTICE 'Error in handle_new_user trigger: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

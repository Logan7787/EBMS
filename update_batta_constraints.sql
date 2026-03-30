-- Run this in your Supabase SQL Editor to allow both Day and Night shifts on the same date

-- 1. Drop the old constraint that restricted it to one entry per date
ALTER TABLE public.batta_entries DROP CONSTRAINT IF EXISTS unique_emp_date;

-- 2. Add the new constraint that restricts it to one entry per shift per date
ALTER TABLE public.batta_entries ADD CONSTRAINT unique_emp_date_shift UNIQUE (emp_id, date, day_night);

-- Run this in your Supabase SQL Editor to add the new Batta columns

-- 1. Add day_night column (defaulting to 'Day' for existing entries)
ALTER TABLE public.batta_entries ADD COLUMN IF NOT EXISTS day_night text check (day_night in ('Day', 'Night')) default 'Day';

-- 2. Add time column (optional text field)
ALTER TABLE public.batta_entries ADD COLUMN IF NOT EXISTS time text;

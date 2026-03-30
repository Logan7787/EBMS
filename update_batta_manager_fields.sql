-- Run this in your Supabase SQL Editor to add fields for Manager Approvals

-- 1. Add reject_reason column
ALTER TABLE public.batta_entries ADD COLUMN IF NOT EXISTS reject_reason text;

-- 2. Add approved_amount column
ALTER TABLE public.batta_entries ADD COLUMN IF NOT EXISTS approved_amount numeric(10,2);

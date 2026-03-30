-- Enable Realtime API for batta_entries to allow instant Toast notifications
BEGIN;
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'batta_entries'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE batta_entries;
  END IF;
END $$;
COMMIT;

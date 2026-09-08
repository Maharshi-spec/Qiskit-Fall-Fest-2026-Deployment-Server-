-- Migration: 017_update_events_schema.sql
-- Description: Adds max_participants and registration_info to events and post_qiskit_events tables,
--              normalizes status values to ACTIVE/CLOSED, sets default status to ACTIVE,
--              and ensures event_type values are normalized.

-- 1. Pre-Qiskit Events table updates
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS max_participants INTEGER NULL,
  ADD COLUMN IF NOT EXISTS registration_info TEXT NULL;

-- Normalize existing status to uppercase
UPDATE events
SET status = 'ACTIVE'
WHERE status IS NULL OR LOWER(status) IN ('active', 'upcoming', 'confirmed');

UPDATE events
SET status = 'CLOSED'
WHERE LOWER(status) IN ('closed', 'completed', 'cancelled', 'inactive');

ALTER TABLE events
  ALTER COLUMN status SET DEFAULT 'ACTIVE';

-- Normalize existing event_type to uppercase
UPDATE events
SET event_type = UPPER(event_type)
WHERE event_type IS NOT NULL;

-- 2. Post-Qiskit Events table updates (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'post_qiskit_events') THEN
    ALTER TABLE post_qiskit_events
      ADD COLUMN IF NOT EXISTS max_participants INTEGER NULL,
      ADD COLUMN IF NOT EXISTS registration_info TEXT NULL;

    UPDATE post_qiskit_events
    SET status = 'ACTIVE'
    WHERE status IS NULL OR LOWER(status) IN ('active', 'upcoming', 'confirmed');

    UPDATE post_qiskit_events
    SET status = 'CLOSED'
    WHERE LOWER(status) IN ('closed', 'completed', 'cancelled', 'inactive');

    ALTER TABLE post_qiskit_events
      ALTER COLUMN status SET DEFAULT 'ACTIVE';

    UPDATE post_qiskit_events
    SET event_type = UPPER(event_type)
    WHERE event_type IS NOT NULL;
  END IF;
END $$;

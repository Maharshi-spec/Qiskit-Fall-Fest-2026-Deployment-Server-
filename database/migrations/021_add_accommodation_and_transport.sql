-- Migration: 021_add_accommodation_and_transport.sql
-- Description: Adds accommodation_required and local_transport_required columns
--              to both pre-qiskit (registrations) and post-qiskit (post_qiskit_registrations) tables.
--              Existing registrations remain valid with default FALSE.

ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS accommodation_required BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS local_transport_required BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE post_qiskit_registrations
ADD COLUMN IF NOT EXISTS accommodation_required BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE post_qiskit_registrations
ADD COLUMN IF NOT EXISTS local_transport_required BOOLEAN NOT NULL DEFAULT FALSE;

-- Refresh pre_qiskit_registrations view to expose new columns
CREATE OR REPLACE VIEW pre_qiskit_registrations AS SELECT * FROM registrations;

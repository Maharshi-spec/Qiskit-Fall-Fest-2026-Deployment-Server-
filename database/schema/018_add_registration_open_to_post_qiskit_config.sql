-- Migration: 018_add_registration_open_to_post_qiskit_config.sql
-- Description: Adds registration_open column to post_qiskit_config singleton table
--              allowing independent registration activation for Post-Qiskit Fall Fest.

ALTER TABLE post_qiskit_config
ADD COLUMN IF NOT EXISTS registration_open BOOLEAN NOT NULL DEFAULT FALSE;

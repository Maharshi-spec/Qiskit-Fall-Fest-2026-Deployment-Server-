-- Migration: 014_create_post_qiskit_config.sql
-- Description: Creates the post_qiskit_config singleton table that organizers use
--              to enable/disable the Post-Qiskit event and configure its details.
--              Post-Qiskit is DISABLED by default and must be explicitly enabled.

CREATE TABLE IF NOT EXISTS post_qiskit_config (
    id                  SERIAL PRIMARY KEY,
    enabled             BOOLEAN NOT NULL DEFAULT FALSE,
    start_date          DATE,
    end_date            DATE,
    coordinator_name    VARCHAR(255),
    coordinator_contact TEXT,
    venue               VARCHAR(255),
    location            VARCHAR(255),
    start_time          TIME,
    end_time            TIME,
    timezone            VARCHAR(100) NOT NULL DEFAULT 'Asia/Kolkata',
    description         TEXT,
    activities          TEXT,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by          BIGINT
);

-- Ensure exactly one row exists (singleton pattern).
-- Organizers update this row; they never insert a second one.
INSERT INTO post_qiskit_config (
    enabled,
    start_date,
    end_date,
    coordinator_name,
    coordinator_contact,
    venue,
    location,
    start_time,
    end_time,
    timezone,
    description,
    activities
)
VALUES (
    FALSE,
    '2026-10-05',
    '2026-10-10',
    NULL,
    NULL,
    NULL,
    NULL,
    '09:00:00',
    '17:00:00',
    'Asia/Kolkata',
    'Advanced Quantum Applications, grand quantum hackathon showcase, and prestigious awards celebration.',
    NULL
)
ON CONFLICT DO NOTHING;

-- Migration: 020_enforce_singleton_post_qiskit_config.sql
-- Description: Enforces single-row integrity (singleton pattern) for post_qiskit_config.
--              1. Inspects existing rows and identifies the authoritative configuration row
--                 (prioritizing enabled = TRUE, registration_open = TRUE, latest updated_at).
--              2. Preserves the authoritative row and deletes duplicate rows.
--              3. Adds is_singleton BOOLEAN NOT NULL DEFAULT TRUE with UNIQUE constraint
--                 and CHECK constraint so duplicate inserts are prevented.

DO $$
DECLARE
    v_authoritative_id INT;
    v_total_before INT;
    v_total_after INT;
BEGIN
    SELECT COUNT(*) INTO v_total_before FROM post_qiskit_config;

    IF v_total_before > 1 THEN
        -- Select the authoritative row:
        -- Prioritize enabled = TRUE, registration_open = TRUE, latest updated_at
        SELECT id INTO v_authoritative_id
        FROM post_qiskit_config
        ORDER BY
            (CASE WHEN enabled THEN 1 ELSE 0 END) DESC,
            (CASE WHEN registration_open THEN 1 ELSE 0 END) DESC,
            updated_at DESC NULLS LAST,
            id ASC
        LIMIT 1;

        RAISE NOTICE 'Preserving authoritative post_qiskit_config row id: % out of % rows', v_authoritative_id, v_total_before;

        DELETE FROM post_qiskit_config
        WHERE id != v_authoritative_id;
    END IF;

    -- Ensure is_singleton column exists
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'post_qiskit_config'
          AND column_name = 'is_singleton'
    ) THEN
        ALTER TABLE post_qiskit_config
        ADD COLUMN is_singleton BOOLEAN NOT NULL DEFAULT TRUE;
    END IF;

    -- Ensure the remaining row has is_singleton = TRUE
    UPDATE post_qiskit_config
    SET is_singleton = TRUE
    WHERE is_singleton IS NOT TRUE;

    -- Create unique index on is_singleton if not already present
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = 'post_qiskit_config'
          AND indexname = 'post_qiskit_config_singleton_idx'
    ) THEN
        CREATE UNIQUE INDEX post_qiskit_config_singleton_idx
        ON post_qiskit_config (is_singleton);
    END IF;

    -- Add CHECK constraint to guarantee is_singleton is always TRUE
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'post_qiskit_config_singleton_check'
    ) THEN
        ALTER TABLE post_qiskit_config
        ADD CONSTRAINT post_qiskit_config_singleton_check CHECK (is_singleton = TRUE);
    END IF;

    SELECT COUNT(*) INTO v_total_after FROM post_qiskit_config;
    RAISE NOTICE 'post_qiskit_config deduplication complete. Row count: %', v_total_after;
END $$;

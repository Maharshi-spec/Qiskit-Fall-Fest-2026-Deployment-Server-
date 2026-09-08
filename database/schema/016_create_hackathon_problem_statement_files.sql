-- Migration: 016_create_hackathon_problem_statement_files.sql
-- Description: Creates table and sequences for hackathon problem statement supporting file attachments.

-- 1. Pre-Qiskit Sequence & Table
CREATE SEQUENCE IF NOT EXISTS hackathon_problem_statement_files_id_seq
    AS BIGINT
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807;

CREATE TABLE IF NOT EXISTS hackathon_problem_statement_files (
    id BIGINT PRIMARY KEY DEFAULT nextval('hackathon_problem_statement_files_id_seq'::regclass),
    problem_statement_id BIGINT NOT NULL,
    event_id VARCHAR(100) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    storage_path TEXT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_hpsf_problem FOREIGN KEY (problem_statement_id)
        REFERENCES hackathon_problem_statements(id) ON DELETE CASCADE,
    CONSTRAINT fk_hpsf_event FOREIGN KEY (event_id)
        REFERENCES events(event_id) ON DELETE CASCADE
);

ALTER SEQUENCE hackathon_problem_statement_files_id_seq OWNED BY hackathon_problem_statement_files.id;

CREATE INDEX IF NOT EXISTS idx_hpsf_problem_id ON hackathon_problem_statement_files(problem_statement_id);
CREATE INDEX IF NOT EXISTS idx_hpsf_event_id ON hackathon_problem_statement_files(event_id);

-- 2. Post-Qiskit Sequence & Table (for event profile isolation)
CREATE SEQUENCE IF NOT EXISTS post_qiskit_hackathon_problem_statement_files_id_seq
    AS BIGINT
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807;

CREATE TABLE IF NOT EXISTS post_qiskit_hackathon_problem_statement_files (
    id BIGINT PRIMARY KEY DEFAULT nextval('post_qiskit_hackathon_problem_statement_files_id_seq'::regclass),
    problem_statement_id BIGINT NOT NULL,
    event_id VARCHAR(100) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    storage_path TEXT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_pq_hpsf_problem FOREIGN KEY (problem_statement_id)
        REFERENCES post_qiskit_hackathon_problem_statements(id) ON DELETE CASCADE,
    CONSTRAINT fk_pq_hpsf_event FOREIGN KEY (event_id)
        REFERENCES post_qiskit_events(event_id) ON DELETE CASCADE
);

ALTER SEQUENCE post_qiskit_hackathon_problem_statement_files_id_seq OWNED BY post_qiskit_hackathon_problem_statement_files.id;

CREATE INDEX IF NOT EXISTS idx_pq_hpsf_problem_id ON post_qiskit_hackathon_problem_statement_files(problem_statement_id);
CREATE INDEX IF NOT EXISTS idx_pq_hpsf_event_id ON post_qiskit_hackathon_problem_statement_files(event_id);

-- 3. Pre-Qiskit View
CREATE OR REPLACE VIEW pre_qiskit_hackathon_problem_statement_files AS SELECT * FROM hackathon_problem_statement_files;

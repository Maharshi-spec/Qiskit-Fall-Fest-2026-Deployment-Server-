-- Migration: 015_create_hackathon_problem_statements.sql
-- Description: Creates persistent tables and views for hackathon problem statements and team selections with capacity enforcement.

-- 1. Pre-Qiskit Sequences & Tables
CREATE SEQUENCE IF NOT EXISTS hackathon_problem_statements_id_seq
    AS BIGINT
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807;

CREATE TABLE IF NOT EXISTS hackathon_problem_statements (
    id BIGINT PRIMARY KEY DEFAULT nextval('hackathon_problem_statements_id_seq'::regclass),
    event_id VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    max_capacity INTEGER NULL CHECK (max_capacity IS NULL OR max_capacity >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_hps_event FOREIGN KEY (event_id)
        REFERENCES events(event_id) ON DELETE CASCADE,
    CONSTRAINT fk_hps_creator FOREIGN KEY (created_by)
        REFERENCES organizers(organizer_id) ON DELETE SET NULL
);

ALTER SEQUENCE hackathon_problem_statements_id_seq OWNED BY hackathon_problem_statements.id;

CREATE SEQUENCE IF NOT EXISTS hackathon_problem_selections_id_seq
    AS BIGINT
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807;

CREATE TABLE IF NOT EXISTS hackathon_problem_selections (
    id BIGINT PRIMARY KEY DEFAULT nextval('hackathon_problem_selections_id_seq'::regclass),
    event_id VARCHAR(100) NOT NULL,
    problem_statement_id BIGINT NOT NULL,
    team_id BIGINT NOT NULL,
    selected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_hpsel_problem FOREIGN KEY (problem_statement_id)
        REFERENCES hackathon_problem_statements(id) ON DELETE RESTRICT,
    CONSTRAINT fk_hpsel_team FOREIGN KEY (team_id)
        REFERENCES teams(id) ON DELETE CASCADE,
    CONSTRAINT unique_team_selection_per_event UNIQUE (event_id, team_id)
);

ALTER SEQUENCE hackathon_problem_selections_id_seq OWNED BY hackathon_problem_selections.id;

CREATE INDEX IF NOT EXISTS idx_hps_event_id ON hackathon_problem_statements(event_id);
CREATE INDEX IF NOT EXISTS idx_hpsel_problem_id ON hackathon_problem_selections(problem_statement_id);
CREATE INDEX IF NOT EXISTS idx_hpsel_event_team ON hackathon_problem_selections(event_id, team_id);

-- 2. Post-Qiskit Sequences & Tables (for profile isolation)
CREATE SEQUENCE IF NOT EXISTS post_qiskit_hackathon_problem_statements_id_seq
    AS BIGINT
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807;

CREATE TABLE IF NOT EXISTS post_qiskit_hackathon_problem_statements (
    id BIGINT PRIMARY KEY DEFAULT nextval('post_qiskit_hackathon_problem_statements_id_seq'::regclass),
    event_id VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    max_capacity INTEGER NULL CHECK (max_capacity IS NULL OR max_capacity >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_pq_hps_event FOREIGN KEY (event_id)
        REFERENCES post_qiskit_events(event_id) ON DELETE CASCADE,
    CONSTRAINT fk_pq_hps_creator FOREIGN KEY (created_by)
        REFERENCES organizers(organizer_id) ON DELETE SET NULL
);

ALTER SEQUENCE post_qiskit_hackathon_problem_statements_id_seq OWNED BY post_qiskit_hackathon_problem_statements.id;

CREATE SEQUENCE IF NOT EXISTS post_qiskit_hackathon_problem_selections_id_seq
    AS BIGINT
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807;

CREATE TABLE IF NOT EXISTS post_qiskit_hackathon_problem_selections (
    id BIGINT PRIMARY KEY DEFAULT nextval('post_qiskit_hackathon_problem_selections_id_seq'::regclass),
    event_id VARCHAR(100) NOT NULL,
    problem_statement_id BIGINT NOT NULL,
    team_id BIGINT NOT NULL,
    selected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_pq_hpsel_problem FOREIGN KEY (problem_statement_id)
        REFERENCES post_qiskit_hackathon_problem_statements(id) ON DELETE RESTRICT,
    CONSTRAINT fk_pq_hpsel_team FOREIGN KEY (team_id)
        REFERENCES post_qiskit_teams(id) ON DELETE CASCADE,
    CONSTRAINT pq_unique_team_selection_per_event UNIQUE (event_id, team_id)
);

ALTER SEQUENCE post_qiskit_hackathon_problem_selections_id_seq OWNED BY post_qiskit_hackathon_problem_selections.id;

CREATE INDEX IF NOT EXISTS idx_pq_hps_event_id ON post_qiskit_hackathon_problem_statements(event_id);
CREATE INDEX IF NOT EXISTS idx_pq_hpsel_problem_id ON post_qiskit_hackathon_problem_selections(problem_statement_id);
CREATE INDEX IF NOT EXISTS idx_pq_hpsel_event_team ON post_qiskit_hackathon_problem_selections(event_id, team_id);

-- 3. Pre-Qiskit Views
CREATE OR REPLACE VIEW pre_qiskit_hackathon_problem_statements AS SELECT * FROM hackathon_problem_statements;
CREATE OR REPLACE VIEW pre_qiskit_hackathon_problem_selections AS SELECT * FROM hackathon_problem_selections;

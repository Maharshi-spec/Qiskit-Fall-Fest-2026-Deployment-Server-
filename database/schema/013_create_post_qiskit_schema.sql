-- Migration: 013_create_post_qiskit_schema.sql
-- Description: Creates isolated database tables, sequences, and views for Post-Qiskit Fall Fest while preserving Pre-Qiskit data intact.

-- 1. Events Table for Post-Qiskit
CREATE TABLE IF NOT EXISTS post_qiskit_events (
    event_id VARCHAR(100) PRIMARY KEY,
    event_name VARCHAR(255) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    location VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    event_type VARCHAR(32) DEFAULT 'GENERAL'
);

-- 2. Registrations for Post-Qiskit
CREATE SEQUENCE IF NOT EXISTS post_qiskit_registrations_id_seq
    AS BIGINT
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807;

CREATE SEQUENCE IF NOT EXISTS post_qiskit_registrations_registration_id_seq
    AS BIGINT
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807;

CREATE TABLE IF NOT EXISTS post_qiskit_registrations (
    id BIGINT PRIMARY KEY DEFAULT nextval('post_qiskit_registrations_id_seq'::regclass),
    registration_id VARCHAR(20) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    mobile_number VARCHAR(15) NOT NULL,
    role VARCHAR(50) NOT NULL,
    institute_name VARCHAR(255) NOT NULL,
    department VARCHAR(150),
    knows_python BOOLEAN NOT NULL DEFAULT FALSE,
    aicte_quantum_course BOOLEAN NOT NULL DEFAULT FALSE,
    knows_quantum_basics BOOLEAN NOT NULL DEFAULT FALSE,
    used_qiskit_before BOOLEAN NOT NULL DEFAULT FALSE,
    id_card_url TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT post_qiskit_registrations_email_key UNIQUE (email),
    CONSTRAINT post_qiskit_registrations_registration_id_key UNIQUE (registration_id),
    CONSTRAINT post_qiskit_registrations_role_check CHECK (role IN ('STUDENT', 'FACULTY', 'PROFESSIONAL', 'OTHER'))
);

ALTER SEQUENCE post_qiskit_registrations_id_seq OWNED BY post_qiskit_registrations.id;

-- 3. Teams for Post-Qiskit
CREATE SEQUENCE IF NOT EXISTS post_qiskit_teams_id_seq
    AS BIGINT
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807;

CREATE TABLE IF NOT EXISTS post_qiskit_teams (
    id BIGINT PRIMARY KEY DEFAULT nextval('post_qiskit_teams_id_seq'::regclass),
    event_id VARCHAR(64) NOT NULL,
    team_name VARCHAR(160) NOT NULL,
    team_lead_registration_id VARCHAR(32),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT post_qiskit_teams_event_id_team_name_key UNIQUE (event_id, team_name),
    CONSTRAINT post_qiskit_teams_event_id_fkey FOREIGN KEY (event_id) REFERENCES post_qiskit_events(event_id) ON DELETE NO ACTION,
    CONSTRAINT post_qiskit_teams_team_lead_registration_id_fkey FOREIGN KEY (team_lead_registration_id) REFERENCES post_qiskit_registrations(registration_id) ON DELETE NO ACTION
);

ALTER SEQUENCE post_qiskit_teams_id_seq OWNED BY post_qiskit_teams.id;

-- 4. Team Members for Post-Qiskit
CREATE SEQUENCE IF NOT EXISTS post_qiskit_team_members_id_seq
    AS BIGINT
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807;

CREATE TABLE IF NOT EXISTS post_qiskit_team_members (
    id BIGINT PRIMARY KEY DEFAULT nextval('post_qiskit_team_members_id_seq'::regclass),
    team_id BIGINT NOT NULL,
    registration_id VARCHAR(32) NOT NULL,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT post_qiskit_team_members_team_id_registration_id_key UNIQUE (team_id, registration_id),
    CONSTRAINT post_qiskit_team_members_registration_id_fkey FOREIGN KEY (registration_id) REFERENCES post_qiskit_registrations(registration_id) ON DELETE NO ACTION,
    CONSTRAINT post_qiskit_team_members_team_id_fkey FOREIGN KEY (team_id) REFERENCES post_qiskit_teams(id) ON DELETE NO ACTION
);

ALTER SEQUENCE post_qiskit_team_members_id_seq OWNED BY post_qiskit_team_members.id;

-- 5. Attendance for Post-Qiskit
CREATE SEQUENCE IF NOT EXISTS post_qiskit_attendance_id_seq
    AS INTEGER
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 2147483647;

CREATE TABLE IF NOT EXISTS post_qiskit_attendance (
    id INTEGER PRIMARY KEY DEFAULT nextval('post_qiskit_attendance_id_seq'::regclass),
    registration_id VARCHAR(64) NOT NULL,
    full_name VARCHAR(160),
    email VARCHAR(320),
    status VARCHAR(32) NOT NULL DEFAULT 'NOT_MARKED',
    marked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    event_id VARCHAR(64) NOT NULL DEFAULT 'qff-2026',
    CONSTRAINT post_qiskit_fk_attendance_registration FOREIGN KEY (registration_id) REFERENCES post_qiskit_registrations(registration_id) ON DELETE CASCADE,
    CONSTRAINT post_qiskit_fk_attendance_event FOREIGN KEY (event_id) REFERENCES post_qiskit_events(event_id) ON DELETE CASCADE,
    CONSTRAINT post_qiskit_attendance_event_reg_unique UNIQUE (event_id, registration_id),
    CONSTRAINT post_qiskit_attendance_event_registration_key UNIQUE (registration_id, event_id),
    CONSTRAINT post_qiskit_unique_attendance_per_event UNIQUE (registration_id, event_id)
);

ALTER SEQUENCE post_qiskit_attendance_id_seq OWNED BY post_qiskit_attendance.id;

-- 6. Attendance Sessions for Post-Qiskit
CREATE SEQUENCE IF NOT EXISTS post_qiskit_attendance_sessions_id_seq
    AS BIGINT
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807;

CREATE TABLE IF NOT EXISTS post_qiskit_attendance_sessions (
    id BIGINT PRIMARY KEY DEFAULT nextval('post_qiskit_attendance_sessions_id_seq'::regclass),
    event_id VARCHAR(100) NOT NULL,
    organizer_id BIGINT NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT post_qiskit_fk_attendance_session_event FOREIGN KEY (event_id) REFERENCES post_qiskit_events(event_id) ON DELETE CASCADE,
    CONSTRAINT post_qiskit_fk_attendance_session_organizer FOREIGN KEY (organizer_id) REFERENCES organizers(organizer_id) ON DELETE CASCADE
);

ALTER SEQUENCE post_qiskit_attendance_sessions_id_seq OWNED BY post_qiskit_attendance_sessions.id;

-- 7. Attendance Tokens for Post-Qiskit
CREATE SEQUENCE IF NOT EXISTS post_qiskit_attendance_tokens_id_seq
    AS BIGINT
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807;

CREATE TABLE IF NOT EXISTS post_qiskit_attendance_tokens (
    id BIGINT PRIMARY KEY DEFAULT nextval('post_qiskit_attendance_tokens_id_seq'::regclass),
    attendance_session_id BIGINT NOT NULL,
    token UUID NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT post_qiskit_attendance_tokens_token_key UNIQUE (token),
    CONSTRAINT post_qiskit_fk_attendance_token_session FOREIGN KEY (attendance_session_id) REFERENCES post_qiskit_attendance_sessions(id) ON DELETE CASCADE
);

ALTER SEQUENCE post_qiskit_attendance_tokens_id_seq OWNED BY post_qiskit_attendance_tokens.id;

-- 8. Certificates for Post-Qiskit
CREATE SEQUENCE IF NOT EXISTS post_qiskit_certificates_id_seq
    AS BIGINT
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807;

CREATE TABLE IF NOT EXISTS post_qiskit_certificates (
    id BIGINT PRIMARY KEY DEFAULT nextval('post_qiskit_certificates_id_seq'::regclass),
    certificate_number VARCHAR(100) NOT NULL,
    registration_id BIGINT NOT NULL,
    certificate_type VARCHAR(50) NOT NULL,
    participant_name VARCHAR(150) NOT NULL,
    participant_email VARCHAR(255) NOT NULL,
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    file_path TEXT,
    status VARCHAR(30) DEFAULT 'issued',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    event_id VARCHAR(64),
    template_name VARCHAR(255),
    verification_code VARCHAR(64),
    CONSTRAINT post_qiskit_certificates_certificate_number_key UNIQUE (certificate_number),
    CONSTRAINT post_qiskit_fk_certificate_registration FOREIGN KEY (registration_id) REFERENCES post_qiskit_registrations(id) ON DELETE CASCADE,
    CONSTRAINT post_qiskit_certificates_event_id_fkey FOREIGN KEY (event_id) REFERENCES post_qiskit_events(event_id) ON DELETE NO ACTION
);

ALTER SEQUENCE post_qiskit_certificates_id_seq OWNED BY post_qiskit_certificates.id;

-- 9. Event Reminders for Post-Qiskit
CREATE SEQUENCE IF NOT EXISTS post_qiskit_event_reminders_id_seq
    AS BIGINT
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807;

CREATE TABLE IF NOT EXISTS post_qiskit_event_reminders (
    id BIGINT PRIMARY KEY DEFAULT nextval('post_qiskit_event_reminders_id_seq'::regclass),
    registration_id VARCHAR(32) NOT NULL,
    day_number SMALLINT NOT NULL,
    event_date DATE NOT NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'PENDING',
    sent_at TIMESTAMPTZ,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT post_qiskit_event_reminders_registration_id_day_number_key UNIQUE (registration_id, day_number),
    CONSTRAINT post_qiskit_event_reminders_registration_id_fkey FOREIGN KEY (registration_id) REFERENCES post_qiskit_registrations(registration_id) ON DELETE CASCADE
);

ALTER SEQUENCE post_qiskit_event_reminders_id_seq OWNED BY post_qiskit_event_reminders.id;

-- 10. Hackathon Results for Post-Qiskit
CREATE SEQUENCE IF NOT EXISTS post_qiskit_hackathon_results_id_seq
    AS BIGINT
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807;

CREATE TABLE IF NOT EXISTS post_qiskit_hackathon_results (
    id BIGINT PRIMARY KEY DEFAULT nextval('post_qiskit_hackathon_results_id_seq'::regclass),
    team_id BIGINT NOT NULL,
    placement VARCHAR(32) NOT NULL,
    assigned_by BIGINT,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT post_qiskit_hackathon_results_team_id_key UNIQUE (team_id),
    CONSTRAINT post_qiskit_hackathon_results_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES organizers(organizer_id) ON DELETE NO ACTION,
    CONSTRAINT post_qiskit_hackathon_results_team_id_fkey FOREIGN KEY (team_id) REFERENCES post_qiskit_teams(id) ON DELETE NO ACTION
);

ALTER SEQUENCE post_qiskit_hackathon_results_id_seq OWNED BY post_qiskit_hackathon_results.id;

-- 11. Seed Default Post-Qiskit Events (5 Oct 2026 - 10 Oct 2026)
INSERT INTO post_qiskit_events (event_id, event_name, description, event_date, start_time, end_time, location, status, event_type)
VALUES
    ('day-1', 'Day 1: Quantum Foundations & Qiskit Workshop', 'Introduction to quantum computing, Qiskit SDK, and basic gates', '2026-10-05', '09:00:00', '17:00:00', 'CUTM-AP Campus Auditorium', 'active', 'GENERAL'),
    ('day-2', 'Day 2: Quantum Algorithms & Lab Sessions', 'Hands-on lab sessions, VQE, and Grover search algorithm', '2026-10-06', '09:00:00', '17:00:00', 'CUTM-AP Campus Computer Labs', 'active', 'WORKSHOP'),
    ('day-3', 'Day 3: Quantum Hackathon & Presentations', 'Group project building, hackathon demos, and certificate ceremony', '2026-10-07', '09:00:00', '15:00:00', 'CUTM-AP Main Hall + Virtual', 'active', 'HACKATHON'),
    ('day-4', 'Day 4: Innovation & Project Showcase', 'Final project showcase, quantum challenge finale, awards & closing celebration', '2026-10-08', '09:30:00', '17:00:00', 'CUTM-AP Auditorium', 'active', 'GENERAL'),
    ('day-5', 'Day 5: Advanced Quantum Applications', 'Deep-dive into quantum error correction, circuit optimization, and industry use cases', '2026-10-09', '09:30:00', '17:00:00', 'CUTM-AP Auditorium', 'active', 'WORKSHOP'),
    ('day-6', 'Day 6: Grand Finale & Award Ceremony', 'Post-Qiskit grand awards celebration, community networking, and farewells', '2026-10-10', '10:00:00', '16:00:00', 'CUTM-AP Main Auditorium', 'active', 'GENERAL')
ON CONFLICT (event_id) DO UPDATE SET
    event_name = EXCLUDED.event_name,
    description = EXCLUDED.description,
    event_date = EXCLUDED.event_date,
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    location = EXCLUDED.location,
    status = EXCLUDED.status,
    event_type = EXCLUDED.event_type;

-- 12. Updatable Views for Pre-Qiskit aliases
CREATE OR REPLACE VIEW pre_qiskit_events AS SELECT * FROM events;
CREATE OR REPLACE VIEW pre_qiskit_registrations AS SELECT * FROM registrations;
CREATE OR REPLACE VIEW pre_qiskit_teams AS SELECT * FROM teams;
CREATE OR REPLACE VIEW pre_qiskit_team_members AS SELECT * FROM team_members;
CREATE OR REPLACE VIEW pre_qiskit_attendance AS SELECT * FROM attendance;
CREATE OR REPLACE VIEW pre_qiskit_attendance_sessions AS SELECT * FROM attendance_sessions;
CREATE OR REPLACE VIEW pre_qiskit_attendance_tokens AS SELECT * FROM attendance_tokens;
CREATE OR REPLACE VIEW pre_qiskit_certificates AS SELECT * FROM certificates;
CREATE OR REPLACE VIEW pre_qiskit_event_reminders AS SELECT * FROM event_reminders;
CREATE OR REPLACE VIEW pre_qiskit_hackathon_results AS SELECT * FROM hackathon_results;

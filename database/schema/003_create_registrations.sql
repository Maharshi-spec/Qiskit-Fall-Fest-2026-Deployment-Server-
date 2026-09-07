CREATE SEQUENCE IF NOT EXISTS registrations_id_seq
    AS BIGINT
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807;

-- Sequence used by the backend to generate registration IDs
CREATE SEQUENCE IF NOT EXISTS registrations_registration_id_seq
    AS BIGINT
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807;

CREATE TABLE IF NOT EXISTS registrations (
    id BIGINT PRIMARY KEY DEFAULT nextval('registrations_id_seq'::regclass),

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

    CONSTRAINT registrations_email_key
        UNIQUE (email),

    CONSTRAINT registrations_registration_id_key
        UNIQUE (registration_id),

    CONSTRAINT registrations_role_check
        CHECK (role IN ('STUDENT', 'FACULTY', 'PROFESSIONAL', 'OTHER'))
);

ALTER SEQUENCE registrations_id_seq
    OWNED BY registrations.id;
CREATE SEQUENCE IF NOT EXISTS attendance_id_seq
    AS INTEGER
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 2147483647;

CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY
        DEFAULT nextval('attendance_id_seq'::regclass),

    registration_id VARCHAR(64) NOT NULL,
    full_name VARCHAR(160),
    email VARCHAR(320),
    status VARCHAR(32) NOT NULL DEFAULT 'NOT_MARKED',

    marked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    event_id VARCHAR(64) NOT NULL DEFAULT 'qff-2026',

    CONSTRAINT fk_attendance_registration
        FOREIGN KEY (registration_id)
        REFERENCES registrations(registration_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_attendance_event
        FOREIGN KEY (event_id)
        REFERENCES events(event_id)
        ON DELETE CASCADE,

    CONSTRAINT attendance_event_reg_unique
        UNIQUE (event_id, registration_id),

    CONSTRAINT attendance_event_registration_key
        UNIQUE (registration_id, event_id),

    CONSTRAINT unique_attendance_per_event
        UNIQUE (registration_id, event_id)
);

ALTER SEQUENCE attendance_id_seq
    OWNED BY attendance.id;
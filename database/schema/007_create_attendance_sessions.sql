CREATE SEQUENCE IF NOT EXISTS attendance_sessions_id_seq
    AS BIGINT
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807;

CREATE TABLE IF NOT EXISTS attendance_sessions (
    id BIGINT PRIMARY KEY
        DEFAULT nextval('attendance_sessions_id_seq'::regclass),

    event_id VARCHAR(100) NOT NULL,
    organizer_id BIGINT NOT NULL,

    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,

    status VARCHAR(20) NOT NULL DEFAULT 'active',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_attendance_session_event
        FOREIGN KEY (event_id)
        REFERENCES events(event_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_attendance_session_organizer
        FOREIGN KEY (organizer_id)
        REFERENCES organizers(organizer_id)
        ON DELETE CASCADE
);

ALTER SEQUENCE attendance_sessions_id_seq
    OWNED BY attendance_sessions.id;
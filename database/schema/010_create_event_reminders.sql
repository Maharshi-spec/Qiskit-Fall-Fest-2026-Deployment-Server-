CREATE SEQUENCE IF NOT EXISTS event_reminders_id_seq
    AS BIGINT
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807;

CREATE TABLE IF NOT EXISTS event_reminders (
    id BIGINT PRIMARY KEY
        DEFAULT nextval('event_reminders_id_seq'::regclass),

    registration_id VARCHAR(32) NOT NULL,

    day_number SMALLINT NOT NULL,
    event_date DATE NOT NULL,

    scheduled_at TIMESTAMPTZ NOT NULL,

    status VARCHAR(16) NOT NULL DEFAULT 'PENDING',

    sent_at TIMESTAMPTZ,
    last_error TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT event_reminders_registration_id_day_number_key
        UNIQUE (registration_id, day_number),

    CONSTRAINT event_reminders_registration_id_fkey
        FOREIGN KEY (registration_id)
        REFERENCES registrations(registration_id)
        ON DELETE CASCADE
);

ALTER SEQUENCE event_reminders_id_seq
    OWNED BY event_reminders.id;
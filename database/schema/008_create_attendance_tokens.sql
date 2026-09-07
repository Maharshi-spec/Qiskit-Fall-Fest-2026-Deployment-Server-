CREATE SEQUENCE IF NOT EXISTS attendance_tokens_id_seq
    AS BIGINT
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807;

CREATE TABLE IF NOT EXISTS attendance_tokens (
    id BIGINT PRIMARY KEY
        DEFAULT nextval('attendance_tokens_id_seq'::regclass),

    attendance_session_id BIGINT NOT NULL,

    token UUID NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT attendance_tokens_token_key
        UNIQUE (token),

    CONSTRAINT fk_attendance_token_session
        FOREIGN KEY (attendance_session_id)
        REFERENCES attendance_sessions(id)
        ON DELETE CASCADE
);

ALTER SEQUENCE attendance_tokens_id_seq
    OWNED BY attendance_tokens.id;
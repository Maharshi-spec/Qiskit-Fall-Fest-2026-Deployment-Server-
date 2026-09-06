CREATE SEQUENCE IF NOT EXISTS organizers_organizer_id_seq
    AS BIGINT
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807;

CREATE TABLE IF NOT EXISTS organizers (
    organizer_id BIGINT PRIMARY KEY
        DEFAULT nextval('organizers_organizer_id_seq'::regclass),

    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT organizers_email_key
        UNIQUE (email)
);

ALTER SEQUENCE organizers_organizer_id_seq
    OWNED BY organizers.organizer_id;
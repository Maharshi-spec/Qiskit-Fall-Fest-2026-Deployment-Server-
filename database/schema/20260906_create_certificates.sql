CREATE SEQUENCE IF NOT EXISTS certificates_id_seq
    AS BIGINT
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807;

CREATE TABLE IF NOT EXISTS certificates (
    id BIGINT PRIMARY KEY
        DEFAULT nextval('certificates_id_seq'::regclass),

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

    CONSTRAINT certificates_certificate_number_key
        UNIQUE (certificate_number),

    CONSTRAINT fk_certificate_registration
        FOREIGN KEY (registration_id)
        REFERENCES registrations(id)
        ON DELETE CASCADE,

    CONSTRAINT certificates_event_id_fkey
        FOREIGN KEY (event_id)
        REFERENCES events(event_id)
        ON DELETE NO ACTION
);

ALTER SEQUENCE certificates_id_seq
    OWNED BY certificates.id;
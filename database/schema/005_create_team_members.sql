CREATE SEQUENCE IF NOT EXISTS team_members_id_seq
    AS BIGINT
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807;

CREATE TABLE IF NOT EXISTS team_members (
    id BIGINT PRIMARY KEY
        DEFAULT nextval('team_members_id_seq'::regclass),

    team_id BIGINT NOT NULL,

    registration_id VARCHAR(32) NOT NULL,

    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT team_members_team_id_registration_id_key
        UNIQUE (team_id, registration_id),

    CONSTRAINT team_members_registration_id_fkey
        FOREIGN KEY (registration_id)
        REFERENCES registrations(registration_id)
        ON DELETE NO ACTION,

    CONSTRAINT team_members_team_id_fkey
        FOREIGN KEY (team_id)
        REFERENCES teams(id)
        ON DELETE NO ACTION
);

ALTER SEQUENCE team_members_id_seq
    OWNED BY team_members.id;
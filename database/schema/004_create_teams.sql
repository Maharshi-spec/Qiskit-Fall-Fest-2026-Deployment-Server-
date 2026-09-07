CREATE SEQUENCE IF NOT EXISTS teams_id_seq
    AS BIGINT
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807;

CREATE TABLE IF NOT EXISTS teams (
    id BIGINT PRIMARY KEY
        DEFAULT nextval('teams_id_seq'::regclass),

    event_id VARCHAR(64) NOT NULL,
    team_name VARCHAR(160) NOT NULL,

    team_lead_registration_id VARCHAR(32),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT teams_event_id_team_name_key
        UNIQUE (event_id, team_name),

    CONSTRAINT teams_event_id_fkey
        FOREIGN KEY (event_id)
        REFERENCES events(event_id)
        ON DELETE NO ACTION,

    CONSTRAINT teams_team_lead_registration_id_fkey
        FOREIGN KEY (team_lead_registration_id)
        REFERENCES registrations(registration_id)
        ON DELETE NO ACTION
);

ALTER SEQUENCE teams_id_seq
    OWNED BY teams.id;
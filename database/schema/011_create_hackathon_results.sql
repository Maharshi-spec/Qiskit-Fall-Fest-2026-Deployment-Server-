CREATE SEQUENCE IF NOT EXISTS hackathon_results_id_seq
    AS BIGINT
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807;

CREATE TABLE IF NOT EXISTS hackathon_results (
    id BIGINT PRIMARY KEY
        DEFAULT nextval('hackathon_results_id_seq'::regclass),

    team_id BIGINT NOT NULL,

    placement VARCHAR(32) NOT NULL,

    assigned_by BIGINT,

    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT hackathon_results_team_id_key
        UNIQUE (team_id),

    CONSTRAINT hackathon_results_assigned_by_fkey
        FOREIGN KEY (assigned_by)
        REFERENCES organizers(organizer_id)
        ON DELETE NO ACTION,

    CONSTRAINT hackathon_results_team_id_fkey
        FOREIGN KEY (team_id)
        REFERENCES teams(id)
        ON DELETE NO ACTION
);

ALTER SEQUENCE hackathon_results_id_seq
    OWNED BY hackathon_results.id;
-- Qiskit Fall Fest 2026
-- Master database migration

BEGIN;

-- Base tables
\ir 20260906_create_events.sql
\ir 20260906_create_registrations.sql
\ir 20260906_create_organizers.sql

-- Attendance
\ir 20260906_create_attendance.sql
\ir 20260906_create_attendance_sessions.sql
\ir 20260906_create_attendance_tokens.sql

-- Certificates / reminders
\ir 20260906_create_certificates.sql
\ir 20260906_create_event_reminders.sql

-- Teams
\ir 20260906_create_teams.sql
\ir 20260906_create_team_members.sql
\ir 20260906_create_hackathon_results.sql

COMMIT;
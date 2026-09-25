-- Migration: 019_update_post_qiskit_schedule.sql
-- Description: Updates Post-Qiskit event records in post_qiskit_events to match
--              the official CUTM-AP Qiskit Fall Fest 2026 Schedule brochure (5–10 Oct 2026).
--              Uses ON CONFLICT (event_id) DO UPDATE SET for idempotency without modifying Pre-Qiskit.

INSERT INTO post_qiskit_events (event_id, event_name, description, event_date, start_time, end_time, location, status, event_type)
VALUES
    ('day-1', 'Day 1 — 5 October 2026', 'Welcoming the guests, addresses by dignitaries, and technical sessions', '2026-10-05', '10:00:00', '15:30:00', '', 'ACTIVE', 'GENERAL'),
    ('day-2', 'Day 2 — 6 October 2026', 'Panel Discussion I, Qiskit 101 Session, Quiz Rules, and Technical Session', '2026-10-06', '10:00:00', '15:30:00', '', 'ACTIVE', 'WORKSHOP'),
    ('day-3', 'Day 3 — 7 October 2026', 'Welcome CBIT Team, MoU Signing, Panel Discussion II, Dr. Rukhsan Ul Haq session, Hackathon Launch', '2026-10-07', '10:00:00', '16:00:00', '', 'ACTIVE', 'HACKATHON'),
    ('day-4', 'Day 4 — 8 October 2026', 'Fun Event - I, Quiz - I, Dr. Shyamapada Mukherjee session, Kiran Kaur Raina session', '2026-10-08', '10:00:00', '16:00:00', '', 'ACTIVE', 'GENERAL'),
    ('day-5', 'Day 5 — 9 October 2026', 'Dr. Santoshi Matam session, Fun Event - II, Quiz - II, Hackathon Evaluations', '2026-10-09', '10:00:00', '16:00:00', '', 'ACTIVE', 'WORKSHOP'),
    ('day-6', 'Day 6 — 10 October 2026', 'Venkat Swamy Tadikonda session, Hackathon Best Presentations, Awards Distribution, Conclusion Address', '2026-10-10', '10:00:00', '03:15:00', '', 'ACTIVE', 'GENERAL')
ON CONFLICT (event_id) DO UPDATE SET
    event_name = EXCLUDED.event_name,
    description = EXCLUDED.description,
    event_date = EXCLUDED.event_date,
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    location = EXCLUDED.location,
    status = EXCLUDED.status,
    event_type = EXCLUDED.event_type;

-- Update Post-Qiskit landing card description if it contains legacy placeholder text
UPDATE post_qiskit_config
SET description = 'Explore advanced quantum computing through hands-on workshops and projects.'
WHERE description IS NULL
   OR description LIKE '%Advanced Quantum Applications%'
   OR description = 'Updated Post-Qiskit Deep Dive Hackathon';

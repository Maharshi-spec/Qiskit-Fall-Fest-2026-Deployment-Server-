const { pool } = require('../config/database')
const bcrypt = require('bcryptjs')

async function seedDatabase() {
  console.log('[SEED] Starting database seed for Qiskit Fall Fest 2026...')

  // 1. Seed/Update Organizer password for admin@qiskitfallfest.com with Admin@123 hash
  const adminPasswordHash = await bcrypt.hash('Admin@123', 10)
  const orgResult = await pool.query(
    `INSERT INTO organizers (email, password)
     VALUES ('admin@qiskitfallfest.com', $1)
     ON CONFLICT (email)
     DO UPDATE SET password = EXCLUDED.password
     RETURNING organizer_id, email;`,
    [adminPasswordHash]
  )
  console.log('[SEED] Organizer account ready:', orgResult.rows[0])

  // 2. Seed all 4 official event days
  const events = [
    {
      id: 'day-1',
      name: 'Day 1: Quantum Foundations & Qiskit Workshop',
      desc: 'Introduction to quantum computing, Qiskit SDK, and basic gates',
      date: '2026-09-07',
      startTime: '09:00',
      endTime: '17:00',
      location: 'CUTM-AP Campus Auditorium',
      type: 'GENERAL',
    },
    {
      id: 'day-2',
      name: 'Day 2: Quantum Algorithms & Lab Sessions',
      desc: 'Hands-on lab sessions, VQE, and Grover search algorithm',
      date: '2026-09-08',
      startTime: '09:00',
      endTime: '17:00',
      location: 'CUTM-AP Campus Computer Labs',
      type: 'WORKSHOP',
    },
    {
      id: 'day-3',
      name: 'Day 3: Quantum Hackathon & Presentations',
      desc: 'Group project building, hackathon demos, and certificate ceremony',
      date: '2026-09-09',
      startTime: '09:00',
      endTime: '15:00',
      location: 'CUTM-AP Main Hall + Virtual',
      type: 'HACKATHON',
    },
    {
      id: 'day-4',
      name: 'Day 4: Innovation & Project Showcase',
      desc: 'Final project showcase, quantum challenge finale, awards & closing celebration',
      date: '2026-09-10',
      startTime: '09:30',
      endTime: '17:00',
      location: 'CUTM-AP Auditorium',
      type: 'GENERAL',
    },
  ]

  for (const evt of events) {
    const res = await pool.query(
      `INSERT INTO events (event_id, event_name, description, event_date, start_time, end_time, location, status, event_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', $8)
       ON CONFLICT (event_id)
       DO UPDATE SET
         event_name = EXCLUDED.event_name,
         description = EXCLUDED.description,
         event_date = EXCLUDED.event_date,
         start_time = EXCLUDED.start_time,
         end_time = EXCLUDED.end_time,
         location = EXCLUDED.location,
         status = EXCLUDED.status,
         event_type = EXCLUDED.event_type
       RETURNING event_id, event_name, event_date;`,
      [evt.id, evt.name, evt.desc, evt.date, evt.startTime, evt.endTime, evt.location, evt.type]
    )
    console.log('[SEED] Event record ready:', res.rows[0])
  }

  console.log('[SEED] Database seeding complete.')
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[SEED_ERROR]', err)
      process.exit(1)
    })
}

module.exports = { seedDatabase }

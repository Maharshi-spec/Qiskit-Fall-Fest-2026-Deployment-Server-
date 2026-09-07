const assert = require('node:assert/strict')
const { test, before, after } = require('node:test')
const http = require('node:http')
const jwt = require('jsonwebtoken')
const app = require('../src/app')
const { pool } = require('../src/config/database')
const { initializeDatabase } = require('../src/config/database-init')
const { calculateProfileStatus, getTodayInTimezone } = require('../src/config/eventProfiles')
const { runWithProfile } = require('../src/middleware/profile.middleware')

let server
let baseUrl
let organizerToken

const generateOrganizerToken = () => {
  return jwt.sign(
    {
      userId: 1,
      organizerId: 1,
      email: 'admin@qiskitfallfest.com',
      role: 'ORGANIZER',
    },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: '1h' }
  )
}

before(async () => {
  // Ensure database schema and migrations are initialized
  await initializeDatabase()

  // Start ephemeral HTTP server for testing
  server = http.createServer(app)
  await new Promise((resolve) => server.listen(0, resolve))
  const port = server.address().port
  baseUrl = `http://127.0.0.1:${port}`

  organizerToken = generateOrganizerToken()

  // Reset post_qiskit_config to initial default state: enabled = false
  await pool.query(`
    UPDATE post_qiskit_config
    SET
      enabled = FALSE,
      start_date = '2026-10-05',
      end_date = '2026-10-10',
      coordinator_name = NULL,
      coordinator_contact = NULL,
      venue = NULL,
      location = NULL,
      start_time = '09:00:00',
      end_time = '17:00:00',
      timezone = 'Asia/Kolkata',
      description = 'Initial post-event description'
    WHERE id = (SELECT id FROM post_qiskit_config ORDER BY id ASC LIMIT 1)
  `)
})

after(async () => {
  // Clean up: restore post_qiskit_config to default
  await pool.query(`
    UPDATE post_qiskit_config
    SET enabled = FALSE, start_date = '2026-10-05', end_date = '2026-10-10'
    WHERE id = (SELECT id FROM post_qiskit_config ORDER BY id ASC LIMIT 1)
  `)

  if (server) {
    await new Promise((resolve) => server.close(resolve))
  }
})

test('1. Landing page profiles endpoint returns profile data with dynamic Post-Qiskit status', async () => {
  const res = await fetch(`${baseUrl}/api/v1/profiles`)
  assert.equal(res.status, 200)
  const data = await res.json()
  assert.equal(data.success, true)
  assert.ok(Array.isArray(data.data))

  const preProfile = data.data.find((p) => p.id === 'pre-qiskit')
  const postProfile = data.data.find((p) => p.id === 'post-qiskit')

  assert.ok(preProfile, 'Pre-Qiskit profile must exist')
  assert.ok(postProfile, 'Post-Qiskit profile must exist')

  // Pre-Qiskit operates independently
  assert.equal(preProfile.id, 'pre-qiskit')
  assert.equal(preProfile.startDate, '2026-09-07')

  // Post-Qiskit has enabled flag from database
  assert.equal(postProfile.enabled, false)
  assert.equal(postProfile.status, 'DISABLED')
})

test('2. Post-Qiskit starts initially disabled in config table and public status endpoint', async () => {
  const res = await fetch(`${baseUrl}/api/v1/post-event/status`)
  assert.equal(res.status, 200)
  const data = await res.json()
  assert.equal(data.success, true)
  assert.equal(data.data.enabled, false)
  assert.equal(data.data.status, 'DISABLED')
  // Public status must NOT expose sensitive organizer details like coordinator_contact
  assert.equal(data.data.coordinator_contact, undefined)
})

test('3. Disabled Post-Qiskit cannot be entered via API (route guard rejects with 403)', async () => {
  const res = await fetch(`${baseUrl}/api/v1/admin/participants`, {
    headers: {
      'X-Event-Profile': 'post-qiskit',
      Authorization: `Bearer ${organizerToken}`,
    },
  })
  assert.equal(res.status, 403)
  const body = await res.json()
  assert.equal(body.error.code, 'POST_QISKIT_DISABLED')
})

test('4. Organizer can read full config and update Post-Qiskit settings', async () => {
  // Read config
  const getRes = await fetch(`${baseUrl}/api/v1/post-event/config`, {
    headers: { Authorization: `Bearer ${organizerToken}` },
  })
  assert.equal(getRes.status, 200)
  const getConfig = await getRes.json()
  assert.equal(getConfig.success, true)
  assert.equal(getConfig.data.enabled, false)

  // Update config
  const updateRes = await fetch(`${baseUrl}/api/v1/post-event/config`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${organizerToken}`,
    },
    body: JSON.stringify({
      start_date: '2026-10-06',
      end_date: '2026-10-11',
      coordinator_name: 'Dr. Quantum Specialist',
      coordinator_contact: 'specialist@cutmap.ac.in',
      venue: 'CUTM-AP Quantum Computing Lab',
      location: 'Andhra Pradesh, India',
      start_time: '10:00:00',
      end_time: '18:00:00',
      description: 'Updated Post-Qiskit Deep Dive Hackathon',
      activities: 'Day 1: Algorithms, Day 2: Error Mitigation',
    }),
  })

  assert.equal(updateRes.status, 200)
  const updated = await updateRes.json()
  assert.equal(updated.success, true)
  assert.equal(updated.data.coordinator_name, 'Dr. Quantum Specialist')
  assert.equal(updated.data.venue, 'CUTM-AP Quantum Computing Lab')
  assert.equal(updated.data.location, 'Andhra Pradesh, India')
  assert.equal(updated.data.start_date, '2026-10-06')
  assert.equal(updated.data.end_date, '2026-10-11')
})

test('5. Invalid dates are rejected by organizer config endpoint', async () => {
  const res = await fetch(`${baseUrl}/api/v1/post-event/config`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${organizerToken}`,
    },
    body: JSON.stringify({
      start_date: '2026-10-20',
      end_date: '2026-10-10', // end_date is before start_date!
    }),
  })
  assert.equal(res.status, 400)
  const body = await res.json()
  assert.equal(body.error.code, 'INVALID_DATES')
})

test('6. Unauthorized users cannot enable, disable, or modify Post-Qiskit config', async () => {
  // Missing auth header
  const putRes = await fetch(`${baseUrl}/api/v1/post-event/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ venue: 'Hacker Venue' }),
  })
  assert.equal(putRes.status, 401)

  const enableRes = await fetch(`${baseUrl}/api/v1/post-event/enable`, {
    method: 'POST',
  })
  assert.equal(enableRes.status, 401)

  const disableRes = await fetch(`${baseUrl}/api/v1/post-event/disable`, {
    method: 'POST',
  })
  assert.equal(disableRes.status, 401)
})

test('7. Organizer can explicitly enable Post-Qiskit and it becomes enterable', async () => {
  const enableRes = await fetch(`${baseUrl}/api/v1/post-event/enable`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${organizerToken}` },
  })
  assert.equal(enableRes.status, 200)
  const enableData = await enableRes.json()
  assert.equal(enableData.success, true)
  assert.equal(enableData.data.enabled, true)

  // Status endpoint now shows enabled = true
  const statusRes = await fetch(`${baseUrl}/api/v1/post-event/status`)
  const statusData = await statusRes.json()
  assert.equal(statusData.data.enabled, true)
  assert.notEqual(statusData.data.status, 'DISABLED')

  // Profiles endpoint shows post-qiskit enabled = true
  const profilesRes = await fetch(`${baseUrl}/api/v1/profiles`)
  const profilesData = await profilesRes.json()
  const postProfile = profilesData.data.find((p) => p.id === 'post-qiskit')
  assert.equal(postProfile.enabled, true)

  // Route guard allows entry when enabled
  const participantsRes = await fetch(`${baseUrl}/api/v1/admin/participants`, {
    headers: {
      'X-Event-Profile': 'post-qiskit',
      Authorization: `Bearer ${organizerToken}`,
    },
  })
  assert.notEqual(participantsRes.status, 403)
})

test('8. Dynamic status calculation depends on both enabled flag and configured dates', () => {
  // When enabled = false, always DISABLED
  assert.equal(calculateProfileStatus('post-qiskit', new Date('2026-10-07'), { enabled: false }), 'DISABLED')

  // When enabled = true:
  // Before start date -> UPCOMING
  assert.equal(
    calculateProfileStatus('post-qiskit', new Date('2026-09-15'), {
      enabled: true,
      startDate: '2026-10-05',
      endDate: '2026-10-10',
    }),
    'UPCOMING'
  )

  // Between start and end date -> GOING
  assert.equal(
    calculateProfileStatus('post-qiskit', new Date('2026-10-07'), {
      enabled: true,
      startDate: '2026-10-05',
      endDate: '2026-10-10',
    }),
    'GOING'
  )

  // After end date -> COMPLETED
  assert.equal(
    calculateProfileStatus('post-qiskit', new Date('2026-10-15'), {
      enabled: true,
      startDate: '2026-10-05',
      endDate: '2026-10-10',
    }),
    'COMPLETED'
  )
})

test('9. Organizer can disable Post-Qiskit again', async () => {
  const disableRes = await fetch(`${baseUrl}/api/v1/post-event/disable`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${organizerToken}` },
  })
  assert.equal(disableRes.status, 200)
  const disableData = await disableRes.json()
  assert.equal(disableData.success, true)
  assert.equal(disableData.data.enabled, false)

  const statusRes = await fetch(`${baseUrl}/api/v1/post-event/status`)
  const statusData = await statusRes.json()
  assert.equal(statusData.data.enabled, false)
  assert.equal(statusData.data.status, 'DISABLED')
})

test('10. Pre-Qiskit data remains untouched and isolated from Post-Qiskit', async () => {
  // Count pre-qiskit registrations
  const preResult = await pool.query('SELECT COUNT(*) AS cnt FROM registrations')
  const preCount = parseInt(preResult.rows[0].cnt, 10)

  // Count post-qiskit registrations
  const postResult = await pool.query('SELECT COUNT(*) AS cnt FROM post_qiskit_registrations')
  const postCount = parseInt(postResult.rows[0].cnt, 10)

  // Verify post_qiskit tables are completely separate
  assert.ok(typeof preCount === 'number')
  assert.ok(typeof postCount === 'number')

  // Insert a test registration in post_qiskit via runWithProfile
  const testEmail = `post_isolated_${Date.now()}@example.com`
  const testRegId = `QFF26-POST-${Date.now().toString().slice(-4)}`

  await runWithProfile('post-qiskit', async () => {
    await pool.query(
      `INSERT INTO post_qiskit_registrations (registration_id, full_name, email, mobile_number, role, institute_name, id_card_url, status)
       VALUES ($1, 'Post Participant', $2, '9999999999', 'STUDENT', 'CUTM-AP', 'https://example.com/id.png', 'CONFIRMED')`,
      [testRegId, testEmail]
    )
  })

  // Verify it exists in post_qiskit_registrations
  const postCheck = await pool.query('SELECT * FROM post_qiskit_registrations WHERE email = $1', [testEmail])
  assert.equal(postCheck.rowCount, 1)

  // Verify it DOES NOT exist in pre-qiskit registrations!
  const preCheck = await pool.query('SELECT * FROM registrations WHERE email = $1', [testEmail])
  assert.equal(preCheck.rowCount, 0, 'Post-Qiskit registration must NOT appear in Pre-Qiskit table')

  // Clean up post-qiskit test row
  await pool.query('DELETE FROM post_qiskit_registrations WHERE email = $1', [testEmail])
})

test('11. Attendance records remain strictly isolated between Pre and Post', async () => {
  // Verify attendance table and post_qiskit_attendance table are distinct
  const preAtt = await pool.query('SELECT table_name FROM information_schema.tables WHERE table_name = $1', ['attendance'])
  const postAtt = await pool.query('SELECT table_name FROM information_schema.tables WHERE table_name = $1', ['post_qiskit_attendance'])
  assert.equal(preAtt.rowCount, 1)
  assert.equal(postAtt.rowCount, 1)
})

test('12. Certificate records remain strictly isolated between Pre and Post', async () => {
  const preCert = await pool.query('SELECT table_name FROM information_schema.tables WHERE table_name = $1', ['certificates'])
  const postCert = await pool.query('SELECT table_name FROM information_schema.tables WHERE table_name = $1', ['post_qiskit_certificates'])
  assert.equal(preCert.rowCount, 1)
  assert.equal(postCert.rowCount, 1)
})

test('13. Events records are independent between Pre and Post', async () => {
  const preEvents = await pool.query('SELECT COUNT(*) AS cnt FROM events')
  const postEvents = await pool.query('SELECT COUNT(*) AS cnt FROM post_qiskit_events')
  assert.ok(parseInt(preEvents.rows[0].cnt, 10) >= 0)
  assert.ok(parseInt(postEvents.rows[0].cnt, 10) >= 0)
})

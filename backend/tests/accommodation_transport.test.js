const test = require('node:test')
const assert = require('node:assert/strict')
process.env.NODE_ENV = 'test'
const http = require('node:http')
const jwt = require('jsonwebtoken')
const app = require('../src/app')
const { pool } = require('../src/config/database')
const { initializeDatabase } = require('../src/config/database-init')
const registrationService = require('../src/services/registration.service')

let server
let baseUrl
let organizerToken
let originalPostConfig = null

const generateOrganizerToken = () => {
  return jwt.sign(
    {
      userId: 1,
      organizerId: 1,
      email: 'admin@qiskitfallfest.com',
      role: 'ORGANIZER',
    },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: '1h' },
  )
}

const fakeFile = {
  originalname: 'idcard.jpg',
  mimetype: 'image/jpeg',
  buffer: Buffer.from('fake-id-card-content'),
  size: 200,
}

const timestamp = Date.now()
const preEmails = {
  bothTrue: `acc_trans_both_${timestamp}@example.com`,
  accOnly: `acc_trans_acc_${timestamp}@example.com`,
  transOnly: `acc_trans_trans_${timestamp}@example.com`,
  omitted: `acc_trans_omit_${timestamp}@example.com`,
}
const postEmail = `acc_trans_post_${timestamp}@example.com`

test.before(async () => {
  await initializeDatabase()
  server = http.createServer(app)
  await new Promise((resolve) => server.listen(0, resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}`
  organizerToken = generateOrganizerToken()

  // Save current post_qiskit_config
  const confRes = await pool.query('SELECT * FROM post_qiskit_config ORDER BY id ASC LIMIT 1')
  originalPostConfig = confRes.rows[0] || null

  // Ensure Post-Qiskit is enabled & registration open for isolation tests
  await pool.query(`
    UPDATE post_qiskit_config
    SET enabled = TRUE, registration_open = TRUE
    WHERE id = (SELECT id FROM post_qiskit_config ORDER BY id ASC LIMIT 1)
  `)
})

test.after(async () => {
  // Clean up Pre-Qiskit test registrations
  const allPreEmails = Object.values(preEmails)
  await pool.query('DELETE FROM registrations WHERE email = ANY($1::text[])', [allPreEmails])

  // Clean up Post-Qiskit test registrations
  await pool.query('DELETE FROM post_qiskit_registrations WHERE email = $1', [postEmail])

  // Restore post_qiskit_config
  if (originalPostConfig) {
    await pool.query(`
      UPDATE post_qiskit_config
      SET enabled = $1, registration_open = $2
      WHERE id = $3
    `, [originalPostConfig.enabled, originalPostConfig.registration_open, originalPostConfig.id])
  }

  if (server) {
    await new Promise((resolve) => server.close(resolve))
  }
})

test('1. Registration with accommodation = true persists true in database', async () => {
  const payload = {
    fullName: 'Acc True User',
    email: preEmails.bothTrue,
    mobileNumber: '9876543210',
    role: 'STUDENT',
    instituteName: 'CUTMAP',
    department: 'CSE',
    knowsPython: true,
    aicteQuantumCourse: false,
    knowsQuantumBasics: true,
    usedQiskitBefore: false,
    accommodation_required: true,
    local_transport_required: true,
  }

  const result = await registrationService.registerUser(payload, fakeFile)
  assert.equal(result.success, true)
  assert.ok(result.data.registrationId)

  const dbRes = await pool.query('SELECT * FROM registrations WHERE email = $1', [preEmails.bothTrue])
  assert.equal(dbRes.rows.length, 1)
  assert.equal(dbRes.rows[0].accommodation_required, true)
})

test('2. Registration with accommodation = false persists false in database', async () => {
  const payload = {
    fullName: 'Acc False User',
    email: preEmails.transOnly,
    mobileNumber: '9876543211',
    role: 'STUDENT',
    instituteName: 'CUTMAP',
    department: 'ECE',
    knowsPython: true,
    aicteQuantumCourse: false,
    knowsQuantumBasics: true,
    usedQiskitBefore: false,
    accommodation_required: false,
    local_transport_required: true,
  }

  const result = await registrationService.registerUser(payload, fakeFile)
  assert.equal(result.success, true)

  const dbRes = await pool.query('SELECT * FROM registrations WHERE email = $1', [preEmails.transOnly])
  assert.equal(dbRes.rows.length, 1)
  assert.equal(dbRes.rows[0].accommodation_required, false)
})

test('3. Registration with local transport = true persists true in database', async () => {
  const payload = {
    fullName: 'Transport Only User',
    email: preEmails.accOnly,
    mobileNumber: '9876543212',
    role: 'FACULTY',
    instituteName: 'CUTMAP',
    department: 'Physics',
    knowsPython: false,
    aicteQuantumCourse: true,
    knowsQuantumBasics: true,
    usedQiskitBefore: false,
    accommodation_required: true,
    local_transport_required: false,
  }

  const result = await registrationService.registerUser(payload, fakeFile)
  assert.equal(result.success, true)

  const dbRes = await pool.query('SELECT * FROM registrations WHERE email = $1', [preEmails.accOnly])
  assert.equal(dbRes.rows.length, 1)
  assert.equal(dbRes.rows[0].local_transport_required, false)
  assert.equal(dbRes.rows[0].accommodation_required, true)
})

test('4. Registration without the new fields defaults to false', async () => {
  const payload = {
    fullName: 'Legacy Client User',
    email: preEmails.omitted,
    mobileNumber: '9876543213',
    role: 'OTHER',
    instituteName: 'CUTMAP',
    department: 'Math',
    knowsPython: false,
    aicteQuantumCourse: false,
    knowsQuantumBasics: false,
    usedQiskitBefore: false,
  }

  const result = await registrationService.registerUser(payload, fakeFile)
  assert.equal(result.success, true)

  const dbRes = await pool.query('SELECT * FROM registrations WHERE email = $1', [preEmails.omitted])
  assert.equal(dbRes.rows.length, 1)
  assert.equal(dbRes.rows[0].accommodation_required, false)
  assert.equal(dbRes.rows[0].local_transport_required, false)
})

test('5. Participants API returns both accommodation_required and local_transport_required', async () => {
  const res = await fetch(`${baseUrl}/api/v1/admin/participants`, {
    headers: {
      Authorization: `Bearer ${organizerToken}`,
    },
  })
  assert.equal(res.status, 200)
  const body = await res.json()
  assert.equal(body.success, true)
  assert.ok(Array.isArray(body.data))

  const bothTrueRecord = body.data.find((p) => p.email === preEmails.bothTrue)
  assert.ok(bothTrueRecord, 'bothTrue participant should be present')
  assert.equal(bothTrueRecord.accommodation_required, true)
  assert.equal(bothTrueRecord.local_transport_required, true)

  const omittedRecord = body.data.find((p) => p.email === preEmails.omitted)
  assert.ok(omittedRecord, 'omitted participant should be present')
  assert.equal(omittedRecord.accommodation_required, false)
  assert.equal(omittedRecord.local_transport_required, false)
})

test('6. Accommodation filter = Required returns only matching participants', async () => {
  const res = await fetch(`${baseUrl}/api/v1/admin/participants?accommodation=required`, {
    headers: {
      Authorization: `Bearer ${organizerToken}`,
    },
  })
  assert.equal(res.status, 200)
  const body = await res.json()
  assert.equal(body.success, true)

  // Every returned participant must have accommodation_required = true
  assert.ok(body.data.length > 0)
  for (const p of body.data) {
    assert.equal(p.accommodation_required, true)
  }

  const emails = body.data.map((p) => p.email)
  assert.ok(emails.includes(preEmails.bothTrue))
  assert.ok(emails.includes(preEmails.accOnly))
  assert.ok(!emails.includes(preEmails.transOnly))
  assert.ok(!emails.includes(preEmails.omitted))
})

test('7. Accommodation filter = Not Required returns only non-matching participants', async () => {
  const res = await fetch(`${baseUrl}/api/v1/admin/participants?accommodation=not_required`, {
    headers: {
      Authorization: `Bearer ${organizerToken}`,
    },
  })
  assert.equal(res.status, 200)
  const body = await res.json()
  assert.equal(body.success, true)

  // Every returned participant must have accommodation_required = false
  assert.ok(body.data.length > 0)
  for (const p of body.data) {
    assert.equal(p.accommodation_required, false)
  }

  const emails = body.data.map((p) => p.email)
  assert.ok(!emails.includes(preEmails.bothTrue))
  assert.ok(!emails.includes(preEmails.accOnly))
  assert.ok(emails.includes(preEmails.transOnly))
  assert.ok(emails.includes(preEmails.omitted))
})

test('8. Local Transport filter = Required returns only matching participants', async () => {
  const res = await fetch(`${baseUrl}/api/v1/admin/participants?local_transport=required`, {
    headers: {
      Authorization: `Bearer ${organizerToken}`,
    },
  })
  assert.equal(res.status, 200)
  const body = await res.json()
  assert.equal(body.success, true)

  // Every returned participant must have local_transport_required = true
  assert.ok(body.data.length > 0)
  for (const p of body.data) {
    assert.equal(p.local_transport_required, true)
  }

  const emails = body.data.map((p) => p.email)
  assert.ok(emails.includes(preEmails.bothTrue))
  assert.ok(emails.includes(preEmails.transOnly))
  assert.ok(!emails.includes(preEmails.accOnly))
  assert.ok(!emails.includes(preEmails.omitted))
})

test('9. Combined filters (Accommodation = Required + Local Transport = Required) work correctly', async () => {
  const res = await fetch(`${baseUrl}/api/v1/admin/participants?accommodation=required&local_transport=required`, {
    headers: {
      Authorization: `Bearer ${organizerToken}`,
    },
  })
  assert.equal(res.status, 200)
  const body = await res.json()
  assert.equal(body.success, true)

  // Every returned participant must have both accommodation_required = true and local_transport_required = true
  for (const p of body.data) {
    assert.equal(p.accommodation_required, true)
    assert.equal(p.local_transport_required, true)
  }

  const emails = body.data.map((p) => p.email)
  assert.ok(emails.includes(preEmails.bothTrue))
  assert.ok(!emails.includes(preEmails.accOnly))
  assert.ok(!emails.includes(preEmails.transOnly))
  assert.ok(!emails.includes(preEmails.omitted))
})

test('10. Pre-Qiskit and Post-Qiskit participant data remain strictly isolated', async () => {
  // Register a Post-Qiskit participant via HTTP with X-Event-Profile header
  const formData = new FormData()
  formData.append('fullName', 'Post Qiskit Attendee')
  formData.append('email', postEmail)
  formData.append('mobileNumber', '9876543299')
  formData.append('role', 'STUDENT')
  formData.append('instituteName', 'CUTM Post-Event')
  formData.append('department', 'CSE')
  formData.append('knowsPython', 'true')
  formData.append('aicteQuantumCourse', 'false')
  formData.append('knowsQuantumBasics', 'true')
  formData.append('usedQiskitBefore', 'true')
  formData.append('accommodation_required', 'true')
  formData.append('local_transport_required', 'true')
  formData.append('idCard', new Blob(['test-post-card'], { type: 'image/jpeg' }), 'postcard.jpg')

  const regRes = await fetch(`${baseUrl}/api/v1/registrations`, {
    method: 'POST',
    headers: {
      'X-Event-Profile': 'post-qiskit',
    },
    body: formData,
  })
  assert.equal(regRes.status, 201)

  // Verify in PostgreSQL that postEmail is ONLY in post_qiskit_registrations, NOT in pre_qiskit registrations
  const preDb = await pool.query('SELECT * FROM registrations WHERE email = $1', [postEmail])
  assert.equal(preDb.rows.length, 0, 'Post-Qiskit registration must NOT be in registrations table')

  const postDb = await pool.query('SELECT * FROM post_qiskit_registrations WHERE email = $1', [postEmail])
  assert.equal(postDb.rows.length, 1, 'Post-Qiskit registration must be in post_qiskit_registrations')
  assert.equal(postDb.rows[0].accommodation_required, true)
  assert.equal(postDb.rows[0].local_transport_required, true)

  // Query Pre-Qiskit participants API: must NOT contain Post-Qiskit participant
  const preApiRes = await fetch(`${baseUrl}/api/v1/admin/participants`, {
    headers: {
      Authorization: `Bearer ${organizerToken}`,
      'X-Event-Profile': 'pre-qiskit',
    },
  })
  assert.equal(preApiRes.status, 200)
  const preApiBody = await preApiRes.json()
  const preApiEmails = preApiBody.data.map((p) => p.email)
  assert.ok(!preApiEmails.includes(postEmail), 'Pre-Qiskit participants API must NOT return Post-Qiskit record')

  // Query Post-Qiskit participants API: must NOT contain Pre-Qiskit participants
  const postApiRes = await fetch(`${baseUrl}/api/v1/admin/participants`, {
    headers: {
      Authorization: `Bearer ${organizerToken}`,
      'X-Event-Profile': 'post-qiskit',
    },
  })
  assert.equal(postApiRes.status, 200)
  const postApiBody = await postApiRes.json()
  const postApiEmails = postApiBody.data.map((p) => p.email)
  assert.ok(postApiEmails.includes(postEmail), 'Post-Qiskit participants API must return Post-Qiskit record')
  for (const preEmail of Object.values(preEmails)) {
    assert.ok(!postApiEmails.includes(preEmail), `Post-Qiskit participants API must NOT return Pre-Qiskit record: ${preEmail}`)
  }
})

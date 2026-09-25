const assert = require('node:assert/strict')
const { test, before, after } = require('node:test')
const http = require('node:http')
const jwt = require('jsonwebtoken')
const app = require('../src/app')
const { pool } = require('../src/config/database')
const { initializeDatabase } = require('../src/config/database-init')

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

let savedConfig = null

before(async () => {
  await initializeDatabase()
  server = http.createServer(app)
  await new Promise((resolve) => server.listen(0, resolve))
  const port = server.address().port
  baseUrl = `http://127.0.0.1:${port}`
  organizerToken = generateOrganizerToken()

  const current = await pool.query('SELECT * FROM post_qiskit_config ORDER BY id ASC LIMIT 1')
  savedConfig = current.rows[0] || null

  await pool.query(`
    UPDATE post_qiskit_config
    SET enabled = FALSE, registration_open = FALSE
    WHERE id = (SELECT id FROM post_qiskit_config ORDER BY id ASC LIMIT 1)
  `)
})

after(async () => {
  if (savedConfig) {
    await pool.query(`
      UPDATE post_qiskit_config
      SET enabled = $1, registration_open = $2
      WHERE id = $3
    `, [savedConfig.enabled, savedConfig.registration_open, savedConfig.id])
  }

  if (server) {
    await new Promise((resolve) => server.close(resolve))
  }
})

test('1. Public status returns registration_open = false and registration_status = CLOSED initially', async () => {
  const res = await fetch(`${baseUrl}/api/v1/post-event/status`)
  assert.equal(res.status, 200)
  const data = await res.json()
  assert.equal(data.success, true)
  assert.equal(data.data.registration_open, false)
  assert.equal(data.data.registration_status, 'CLOSED')
})

test('2. Unauthorized user cannot open or close Post-Qiskit registration', async () => {
  const openRes = await fetch(`${baseUrl}/api/v1/post-event/registration/open`, { method: 'POST' })
  assert.equal(openRes.status, 401)

  const closeRes = await fetch(`${baseUrl}/api/v1/post-event/registration/close`, { method: 'POST' })
  assert.equal(closeRes.status, 401)
})

test('3. Organizer can open registration independently from event activation', async () => {
  const openRes = await fetch(`${baseUrl}/api/v1/post-event/registration/open`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${organizerToken}` },
  })
  assert.equal(openRes.status, 200)
  const openData = await openRes.json()
  assert.equal(openData.success, true)
  assert.equal(openData.data.registration_open, true)

  // Verify persistence via GET /post-event/config
  const configRes = await fetch(`${baseUrl}/api/v1/post-event/config`, {
    headers: { Authorization: `Bearer ${organizerToken}` },
  })
  assert.equal(configRes.status, 200)
  const configData = await configRes.json()
  assert.equal(configData.data.registration_open, true)
})

test('4. Organizer can close registration independently', async () => {
  const closeRes = await fetch(`${baseUrl}/api/v1/post-event/registration/close`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${organizerToken}` },
  })
  assert.equal(closeRes.status, 200)
  const closeData = await closeRes.json()
  assert.equal(closeData.success, true)
  assert.equal(closeData.data.registration_open, false)
  assert.equal(closeData.data.registration_status, 'CLOSED')
})

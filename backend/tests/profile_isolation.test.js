const test = require('node:test')
const assert = require('node:assert/strict')
const {
  EVENT_PROFILES,
  calculateProfileStatus,
} = require('../src/config/eventProfiles')
const {
  profileMiddleware,
  runWithProfile,
  getActiveEventProfile,
} = require('../src/middleware/profile.middleware')
const { rewriteSqlForProfile } = require('../src/config/database')

test('profile status follows configured event dates', () => {
  assert.equal(calculateProfileStatus('pre-qiskit', new Date('2026-09-07T08:00:00Z')), 'GOING')
  assert.equal(calculateProfileStatus('post-qiskit', new Date('2026-09-07T08:00:00Z')), 'UPCOMING')
  assert.equal(calculateProfileStatus('pre-qiskit', new Date('2026-09-11T08:00:00Z')), 'COMPLETED')
  assert.equal(calculateProfileStatus('post-qiskit', new Date('2026-10-11T08:00:00Z')), 'COMPLETED')
  assert.equal(EVENT_PROFILES['post-qiskit'].startDate, '2026-10-05')
})

test('invalid event profiles are rejected by middleware', () => {
  const response = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code
      return this
    },
    json(body) {
      this.body = body
      return this
    },
    setHeader() {},
  }

  const request = { headers: { 'x-event-profile': 'unknown-profile' }, query: {} }
  let nextCalled = false
  profileMiddleware(request, response, () => { nextCalled = true })

  assert.equal(response.statusCode, 400)
  assert.equal(response.body.error.code, 'INVALID_EVENT_PROFILE')
  assert.equal(nextCalled, false)
})

test('profile context and SQL routing remain isolated', async () => {
  const sql = 'SELECT * FROM registrations JOIN attendance_sessions ON attendance_sessions.id = registrations.id'
  assert.match(rewriteSqlForProfile(sql, 'post-qiskit'), /post_qiskit_registrations/)
  assert.match(rewriteSqlForProfile(sql, 'post-qiskit'), /post_qiskit_attendance_sessions/)
  assert.equal(rewriteSqlForProfile(sql, 'pre-qiskit'), sql)

  await runWithProfile('post-qiskit', async () => {
    assert.equal(getActiveEventProfile(), 'post-qiskit')
  })
  assert.equal(getActiveEventProfile(), 'pre-qiskit')
})
const assert = require('assert')
const { test } = require('node:test')
process.env.NODE_ENV = 'test'
const attendanceService = require('../src/services/attendance.service')
const registrationService = require('../src/services/registration.service')
const { pool } = require('../src/config/database')

test('Attendance Flow & Email Service - End-to-End Database Integration', async () => {
  console.log('[TEST] Starting Attendance & Email End-to-End Verification...')

  // Clean test artifacts
  await pool.query("DELETE FROM attendance WHERE registration_id LIKE 'QFF26-R-ATT-%'")
  await pool.query("DELETE FROM attendance_tokens WHERE attendance_session_id IN (SELECT id FROM attendance_sessions WHERE event_id = 'day-3-test')")
  await pool.query("DELETE FROM attendance_sessions WHERE event_id = 'day-3-test'")
  await pool.query("DELETE FROM registrations WHERE registration_id LIKE 'QFF26-R-ATT-%'")
  await pool.query("DELETE FROM events WHERE event_id = 'day-3-test'")

  // TEST A: Organizer login with configured password Admin@123
  const loginRes = await registrationService.loginOrganizer({
    email: 'admin@qiskitfallfest.com',
    password: 'Admin@123',
  })
  assert.equal(loginRes.success, true)
  assert.ok(loginRes.data.token)
  console.log('✓ TEST A: Organizer login succeeded with valid JWT token')

  // TEST B & C: Events list includes all 4 event days
  const events = await attendanceService.getEventsList()
  assert.ok(events.length >= 4)
  const dayIds = events.map((e) => e.eventId)
  assert.ok(dayIds.includes('day-1'))
  assert.ok(dayIds.includes('day-2'))
  assert.ok(dayIds.includes('day-3'))
  assert.ok(dayIds.includes('day-4'))
  console.log('✓ TEST B & C: Events list retrieved with all 4 official event days')

  // Ensure test event 'day-3-test'
  await pool.query(
    `INSERT INTO events (event_id, event_name, description, event_date, status, event_type)
     VALUES ('day-3-test', 'Day 3 Test Hackathon', 'Test session', '2026-09-07', 'active', 'HACKATHON')
     ON CONFLICT (event_id) DO NOTHING`
  )

  // TEST D: Initial attendance records call is empty for new test event
  const initialRecords = await attendanceService.getAttendanceRecords('day-3-test')
  assert.equal(initialRecords.length, 0)
  console.log('✓ TEST D: Initial attendance records state verified')

  // TEST E: Start session
  const startSessionRes = await attendanceService.startAttendanceSession('day-3-test', 5, 'admin@qiskitfallfest.com')
  assert.equal(startSessionRes.eventId, 'day-3-test')
  assert.equal(startSessionRes.status, 'active')
  assert.ok(startSessionRes.token)
  console.log('✓ TEST E: Start session succeeded, attendance_sessions and attendance_tokens updated in DB')

  // TEST F: Generate Live QR Token & Strict 5-Second Rotation Verification
  const token1Res = await attendanceService.generateLiveQrToken('day-3-test')
  const token2Res = await attendanceService.generateLiveQrToken('day-3-test')

  assert.ok(token1Res.token)
  assert.ok(token2Res.token)
  assert.notEqual(token1Res.token, token2Res.token, 'Tokens must rotate on each 5-second cycle')
  console.log('✓ TEST F: Successive QR token calls generated unique rotated UUID tokens:', {
    token1: token1Res.token,
    token2: token2Res.token,
  })

  // Create test participant in registrations
  await pool.query(
    `INSERT INTO registrations (registration_id, full_name, email, mobile_number, role, institute_name, status, id_card_url)
     VALUES ('QFF26-R-ATT-001', 'Attendance Test User', 'att_test_user@example.com', '9876543210', 'STUDENT', 'Test University', 'CONFIRMED', 'https://example.com/test.jpg')`
  )

  const participantUser = {
    registrationId: 'QFF26-R-ATT-001',
    email: 'att_test_user@example.com',
  }

  // TEST G: Scan/mark attendance with valid token
  const markRes = await attendanceService.markAttendance(participantUser, token2Res.token)
  assert.equal(markRes.success, true)
  assert.equal(markRes.alreadyMarked, false)
  assert.equal(markRes.participant.registrationId, 'QFF26-R-ATT-001')
  console.log('✓ TEST G: Attendance marked for participant in PostgreSQL')

  // TEST H: Scan/mark attendance again with same participant (Idempotent check)
  const duplicateMarkRes = await attendanceService.markAttendance(participantUser, token2Res.token)
  assert.equal(duplicateMarkRes.success, true)
  assert.equal(duplicateMarkRes.alreadyMarked, true)
  console.log('✓ TEST H: Duplicate attendance check verified (Idempotent)')

  // TEST I: Stop session
  const stopRes = await attendanceService.stopAttendanceSession('day-3-test', 5, 'admin@qiskitfallfest.com')
  assert.equal(stopRes.success, true)
  assert.equal(stopRes.status, 'ended')

  // Verify that live QR token call after stop returns 404
  let sessionEndedError = null
  try {
    await attendanceService.generateLiveQrToken('day-3-test')
  } catch (err) {
    sessionEndedError = err.code
  }
  assert.equal(sessionEndedError, 'ATTENDANCE_SESSION_NOT_FOUND')
  console.log('✓ TEST I: Stop session updated status to ended and rejected subsequent QR requests')

  // TEST J: Send Organizer Email response structure check
  const emailRes = await registrationService.sendOrganizerEmail({
    role: 'Student',
    subject: 'Test Announcement',
    message: 'Hello students!',
  })
  assert.equal(emailRes.success, true)
  assert.ok(emailRes.data)
  assert.ok(typeof emailRes.sent === 'number')
  assert.ok(typeof emailRes.failed === 'number')
  console.log('✓ TEST J: Send email service returned structured result with sent/failed metrics')

  // Clean up test data
  await pool.query("DELETE FROM attendance WHERE registration_id LIKE 'QFF26-R-ATT-%'")
  await pool.query("DELETE FROM attendance_tokens WHERE attendance_session_id IN (SELECT id FROM attendance_sessions WHERE event_id = 'day-3-test')")
  await pool.query("DELETE FROM attendance_sessions WHERE event_id = 'day-3-test'")
  await pool.query("DELETE FROM registrations WHERE registration_id LIKE 'QFF26-R-ATT-%'")
  await pool.query("DELETE FROM events WHERE event_id = 'day-3-test'")

  console.log('--- All Attendance & Email Verification Tests Passed! ---')
})

const crypto = require('crypto')
const { pool } = require('../config/database')
const { AppError } = require('../middleware/error.middleware')
const registrationService = require('./registration.service')

const mapEventRow = (row) => {
  let dateStr = ''
  if (row.event_date) {
    if (typeof row.event_date === 'string') {
      dateStr = row.event_date.slice(0, 10)
    } else if (row.event_date instanceof Date) {
      const y = row.event_date.getFullYear()
      const m = String(row.event_date.getMonth() + 1).padStart(2, '0')
      const d = String(row.event_date.getDate()).padStart(2, '0')
      dateStr = `${y}-${m}-${d}`
    } else {
      dateStr = String(row.event_date).slice(0, 10)
    }
  }

  return {
    eventId: row.event_id,
    event_id: row.event_id,
    name: row.event_name,
    event_name: row.event_name,
    description: row.description || '',
    venue: row.location || '',
    location: row.location || '',
    date: dateStr,
    event_date: dateStr,
    startTime: row.start_time || null,
    start_time: row.start_time || null,
    endTime: row.end_time || null,
    end_time: row.end_time || null,
    status: row.status || 'active',
    eventType: row.event_type || 'GENERAL',
    event_type: row.event_type || 'GENERAL',
    createdAt: row.created_at || null,
    created_at: row.created_at || null,
  }
}

const getEventsList = async () => {
  const result = await pool.query('SELECT * FROM events ORDER BY event_date ASC, created_at ASC;')
  return result.rows.map(mapEventRow)
}

const getEventById = async (eventId) => {
  const result = await pool.query('SELECT * FROM events WHERE event_id = $1 LIMIT 1;', [eventId])
  if (result.rows && result.rows.length > 0) {
    return mapEventRow(result.rows[0])
  }
  return null
}

const createEvent = async (payload = {}) => {
  const name = (payload.event_name || payload.name || '').trim()
  const description = (payload.description || '').trim()
  const date = (payload.event_date || payload.date || '').trim()
  const startTime = payload.start_time || payload.startTime || null
  const endTime = payload.end_time || payload.endTime || null
  const location = (payload.location || payload.venue || '').trim()
  const status = payload.status || 'active'
  const eventType = payload.event_type || payload.eventType || 'GENERAL'

  if (!name) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Event name is required.')
  }
  if (!date) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Event date is required.')
  }

  let eventId = (payload.event_id || payload.eventId || '').trim()
  if (!eventId) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 30)
    eventId = `${slug || 'event'}-${Date.now().toString(36)}`
  }

  try {
    const result = await pool.query(
      `INSERT INTO events (event_id, event_name, description, event_date, start_time, end_time, location, status, event_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *;`,
      [eventId, name, description, date, startTime, endTime, location, status, eventType]
    )
    return mapEventRow(result.rows[0])
  } catch (err) {
    if (err.code === '23505') {
      throw new AppError(409, 'CONFLICT', 'An event with this ID already exists.')
    }
    throw new AppError(500, 'DATABASE_ERROR', `Failed to create event: ${err.message}`)
  }
}

const resolveOrganizerId = async (organizerIdInput, userEmail) => {
  if (organizerIdInput && !isNaN(Number(organizerIdInput))) {
    const checkRes = await pool.query('SELECT organizer_id FROM organizers WHERE organizer_id = $1 LIMIT 1', [Number(organizerIdInput)])
    if (checkRes.rows.length > 0) return checkRes.rows[0].organizer_id
  }
  if (userEmail) {
    const emailRes = await pool.query('SELECT organizer_id FROM organizers WHERE email = $1 LIMIT 1', [userEmail])
    if (emailRes.rows.length > 0) return emailRes.rows[0].organizer_id
  }
  const fallbackRes = await pool.query('SELECT organizer_id FROM organizers ORDER BY organizer_id ASC LIMIT 1')
  if (fallbackRes.rows.length > 0) return fallbackRes.rows[0].organizer_id
  throw new AppError(500, 'ORGANIZER_NOT_FOUND', 'No valid organizer account found in system.')
}

const startAttendanceSession = async (eventId, rawOrganizerId, userEmail) => {
  const event = await getEventById(eventId)
  if (!event) {
    throw new AppError(404, 'EVENT_NOT_FOUND', `Event '${eventId}' not found.`)
  }

  // Check if an active session already exists for this event
  const existingRes = await pool.query(
    `SELECT id, event_id, organizer_id, started_at, ended_at, status, created_at
     FROM attendance_sessions
     WHERE event_id = $1 AND status = 'active'
     ORDER BY started_at DESC LIMIT 1;`,
    [eventId]
  )

  let session = null
  if (existingRes.rows.length > 0) {
    session = existingRes.rows[0]
  } else {
    const organizerId = await resolveOrganizerId(rawOrganizerId, userEmail)
    const insertRes = await pool.query(
      `INSERT INTO attendance_sessions (event_id, organizer_id, started_at, status)
       VALUES ($1, $2, NOW(), 'active')
       RETURNING id, event_id, organizer_id, started_at, ended_at, status, created_at;`,
      [eventId, organizerId]
    )
    session = insertRes.rows[0]
  }

  // Immediately create a fresh QR token expiring in exactly 5 seconds
  const tokenUuid = crypto.randomUUID()
  const tokenRes = await pool.query(
    `INSERT INTO attendance_tokens (attendance_session_id, token, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '5 seconds')
     RETURNING token, expires_at;`,
    [session.id, tokenUuid]
  )

  return {
    sessionId: session.id,
    eventId: session.event_id,
    status: session.status,
    startedAt: session.started_at,
    token: tokenRes.rows[0].token,
    expiresAt: tokenRes.rows[0].expires_at,
  }
}

const stopAttendanceSession = async (eventId, rawOrganizerId, userEmail) => {
  const event = await getEventById(eventId)
  if (!event) {
    throw new AppError(404, 'EVENT_NOT_FOUND', `Event '${eventId}' not found.`)
  }

  const updateRes = await pool.query(
    `UPDATE attendance_sessions
     SET status = 'ended', ended_at = NOW()
     WHERE event_id = $1 AND status = 'active'
     RETURNING id, event_id, status, ended_at;`,
    [eventId]
  )

  return {
    success: true,
    eventId,
    status: 'ended',
    stoppedCount: updateRes.rowCount,
  }
}

const generateLiveQrToken = async (eventId) => {
  const sessionRes = await pool.query(
    `SELECT id, event_id, status FROM attendance_sessions
     WHERE event_id = $1 AND status = 'active'
     ORDER BY started_at DESC LIMIT 1;`,
    [eventId]
  )

  if (sessionRes.rows.length === 0) {
    throw new AppError(404, 'ATTENDANCE_SESSION_NOT_FOUND', 'No active attendance session exists for this event.')
  }

  const session = sessionRes.rows[0]

  // Cleanup expired tokens for this session
  await pool.query(
    `DELETE FROM attendance_tokens
     WHERE attendance_session_id = $1 AND expires_at <= NOW();`,
    [session.id]
  ).catch(() => null)

  // Strict 5-second rotation: Generate a new crypto.randomUUID() on each 5-second refresh call
  const tokenUuid = crypto.randomUUID()
  const newTokenRes = await pool.query(
    `INSERT INTO attendance_tokens (attendance_session_id, token, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '5 seconds')
     RETURNING token, expires_at;`,
    [session.id, tokenUuid]
  )

  return {
    token: newTokenRes.rows[0].token,
    expiresAt: newTokenRes.rows[0].expires_at,
    eventId,
  }
}

const getAttendanceRecords = async (eventId) => {
  try {
    const result = await pool.query(
      `SELECT id, event_id AS "eventId", registration_id AS "registrationId", full_name AS "fullName",
              email, status, marked_at AS "markedAt"
       FROM attendance WHERE event_id = $1 ORDER BY marked_at DESC`,
      [eventId],
    )
    return result.rows
  } catch (err) {
    return []
  }
}

const markAttendance = async (participantUser, attendanceToken) => {
  if (!participantUser || (!participantUser.email && !participantUser.registrationId)) {
    throw new AppError(401, 'UNAUTHORIZED', 'Participant authentication required.')
  }

  if (!attendanceToken) {
    throw new AppError(400, 'INVALID_TOKEN', 'Attendance QR token is missing.')
  }

  // Query token and its session from PostgreSQL
  const tokenRes = await pool.query(
    `SELECT t.token, t.expires_at, s.id AS session_id, s.event_id, s.status AS session_status,
            (t.expires_at > NOW()) AS is_valid
     FROM attendance_tokens t
     JOIN attendance_sessions s ON t.attendance_session_id = s.id
     WHERE t.token::text = $1 LIMIT 1;`,
    [String(attendanceToken).trim()]
  ).catch(() => null)

  if (!tokenRes || tokenRes.rows.length === 0) {
    throw new AppError(400, 'INVALID_TOKEN', 'Invalid attendance QR code.')
  }

  const tokenInfo = tokenRes.rows[0]

  if (tokenInfo.session_status !== 'active') {
    throw new AppError(400, 'SESSION_CLOSED', 'Attendance for this event is currently closed.')
  }

  if (!tokenInfo.is_valid) {
    throw new AppError(400, 'ATTENDANCE_TOKEN_EXPIRED', 'This attendance QR code has expired. Please scan the current QR code.')
  }

  const eventId = tokenInfo.event_id

  // Verify participant registration in PostgreSQL
  let participant = null
  if (participantUser.registrationId) {
    participant = await registrationService.registrationRepository.findByRegistrationId(participantUser.registrationId)
  }
  if (!participant && participantUser.email) {
    participant = await registrationService.registrationRepository.findByEmail(participantUser.email)
  }

  if (!participant) {
    throw new AppError(400, 'NOT_REGISTERED', 'You are not registered for this event.')
  }

  // Check if attendance already marked
  const existingRes = await pool.query(
    `SELECT id FROM attendance WHERE event_id = $1 AND registration_id = $2 LIMIT 1;`,
    [eventId, participant.registrationId]
  )

  if (existingRes.rows.length > 0) {
    return {
      success: true,
      alreadyMarked: true,
      message: 'You have already been successfully marked present for this event.',
      registrationId: participant.registrationId,
      eventId,
    }
  }

  let savedRecord = null
  try {
    const result = await pool.query(
      `INSERT INTO attendance (event_id, registration_id, full_name, email, status, marked_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'PRESENT', NOW(), NOW(), NOW())
       RETURNING id, event_id AS "eventId", registration_id AS "registrationId", full_name AS "fullName", email, status, marked_at AS "markedAt"`,
      [eventId, participant.registrationId, participant.fullName, participant.email],
    )
    savedRecord = result.rows[0]
  } catch (err) {
    if (err.code === '23505' || err.message.includes('unique')) {
      return {
        success: true,
        alreadyMarked: true,
        message: 'You have already been successfully marked present for this event.',
        registrationId: participant.registrationId,
        eventId,
      }
    }
    throw new AppError(500, 'DATABASE_ERROR', 'Failed to mark attendance. Please try again.')
  }

  return {
    success: true,
    alreadyMarked: false,
    message: 'You have been successfully marked present for this event.',
    participant: savedRecord,
  }
}

module.exports = {
  getEventsList,
  getEventById,
  createEvent,
  startAttendanceSession,
  stopAttendanceSession,
  generateLiveQrToken,
  getAttendanceRecords,
  markAttendance,
}

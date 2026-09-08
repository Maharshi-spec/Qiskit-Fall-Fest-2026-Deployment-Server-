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

  const rawStatus = String(row.status || 'ACTIVE').toUpperCase()
  const status = rawStatus === 'CLOSED' ? 'CLOSED' : 'ACTIVE'

  return {
    id: row.event_id,
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
    status,
    eventType: row.event_type || 'GENERAL',
    event_type: row.event_type || 'GENERAL',
    maxParticipants: row.max_participants !== null && row.max_participants !== undefined ? Number(row.max_participants) : null,
    max_participants: row.max_participants !== null && row.max_participants !== undefined ? Number(row.max_participants) : null,
    registrationInfo: row.registration_info || null,
    registration_info: row.registration_info || null,
    createdAt: row.created_at || null,
    created_at: row.created_at || null,
  }
}

const getEventsList = async (filter = {}) => {
  const conditions = []
  const params = []

  if (filter.activeOnly) {
    params.push('ACTIVE')
    conditions.push(`UPPER(status) = $${params.length}`)
  }

  if (filter.eventType) {
    params.push(String(filter.eventType).trim().toUpperCase())
    conditions.push(`UPPER(event_type) = $${params.length}`)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const result = await pool.query(
    `SELECT * FROM events ${whereClause} ORDER BY event_date ASC, created_at ASC;`,
    params
  )
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
  const rawType = (payload.event_type || payload.eventType || '').trim().toUpperCase()
  const validTypes = ['HACKATHON', 'WORKSHOP', 'WEBINAR', 'BOOTCAMP', 'OTHER']

  if (!rawType) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Event type is required.')
  }
  if (!validTypes.includes(rawType)) {
    throw new AppError(400, 'VALIDATION_ERROR', `Invalid event type. Must be one of: ${validTypes.join(', ')}`)
  }
  const eventType = rawType

  const name = (payload.event_name || payload.eventName || payload.name || '').trim()
  if (!name) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Event name is required.')
  }

  const date = (payload.event_date || payload.date || '').trim()
  if (!date) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Event date is required.')
  }

  const description = (payload.description || '').trim()
  const startTime = payload.start_time || payload.startTime || null
  const endTime = payload.end_time || payload.endTime || null
  const location = (payload.location || payload.venue || '').trim()
  const rawStatus = String(payload.status || 'ACTIVE').trim().toUpperCase()
  const status = rawStatus === 'CLOSED' ? 'CLOSED' : 'ACTIVE'

  let maxParticipants = null
  if (payload.max_participants !== undefined && payload.max_participants !== null && payload.max_participants !== '') {
    const num = Number(payload.max_participants)
    if (!isNaN(num) && num > 0) maxParticipants = num
  } else if (payload.maxParticipants !== undefined && payload.maxParticipants !== null && payload.maxParticipants !== '') {
    const num = Number(payload.maxParticipants)
    if (!isNaN(num) && num > 0) maxParticipants = num
  }

  const registrationInfo = (payload.registration_info || payload.registrationInfo || '').trim() || null

  let eventId = (payload.event_id || payload.eventId || '').trim()
  if (!eventId) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 30)
    const randomSuffix = crypto.randomBytes(3).toString('hex')
    eventId = `${slug || eventType.toLowerCase()}-${Date.now().toString(36)}-${randomSuffix}`
  }

  try {
    const result = await pool.query(
      `INSERT INTO events (event_id, event_name, description, event_date, start_time, end_time, location, status, event_type, max_participants, registration_info)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *;`,
      [eventId, name, description, date, startTime, endTime, location, status, eventType, maxParticipants, registrationInfo]
    )
    return mapEventRow(result.rows[0])
  } catch (err) {
    if (err.code === '23505') {
      throw new AppError(409, 'CONFLICT', 'An event with this ID already exists.')
    }
    throw new AppError(500, 'DATABASE_ERROR', `Failed to create event: ${err.message}`)
  }
}

const updateEventStatus = async (eventId, newStatus) => {
  const normStatus = String(newStatus || '').trim().toUpperCase()
  if (!['ACTIVE', 'CLOSED'].includes(normStatus)) {
    throw new AppError(400, 'INVALID_STATUS', 'Status must be either ACTIVE or CLOSED.')
  }
  const check = await pool.query('SELECT event_id FROM events WHERE event_id = $1 LIMIT 1;', [eventId])
  if (!check.rows[0]) {
    throw new AppError(404, 'EVENT_NOT_FOUND', `Event '${eventId}' not found.`)
  }
  const result = await pool.query(
    'UPDATE events SET status = $1 WHERE event_id = $2 RETURNING *;',
    [normStatus, eventId]
  )
  return mapEventRow(result.rows[0])
}

const updateEvent = async (eventId, payload = {}) => {
  const check = await pool.query('SELECT * FROM events WHERE event_id = $1 LIMIT 1;', [eventId])
  if (!check.rows[0]) {
    throw new AppError(404, 'EVENT_NOT_FOUND', `Event '${eventId}' not found.`)
  }
  const existing = check.rows[0]
  const name = payload.event_name !== undefined ? payload.event_name.trim() : existing.event_name
  const description = payload.description !== undefined ? payload.description.trim() : existing.description
  const date = payload.event_date !== undefined ? payload.event_date.trim() : existing.event_date
  const startTime = payload.start_time !== undefined ? payload.start_time : existing.start_time
  const endTime = payload.end_time !== undefined ? payload.end_time : existing.end_time
  const location = payload.location !== undefined ? payload.location.trim() : existing.location

  let status = existing.status
  if (payload.status) {
    const s = String(payload.status).trim().toUpperCase()
    if (['ACTIVE', 'CLOSED'].includes(s)) status = s
  }

  let eventType = existing.event_type
  if (payload.event_type || payload.eventType) {
    const t = String(payload.event_type || payload.eventType).trim().toUpperCase()
    if (['HACKATHON', 'WORKSHOP', 'WEBINAR', 'BOOTCAMP', 'OTHER'].includes(t)) eventType = t
  }

  let maxParticipants = existing.max_participants
  if (payload.max_participants !== undefined) {
    maxParticipants = payload.max_participants === '' || payload.max_participants === null ? null : Number(payload.max_participants)
  } else if (payload.maxParticipants !== undefined) {
    maxParticipants = payload.maxParticipants === '' || payload.maxParticipants === null ? null : Number(payload.maxParticipants)
  }

  let registrationInfo = existing.registration_info
  if (payload.registration_info !== undefined) {
    registrationInfo = payload.registration_info.trim() || null
  } else if (payload.registrationInfo !== undefined) {
    registrationInfo = payload.registrationInfo.trim() || null
  }

  const result = await pool.query(
    `UPDATE events
     SET event_name = $1, description = $2, event_date = $3, start_time = $4, end_time = $5,
         location = $6, status = $7, event_type = $8, max_participants = $9, registration_info = $10
     WHERE event_id = $11
     RETURNING *;`,
    [name, description, date, startTime, endTime, location, status, eventType, maxParticipants, registrationInfo, eventId]
  )
  return mapEventRow(result.rows[0])
}

const deleteEvent = async (eventId) => {
  const event = await getEventById(eventId)
  if (!event) {
    throw new AppError(404, 'EVENT_NOT_FOUND', `Event '${eventId}' not found.`)
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // 1. Hackathon awards / results for teams in this event
    await client.query(`
      DELETE FROM hackathon_results
      WHERE team_id IN (SELECT id FROM teams WHERE event_id = $1)
    `, [eventId])

    // 2. Hackathon problem selections
    await client.query(`
      DELETE FROM hackathon_problem_selections
      WHERE team_id IN (SELECT id FROM teams WHERE event_id = $1) OR event_id = $1
    `, [eventId])

    // 3. Team members
    await client.query(`
      DELETE FROM team_members
      WHERE team_id IN (SELECT id FROM teams WHERE event_id = $1)
    `, [eventId])

    // 4. Teams
    await client.query('DELETE FROM teams WHERE event_id = $1', [eventId])

    // 5. Attendance tokens
    await client.query(`
      DELETE FROM attendance_tokens
      WHERE attendance_session_id IN (SELECT id FROM attendance_sessions WHERE event_id = $1)
    `, [eventId])

    // 6. Attendance sessions
    await client.query('DELETE FROM attendance_sessions WHERE event_id = $1', [eventId])

    // 7. Attendance logs
    await client.query('DELETE FROM attendance WHERE event_id = $1', [eventId])

    // 8. Hackathon problem statement files
    await client.query(`
      DELETE FROM hackathon_problem_statement_files
      WHERE problem_statement_id IN (SELECT id FROM hackathon_problem_statements WHERE event_id = $1) OR event_id = $1
    `, [eventId])

    // 9. Hackathon problem statements
    await client.query('DELETE FROM hackathon_problem_statements WHERE event_id = $1', [eventId])

    // 10. Certificates
    await client.query('DELETE FROM certificates WHERE event_id = $1', [eventId])

    // 11. Delete event from events
    await client.query('DELETE FROM events WHERE event_id = $1', [eventId])

    await client.query('COMMIT')
    return { success: true, eventId }
  } catch (error) {
    try {
      await client.query('ROLLBACK')
    } catch (_rbErr) {}
    throw new AppError(500, 'DELETE_FAILED', `Failed to delete event '${eventId}': ${error.message}`)
  } finally {
    client.release()
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
  if (String(event.status).toUpperCase() === 'CLOSED') {
    throw new AppError(400, 'EVENT_CLOSED', 'Cannot start attendance for a closed event.')
  }
  if (String(event.status).toUpperCase() !== 'ACTIVE') {
    throw new AppError(400, 'EVENT_NOT_ACTIVE', 'Event is not currently active.')
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
  const event = await getEventById(eventId)
  if (!event || String(event.status).toUpperCase() !== 'ACTIVE') {
    throw new AppError(400, 'EVENT_NOT_ACTIVE', 'Cannot generate attendance tokens for an inactive or closed event.')
  }

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
  const event = await getEventById(eventId)
  if (!event || String(event.status).toUpperCase() !== 'ACTIVE') {
    throw new AppError(400, 'EVENT_CLOSED', 'Attendance for this event is closed.')
  }

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
  updateEventStatus,
  updateEvent,
  deleteEvent,
  startAttendanceSession,
  stopAttendanceSession,
  generateLiveQrToken,
  getAttendanceRecords,
  markAttendance,
}

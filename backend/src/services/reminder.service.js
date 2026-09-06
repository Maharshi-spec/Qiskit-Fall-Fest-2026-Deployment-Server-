const { DateTime } = require('luxon')
const { pool } = require('../config/database')
const { AppError } = require('../middleware/error.middleware')
const { eventTimezone, eventReminderTime } = require('../config/env')

const EVENT_DAYS = [
  { dayNumber: 1, eventDate: '2026-09-07' },
  { dayNumber: 2, eventDate: '2026-09-08' },
  { dayNumber: 3, eventDate: '2026-09-09' },
  { dayNumber: 4, eventDate: '2026-09-10' },
]

const getReminderConfiguration = () => {
  if (!eventTimezone || !eventReminderTime) {
    throw new AppError(503, 'REMINDER_CONFIGURATION_INCOMPLETE', 'EVENT_TIMEZONE and EVENT_REMINDER_TIME must be configured.')
  }

  const parsedTime = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(eventReminderTime)
  if (!parsedTime || !DateTime.now().setZone(eventTimezone).isValid) {
    throw new AppError(503, 'REMINDER_CONFIGURATION_INVALID', 'EVENT_TIMEZONE or EVENT_REMINDER_TIME is invalid.')
  }

  return { timezone: eventTimezone, reminderTime: eventReminderTime }
}

const getScheduledAt = (eventDate) => {
  const { timezone, reminderTime } = getReminderConfiguration()
  const scheduled = DateTime.fromISO(`${eventDate}T${reminderTime}`, { zone: timezone })
  if (!scheduled.isValid) {
    throw new AppError(503, 'REMINDER_CONFIGURATION_INVALID', `Unable to schedule reminder for ${eventDate}.`)
  }
  return scheduled.toUTC().toJSDate()
}

const scheduleRegistrationReminders = async (registration) => {
  if (!pool) throw new AppError(503, 'DATABASE_UNAVAILABLE', 'Reminder storage is unavailable.')

  const values = []
  const placeholders = EVENT_DAYS.map((day, index) => {
    const offset = index * 4
    values.push(registration.registrationId, day.dayNumber, day.eventDate, getScheduledAt(day.eventDate))
    return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, 'PENDING')`
  })

  const result = await pool.query(
    `INSERT INTO event_reminders (registration_id, day_number, event_date, scheduled_at, status)
     VALUES ${placeholders.join(', ')}
     ON CONFLICT (registration_id, day_number) DO NOTHING
     RETURNING id, registration_id AS "registrationId", day_number AS "dayNumber", event_date AS "eventDate", scheduled_at AS "scheduledAt", status`,
    values,
  )

  return result.rows
}

const claimDueReminder = async (excludedIds = []) => {
  const result = await pool.query(
    `WITH candidate AS (
       SELECT id
       FROM event_reminders
       WHERE status = 'PENDING' AND scheduled_at <= NOW() AND NOT (id = ANY($1::bigint[]))
       ORDER BY scheduled_at, id
       FOR UPDATE SKIP LOCKED
       LIMIT 1
    )
     UPDATE event_reminders reminder
     SET status = 'PROCESSING', updated_at = NOW(), last_error = NULL
     FROM candidate
     WHERE reminder.id = candidate.id
     RETURNING reminder.id, reminder.registration_id AS "registrationId", reminder.day_number AS "dayNumber",
       reminder.event_date AS "eventDate", reminder.scheduled_at AS "scheduledAt"`,
     [excludedIds],
  )
  return result.rows[0] || null
}

const markReminderSent = async (reminderId) => {
  await pool.query(
    `UPDATE event_reminders
     SET status = 'SENT', sent_at = NOW(), updated_at = NOW(), last_error = NULL
     WHERE id = $1 AND status = 'PROCESSING'`,
    [reminderId],
  )
}

const markReminderFailed = async (reminderId, error) => {
  await pool.query(
    `UPDATE event_reminders
     SET status = 'PENDING', last_error = $2, updated_at = NOW()
     WHERE id = $1 AND status = 'PROCESSING'`,
    [reminderId, String(error.message || error).slice(0, 2000)],
  )
}

const normalizeReminderEventDate = (eventDate) => {
  if (eventDate === null || eventDate === undefined || eventDate === '') {
    return null
  }

  if (eventDate instanceof Date) {
    return DateTime.fromJSDate(eventDate, { zone: eventTimezone })
  }

  if (typeof eventDate === 'string') {
    const trimmed = eventDate.trim()
    if (!trimmed) return null

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return DateTime.fromISO(trimmed, { zone: eventTimezone, setZone: true })
    }

    return DateTime.fromISO(trimmed, { zone: eventTimezone })
  }

  return DateTime.fromJSDate(new Date(String(eventDate)), { zone: eventTimezone })
}

const formatReminderDateLabel = (eventDate) => {
  const safeDate = normalizeReminderEventDate(eventDate)
  if (!safeDate || !safeDate.isValid) {
    return 'Invalid DateTime'
  }

  return safeDate.setZone(eventTimezone).toFormat('cccc, LLLL d, yyyy')
}

const buildReminderEmail = (registration, reminder) => {
  const dateLabel = formatReminderDateLabel(reminder.eventDate)
  const fullName = registration && registration.fullName ? registration.fullName : 'Participant'

  return {
    to: registration.email,
    subject: `Qiskit Fall Fest 2026 - Day ${reminder.dayNumber} Reminder`,
    text: `Hello ${fullName},\n\nThis is your reminder for Day ${reminder.dayNumber} of Qiskit Fall Fest 2026 on ${dateLabel}.\nPlease check the final schedule and venue details shared by the organizers.`,
    html: `<div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#303030"><h2 style="color:#d14b9b">Qiskit Fall Fest 2026</h2><h1>Day ${reminder.dayNumber} Reminder</h1><p>Hello ${fullName},</p><p>This is your reminder for Day ${reminder.dayNumber} of Qiskit Fall Fest 2026 on <strong>${dateLabel}</strong>.</p><p>Please check the final schedule and venue details shared by the organizers.</p></div>`,
  }
}

const processDueReminders = async ({ limit = 25 } = {}) => {
  if (!pool) throw new AppError(503, 'DATABASE_UNAVAILABLE', 'Reminder storage is unavailable.')
  const { sendMail } = require('./registration.service')
  const results = []
  const claimedIds = []
  const max = Math.min(Math.max(Number(limit) || 25, 1), 100)

  await pool.query(
    `UPDATE event_reminders
     SET status = 'PENDING', updated_at = NOW(), last_error = COALESCE(last_error, 'Recovered after interrupted processing')
     WHERE status = 'PROCESSING' AND updated_at < NOW() - INTERVAL '15 minutes'`,
  )

  for (let index = 0; index < max; index += 1) {
    const reminder = await claimDueReminder(claimedIds)
    if (!reminder) break
    claimedIds.push(reminder.id)

    console.info('[REMINDER] claimed', { reminderId: reminder.id, registrationId: reminder.registrationId, dayNumber: reminder.dayNumber, scheduledAt: reminder.scheduledAt })
    try {
      const registrationResult = await pool.query(
        `SELECT registration_id AS "registrationId", full_name AS "fullName", email
         FROM registrations WHERE registration_id = $1 LIMIT 1`,
        [reminder.registrationId],
      )
      const registration = registrationResult.rows[0]
      if (!registration) throw new Error('Registration record not found.')

      await sendMail(buildReminderEmail(registration, reminder))
      await markReminderSent(reminder.id)
      console.info('[REMINDER] sent', { reminderId: reminder.id, registrationId: reminder.registrationId, dayNumber: reminder.dayNumber, scheduledAt: reminder.scheduledAt })
      results.push({ reminderId: reminder.id, status: 'SENT' })
    } catch (error) {
      await markReminderFailed(reminder.id, error)
      console.error('[REMINDER] failed', { reminderId: reminder.id, registrationId: reminder.registrationId, dayNumber: reminder.dayNumber, scheduledAt: reminder.scheduledAt, error: error.message })
      results.push({ reminderId: reminder.id, status: 'PENDING', error: error.message })
    }
  }

  return { processed: results.length, results }
}

module.exports = {
  EVENT_DAYS,
  getScheduledAt,
  scheduleRegistrationReminders,
  processDueReminders,
  buildReminderEmail,
}

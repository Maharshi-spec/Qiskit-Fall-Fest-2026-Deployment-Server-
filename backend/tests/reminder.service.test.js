process.env.EVENT_TIMEZONE = 'Asia/Kolkata'
process.env.EVENT_REMINDER_TIME = '09:30'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const test = require('node:test')
const reminderService = require('../src/services/reminder.service')
const registrationService = require('../src/services/registration.service')
const { pool } = require('../src/config/database')

const originalQuery = pool.query
const originalSendMail = registrationService.sendMail

test.afterEach(() => {
  pool.query = originalQuery
  registrationService.sendMail = originalSendMail
})

test('buildReminderEmail formats valid eventDate values and uses the participant fullName in the greeting', () => {
  const registration = { fullName: 'Jane Participant', email: 'jane@example.com' }
  const expectedDates = {
    1: ['Monday, September 7, 2026', '2026-09-07'],
    2: ['Tuesday, September 8, 2026', '2026-09-08'],
    3: ['Wednesday, September 9, 2026', '2026-09-09'],
    4: ['Thursday, September 10, 2026', '2026-09-10'],
  }

  const eventDateInputs = [
    '2026-09-07',
    '2026-09-07T00:00:00.000Z',
    new Date('2026-09-07T00:00:00.000Z'),
  ]

  for (const rawValue of eventDateInputs) {
    const email = reminderService.buildReminderEmail(registration, { dayNumber: 1, eventDate: rawValue })
    assert.match(email.text, /Hello Jane Participant,/) 
    assert.match(email.text, /Monday, September 7, 2026/) 
    assert.doesNotMatch(email.text, /Invalid DateTime/) 
  }

  for (const [dayNumber, [expectedDate, rawValue]] of Object.entries(expectedDates)) {
    const email = reminderService.buildReminderEmail(registration, { dayNumber: Number(dayNumber), eventDate: rawValue })
    assert.match(email.text, new RegExp(expectedDate))
    assert.doesNotMatch(email.text, /Invalid DateTime/)
  }
})

test('defines and schedules all four event days in the configured timezone', () => {
  assert.deepEqual(reminderService.EVENT_DAYS.map((day) => [day.dayNumber, day.eventDate]), [
    [1, '2026-09-07'],
    [2, '2026-09-08'],
    [3, '2026-09-09'],
    [4, '2026-09-10'],
  ])
  assert.equal(reminderService.getScheduledAt('2026-09-07').toISOString(), '2026-09-07T04:00:00.000Z')
})

test('creates four pending reminder records without sending email', async () => {
  let queryText = ''
  let queryValues = []
  pool.query = async (text, values) => {
    queryText = text
    queryValues = values
    return { rows: reminderService.EVENT_DAYS.map((day) => ({ id: day.dayNumber, status: 'PENDING' })) }
  }

  let sent = false
  registrationService.sendMail = async () => { sent = true }
  const result = await reminderService.scheduleRegistrationReminders({ registrationId: 'QFF26-R-TEST' })

  assert.equal(result.length, 4)
  assert.equal(queryValues.length, 16)
  assert.match(queryText, /ON CONFLICT \(registration_id, day_number\) DO NOTHING/)
  assert.equal(sent, false)
})

test('processes a due reminder and marks it SENT only after delivery', async () => {
  const queries = []
  pool.query = async (text) => {
    queries.push(text)
    if (text.includes('WITH candidate')) {
      return { rows: [{ id: 7, registrationId: 'QFF26-R-TEST', dayNumber: 1, eventDate: '2026-09-07', scheduledAt: new Date('2026-09-07T04:00:00Z') }] }
    }
    if (text.includes('FROM registrations WHERE registration_id')) {
      return { rows: [{ registrationId: 'QFF26-R-TEST', fullName: 'Test Participant', email: 'test@example.invalid' }] }
    }
    return { rows: [] }
  }
  let sentPayload
  registrationService.sendMail = async (payload) => { sentPayload = payload }

  const result = await reminderService.processDueReminders({ limit: 1 })

  assert.equal(result.results[0].status, 'SENT')
  assert.match(sentPayload.subject, /Day 1 Reminder/)
  assert.match(sentPayload.text, /September 7, 2026/)
  assert.ok(queries.some((query) => query.includes("SET status = 'SENT'")))
})

test('failed delivery returns the reminder to PENDING and does not mark it SENT', async () => {
  const queries = []
  pool.query = async (text) => {
    queries.push(text)
    if (text.includes('WITH candidate')) {
      return { rows: [{ id: 8, registrationId: 'QFF26-R-TEST', dayNumber: 4, eventDate: '2026-09-10', scheduledAt: new Date('2026-09-10T04:00:00Z') }] }
    }
    if (text.includes('FROM registrations WHERE registration_id')) {
      return { rows: [{ registrationId: 'QFF26-R-TEST', fullName: 'Test Participant', email: 'test@example.invalid' }] }
    }
    return { rows: [] }
  }
  registrationService.sendMail = async () => { throw new Error('temporary SMTP failure') }

  const result = await reminderService.processDueReminders({ limit: 1 })

  assert.equal(result.results[0].status, 'PENDING')
  assert.ok(queries.some((query) => query.includes("SET status = 'PENDING'")))
  assert.equal(queries.some((query) => query.includes("SET status = 'SENT'")), false)
})

test('does not process reminders before scheduled_at and uses a database lock for duplicate safety', async () => {
  let claimQuery = ''
  pool.query = async (text) => {
    if (text.includes('WITH candidate')) claimQuery = text
    return { rows: [] }
  }

  const result = await reminderService.processDueReminders()

  assert.equal(result.processed, 0)
  assert.match(claimQuery, /status = 'PENDING'/)
  assert.match(claimQuery, /scheduled_at <= NOW\(\)/)
  assert.match(claimQuery, /FOR UPDATE SKIP LOCKED/)
})

test('registration source no longer invokes the obsolete immediate reminder loop', () => {
  const source = fs.readFileSync(require.resolve('../src/services/registration.service'), 'utf8')
  assert.equal(source.includes('scheduleEventDayReminders'), false)
  assert.equal(source.includes('sendEventDayReminder'), false)
  assert.match(source, /sendRegistrationConfirmationEmail\(registration\)/)
})
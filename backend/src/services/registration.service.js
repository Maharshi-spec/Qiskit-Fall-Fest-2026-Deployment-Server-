require('../config/env')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const nodemailer = require('nodemailer')
const path = require('path')
const { AppError } = require('../middleware/error.middleware')
const { pool } = require('../config/database')
const reminderService = require('./reminder.service')
const { saveFile } = require('../utils/file-storage')
const ExcelJS = require('exceljs')
const { getActiveEventProfile, runWithProfile } = require('../middleware/profile.middleware')

const VALID_ROLES = new Set(['STUDENT', 'FACULTY', 'PROFESSIONAL', 'OTHER'])
const BOOLEAN_FIELDS = new Set(['knowsPython', 'aicteQuantumCourse', 'knowsQuantumBasics', 'usedQiskitBefore'])

const uploadIdCard = async (file) => {
  const ext = path.extname(file.originalname || '') || (file.mimetype === 'application/pdf' ? '.pdf' : '.jpg')
  const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`
  try {
    const stored = await saveFile(`id-cards/${uniqueName}`, file.buffer)
    return stored.publicUrl
  } catch (error) {
    console.error('[FILE_STORAGE_ERROR]', error)
    throw new AppError(500, 'FILE_UPLOAD_FAILED', 'Failed to store the ID card.')
  }
}

const registrationRepository = {
  notificationLog: [],

  async findByEmail(email) {
    const normalizedEmail = normalizeEmail(email)

    try {
      const result = await pool.query(
        `SELECT registration_id AS "registrationId", status, full_name AS "fullName",
          email, mobile_number AS "mobileNumber", mobile_number AS "phone", role, institute_name AS "instituteName",
          department, knows_python AS "knowsPython", aicte_quantum_course AS "aicteQuantumCourse",
          knows_quantum_basics AS "knowsQuantumBasics", used_qiskit_before AS "usedQiskitBefore",
          accommodation_required AS "accommodationRequired", local_transport_required AS "localTransportRequired",
          accommodation_required AS "accommodation_required", local_transport_required AS "local_transport_required",
          id_card_url AS "idCardUrl", created_at AS "createdAt"
        FROM registrations WHERE email = $1 LIMIT 1`,
        [normalizedEmail],
      )
      return result.rows[0] || null
    } catch (err) {
      console.error('[PG DB ERROR] findByEmail failed', { message: err.message })
      throw err
    }
  },

  async findByEmailAndRegistrationId(email, registrationId) {
    const normalizedEmail = normalizeEmail(email)
    const normalizedId = String(registrationId || '').trim().toUpperCase()

    try {
      const result = await pool.query(
        `SELECT registration_id AS "registrationId", status, full_name AS "fullName",
          email, mobile_number AS "mobileNumber", mobile_number AS "phone", role, institute_name AS "instituteName",
          department, knows_python AS "knowsPython", aicte_quantum_course AS "aicteQuantumCourse",
          knows_quantum_basics AS "knowsQuantumBasics", used_qiskit_before AS "usedQiskitBefore",
          accommodation_required AS "accommodationRequired", local_transport_required AS "localTransportRequired",
          accommodation_required AS "accommodation_required", local_transport_required AS "local_transport_required",
          id_card_url AS "idCardUrl", created_at AS "createdAt"
        FROM registrations WHERE email = $1 AND registration_id = $2 LIMIT 1`,
        [normalizedEmail, normalizedId],
      )
      return result.rows[0] || null
    } catch (err) {
      console.error('[PG DB ERROR] findByEmailAndRegistrationId failed', { message: err.message })
      throw err
    }
  },

  async findByRegistrationId(registrationId) {
    const normalizedId = String(registrationId || '').trim().toUpperCase()

    try {
      const result = await pool.query(
        `SELECT registration_id AS "registrationId", status, full_name AS "fullName",
          email, mobile_number AS "mobileNumber", mobile_number AS "phone", role, institute_name AS "instituteName",
          department, knows_python AS "knowsPython", aicte_quantum_course AS "aicteQuantumCourse",
          knows_quantum_basics AS "knowsQuantumBasics", used_qiskit_before AS "usedQiskitBefore",
          accommodation_required AS "accommodationRequired", local_transport_required AS "localTransportRequired",
          accommodation_required AS "accommodation_required", local_transport_required AS "local_transport_required",
          id_card_url AS "idCardUrl", created_at AS "createdAt"
        FROM registrations WHERE registration_id = $1 LIMIT 1`,
        [normalizedId],
      )
      return result.rows[0] || null
    } catch (err) {
      console.error('[PG DB ERROR] findByRegistrationId failed', { message: err.message })
      throw err
    }
  },

  async createRegistration(record, idCardUrl) {
    const normalizedEmail = normalizeEmail(record.email)
    const fullName = String(record.fullName || '').trim()
    const mobileNumber = String(record.mobileNumber || '').trim()
    const role = String(record.role || '').trim().toUpperCase()
    const instituteName = String(record.instituteName || '').trim()
    const department = String(record.department || '').trim()
    const accommodationRequired = Boolean(record.accommodationRequired ?? record.accommodation_required ?? false)
    const localTransportRequired = Boolean(record.localTransportRequired ?? record.local_transport_required ?? false)

    try {
      const result = await pool.query(
        `INSERT INTO registrations (
          registration_id, full_name, email, mobile_number, role, institute_name, department,
          knows_python, aicte_quantum_course, knows_quantum_basics, used_qiskit_before,
          accommodation_required, local_transport_required,
          id_card_url, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
        RETURNING registration_id AS "registrationId", status`,
        [
          record.registrationId,
          fullName,
          normalizedEmail,
          mobileNumber,
          role,
          instituteName,
          department,
          Boolean(record.knowsPython),
          Boolean(record.aicteQuantumCourse),
          Boolean(record.knowsQuantumBasics),
          Boolean(record.usedQiskitBefore),
          accommodationRequired,
          localTransportRequired,
          idCardUrl,
          record.status || 'CONFIRMED',
        ],
      )

      if (result.rows[0]) {
        return { registrationId: result.rows[0].registrationId, status: result.rows[0].status }
      }

      const existingRegistration = await this.findByEmail(normalizedEmail)
      if (existingRegistration) {
        throw new AppError(409, 'EMAIL_ALREADY_REGISTERED', 'This email is already registered.')
      }

      throw new AppError(500, 'DATABASE_ERROR', 'Failed to save registration.')
    } catch (err) {
      if (err instanceof AppError) throw err

      if (err && err.code === '23505') {
        throw new AppError(409, 'EMAIL_ALREADY_REGISTERED', 'This email is already registered.')
      }

      console.error('[PG DB EXCEPTION]', err)
      throw new AppError(503, 'DATABASE_UNAVAILABLE', 'Registration could not be saved. Please try again.')
    }
  },

  async findAll() {
    const result = await pool.query(
      `SELECT registration_id AS "registrationId", status, full_name AS "fullName",
        email, mobile_number AS "mobileNumber", mobile_number AS "phone", role, institute_name AS "instituteName",
        department, knows_python AS "knowsPython", aicte_quantum_course AS "aicteQuantumCourse",
        knows_quantum_basics AS "knowsQuantumBasics", used_qiskit_before AS "usedQiskitBefore",
        accommodation_required AS "accommodationRequired", local_transport_required AS "localTransportRequired",
        accommodation_required AS "accommodation_required", local_transport_required AS "local_transport_required",
        id_card_url AS "idCardUrl", created_at AS "createdAt"
      FROM registrations ORDER BY created_at DESC`,
    )
    return result.rows
  },

  logNotification(notification) {
    const existing = this.notificationLog.find(
      (item) => item.registrationId === notification.registrationId && item.eventDay === notification.eventDay && item.emailType === notification.emailType,
    )

    if (!existing) {
      this.notificationLog.push({
        ...notification,
        status: 'SENT',
        sentAt: new Date().toISOString(),
      })
    }

    return existing || notification
  },
}

const userRepository = {
  users: [
    {
      id: 'admin-001',
      fullName: 'Admin User',
      email: 'admin@qiskitfallfest.com',
      passwordHash: bcrypt.hashSync('Admin@123', 10),
      role: 'ADMIN',
      createdAt: new Date().toISOString(),
    },
  ],

  findByEmail(email) {
    const normalizedEmail = normalizeEmail(email)
    return this.users.find((user) => normalizeEmail(user.email) === normalizedEmail) || null
  },

  create(user) {
    this.users.push(user)
    return user
  },
}

const eventRepository = {
  events: [
    {
      eventId: 'qff-2026',
      name: 'Qiskit Fall Fest 2026',
      description: 'Three-day quantum learning festival',
      location: 'CUTM-AP Campus + Virtual',
      startDate: '2026-09-05',
      endDate: '2026-09-07',
      status: 'ACTIVE',
    },
  ],
  eventDays: [
    {
      eventId: 'qff-2026',
      dayId: 'day-1',
      dayNumber: 1,
      name: 'Day 1',
      date: '2026-09-05',
      startTime: '09:00',
      endTime: '17:00',
      venue: 'CUTM-AP Campus',
      importantInfo: 'Check-in opens at 08:30',
    },
    {
      eventId: 'qff-2026',
      dayId: 'day-2',
      dayNumber: 2,
      name: 'Day 2',
      date: '2026-09-06',
      startTime: '09:00',
      endTime: '17:00',
      venue: 'CUTM-AP Campus',
      importantInfo: 'Bring your laptop for lab sessions',
    },
    {
      eventId: 'qff-2026',
      dayId: 'day-3',
      dayNumber: 3,
      name: 'Day 3',
      date: '2026-09-07',
      startTime: '09:00',
      endTime: '15:00',
      venue: 'CUTM-AP Campus + Virtual',
      importantInfo: 'Final day wrap-up and closing remarks',
    },
  ],
  schedules: [
    {
      scheduleId: 'sched-1',
      eventId: 'qff-2026',
      dayId: 'day-1',
      title: 'Opening Keynote',
      speaker: 'Quantum Community',
      startTime: '09:30',
      endTime: '10:30',
      venue: 'Auditorium',
    },
  ],

  findAllEvents() {
    return this.events
  },

  findEventById(eventId) {
    return this.events.find((event) => event.eventId === eventId) || null
  },

  createEvent(event) {
    this.events.push(event)
    return event
  },

  updateEvent(eventId, updates) {
    const index = this.events.findIndex((event) => event.eventId === eventId)
    if (index === -1) return null
    this.events[index] = { ...this.events[index], ...updates }
    return this.events[index]
  },

  deleteEvent(eventId) {
    const index = this.events.findIndex((event) => event.eventId === eventId)
    if (index === -1) return false
    this.events.splice(index, 1)
    return true
  },

  findDaysByEvent(eventId) {
    return this.eventDays.filter((day) => day.eventId === eventId)
  },

  findDayById(eventId, dayId) {
    return this.eventDays.find((day) => day.eventId === eventId && day.dayId === dayId) || null
  },

  createDay(day) {
    this.eventDays.push(day)
    return day
  },

  updateDay(eventId, dayId, updates) {
    const index = this.eventDays.findIndex((day) => day.eventId === eventId && day.dayId === dayId)
    if (index === -1) return null
    this.eventDays[index] = { ...this.eventDays[index], ...updates }
    return this.eventDays[index]
  },

  deleteDay(eventId, dayId) {
    const index = this.eventDays.findIndex((day) => day.eventId === eventId && day.dayId === dayId)
    if (index === -1) return false
    this.eventDays.splice(index, 1)
    return true
  },

  findScheduleByEventDay(eventId, dayId) {
    return this.schedules.filter((schedule) => schedule.eventId === eventId && schedule.dayId === dayId)
  },

  findScheduleById(scheduleId) {
    return this.schedules.find((schedule) => schedule.scheduleId === scheduleId) || null
  },

  createSchedule(schedule) {
    this.schedules.push(schedule)
    return schedule
  },

  updateSchedule(scheduleId, updates) {
    const index = this.schedules.findIndex((schedule) => schedule.scheduleId === scheduleId)
    if (index === -1) return null
    this.schedules[index] = { ...this.schedules[index], ...updates }
    return this.schedules[index]
  },

  deleteSchedule(scheduleId) {
    const index = this.schedules.findIndex((schedule) => schedule.scheduleId === scheduleId)
    if (index === -1) return false
    this.schedules.splice(index, 1)
    return true
  },
}

const notificationRepository = {
  notifications: [],

  findExisting(payload) {
    return this.notifications.find(
      (item) => item.registrationId === payload.registrationId && item.eventDay === payload.eventDay && item.emailType === payload.emailType,
    ) || null
  },

  create(payload) {
    this.notifications.push(payload)
    return payload
  },

  markSent(payload) {
    const record = this.notifications.find(
      (item) => item.registrationId === payload.registrationId && item.eventDay === payload.eventDay && item.emailType === payload.emailType,
    )
    if (record) {
      record.status = 'SENT'
      record.sentAt = new Date().toISOString()
      return record
    }
    return this.create({ ...payload, status: 'SENT', sentAt: new Date().toISOString() })
  },

  markFailed(payload, errorMessage) {
    const record = this.notifications.find(
      (item) => item.registrationId === payload.registrationId && item.eventDay === payload.eventDay && item.emailType === payload.emailType,
    )
    if (record) {
      record.status = 'FAILED'
      record.errorMessage = errorMessage
      record.sentAt = new Date().toISOString()
      return record
    }
    return this.create({ ...payload, status: 'FAILED', errorMessage, sentAt: new Date().toISOString() })
  },

  findPending() {
    return this.notifications.filter((notification) => notification.status === 'PENDING')
  },
}

const normalizeEmail = (value) => String(value || '').trim().toLowerCase()

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim())

const isValidMobileNumber = (value) => /^\+?[0-9\s()-]{7,20}$/.test(String(value || '').trim())

const normalizeMailValue = (value, fallback = '') => String(value ?? fallback).trim()
const normalizeMailPassword = (value) => normalizeMailValue(value, '').replace(/\s+/g, '')

const getMailConfiguration = () => {
  const environment = process.env.NODE_ENV || 'development'
  const requiredFields = ['MAIL_HOST', 'MAIL_PORT', 'MAIL_USER', 'MAIL_PASSWORD', 'MAIL_FROM']

  const config = {
    host: normalizeMailValue(process.env.MAIL_HOST || (environment === 'production' ? '' : 'localhost')),
    port: process.env.MAIL_PORT ? Number(process.env.MAIL_PORT) : (environment === 'production' ? '' : 1025),
    user: normalizeMailValue(process.env.MAIL_USER),
    password: normalizeMailPassword(process.env.MAIL_PASSWORD),
    from: normalizeMailValue(process.env.MAIL_FROM || (environment === 'production' ? '' : 'noreply@qiskitfallfest.com')),
    fromName: normalizeMailValue(process.env.MAIL_FROM_NAME, 'Qiskit Fall Fest 2026'),
  }

  const isSandbox = process.env.MAIL_SANDBOX === 'true' || process.env.MAIL_HOST === 'sandbox' || process.env.MAIL_HOST === 'ethereal'
  const missingFields = isSandbox
    ? []
    : requiredFields.filter((fieldName) => {
        const fieldValue = process.env[fieldName]
        return !fieldValue || String(fieldValue).trim() === ''
      })

  const secureMode = Number(config.port || 587) === 465

  const summary = {
    MAIL_HOST: Boolean(config.host),
    MAIL_PORT: Boolean(config.port),
    MAIL_USER: Boolean(config.user),
    MAIL_PASSWORD: Boolean(config.password),
    MAIL_FROM: Boolean(config.from),
    MAIL_FROM_NAME: Boolean(config.fromName),
    configuredHost: config.host,
    configuredPort: Number(config.port || 587),
    secureMode,
  }

  return {
    config,
    summary,
    missingFields,
    isProduction: environment === 'production',
  }
}

const isBooleanLikeText = (value) => {
  if (typeof value === 'boolean') return true
  const normalized = String(value || '').trim().toLowerCase()
  return normalized === 'true' || normalized === 'false'
}

const normalizeBooleanField = (value) => {
  const normalized = String(value || '').trim().toLowerCase()
  if (normalized === 'true') return true
  if (normalized === 'false') return false
  return false
}

const generateRegistrationId = async () => {
  let nextNumber = 1
  try {
    const result = await pool.query('SELECT nextval(\'registrations_id_seq\') AS "nextNumber"')
    nextNumber = Number(result.rows[0]?.nextNumber ?? 1)
  } catch (err) {
    if (err.code === '42P01') {
      const result = await pool.query('SELECT nextval(\'registrations_registration_id_seq\') AS "nextNumber"')
      nextNumber = Number(result.rows[0]?.nextNumber ?? 1)
    } else {
      throw err
    }
  }

  return {
    id: null,
    registrationId: `QFF26-R-${String(nextNumber).padStart(5, '0')}`,
  }
}

const createJwtToken = (user) => jwt.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '24h' })

const getAttendanceRecords = async () => {
  const memory = global.__organizerAttendance || {}

  if (!pool) {
    return Object.values(memory).map((item) => ({
      registrationId: item.registrationId,
      fullName: item.fullName,
      email: item.email,
      status: item.status || 'NOT_MARKED',
      markedAt: item.markedAt || null,
    }))
  }

  try {
    const result = await pool.query(
      `SELECT registration_id AS "registrationId", full_name AS "fullName", email, status, marked_at AS "markedAt"
       FROM attendance ORDER BY updated_at DESC`,
    )
    return result.rows
  } catch (error) {
    console.warn('[ATTENDANCE WARN] Falling back to in-memory attendance:', error.message)
    return Object.values(memory).map((item) => ({
      registrationId: item.registrationId,
      fullName: item.fullName,
      email: item.email,
      status: item.status || 'NOT_MARKED',
      markedAt: item.markedAt || null,
    }))
  }
}

const setAttendanceRecord = async (registrationId, status, participant = {}) => {
  const normalizedStatus = ['PRESENT', 'ABSENT', 'NOT_MARKED'].includes(String(status).toUpperCase())
    ? String(status).toUpperCase()
    : 'NOT_MARKED'

  const record = {
    registrationId: String(registrationId),
    fullName: participant.fullName || participant.full_name || 'Participant',
    email: participant.email || '',
    status: normalizedStatus,
    markedAt: new Date().toISOString(),
  }

  global.__organizerAttendance = global.__organizerAttendance || {}
  global.__organizerAttendance[record.registrationId] = record

  if (!pool) {
    return record
  }

  try {
    await pool.query(
      `INSERT INTO attendance (registration_id, full_name, email, status, marked_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       ON CONFLICT (registration_id)
       DO UPDATE SET full_name = EXCLUDED.full_name, email = EXCLUDED.email, status = EXCLUDED.status, marked_at = NOW(), updated_at = NOW()`,
      [record.registrationId, record.fullName, record.email, record.status],
    )
  } catch (error) {
    console.warn('[ATTENDANCE WARN] Attendance update failed in database, using in-memory fallback:', error.message)
  }

  return record
}

const sendOrganizerEmail = async (payload = {}) => {
  const role = String(payload.role || '').trim().toUpperCase()
  const subject = String(payload.subject || '').trim()
  const message = String(payload.message || '').trim()

  if (!role) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Participant role is required.')
  }

  if (!VALID_ROLES.has(role)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'role must be one of Student, Faculty, Professional, Other.')
  }

  if (!subject) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Email subject is required.')
  }

  if (!message) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Email message is required.')
  }

  const result = await pool.query(
    'SELECT email FROM registrations WHERE role = $1 ORDER BY id',
    [role],
  )
  const uniqueRecipients = [...new Set(result.rows.map((row) => String(row.email || '').trim()).filter(Boolean))]

  if (!uniqueRecipients.length) {
    return {
      success: true,
      sent: 0,
      failed: 0,
      accepted: [],
      rejected: [],
      message: 'No registered participants found for the selected role.',
      data: {
        participantCount: 0,
        sent: 0,
        failed: 0,
      },
    }
  }

  const preparedMessage = message.replace(/\n/g, '<br />')

  let mailInfo
  try {
    mailInfo = await sendMail({
      to: uniqueRecipients,
      subject,
      text: message,
      html: `<div style="font-family: Arial, sans-serif; line-height: 1.6;">${preparedMessage}</div>`,
    })
  } catch (error) {
    const safeErrorMsg = error.message
      ? String(error.message).replace(/(pass|password|token|secret)\s*[:=]?\s*[^\s,;]+/gi, '[REDACTED]')
      : 'Unable to deliver email.'
    console.error('[ORGANIZER_EMAIL_FAILURE]', {
      recipientCount: uniqueRecipients.length,
      error: safeErrorMsg,
    })
    throw new AppError(error.statusCode || 500, error.code || 'EMAIL_SEND_FAILED', `Email delivery failed: ${safeErrorMsg}`)
  }

  const accepted = Array.isArray(mailInfo?.accepted) ? mailInfo.accepted : uniqueRecipients
  const rejected = Array.isArray(mailInfo?.rejected) ? mailInfo.rejected : []
  const messageId = mailInfo?.messageId || null

  console.info('[ORGANIZER_EMAIL_SUCCESS]', {
    recipientCount: uniqueRecipients.length,
    acceptedRecipients: accepted,
    rejectedRecipients: rejected,
    messageId,
  })

  const sentCount = accepted.length
  const failedCount = rejected.length

  if (sentCount === 0 && failedCount > 0) {
    throw new AppError(500, 'EMAIL_SEND_FAILED', `All email deliveries were rejected (${failedCount} failed).`)
  }

  return {
    success: true,
    sent: sentCount,
    failed: failedCount,
    accepted,
    rejected,
    messageId,
    data: {
      participantCount: uniqueRecipients.length,
      sent: sentCount,
      failed: failedCount,
      accepted,
      rejected,
      messageId,
      subject,
      sentAt: new Date().toISOString(),
    },
  }
}

const sendMail = async ({ to, subject, text, html }) => {
  const { config, missingFields } = getMailConfiguration()

  const safeTo = Array.isArray(to) ? to.join(', ') : String(to || '')

  const secureMode = Number(config.port || 587) === 465
  console.info('[REGISTRATION_EMAIL_DIAGNOSTIC] Safe configuration status:', {
    hasMailHost: Boolean(config.host),
    hasMailUser: Boolean(config.user),
    hasMailPassword: Boolean(config.password),
    hasMailFrom: Boolean(config.from),
    configuredHost: config.host,
    configuredPort: Number(config.port || 587),
    secureMode,
    toCount: Array.isArray(to) ? to.length : 1,
    subject,
  })

  if (missingFields.length > 0) {
    throw new AppError(
      503,
      'EMAIL_CONFIGURATION_INCOMPLETE',
      `Email delivery disabled. Missing SMTP configuration fields: ${missingFields.join(', ')}.`,
    )
  }

  const transport = nodemailer.createTransport({
    host: config.host,
    port: Number(config.port || 587),
    secure: Number(config.port || 587) === 465,
    family: 4,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    tls: { rejectUnauthorized: true },
    auth: config.user && config.password ? { user: config.user, pass: config.password } : undefined,
  })

  const senderAddress = config.fromName
    ? `${config.fromName} <${config.from}>`
    : config.from

  if (process.env.MAIL_SANDBOX === 'true' || config.host === 'sandbox' || config.host === 'ethereal') {
    try {
      const testAccount = await nodemailer.createTestAccount()
      const sandboxTransport = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: { user: testAccount.user, pass: testAccount.pass },
      })
      const result = await sandboxTransport.sendMail({
        from: senderAddress || `Qiskit Fall Fest 2026 <${testAccount.user}>`,
        to: safeTo,
        subject,
        text,
        html,
      })
      const previewUrl = nodemailer.getTestMessageUrl(result)
      console.info('[REGISTRATION_EMAIL_SANDBOX] Email accepted by Ethereal sandbox:', {
        messageId: result.messageId,
        previewUrl,
        recipient: safeTo,
        subject,
        accepted: result.accepted,
      })
      return { ...result, previewUrl }
    } catch (err) {
      console.error('[REGISTRATION_EMAIL_SANDBOX_ERROR] Sandbox delivery failed:', err.message)
      throw new AppError(503, 'SMTP_DELIVERY_FAILED', `Sandbox delivery failed: ${err.message}`)
    }
  }

  if (process.env.NODE_ENV === 'test') {
    return { messageId: `mock-${Date.now()}`, accepted: Array.isArray(to) ? to : [to], rejected: [] }
  }

  await transport.verify().catch((error) => {
    const safeMessage = error && error.message ? error.message.replace(/(pass|password|token|secret)\s*[:=]?\s*[^\s,;]+/gi, '[REDACTED]') : 'SMTP verification failed.'
    console.error('[REGISTRATION_EMAIL_ERROR] SMTP verification failed', { code: error && error.code, message: safeMessage })
    throw new AppError(503, 'SMTP_VERIFICATION_FAILED', safeMessage)
  })

  try {
    const result = await transport.sendMail({
      from: senderAddress,
      to: safeTo,
      subject,
      text,
      html,
    })
    console.info('[REGISTRATION_EMAIL_DIAGNOSTIC] sendMail success', {
      toCount: Array.isArray(to) ? to.length : 1,
      subject,
      messageId: result && result.messageId,
      accepted: result && result.accepted,
      rejected: result && result.rejected,
      smtpHost: config.host,
      smtpPort: config.port,
    })
    return result
  } catch (error) {
    const safeMsg = error && error.message ? String(error.message).replace(/(pass|password|token|secret)\s*[:=]?\s*[^\s,;]+/gi, '[REDACTED]') : 'SMTP delivery failed'
    console.error('[REGISTRATION_EMAIL_ERROR] SMTP delivery failed', {
      code: error && error.code,
      message: safeMsg,
    })
    throw new AppError(503, 'SMTP_DELIVERY_FAILED', `Email delivery failed: ${safeMsg}`)
  }
}

const buildRegistrationConfirmationEmailContent = (registration) => {
  const participantName = String(registration.fullName || 'Participant').trim() || 'Participant'
  const registrationId = String(registration.registrationId || 'N/A').trim()
  const status = String(registration.status || 'CONFIRMED').trim().toUpperCase()
  const participantEmail = String(registration.email || '').trim()

  const text = [
    `Hi ${participantName},`,
    '',
    'Your registration for Qiskit Fall Fest 2026 has been successfully received and confirmed.',
    '',
    `Registration ID: ${registrationId}`,
    `Status: ${status}`,
    `Participant: ${participantName}`,
    `Email: ${participantEmail}`,
    '',
    'Thank you for registering for Qiskit Fall Fest 2026. We are looking forward to having you join us for a hands-on experience around quantum computing, learning, workshops, community, and experimentation.',
    '',
    "What's next?",
    '- Keep your registration ID safe for future communication and check-in.',
    '- Watch your registered email for event updates and follow-up instructions.',
    '- Follow official event communication for schedule and participation guidance.',
    '- Contact the organizers if you need assistance.',
    '',
    'Thank you for being part of the Qiskit Fall Fest 2026 community.',
  ].join('\n')

  const html = `
    <div style="margin:0;padding:0;background:#f5f3f8;font-family:Arial,Helvetica,sans-serif;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f5f3f8;padding:32px 0;">
        <tr>
          <td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:640px;background:#ffffff;border:1px solid #f3d8e6;border-radius:14px;overflow:hidden;">
              <tr>
                <td style="padding:30px 28px 10px 28px;background:#ffffff;">
                  <div style="font-size:12px;letter-spacing:1.5px;color:#d14b9b;font-weight:700;text-transform:uppercase;">Qiskit Fall Fest 2026</div>
                  <h1 style="margin:14px 0 10px 0;font-size:28px;line-height:1.3;color:#1f1f1f;">Registration confirmed</h1>
                  <p style="margin:0;color:#4a4a4a;font-size:16px;line-height:1.6;">Hi ${participantName},</p>
                  <p style="margin:16px 0 0 0;color:#4a4a4a;font-size:16px;line-height:1.7;">Your registration for Qiskit Fall Fest 2026 has been successfully received and confirmed.</p>
                </td>
              </tr>
              <tr>
                <td style="padding:20px 28px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#fff8fc;border:1px solid #f3d8e6;border-radius:10px;">
                    <tr>
                      <td style="padding:18px 20px;">
                        <div style="font-size:11px;letter-spacing:1.3px;color:#d14b9b;text-transform:uppercase;font-weight:700;">Registration ID</div>
                        <div style="margin-top:8px;font-size:26px;font-weight:700;color:#1f1f1f;letter-spacing:0.5px;">${registrationId}</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:0 28px 16px 28px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="font-size:15px;color:#303030;line-height:1.7;">
                    <tr>
                      <td style="padding:6px 0;width:120px;font-weight:700;color:#1f1f1f;">Status</td>
                      <td style="padding:6px 0;color:#4a4a4a;">${status}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;width:120px;font-weight:700;color:#1f1f1f;">Participant</td>
                      <td style="padding:6px 0;color:#4a4a4a;">${participantName}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;width:120px;font-weight:700;color:#1f1f1f;">Email</td>
                      <td style="padding:6px 0;color:#4a4a4a;">${participantEmail}</td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:0 28px 8px 28px;">
                  <p style="margin:0;color:#4a4a4a;font-size:15px;line-height:1.7;">Thank you for registering for Qiskit Fall Fest 2026. We are looking forward to having you join us for a hands-on experience around quantum computing, learning, workshops, community, and experimentation.</p>
                </td>
              </tr>
              <tr>
                <td style="padding:18px 28px 8px 28px;">
                  <h2 style="margin:0 0 10px 0;font-size:20px;color:#1f1f1f;">What’s next?</h2>
                  <ul style="margin:0;padding-left:20px;color:#4a4a4a;font-size:15px;line-height:1.8;">
                    <li>Keep your registration ID safe for future communication and check-in.</li>
                    <li>Watch your registered email for event updates and follow-up instructions.</li>
                    <li>Follow official event communication for schedule and participation guidance.</li>
                    <li>Contact the organizers if you need assistance.</li>
                  </ul>
                </td>
              </tr>
              <tr>
                <td style="padding:20px 28px 30px 28px;">
                  <div style="border-top:1px solid #f0e0eb;padding-top:16px;color:#4a4a4a;font-size:14px;line-height:1.7;">
                    Thank you for being part of the Qiskit Fall Fest 2026 community.
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `

  return { text, html }
}

const sendRegistrationConfirmationEmail = async (registration) => {
  const emailContent = buildRegistrationConfirmationEmailContent(registration)
  const emailPayload = {
    to: registration.email,
    subject: 'Registration Confirmed — Qiskit Fall Fest 2026',
    text: emailContent.text,
    html: emailContent.html,
  }

  await sendMail(emailPayload)
  return emailPayload
}

const validateRegistrationPayload = (payload) => {
  const requiredFields = [
    'fullName',
    'email',
    'mobileNumber',
    'role',
    'instituteName',
    'department',
    'knowsPython',
    'aicteQuantumCourse',
    'knowsQuantumBasics',
    'usedQiskitBefore',
  ]

  for (const fieldName of requiredFields) {
    if (payload[fieldName] === undefined || payload[fieldName] === null || String(payload[fieldName]).trim() === '') {
      throw new AppError(400, 'VALIDATION_ERROR', `Missing required field: ${fieldName}`)
    }
  }

  if (typeof payload.fullName !== 'string' || payload.fullName.trim().length < 2) {
    throw new AppError(400, 'VALIDATION_ERROR', 'fullName must be at least 2 characters long.')
  }

  if (!isValidEmail(payload.email)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid email format.')
  }

  if (!isValidMobileNumber(payload.mobileNumber)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'mobileNumber is invalid.')
  }

  if (!VALID_ROLES.has(String(payload.role).trim().toUpperCase())) {
    throw new AppError(400, 'VALIDATION_ERROR', 'role must be one of STUDENT, FACULTY, PROFESSIONAL, OTHER.')
  }

  for (const fieldName of BOOLEAN_FIELDS) {
    if (!isBooleanLikeText(payload[fieldName])) {
      throw new AppError(400, 'VALIDATION_ERROR', `${fieldName} must be either "true" or "false".`)
    }
  }

  const optionalBooleanFields = ['accommodation_required', 'accommodationRequired', 'local_transport_required', 'localTransportRequired']
  for (const fieldName of optionalBooleanFields) {
    if (payload[fieldName] !== undefined && payload[fieldName] !== null && String(payload[fieldName]).trim() !== '') {
      if (!isBooleanLikeText(payload[fieldName])) {
        throw new AppError(400, 'VALIDATION_ERROR', `${fieldName} must be a boolean.`)
      }
    }
  }

  if (!payload.idCard && !payload.file) {
    throw new AppError(400, 'VALIDATION_ERROR', 'idCard is required.')
  }
}

const registerUser = async (payload = {}, file) => {
  const requestPayload = {
    ...payload,
    ...(file ? { idCard: file } : {}),
  }

  validateRegistrationPayload(requestPayload)

  const email = normalizeEmail(requestPayload.email)
  const existingRegistration = await registrationRepository.findByEmail(email)

  if (existingRegistration) {
    throw new AppError(409, 'EMAIL_ALREADY_REGISTERED', 'This email is already registered.')
  }

  if (!file) {
    throw new AppError(400, 'VALIDATION_ERROR', 'idCard is required.')
  }

  if ((!file.buffer && !file.path) || file.size <= 0) {
    throw new AppError(400, 'VALIDATION_ERROR', 'idCard file is missing or empty.')
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new AppError(400, 'INVALID_FILE_SIZE', 'idCard file exceeds the allowed size limit.')
  }

  const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'])
  if (!allowedMimeTypes.has(file.mimetype)) {
    throw new AppError(400, 'INVALID_FILE_TYPE', 'Invalid ID card file type. Allowed types: JPEG, PNG, PDF.')
  }

  const idCardUrl = await uploadIdCard(file)
  const generatedId = await generateRegistrationId()

  const accommodationVal = requestPayload.accommodation_required !== undefined
    ? requestPayload.accommodation_required
    : requestPayload.accommodationRequired
  const localTransportVal = requestPayload.local_transport_required !== undefined
    ? requestPayload.local_transport_required
    : requestPayload.localTransportRequired

  const accommodationRequired = accommodationVal !== undefined && accommodationVal !== null && String(accommodationVal).trim() !== ''
    ? normalizeBooleanField(accommodationVal)
    : false
  const localTransportRequired = localTransportVal !== undefined && localTransportVal !== null && String(localTransportVal).trim() !== ''
    ? normalizeBooleanField(localTransportVal)
    : false

  const registration = {
    id: generatedId.id,
    registrationId: generatedId.registrationId,
    status: 'CONFIRMED',
    fullName: String(requestPayload.fullName).trim(),
    email,
    mobileNumber: String(requestPayload.mobileNumber).trim(),
    role: String(requestPayload.role).trim().toUpperCase(),
    instituteName: String(requestPayload.instituteName).trim(),
    department: String(requestPayload.department).trim(),
    knowsPython: normalizeBooleanField(requestPayload.knowsPython),
    aicteQuantumCourse: normalizeBooleanField(requestPayload.aicteQuantumCourse),
    knowsQuantumBasics: normalizeBooleanField(requestPayload.knowsQuantumBasics),
    usedQiskitBefore: normalizeBooleanField(requestPayload.usedQiskitBefore),
    accommodation_required: accommodationRequired,
    local_transport_required: localTransportRequired,
    accommodationRequired,
    localTransportRequired,
    idCardUrl,
    createdAt: new Date().toISOString(),
  }

  await registrationRepository.createRegistration(registration, idCardUrl)

  const token = jwt.sign(
    { email: registration.email, registrationId: registration.registrationId, role: 'PARTICIPANT' },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: '7d' },
  )

  try {
    await reminderService.scheduleRegistrationReminders(registration)
    console.info('[REMINDER] scheduled', { registrationId: registration.registrationId, dayCount: reminderService.EVENT_DAYS.length })
  } catch (error) {
    console.error('[REMINDER] scheduling failed', { registrationId: registration.registrationId, error: error.message })
  }

  console.info('[REGISTRATION_EMAIL_DIAGNOSTIC] registration confirmation email call', {
    recipient: registration.email,
    registrationId: registration.registrationId,
    smtpHost: process.env.MAIL_HOST,
    smtpPort: process.env.MAIL_PORT,
    hasMailUser: Boolean(process.env.MAIL_USER),
    hasMailPassword: Boolean(process.env.MAIL_PASSWORD),
  })
  sendRegistrationConfirmationEmail(registration)
    .then(() => {
      console.info('[REGISTRATION_EMAIL] confirmation email sent', {
        registrationId: registration.registrationId,
        recipient: registration.email,
      })
    })
    .catch((error) => {
      console.error('[REGISTRATION_EMAIL_ERROR] registration confirmation failed', {
        code: error && error.code,
        message: error && error.message ? String(error.message).replace(/(pass|password|token|secret)\s*[:=]?\s*[^\s,;]+/gi, '[REDACTED]') : 'Unknown email failure',
        registrationId: registration.registrationId,
        recipient: registration.email,
      })
    })

  return {
    success: true,
    data: {
      registrationId: registration.registrationId,
      status: registration.status,
      idCardUrl,
      token,
      registration,
    },
  }
}

const loginParticipant = async (payload = {}) => {
  const { email, registrationId } = payload

  if (!email || !registrationId) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Email and registration ID are required.')
  }

  if (!isValidEmail(email)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid email format.')
  }

  const registration = await registrationRepository.findByEmailAndRegistrationId(email, registrationId)

  if (!registration) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or registration ID.')
  }

  const token = jwt.sign(
    { email: registration.email, registrationId: registration.registrationId, role: 'PARTICIPANT' },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: '7d' },
  )

  return {
    success: true,
    data: {
      token,
      registration,
    },
  }
}

const getCurrentParticipant = async (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication token is missing.')
  }

  const token = authHeader.split(' ')[1]
  let decoded
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret')
  } catch (err) {
    throw new AppError(401, 'INVALID_TOKEN', 'Session expired or invalid token.')
  }

  if (!decoded || !decoded.registrationId) {
    throw new AppError(401, 'INVALID_TOKEN', 'Invalid session token.')
  }

  const registration = await registrationRepository.findByRegistrationId(decoded.registrationId)

  if (!registration) {
    throw new AppError(404, 'REGISTRATION_NOT_FOUND', 'Registration record not found.')
  }

  return {
    success: true,
    data: {
      registration,
    },
  }
}

const registerAuthUser = async (payload = {}) => {
  const { fullName, email, password } = payload

  if (!fullName || !email || !password) {
    throw new AppError(400, 'VALIDATION_ERROR', 'fullName, email, and password are required.')
  }

  if (!isValidEmail(email)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid email format.')
  }

  if (userRepository.findByEmail(email)) {
    throw new AppError(409, 'EMAIL_ALREADY_REGISTERED', 'This email is already registered.')
  }

  const user = {
    id: `user-${Date.now()}`,
    fullName: String(fullName).trim(),
    email: normalizeEmail(email),
    passwordHash: bcrypt.hashSync(String(password), 10),
    role: 'PARTICIPANT',
    createdAt: new Date().toISOString(),
  }

  userRepository.create(user)

  return {
    success: true,
    data: {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
      token: createJwtToken(user),
    },
  }
}

const loginOrganizer = async (payload = {}) => {
  const { email, password } = payload

  if (!email || !password) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Email and password are required.')
  }

  const normalizedEmail = normalizeEmail(email)
  let organizer = null

  try {
    const result = await pool.query(
      'SELECT organizer_id AS "organizerId", name, email, password FROM organizers WHERE email = $1 LIMIT 1',
      [normalizedEmail],
    )
    if (result.rows.length > 0) {
      organizer = result.rows[0]
    }
  } catch (err) {
    throw new AppError(503, 'DATABASE_UNAVAILABLE', 'Unable to authenticate organizer.')
  }

  let isPasswordValid = false
  if (organizer && organizer.password) {
    if (organizer.password.startsWith('$2a$') || organizer.password.startsWith('$2b$') || organizer.password.startsWith('$2y$')) {
      isPasswordValid = await bcrypt.compare(String(password), organizer.password)
    } else {
      isPasswordValid = String(organizer.password) === String(password)
    }
  }

  if (!organizer || !isPasswordValid) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid organizer credentials.')
  }

  const token = jwt.sign(
    {
      userId: organizer.organizer_id || organizer.organizerId || 'org-1',
      name: organizer.name,
      email: organizer.email,
      role: 'ORGANIZER',
    },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: '7d' },
  )

  return {
    success: true,
    data: {
      token,
      user: {
        id: organizer.organizer_id || organizer.organizerId || 'org-1',
        name: organizer.name,
        email: organizer.email,
        role: 'ORGANIZER',
      },
    },
  }
}

const loginUser = async (payload = {}) => {
  return loginOrganizer(payload)
}


const refreshAuthToken = async (user) => ({
  success: true,
  data: {
    token: createJwtToken({ id: user.userId, email: user.email, role: user.role }),
  },
})

const logoutUser = async () => ({
  success: true,
  data: {
    message: 'Logged out successfully.',
  },
})

const getEvents = async () => ({
  success: true,
  data: eventRepository.findAllEvents(),
})

const getEventById = async (eventId) => {
  const event = eventRepository.findEventById(eventId)
  if (!event) {
    throw new AppError(404, 'EVENT_NOT_FOUND', 'Event not found.')
  }

  return {
    success: true,
    data: event,
  }
}

const createEvent = async (payload = {}) => {
  const { eventId, name, description, location, startDate, endDate } = payload

  if (!eventId || !name || !location || !startDate || !endDate) {
    throw new AppError(400, 'VALIDATION_ERROR', 'eventId, name, location, startDate, and endDate are required.')
  }

  const event = {
    eventId: String(eventId),
    name: String(name).trim(),
    description: description || '',
    location: String(location).trim(),
    startDate: String(startDate),
    endDate: String(endDate),
    status: 'ACTIVE',
  }

  eventRepository.createEvent(event)
  return { success: true, data: event }
}

const updateEvent = async (eventId, payload = {}) => {
  const event = eventRepository.findEventById(eventId)
  if (!event) {
    throw new AppError(404, 'EVENT_NOT_FOUND', 'Event not found.')
  }

  const updated = eventRepository.updateEvent(eventId, payload)
  return { success: true, data: updated }
}

const deleteEvent = async (eventId) => {
  const event = eventRepository.findEventById(eventId)
  if (!event) {
    throw new AppError(404, 'EVENT_NOT_FOUND', 'Event not found.')
  }

  eventRepository.deleteEvent(eventId)
  return { success: true, data: { eventId, deleted: true } }
}

const getEventDays = async (eventId) => {
  const event = eventRepository.findEventById(eventId)
  if (!event) {
    throw new AppError(404, 'EVENT_NOT_FOUND', 'Event not found.')
  }

  return { success: true, data: eventRepository.findDaysByEvent(eventId) }
}

const getEventDayById = async (eventId, dayId) => {
  const day = eventRepository.findDayById(eventId, dayId)
  if (!day) {
    throw new AppError(404, 'EVENT_DAY_NOT_FOUND', 'Event day not found.')
  }

  return { success: true, data: day }
}

const createEventDay = async (eventId, payload = {}) => {
  const event = eventRepository.findEventById(eventId)
  if (!event) {
    throw new AppError(404, 'EVENT_NOT_FOUND', 'Event not found.')
  }

  const { dayId, dayNumber, name, date, startTime, endTime, venue, importantInfo } = payload
  if (!dayId || !dayNumber || !name || !date || !startTime || !endTime || !venue) {
    throw new AppError(400, 'VALIDATION_ERROR', 'dayId, dayNumber, name, date, startTime, endTime, and venue are required.')
  }

  const day = {
    eventId,
    dayId: String(dayId),
    dayNumber: Number(dayNumber),
    name: String(name).trim(),
    date: String(date),
    startTime: String(startTime),
    endTime: String(endTime),
    venue: String(venue).trim(),
    importantInfo: importantInfo || '',
  }

  eventRepository.createDay(day)
  return { success: true, data: day }
}

const updateEventDay = async (eventId, dayId, payload = {}) => {
  const day = eventRepository.findDayById(eventId, dayId)
  if (!day) {
    throw new AppError(404, 'EVENT_DAY_NOT_FOUND', 'Event day not found.')
  }

  const updated = eventRepository.updateDay(eventId, dayId, payload)
  return { success: true, data: updated }
}

const deleteEventDay = async (eventId, dayId) => {
  const day = eventRepository.findDayById(eventId, dayId)
  if (!day) {
    throw new AppError(404, 'EVENT_DAY_NOT_FOUND', 'Event day not found.')
  }

  eventRepository.deleteDay(eventId, dayId)
  return { success: true, data: { eventId, dayId, deleted: true } }
}

const getSchedule = async (eventId, dayId) => {
  const event = eventRepository.findEventById(eventId)
  if (!event) {
    throw new AppError(404, 'EVENT_NOT_FOUND', 'Event not found.')
  }

  return { success: true, data: eventRepository.findScheduleByEventDay(eventId, dayId) }
}

const createSchedule = async (eventId, dayId, payload = {}) => {
  const day = eventRepository.findDayById(eventId, dayId)
  if (!day) {
    throw new AppError(404, 'EVENT_DAY_NOT_FOUND', 'Event day not found.')
  }

  const { scheduleId, title, speaker, startTime, endTime, venue } = payload
  if (!scheduleId || !title || !speaker || !startTime || !endTime || !venue) {
    throw new AppError(400, 'VALIDATION_ERROR', 'scheduleId, title, speaker, startTime, endTime, and venue are required.')
  }

  const schedule = {
    scheduleId: String(scheduleId),
    eventId,
    dayId,
    title: String(title).trim(),
    speaker: String(speaker).trim(),
    startTime: String(startTime),
    endTime: String(endTime),
    venue: String(venue).trim(),
  }

  eventRepository.createSchedule(schedule)
  return { success: true, data: schedule }
}

const updateSchedule = async (scheduleId, payload = {}) => {
  const schedule = eventRepository.findScheduleById(scheduleId)
  if (!schedule) {
    throw new AppError(404, 'SCHEDULE_NOT_FOUND', 'Schedule not found.')
  }

  const updated = eventRepository.updateSchedule(scheduleId, payload)
  return { success: true, data: updated }
}

const deleteSchedule = async (scheduleId) => {
  const schedule = eventRepository.findScheduleById(scheduleId)
  if (!schedule) {
    throw new AppError(404, 'SCHEDULE_NOT_FOUND', 'Schedule not found.')
  }

  eventRepository.deleteSchedule(scheduleId)
  return { success: true, data: { scheduleId, deleted: true } }
}

const getParticipantById = async (participantId, user) => {
  const participant = userRepository.users.find((item) => item.id === participantId)
  if (!participant) {
    throw new AppError(404, 'PARTICIPANT_NOT_FOUND', 'Participant not found.')
  }

  if (user.role !== 'ADMIN' && user.userId !== participantId) {
    throw new AppError(403, 'FORBIDDEN', 'You do not have access to this participant record.')
  }

  return {
    success: true,
    data: {
      id: participant.id,
      fullName: participant.fullName,
      email: participant.email,
      role: participant.role,
    },
  }
}

const updateParticipantById = async (participantId, payload = {}, user) => {
  const participantIndex = userRepository.users.findIndex((item) => item.id === participantId)
  if (participantIndex === -1) {
    throw new AppError(404, 'PARTICIPANT_NOT_FOUND', 'Participant not found.')
  }

  if (user.role !== 'ADMIN' && user.userId !== participantId) {
    throw new AppError(403, 'FORBIDDEN', 'You do not have access to update this participant record.')
  }

  const participant = userRepository.users[participantIndex]
  const nextParticipant = {
    ...participant,
    ...(payload.fullName ? { fullName: String(payload.fullName).trim() } : {}),
  }

  userRepository.users[participantIndex] = nextParticipant

  return {
    success: true,
    data: {
      id: nextParticipant.id,
      fullName: nextParticipant.fullName,
      email: nextParticipant.email,
      role: nextParticipant.role,
    },
  }
}

const getAdminRegistrations = async () => ({
  success: true,
  data: await registrationRepository.findAll(),
})

const getAdminParticipants = async (query = {}) => {
  const registrations = await registrationRepository.findAll()
  const attendanceByRegistrationId = Object.fromEntries(
    (await getAttendanceRecords()).map((record) => [record.registrationId, record.status || 'NOT_MARKED']),
  )

  let list = registrations.map((registration) => {
    const accReq = Boolean(registration.accommodationRequired ?? registration.accommodation_required ?? false)
    const transReq = Boolean(registration.localTransportRequired ?? registration.local_transport_required ?? false)
    const phoneVal = registration.phone || registration.mobileNumber || ''
    return {
      registrationId: registration.registrationId,
      fullName: registration.fullName,
      email: registration.email,
      phone: phoneVal,
      mobileNumber: registration.mobileNumber || phoneVal,
      role: registration.role,
      instituteName: registration.instituteName,
      department: registration.department,
      status: registration.status,
      attendanceStatus: attendanceByRegistrationId[registration.registrationId] || 'NOT_MARKED',
      accommodation_required: accReq,
      local_transport_required: transReq,
      accommodationRequired: accReq,
      localTransportRequired: transReq,
      createdAt: registration.createdAt,
    }
  })

  const accommodationRequiredCount = list.filter((p) => p.accommodation_required).length
  const localTransportRequiredCount = list.filter((p) => p.local_transport_required).length

  const searchTerm = String(query.search || query.q || query.searchTerm || '').toLowerCase().trim()
  if (searchTerm) {
    list = list.filter((p) => {
      const matchFields = [
        p.fullName,
        p.email,
        p.phone,
        p.mobileNumber,
        p.registrationId,
        p.instituteName,
        p.department,
        p.role,
      ]
      return matchFields.some((field) => field && String(field).toLowerCase().includes(searchTerm))
    })
  }

  const roleFilter = String(query.role || '').toLowerCase().trim()
  if (roleFilter && roleFilter !== 'all') {
    list = list.filter((p) => String(p.role || '').toLowerCase() === roleFilter)
  }

  const statusFilter = String(query.status || '').toLowerCase().trim()
  if (statusFilter && statusFilter !== 'all') {
    list = list.filter((p) => String(p.status || '').toLowerCase() === statusFilter)
  }

  const accFilter = String(query.accommodation || query.accommodation_required || query.accommodationRequired || '').toLowerCase().trim()
  if (accFilter === 'required' || accFilter === 'true' || accFilter === 'yes') {
    list = list.filter((p) => p.accommodation_required === true)
  } else if (accFilter === 'not_required' || accFilter === 'not-required' || accFilter === 'not required' || accFilter === 'false' || accFilter === 'no') {
    list = list.filter((p) => p.accommodation_required === false)
  }

  const transFilter = String(query.local_transport || query.localTransport || query.local_transport_required || query.localTransportRequired || query.transport || '').toLowerCase().trim()
  if (transFilter === 'required' || transFilter === 'true' || transFilter === 'yes') {
    list = list.filter((p) => p.local_transport_required === true)
  } else if (transFilter === 'not_required' || transFilter === 'not-required' || transFilter === 'not required' || transFilter === 'false' || transFilter === 'no') {
    list = list.filter((p) => p.local_transport_required === false)
  }

  return {
    success: true,
    data: list,
    counts: {
      total: registrations.length,
      accommodationRequired: accommodationRequiredCount,
      localTransportRequired: localTransportRequiredCount,
    },
  }
}

const formatExcelDate = (val) => {
  if (!val) return ''
  try {
    const d = new Date(val)
    if (isNaN(d.getTime())) return String(val)
    const pad = (n) => String(n).padStart(2, '0')
    const yyyy = d.getFullYear()
    const mm = pad(d.getMonth() + 1)
    const dd = pad(d.getDate())
    const hh = pad(d.getHours())
    const min = pad(d.getMinutes())
    const ss = pad(d.getSeconds())
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`
  } catch (_e) {
    return String(val)
  }
}

const exportParticipantsToExcel = async (query = {}, profileOverride) => {
  const targetProfile = profileOverride || getActiveEventProfile() || 'pre-qiskit'
  return runWithProfile(targetProfile, async () => {
    const participantsResult = await getAdminParticipants(query)
    const participants = participantsResult.data || []
    const profileLabel = targetProfile === 'post-qiskit' ? 'Post-Qiskit' : 'Pre-Qiskit'

    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Qiskit Fall Fest 2026 Organizer Portal'
    workbook.created = new Date()

    const worksheet = workbook.addWorksheet('Participants', {
      views: [{ state: 'frozen', ySplit: 1 }],
    })

    worksheet.columns = [
      { header: 'Registration ID', key: 'registrationId', width: 22 },
      { header: 'Full Name', key: 'fullName', width: 26 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Phone Number', key: 'phone', width: 18 },
      { header: 'College / Institution', key: 'instituteName', width: 32 },
      { header: 'Department', key: 'department', width: 24 },
      { header: 'Year', key: 'year', width: 12 },
      { header: 'Gender', key: 'gender', width: 12 },
      { header: 'Accommodation Required', key: 'accommodationRequired', width: 24 },
      { header: 'Local Transport Required', key: 'localTransportRequired', width: 24 },
      { header: 'Registration Date', key: 'createdAt', width: 22 },
      { header: 'Event / Profile', key: 'eventProfile', width: 16 },
      { header: 'Registration Status', key: 'status', width: 20 },
    ]

    worksheet.autoFilter = 'A1:M1'

    // Style header row
    const headerRow = worksheet.getRow(1)
    headerRow.height = 28
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF3D2F59' },
      }
      cell.font = {
        name: 'Calibri',
        size: 11,
        bold: true,
        color: { argb: 'FFFFFFFF' },
      }
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: false,
      }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF5A4579' } },
        left: { style: 'thin', color: { argb: 'FF5A4579' } },
        bottom: { style: 'medium', color: { argb: 'FF2A1F3D' } },
        right: { style: 'thin', color: { argb: 'FF5A4579' } },
      }
    })

    // Populate participant rows
    participants.forEach((p) => {
      const regDate = p.createdAt ? formatExcelDate(p.createdAt) : ''
      const accStr = p.accommodation_required || p.accommodationRequired ? 'Yes' : 'No'
      const transStr = p.local_transport_required || p.localTransportRequired ? 'Yes' : 'No'
      const phoneStr = p.phone ? String(p.phone) : (p.mobileNumber ? String(p.mobileNumber) : '')
      const regIdStr = p.registrationId ? String(p.registrationId) : ''

      const row = worksheet.addRow({
        registrationId: regIdStr,
        fullName: p.fullName || '',
        email: p.email || '',
        phone: phoneStr,
        instituteName: p.instituteName || '',
        department: p.department || '',
        year: '',
        gender: '',
        accommodationRequired: accStr,
        localTransportRequired: transStr,
        createdAt: regDate,
        eventProfile: profileLabel,
        status: p.status || 'CONFIRMED',
      })

      row.height = 22

      row.eachCell((cell, colNumber) => {
        cell.font = { name: 'Calibri', size: 10 }
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          right: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        }
        cell.alignment = { vertical: 'middle', horizontal: 'left' }

        // Format Registration ID and Phone as TEXT
        if (colNumber === 1 || colNumber === 4) {
          cell.numFmt = '@'
          cell.alignment = { vertical: 'middle', horizontal: 'center' }
        }
        // Year, Gender, Accommodation, Transport, Date, Event Profile, Status centered
        if ([7, 8, 9, 10, 11, 12, 13].includes(colNumber)) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' }
        }
      })
    })

    return await workbook.xlsx.writeBuffer()
  })
}

const getAttendanceSummary = async () => {
  const registrations = await registrationRepository.findAll()
  const attendanceRecords = await getAttendanceRecords()
  const attendanceMap = Object.fromEntries(attendanceRecords.map((item) => [item.registrationId, item.status || 'NOT_MARKED']))

  return {
    success: true,
    data: registrations.map((participant) => ({
      registrationId: participant.registrationId,
      fullName: participant.fullName,
      email: participant.email,
      role: participant.role,
      attendanceStatus: attendanceMap[participant.registrationId] || 'NOT_MARKED',
      status: participant.status,
    })),
  }
}

const updateAttendanceStatus = async (registrationId, payload = {}) => {
  const participant = (await registrationRepository.findAll()).find((item) => item.registrationId === registrationId)

  if (!participant) {
    throw new AppError(404, 'PARTICIPANT_NOT_FOUND', 'Participant not found.')
  }

  const nextStatus = String(payload.status || 'NOT_MARKED').toUpperCase()
  if (!['PRESENT', 'ABSENT', 'NOT_MARKED'].includes(nextStatus)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Attendance status must be PRESENT, ABSENT, or NOT_MARKED.')
  }

  const saved = await setAttendanceRecord(registrationId, nextStatus, participant)

  return {
    success: true,
    data: {
      registrationId,
      fullName: saved.fullName,
      email: saved.email,
      attendanceStatus: saved.status,
      markedAt: saved.markedAt,
    },
  }
}

const getAdminEmailLogs = async () => ({
  success: true,
  data: notificationRepository.notifications,
})

const bulkImportStudents = async (students = [], options = {}) => {
  const dryRun = Boolean(options.dryRun)
  if (!Array.isArray(students)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Students must be an array.')
  }

  const results = []
  let totalProcessed = 0
  let newlyRegisteredCount = 0
  let alreadyRegisteredCount = 0
  let invalidCount = 0
  let emailSentCount = 0
  let emailFailedCount = 0

  for (const item of students) {
    totalProcessed++
    const rawName = String(item.name || item.fullName || '').trim()
    const rawCollege = String(item.college || item.instituteName || '').trim()
    const rawPhone = String(item.phone || item.mobileNumber || '').trim()
    const rawEmail = normalizeEmail(item.email)

    // Validation
    if (!rawName || rawName.length < 2) {
      invalidCount++
      results.push({
        name: rawName,
        college: rawCollege,
        phone: rawPhone,
        email: rawEmail,
        status: 'FAILED',
        registrationId: null,
        emailStatus: 'SKIPPED',
        error: 'Name must be at least 2 characters long.',
      })
      continue
    }

    if (!rawEmail || !isValidEmail(rawEmail)) {
      invalidCount++
      results.push({
        name: rawName,
        college: rawCollege,
        phone: rawPhone,
        email: rawEmail,
        status: 'FAILED',
        registrationId: null,
        emailStatus: 'SKIPPED',
        error: 'Invalid or missing email format.',
      })
      continue
    }

    if (!rawPhone) {
      invalidCount++
      results.push({
        name: rawName,
        college: rawCollege,
        phone: rawPhone,
        email: rawEmail,
        status: 'FAILED',
        registrationId: null,
        emailStatus: 'SKIPPED',
        error: 'Contact/phone number is required.',
      })
      continue
    }

    // Duplicate check in Pre-Qiskit registrations
    const existing = await registrationRepository.findByEmail(rawEmail)
    if (existing) {
      alreadyRegisteredCount++
      results.push({
        name: rawName,
        college: rawCollege || existing.instituteName,
        phone: rawPhone,
        email: rawEmail,
        status: 'ALREADY_REGISTERED',
        registrationId: existing.registrationId,
        emailStatus: 'NOT_SENT',
        error: null,
      })
      continue
    }

    if (dryRun) {
      newlyRegisteredCount++
      results.push({
        name: rawName,
        college: rawCollege,
        phone: rawPhone,
        email: rawEmail,
        status: 'WOULD_REGISTER',
        registrationId: null,
        emailStatus: 'WOULD_SEND',
        error: null,
      })
      continue
    }

    // Real run: create registration using existing ID generation mechanism
    try {
      const generatedId = await generateRegistrationId()
      const registrationRecord = {
        id: generatedId.id,
        registrationId: generatedId.registrationId,
        status: 'CONFIRMED',
        fullName: rawName,
        email: rawEmail,
        mobileNumber: rawPhone,
        role: 'STUDENT',
        instituteName: rawCollege || 'Not Specified',
        department: 'Not Specified',
        knowsPython: false,
        aicteQuantumCourse: false,
        knowsQuantumBasics: false,
        usedQiskitBefore: false,
        accommodation_required: Boolean(item.accommodation_required ?? item.accommodationRequired ?? false),
        local_transport_required: Boolean(item.local_transport_required ?? item.localTransportRequired ?? false),
        accommodationRequired: Boolean(item.accommodation_required ?? item.accommodationRequired ?? false),
        localTransportRequired: Boolean(item.local_transport_required ?? item.localTransportRequired ?? false),
        idCardUrl: 'bulk-import://pre-qiskit/student-id',
        createdAt: new Date().toISOString(),
      }

      await registrationRepository.createRegistration(registrationRecord, registrationRecord.idCardUrl)

      // Schedule event reminders for Pre-Qiskit
      try {
        await reminderService.scheduleRegistrationReminders(registrationRecord)
      } catch (remErr) {
        console.warn('[BULK_IMPORT_REMINDER_WARN]', {
          registrationId: registrationRecord.registrationId,
          error: remErr.message,
        })
      }

      // Send confirmation email via existing Nodemailer service
      let mailResultStatus = 'SENT'
      let mailErrorMsg = null

      try {
        await sendRegistrationConfirmationEmail(registrationRecord)
        emailSentCount++
      } catch (mailErr) {
        mailResultStatus = 'FAILED'
        emailFailedCount++
        mailErrorMsg = mailErr?.message || 'Email delivery failed'
        console.error('[BULK_IMPORT_EMAIL_ERROR]', {
          registrationId: registrationRecord.registrationId,
          email: rawEmail,
          error: mailErrorMsg,
        })
      }

      newlyRegisteredCount++
      results.push({
        name: rawName,
        college: rawCollege,
        phone: rawPhone,
        email: rawEmail,
        status: mailResultStatus === 'SENT' ? 'SUCCESS' : 'REGISTERED_EMAIL_FAILED',
        registrationId: registrationRecord.registrationId,
        emailStatus: mailResultStatus,
        error: mailErrorMsg,
      })
    } catch (createErr) {
      console.error('[BULK_IMPORT_INSERT_ERROR]', {
        email: rawEmail,
        error: createErr.message,
      })
      results.push({
        name: rawName,
        college: rawCollege,
        phone: rawPhone,
        email: rawEmail,
        status: 'FAILED',
        registrationId: null,
        emailStatus: 'NOT_SENT',
        error: createErr.message || 'Failed to insert registration.',
      })
    }
  }

  return {
    success: true,
    data: {
      dryRun,
      summary: {
        totalRecords: totalProcessed,
        validRecords: newlyRegisteredCount + alreadyRegisteredCount,
        invalidRecords: invalidCount,
        alreadyRegistered: alreadyRegisteredCount,
        newlyRegistered: newlyRegisteredCount,
        emailSent: emailSentCount,
        emailFailed: emailFailedCount,
      },
      results,
    },
  }
}

module.exports = {
  registerUser,
  loginParticipant,
  getCurrentParticipant,
  loginOrganizer,
  registerAuthUser,
  loginUser,
  bulkImportStudents,

  refreshAuthToken,
  logoutUser,
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventDays,
  getEventDayById,
  createEventDay,
  updateEventDay,
  deleteEventDay,
  getSchedule,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getParticipantById,
  updateParticipantById,
  getAdminRegistrations,
  getAdminParticipants,
  exportParticipantsToExcel,
  getAttendanceSummary,
  updateAttendanceStatus,
  getAdminEmailLogs,
  sendOrganizerEmail,
  getAttendanceRecords,
  setAttendanceRecord,
  registrationRepository,
  userRepository,
  eventRepository,
  notificationRepository,
  sendRegistrationConfirmationEmail,
  buildRegistrationConfirmationEmailContent,
  normalizeEmail,
  getMailConfiguration,
  sendMail,
}

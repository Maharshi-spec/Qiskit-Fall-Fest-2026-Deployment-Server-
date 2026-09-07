const { eventTimezone } = require('./env')

const TIMEZONE = eventTimezone || 'Asia/Kolkata'

const EVENT_PROFILES = {
  'pre-qiskit': {
    id: 'pre-qiskit',
    name: 'Pre-Qiskit Fall Fest',
    displayName: 'PRE-QISKIT FALL FEST',
    startDate: '2026-09-07',
    endDate: '2026-09-10',
    dateLabel: '7 Sep 2026 – 10 Sep 2026',
    shortDateLabel: '7 Sep - 10 Sep',
    timezone: TIMEZONE,
    days: [
      { dayNumber: 1, eventDate: '2026-09-07' },
      { dayNumber: 2, eventDate: '2026-09-08' },
      { dayNumber: 3, eventDate: '2026-09-09' },
      { dayNumber: 4, eventDate: '2026-09-10' },
    ],
  },
  'post-qiskit': {
    id: 'post-qiskit',
    name: 'Post-Qiskit Fall Fest',
    displayName: 'POST-QISKIT FALL FEST',
    startDate: '2026-10-05',
    endDate: '2026-10-10',
    dateLabel: '5 Oct 2026 – 10 Oct 2026',
    shortDateLabel: '5 Oct - 10 Oct',
    timezone: TIMEZONE,
    days: [
      { dayNumber: 1, eventDate: '2026-10-05' },
      { dayNumber: 2, eventDate: '2026-10-06' },
      { dayNumber: 3, eventDate: '2026-10-07' },
      { dayNumber: 4, eventDate: '2026-10-08' },
      { dayNumber: 5, eventDate: '2026-10-09' },
      { dayNumber: 6, eventDate: '2026-10-10' },
    ],
  },
}

const DEFAULT_PROFILE = 'pre-qiskit'
const ALLOWED_PROFILES = Object.keys(EVENT_PROFILES)

const isValidProfile = (profileId) => {
  return typeof profileId === 'string' && ALLOWED_PROFILES.includes(profileId.trim().toLowerCase())
}

const normalizeProfile = (profileId) => {
  if (!profileId) return DEFAULT_PROFILE
  const normalized = String(profileId).trim().toLowerCase()
  return isValidProfile(normalized) ? normalized : null
}

const getTodayInTimezone = (timezone = TIMEZONE, date = new Date()) => {
  const d = date instanceof Date ? date : new Date(date)
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return formatter.format(d)
}

const calculateProfileStatus = (profileId, referenceDate = new Date(), options = {}) => {
  const profile = EVENT_PROFILES[profileId]
  if (!profile) return 'UNKNOWN'

  if (options.enabled === false) {
    return 'DISABLED'
  }

  const startDate = options.startDate || profile.startDate
  const endDate = options.endDate || profile.endDate
  const timezone = options.timezone || profile.timezone

  const today = getTodayInTimezone(timezone, referenceDate)

  if (today < startDate) {
    return 'UPCOMING'
  }
  if (today > endDate) {
    return 'COMPLETED'
  }
  return 'GOING'
}

const getProfileSummary = (profileId, referenceDate = new Date()) => {
  const profile = EVENT_PROFILES[profileId]
  if (!profile) return null

  return {
    id: profile.id,
    name: profile.name,
    displayName: profile.displayName,
    startDate: profile.startDate,
    endDate: profile.endDate,
    dateLabel: profile.dateLabel,
    shortDateLabel: profile.shortDateLabel,
    timezone: profile.timezone,
    status: calculateProfileStatus(profile.id, referenceDate),
  }
}

const getAllProfilesSummary = (referenceDate = new Date()) => {
  return ALLOWED_PROFILES.map((id) => getProfileSummary(id, referenceDate))
}

const getProfileEventDays = (profileId) => {
  const profile = EVENT_PROFILES[profileId] || EVENT_PROFILES[DEFAULT_PROFILE]
  return profile.days
}

module.exports = {
  EVENT_PROFILES,
  DEFAULT_PROFILE,
  ALLOWED_PROFILES,
  isValidProfile,
  normalizeProfile,
  calculateProfileStatus,
  getProfileSummary,
  getAllProfilesSummary,
  getProfileEventDays,
  getTodayInTimezone,
}

export const TIMEZONE = 'Asia/Kolkata'

export const EVENT_PROFILES = {
  'pre-qiskit': {
    id: 'pre-qiskit',
    name: 'Pre-Qiskit Fall Fest',
    displayName: 'PRE-QISKIT FALL FEST',
    startDate: '2026-09-07',
    endDate: '2026-09-10',
    dateLabel: '7 Sep 2026 – 10 Sep 2026',
    shortDateLabel: '7 Sep - 10 Sep',
    timezone: TIMEZONE,
    description: 'Foundations of Quantum Computing, Qiskit SDK workshops, and collaborative hands-on learning.',
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
    description: 'Advanced Quantum Applications, grand quantum hackathon showcase, and prestigious awards celebration.',
  },
}

export const DEFAULT_PROFILE = 'pre-qiskit'
export const ALLOWED_PROFILES = Object.keys(EVENT_PROFILES)

export const isValidProfile = (profileId) => {
  return typeof profileId === 'string' && ALLOWED_PROFILES.includes(profileId.trim().toLowerCase())
}

export const normalizeProfile = (profileId) => {
  if (!profileId) return DEFAULT_PROFILE
  const normalized = String(profileId).trim().toLowerCase()
  return isValidProfile(normalized) ? normalized : null
}

export const getTodayInTimezone = (timezone = TIMEZONE, date = new Date()) => {
  const d = date instanceof Date ? date : new Date(date)
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return formatter.format(d)
}

export const calculateProfileStatus = (profileId, referenceDate = new Date()) => {
  const profile = EVENT_PROFILES[profileId]
  if (!profile) return 'UNKNOWN'

  const today = getTodayInTimezone(profile.timezone, referenceDate)
  const { startDate, endDate } = profile

  if (today < startDate) {
    return 'UPCOMING'
  }
  if (today > endDate) {
    return 'COMPLETED'
  }
  return 'GOING'
}

export const getProfileSummary = (profileId, referenceDate = new Date()) => {
  const profile = EVENT_PROFILES[profileId]
  if (!profile) return null

  return {
    ...profile,
    status: calculateProfileStatus(profile.id, referenceDate),
  }
}

export const getAllProfilesSummary = (referenceDate = new Date()) => {
  return ALLOWED_PROFILES.map((id) => getProfileSummary(id, referenceDate))
}

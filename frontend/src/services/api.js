const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
const ORGANIZER_TOKEN_KEY = 'qff-organizer-token'

const resolveApiUrl = (path = '') => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  if (!API_BASE_URL) {
    return normalizedPath
  }

  return `${API_BASE_URL}${normalizedPath}`
}

const readOrganizerToken = () => localStorage.getItem(ORGANIZER_TOKEN_KEY) || ''

const writeOrganizerToken = (token) => {
  if (token) {
    localStorage.setItem(ORGANIZER_TOKEN_KEY, token)
    return
  }

  localStorage.removeItem(ORGANIZER_TOKEN_KEY)
}

let currentEventProfile = localStorage.getItem('qff_active_profile') || 'pre-qiskit'

const getProfileHeader = () => ({
  'X-Event-Profile': currentEventProfile,
})

const buildJsonHeaders = (extra = {}) => ({
  'Content-Type': 'application/json',
  ...getProfileHeader(),
  ...extra,
})

const profileFetch = (url, options = {}) => {
  return fetch(url, {
    ...options,
    headers: {
      ...getProfileHeader(),
      ...(options.headers || {}),
    },
  })
}

const parseApiResponse = async (response) => {
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    return null
  }

  return response.json()
}

export const api = {
  baseUrl: API_BASE_URL,
  getUrl: resolveApiUrl,
  getOrganizerToken: readOrganizerToken,
  setOrganizerToken: writeOrganizerToken,
  clearOrganizerToken: () => writeOrganizerToken(''),
  getEventProfile: () => currentEventProfile,
  setEventProfile: (profile) => {
    if (profile) currentEventProfile = profile
  },
  async fetchEventProfiles() {
    try {
      const response = await profileFetch(resolveApiUrl('/api/v1/profiles'), {
        headers: buildJsonHeaders(),
        credentials: 'include',
      })
      const data = await parseApiResponse(response)
      return response.ok ? { success: true, data: data?.data || [] } : { success: false, data: [] }
    } catch (err) {
      return { success: false, data: [] }
    }
  },

  async submitRegistration(formData) {
    try {
      const response = await profileFetch(resolveApiUrl('/api/v1/registrations'), {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })

      const data = await parseApiResponse(response)

      if (!response.ok) {
        return {
          success: false,
          error: data?.error || { code: 'UNKNOWN_ERROR', message: 'Registration failed.' },
        }
      }

      return {
        success: true,
        data: data?.data || {},
      }
    } catch (err) {
      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message: 'Unable to connect to the server. Please check your connection and try again.' },
      }
    }
  },

  async loginParticipant(credentials) {
    try {
      const response = await profileFetch(resolveApiUrl('/api/v1/registrations/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
        credentials: 'include',
      })

      const contentType = response.headers.get('content-type') || ''
      const data = contentType.includes('application/json') ? await response.json() : null

      if (!response.ok) {
        return {
          success: false,
          error: data?.error || { code: 'INVALID_CREDENTIALS', message: 'Invalid email or registration ID.' },
        }
      }

      return {
        success: true,
        data: data?.data || {},
      }
    } catch (err) {
      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message: 'Unable to connect to the server. Please check your connection and try again.' },
      }
    }
  },

  async getCurrentUser(token) {
    try {
      const response = await profileFetch(resolveApiUrl('/api/v1/registrations/me'), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      })

      const contentType = response.headers.get('content-type') || ''
      const data = contentType.includes('application/json') ? await response.json() : null

      if (!response.ok) {
        return {
          success: false,
          status: response.status,
          error: data?.error || { code: 'UNAUTHORIZED', message: 'Session expired.' },
        }
      }

      return {
        success: true,
        status: response.status,
        data: data?.data || {},
      }
    } catch (err) {
      return {
        success: false,
        status: 0,
        error: { code: 'NETWORK_ERROR', message: 'Unable to connect to the server.' },
      }
    }
  },

  async organizerLogin(payload) {
    try {
      const response = await profileFetch(resolveApiUrl('/api/v1/organizers/login'), {
        method: 'POST',
        headers: buildJsonHeaders(),
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      const data = await parseApiResponse(response)

      if (!response.ok) {
        return {
          success: false,
          error: data?.error || { code: 'INVALID_CREDENTIALS', message: 'Invalid organizer credentials.' },
        }
      }

      const token = data?.data?.token
      if (token) {
        writeOrganizerToken(token)
      }

      return {
        success: true,
        data: data?.data || {},
      }
    } catch (err) {
      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message: 'Invalid organizer credentials.' },
      }
    }
  },

  async organizerFetchParticipants() {
    try {
      const response = await profileFetch(resolveApiUrl('/api/v1/admin/participants'), {
        headers: {
          Authorization: `Bearer ${readOrganizerToken()}`,
          ...buildJsonHeaders(),
        },
        credentials: 'include',
      })

      const data = await parseApiResponse(response)

      if (!response.ok) {
        return {
          success: false,
          error: data?.error || { code: 'REQUEST_FAILED', message: 'Unable to load participants.' },
        }
      }

      return {
        success: true,
        data: data?.data || [],
      }
    } catch (err) {
      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message: 'Unable to load participant records.' },
      }
    }
  },

  async organizerFetchAttendance() {
    try {
      const response = await profileFetch(resolveApiUrl('/api/v1/admin/attendance'), {
        headers: {
          Authorization: `Bearer ${readOrganizerToken()}`,
          ...buildJsonHeaders(),
        },
        credentials: 'include',
      })

      const data = await parseApiResponse(response)

      if (!response.ok) {
        return {
          success: false,
          error: data?.error || { code: 'REQUEST_FAILED', message: 'Unable to load attendance.' },
        }
      }

      return {
        success: true,
        data: data?.data || [],
      }
    } catch (err) {
      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message: 'Unable to load attendance records.' },
      }
    }
  },

  async organizerUpdateAttendance(registrationId, status) {
    try {
      const response = await profileFetch(resolveApiUrl(`/api/v1/admin/attendance/${registrationId}`), {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${readOrganizerToken()}`,
          ...buildJsonHeaders(),
        },
        credentials: 'include',
        body: JSON.stringify({ status }),
      })

      const data = await parseApiResponse(response)

      if (!response.ok) {
        return {
          success: false,
          error: data?.error || { code: 'UPDATE_FAILED', message: 'Attendance update failed.' },
        }
      }

      return {
        success: true,
        data: data?.data || {},
      }
    } catch (err) {
      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message: 'Unable to update attendance.' },
      }
    }
  },

  async organizerSendEmail(payload) {
    try {
      const response = await profileFetch(resolveApiUrl('/api/v1/admin/email/send'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${readOrganizerToken()}`,
          ...buildJsonHeaders(),
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      const data = await parseApiResponse(response)

      if (!response.ok) {
        return {
          success: false,
          error: data?.error || { code: 'EMAIL_FAILED', message: 'Unable to send email.' },
        }
      }

      return {
        success: true,
        data: data?.data || {},
      }
    } catch (err) {
      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message: 'Unable to send the email right now.' },
      }
    }
  },

  async organizerFetchCertificates() {
    try {
      const response = await profileFetch(resolveApiUrl('/api/v1/certificates'), {
        headers: {
          Authorization: `Bearer ${readOrganizerToken()}`,
          ...buildJsonHeaders(),
        },
        credentials: 'include',
      })

      const data = await parseApiResponse(response)

      if (!response.ok) {
        return {
          success: false,
          error: data?.error || { code: 'REQUEST_FAILED', message: 'Unable to fetch rewards.' },
        }
      }

      return {
        success: true,
        data: data?.data || [],
      }
    } catch (err) {
      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message: 'Unable to load certificates.' },
      }
    }
  },

  async organizerFetchEligibleParticipants(eventId, certificateType) {
    try {
      const response = await profileFetch(resolveApiUrl(`/api/v1/organizer/events/${eventId}/certificates/eligible?certificateType=${encodeURIComponent(certificateType)}`), {
        headers: { Authorization: `Bearer ${readOrganizerToken()}` },
        credentials: 'include',
      })
      const data = await parseApiResponse(response)
      return response.ok
        ? { success: true, data: data?.data || [] }
        : { success: false, error: data?.error || { message: 'Unable to load eligible participants.' } }
    } catch (err) {
      return { success: false, error: { code: 'NETWORK_ERROR', message: 'Unable to load eligible participants.' } }
    }
  },

  async organizerPreviewCertificateEligibility(eventId, certificateType) {
    try {
      const response = await profileFetch(resolveApiUrl(`/api/v1/organizer/events/${eventId}/certificates/eligibility-preview?certificateType=${encodeURIComponent(certificateType)}`), {
        headers: { Authorization: `Bearer ${readOrganizerToken()}` },
        credentials: 'include',
      })
      const data = await parseApiResponse(response)
      return response.ok
        ? { success: true, data: data?.data || {} }
        : { success: false, error: data?.error || { message: 'Unable to preview eligibility.' } }
    } catch (err) {
      return { success: false, error: { code: 'NETWORK_ERROR', message: 'Unable to preview eligibility.' } }
    }
  },

  async organizerGenerateCertificates(eventId, payload) {
    try {
      const response = await profileFetch(resolveApiUrl(`/api/v1/organizer/events/${eventId}/certificates/generate`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${readOrganizerToken()}`, ...buildJsonHeaders() },
        body: JSON.stringify(payload),
        credentials: 'include',
      })
      const data = await parseApiResponse(response)
      return response.ok
        ? { success: true, data: data?.data || [] }
        : { success: false, error: data?.error || { message: 'Unable to generate certificates.' } }
    } catch (err) {
      return { success: false, error: { code: 'NETWORK_ERROR', message: 'Unable to generate certificates.' } }
    }
  },

  async organizerFetchTeams(eventId) {
    try {
      const response = await profileFetch(resolveApiUrl(`/api/v1/organizer/events/${eventId}/teams`), {
        headers: { Authorization: `Bearer ${readOrganizerToken()}` },
        credentials: 'include',
      })
      const data = await parseApiResponse(response)
      return response.ok
        ? { success: true, data: data?.data || [] }
        : { success: false, error: data?.error || { message: 'Unable to load teams.' } }
    } catch (err) {
      return { success: false, error: { code: 'NETWORK_ERROR', message: 'Unable to load teams.' } }
    }
  },

  async organizerFetchTeamMembers(teamId) {
    try {
      const response = await profileFetch(resolveApiUrl(`/api/v1/organizer/teams/${teamId}/members`), {
        headers: { Authorization: `Bearer ${readOrganizerToken()}` },
        credentials: 'include',
      })
      const data = await parseApiResponse(response)
      return response.ok
        ? { success: true, data: data?.data || [] }
        : { success: false, error: data?.error || { message: 'Unable to load team members.' } }
    } catch (err) {
      return { success: false, error: { code: 'NETWORK_ERROR', message: 'Unable to load team members.' } }
    }
  },

  async organizerAssignHackathonAward(eventId, teamId, placement) {
    try {
      const response = await profileFetch(resolveApiUrl(`/api/v1/organizer/events/${eventId}/teams/${teamId}/award`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${readOrganizerToken()}`, ...buildJsonHeaders() },
        body: JSON.stringify({ placement }),
        credentials: 'include',
      })
      const data = await parseApiResponse(response)
      return response.ok
        ? { success: true, data: data?.data || {} }
        : { success: false, error: data?.error || { message: 'Unable to assign the award.' } }
    } catch (err) {
      return { success: false, error: { code: 'NETWORK_ERROR', message: 'Unable to assign the award.' } }
    }
  },

  async organizerGenerateAwardCertificates(eventId, teamId) {
    try {
      const response = await profileFetch(resolveApiUrl(`/api/v1/organizer/events/${eventId}/teams/${teamId}/certificates/generate`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${readOrganizerToken()}`, ...buildJsonHeaders() },
        credentials: 'include',
      })
      const data = await parseApiResponse(response)
      return response.ok
        ? { success: true, data: data?.data || [] }
        : { success: false, error: data?.error || { message: 'Unable to generate award certificates.' } }
    } catch (err) {
      return { success: false, error: { code: 'NETWORK_ERROR', message: 'Unable to generate award certificates.' } }
    }
  },

  async fetchParticipantCertificates(token) {
    try {
      const response = await profileFetch(resolveApiUrl('/api/v1/participants/me/certificates'), {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      })
      const data = await parseApiResponse(response)
      return response.ok
        ? { success: true, data: data?.data || [] }
        : { success: false, error: data?.error || { message: 'Unable to load certificates.' } }
    } catch (err) {
      return { success: false, error: { code: 'NETWORK_ERROR', message: 'Unable to load certificates.' } }
    }
  },

  async verifyCertificate(verificationCode) {
    try {
      const response = await profileFetch(resolveApiUrl(`/api/v1/certificates/verify/${encodeURIComponent(verificationCode)}`))
      const data = await parseApiResponse(response)
      return response.ok
        ? { success: true, data: data?.data || {} }
        : { success: false, error: data?.error || { message: 'Unable to verify certificate.' } }
    } catch (err) {
      return { success: false, error: { code: 'NETWORK_ERROR', message: 'Unable to verify certificate.' } }
    }
  },

  async fetchMyTeam(token) {
    try {
      const response = await profileFetch(resolveApiUrl('/api/v1/hackathon/team/me'), {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      })
      const data = await parseApiResponse(response)
      if (response.ok) {
        return { success: true, data: data?.data || null }
      }
      if (response.status === 404 || data?.error?.code === 'REGISTRATION_NOT_FOUND' || data?.error?.code === 'TEAM_NOT_FOUND') {
        return { success: true, data: null }
      }
      return { success: false, error: data?.error || { message: 'Unable to load team details.' } }
    } catch (err) {
      return { success: false, error: { code: 'NETWORK_ERROR', message: 'Unable to load team details.' } }
    }
  },

  async createTeam(token, payload) {
    try {
      const response = await profileFetch(resolveApiUrl('/api/v1/hackathon/team'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          ...buildJsonHeaders(),
        },
        body: JSON.stringify(payload),
        credentials: 'include',
      })
      const data = await parseApiResponse(response)
      return response.ok
        ? { success: true, data: data?.data || null }
        : { success: false, error: data?.error || { message: 'Unable to create team.' } }
    } catch (err) {
      return { success: false, error: { code: 'NETWORK_ERROR', message: 'Unable to create team.' } }
    }
  },

  async verifyHackathonParticipant(token, email) {
    try {
      const response = await profileFetch(resolveApiUrl(`/api/v1/hackathon/verify-participant?email=${encodeURIComponent(email)}`), {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      })
      const data = await parseApiResponse(response)
      return response.ok
        ? { success: true, data: data?.data || {} }
        : { success: false, error: data?.error || { message: 'Participant not found. All team members must be registered.' } }
    } catch (err) {
      return { success: false, error: { code: 'NETWORK_ERROR', message: 'Unable to verify participant email.' } }
    }
  },

  async organizerFetchHackathonStats(eventId = 'day-3') {
    try {
      const response = await profileFetch(resolveApiUrl(`/api/v1/hackathon/stats?eventId=${encodeURIComponent(eventId)}`), {
        headers: {
          Authorization: `Bearer ${readOrganizerToken()}`,
          ...buildJsonHeaders(),
        },
        credentials: 'include',
      })
      const data = await parseApiResponse(response)
      return response.ok
        ? { success: true, data: data?.data || {} }
        : { success: false, error: data?.error || { message: 'Unable to load hackathon statistics.' } }
    } catch (err) {
      return { success: false, error: { code: 'NETWORK_ERROR', message: 'Unable to connect to server.' } }
    }
  },

  async organizerFetchProblemStatements(eventId = 'day-3') {
    try {
      const response = await profileFetch(resolveApiUrl(`/api/v1/hackathon/problem-statements?eventId=${encodeURIComponent(eventId)}`), {
        headers: {
          Authorization: `Bearer ${readOrganizerToken()}`,
          ...buildJsonHeaders(),
        },
        credentials: 'include',
      })
      const data = await parseApiResponse(response)
      return response.ok
        ? { success: true, data: data?.data || [] }
        : { success: false, error: data?.error || { message: 'Unable to load problem statements.' } }
    } catch (err) {
      return { success: false, error: { code: 'NETWORK_ERROR', message: 'Unable to connect to server.' } }
    }
  },

  async organizerCreateProblemStatement(payload) {
    try {
      const response = await profileFetch(resolveApiUrl('/api/v1/hackathon/problem-statements'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${readOrganizerToken()}`,
          ...buildJsonHeaders(),
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      const data = await parseApiResponse(response)
      return response.ok
        ? { success: true, data: data?.data }
        : { success: false, error: data?.error || { message: 'Unable to create problem statement.' } }
    } catch (err) {
      return { success: false, error: { code: 'NETWORK_ERROR', message: 'Unable to connect to server.' } }
    }
  },

  async organizerUpdateProblemStatement(id, payload) {
    try {
      const response = await profileFetch(resolveApiUrl(`/api/v1/hackathon/problem-statements/${encodeURIComponent(id)}`), {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${readOrganizerToken()}`,
          ...buildJsonHeaders(),
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      const data = await parseApiResponse(response)
      return response.ok
        ? { success: true, data: data?.data }
        : { success: false, error: data?.error || { message: 'Unable to update problem statement.' } }
    } catch (err) {
      return { success: false, error: { code: 'NETWORK_ERROR', message: 'Unable to connect to server.' } }
    }
  },

  async organizerDeleteProblemStatement(id) {
    try {
      const response = await profileFetch(resolveApiUrl(`/api/v1/hackathon/problem-statements/${encodeURIComponent(id)}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${readOrganizerToken()}`,
          ...buildJsonHeaders(),
        },
        credentials: 'include',
      })
      const data = await parseApiResponse(response)
      return response.ok
        ? { success: true, data: data?.data }
        : { success: false, error: data?.error || { message: 'Unable to delete problem statement.' } }
    } catch (err) {
      return { success: false, error: { code: 'NETWORK_ERROR', message: 'Unable to connect to server.' } }
    }
  },

  async organizerFetchProblemSelections(id) {
    try {
      const response = await profileFetch(resolveApiUrl(`/api/v1/hackathon/problem-statements/${encodeURIComponent(id)}/selections`), {
        headers: {
          Authorization: `Bearer ${readOrganizerToken()}`,
          ...buildJsonHeaders(),
        },
        credentials: 'include',
      })
      const data = await parseApiResponse(response)
      return response.ok
        ? { success: true, data: data?.data || {} }
        : { success: false, error: data?.error || { message: 'Unable to load selections.' } }
    } catch (err) {
      return { success: false, error: { code: 'NETWORK_ERROR', message: 'Unable to connect to server.' } }
    }
  },

  async fetchParticipantProblemStatements(token = null) {
    try {
      const headers = { ...buildJsonHeaders() }
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }
      const response = await profileFetch(resolveApiUrl('/api/v1/hackathon/problem-statements?activeOnly=true'), {
        headers,
        credentials: 'include',
      })
      const data = await parseApiResponse(response)
      return response.ok
        ? { success: true, data: data?.data || [] }
        : { success: false, error: data?.error || { message: 'Unable to load problem statements.' } }
    } catch (err) {
      return { success: false, error: { code: 'NETWORK_ERROR', message: 'Unable to connect to server.' } }
    }
  },

  async fetchMyTeamProblemSelection(token) {
    try {
      const response = await profileFetch(resolveApiUrl('/api/v1/hackathon/my-team/problem-selection'), {
        headers: {
          Authorization: `Bearer ${token}`,
          ...buildJsonHeaders(),
        },
        credentials: 'include',
      })
      const data = await parseApiResponse(response)
      return response.ok
        ? { success: true, data: data?.data || { hasSelection: false, selection: null } }
        : { success: false, error: data?.error || { message: 'Unable to load team problem selection.' } }
    } catch (err) {
      return { success: false, error: { code: 'NETWORK_ERROR', message: 'Unable to connect to server.' } }
    }
  },

  async selectProblemStatement(token, problemStatementId) {
    try {
      const response = await profileFetch(resolveApiUrl(`/api/v1/hackathon/problem-statements/${encodeURIComponent(problemStatementId)}/select`), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          ...buildJsonHeaders(),
        },
        credentials: 'include',
      })
      const data = await parseApiResponse(response)
      return response.ok
        ? { success: true, data: data?.data }
        : { success: false, error: data?.error || { message: 'Unable to select problem statement.' } }
    } catch (err) {
      return { success: false, error: { code: 'NETWORK_ERROR', message: 'Unable to connect to server.' } }
    }
  },

  async organizerFetchEvents() {
    try {
      const response = await profileFetch(resolveApiUrl('/api/v1/organizer/events'), {
        headers: {
          Authorization: `Bearer ${readOrganizerToken()}`,
          ...buildJsonHeaders(),
        },
        credentials: 'include',
      })
      const data = await parseApiResponse(response)
      if (!response.ok) {
        return { success: false, error: data?.error || { message: 'Unable to load events.' } }
      }
      return { success: true, data: data?.data || [] }
    } catch (err) {
      return { success: false, error: { message: 'Unable to connect to server.' } }
    }
  },

  async organizerCreateEvent(payload) {
    try {
      const response = await profileFetch(resolveApiUrl('/api/v1/organizer/events'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${readOrganizerToken()}`,
          ...buildJsonHeaders(),
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      const data = await parseApiResponse(response)
      if (!response.ok) {
        return { success: false, error: data?.error || { message: 'Unable to create event.' } }
      }
      return { success: true, data: data?.data }
    } catch (err) {
      return { success: false, error: { message: 'Unable to connect to server.' } }
    }
  },

  async organizerStartAttendanceSession(eventId) {
    try {
      const response = await profileFetch(resolveApiUrl(`/api/v1/organizer/events/${eventId}/attendance/start`), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${readOrganizerToken()}`,
          ...buildJsonHeaders(),
        },
        credentials: 'include',
      })
      const data = await parseApiResponse(response)
      return { success: response.ok, data: data?.data }
    } catch (err) {
      return { success: false }
    }
  },

  async organizerStopAttendanceSession(eventId) {
    try {
      const response = await profileFetch(resolveApiUrl(`/api/v1/organizer/events/${eventId}/attendance/stop`), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${readOrganizerToken()}`,
          ...buildJsonHeaders(),
        },
        credentials: 'include',
      })
      const data = await parseApiResponse(response)
      return { success: response.ok, data: data?.data }
    } catch (err) {
      return { success: false }
    }
  },

  async organizerFetchQrToken(eventId) {
    try {
      const response = await profileFetch(resolveApiUrl(`/api/v1/organizer/events/${eventId}/attendance/token`), {
        headers: {
          Authorization: `Bearer ${readOrganizerToken()}`,
          ...buildJsonHeaders(),
        },
        credentials: 'include',
      })
      const data = await parseApiResponse(response)
      if (!response.ok) return { success: false }
      return { success: true, data: data?.data }
    } catch (err) {
      return { success: false }
    }
  },

  async organizerFetchAttendanceData(eventId) {
    try {
      const response = await profileFetch(resolveApiUrl(`/api/v1/organizer/events/${eventId}/attendance/data`), {
        headers: {
          Authorization: `Bearer ${readOrganizerToken()}`,
          ...buildJsonHeaders(),
        },
        credentials: 'include',
      })
      const data = await parseApiResponse(response)
      if (!response.ok) return { success: false, error: data?.error }
      return { success: true, data: data?.data }
    } catch (err) {
      return { success: false }
    }
  },

  async markAttendance(attendanceToken) {
    try {
      const token = localStorage.getItem('qff_auth_token') || ''
      const response = await profileFetch(resolveApiUrl('/api/v1/attendance/mark'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          ...buildJsonHeaders(),
        },
        credentials: 'include',
        body: JSON.stringify({ attendance_token: attendanceToken }),
      })
      const data = await parseApiResponse(response)
      if (!response.ok) {
        return {
          success: false,
          code: data?.error?.code || 'ATTENDANCE_FAILED',
          message: data?.error?.message || 'Unable to mark attendance.',
        }
      }
      return {
        success: true,
        alreadyMarked: Boolean(data?.alreadyMarked),
        message: data?.message || 'You have been successfully marked present for this event.',
        participant: data?.participant,
      }
    } catch (err) {
      return {
        success: false,
        code: 'NETWORK_ERROR',
        message: 'Unable to connect to server. Please try again.',
      }
    }
  },

  // ─── Post-Event Config API ─────────────────────────────────────────────────

  /** Public: get Post-Qiskit enabled state and safe display info */
  async getPostEventStatus() {
    try {
      const response = await fetch(resolveApiUrl('/api/v1/post-event/status'), {
        headers: buildJsonHeaders(),
        credentials: 'include',
      })
      const data = await parseApiResponse(response)
      return response.ok
        ? { success: true, data: data?.data || {} }
        : { success: false, data: {} }
    } catch (_err) {
      return { success: false, data: {} }
    }
  },

  /** Organizer: get full Post-Qiskit config (includes coordinator_contact) */
  async getPostEventConfig() {
    const token = readOrganizerToken()
    try {
      const response = await fetch(resolveApiUrl('/api/v1/post-event/config'), {
        headers: buildJsonHeaders({ Authorization: `Bearer ${token}` }),
        credentials: 'include',
      })
      const data = await parseApiResponse(response)
      if (!response.ok) {
        return { success: false, error: data?.error || { message: 'Failed to load config.' } }
      }
      return { success: true, data: data?.data || {} }
    } catch (_err) {
      return { success: false, error: { message: 'Network error.' } }
    }
  },

  /** Organizer: update Post-Qiskit config fields */
  async updatePostEventConfig(payload) {
    const token = readOrganizerToken()
    try {
      const response = await fetch(resolveApiUrl('/api/v1/post-event/config'), {
        method: 'PUT',
        headers: buildJsonHeaders({ Authorization: `Bearer ${token}` }),
        body: JSON.stringify(payload),
        credentials: 'include',
      })
      const data = await parseApiResponse(response)
      if (!response.ok) {
        return { success: false, error: data?.error || { message: 'Failed to update config.' } }
      }
      return { success: true, data: data?.data || {}, message: data?.message }
    } catch (_err) {
      return { success: false, error: { message: 'Network error.' } }
    }
  },

  /** Organizer: enable Post-Qiskit */
  async enablePostEvent() {
    const token = readOrganizerToken()
    try {
      const response = await fetch(resolveApiUrl('/api/v1/post-event/enable'), {
        method: 'POST',
        headers: buildJsonHeaders({ Authorization: `Bearer ${token}` }),
        credentials: 'include',
      })
      const data = await parseApiResponse(response)
      if (!response.ok) {
        return { success: false, error: data?.error || { message: 'Failed to enable Post-Qiskit.' } }
      }
      return { success: true, data: data?.data || {}, message: data?.message }
    } catch (_err) {
      return { success: false, error: { message: 'Network error.' } }
    }
  },

  /** Organizer: disable Post-Qiskit */
  async disablePostEvent() {
    const token = readOrganizerToken()
    try {
      const response = await fetch(resolveApiUrl('/api/v1/post-event/disable'), {
        method: 'POST',
        headers: buildJsonHeaders({ Authorization: `Bearer ${token}` }),
        credentials: 'include',
      })
      const data = await parseApiResponse(response)
      if (!response.ok) {
        return { success: false, error: data?.error || { message: 'Failed to disable Post-Qiskit.' } }
      }
      return { success: true, data: data?.data || {}, message: data?.message }
    } catch (_err) {
      return { success: false, error: { message: 'Network error.' } }
    }
  },
}


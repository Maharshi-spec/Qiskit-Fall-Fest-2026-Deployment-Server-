import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import Button from '../../components/Button'
import { api } from '../../services/api'

const ORGANIZER_EMAIL = 'admin@qiskitfallfest.com'
const ORGANIZER_PASSWORD = 'Admin@123'

const getOrganizerToken = () => api.getOrganizerToken()

const parseJwtPayload = (token) => {
  if (!token) return null
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    )
    return JSON.parse(jsonPayload)
  } catch (e) {
    return null
  }
}

const isOrganizerAuthenticated = () => {
  const token = getOrganizerToken()
  if (!token) return false
  const payload = parseJwtPayload(token)
  if (!payload) return false
  return payload.role === 'ORGANIZER' || payload.role === 'ADMIN'
}

const OrganizerLayout = ({ children }) => {
  const navigate = useNavigate()
  const profileRef = useRef(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  const organizerToken = getOrganizerToken()
  const organizerProfile = organizerToken ? parseJwtPayload(organizerToken) : null
  const organizerName = organizerProfile?.name || organizerProfile?.fullName || 'Organizer'
  const organizerEmail = organizerProfile?.email || ORGANIZER_EMAIL

  const handleLogout = () => {
    api.clearOrganizerToken()
    navigate('/organizer')
  }

  const navItems = [
    {
      label: 'Send Email',
      to: '/organizer/email',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
      ),
    },
    {
      label: 'Attendance',
      to: '/organizer/attendance',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      ),
    },
    {
      label: 'Participants',
      to: '/organizer/participants',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      label: 'Rewards',
      to: '/organizer/rewards',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="8" r="6" />
          <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
        </svg>
      ),
    },
    {
      label: 'Events',
      to: '/organizer/events',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
  ]

  return (
    <div className="organizer-layout">
      {/* TOP NAVBAR */}
      <header className="organizer-navbar">
        <div className="organizer-navbar__left">
          <button
            type="button"
            className="organizer-navbar__toggle"
            onClick={() => setSidebarOpen((prev) => !prev)}
            aria-label={sidebarOpen ? 'Close navigation sidebar' : 'Open navigation sidebar'}
            aria-expanded={sidebarOpen}
          >
            <span />
            <span />
            <span />
          </button>
          <div className="organizer-navbar__brand">
            <h1 className="organizer-navbar__title">Organizers Dashboard</h1>
            <p className="organizer-navbar__subheading">Event Operations</p>
          </div>
        </div>

        {/* TOP RIGHT NAVIGATION: Exactly [Profile Icon] [Logout] [Dashboard] */}
        <div className="organizer-navbar__actions">
          {/* 1. Profile Icon */}
          <div
            ref={profileRef}
            className="organizer-page__profile-wrap"
            onMouseEnter={() => setProfileOpen(true)}
            onMouseLeave={() => setProfileOpen(false)}
          >
            <button
              type="button"
              className="organizer-page__profile-button"
              onClick={() => setProfileOpen((open) => !open)}
              aria-expanded={profileOpen}
              aria-label="Organizer profile menu"
              title={organizerName}
            >
              <span className="organizer-page__profile-avatar">{organizerName.charAt(0).toUpperCase()}</span>
            </button>

            {profileOpen && (
              <div className="organizer-page__profile-popover" role="dialog" aria-label="Organizer profile">
                <div className="organizer-page__profile-summary">
                  <span className="organizer-page__profile-avatar organizer-page__profile-avatar--large">{organizerName.charAt(0).toUpperCase()}</span>
                  <div>
                    <strong>{organizerName}</strong>
                    <small>Organizer</small>
                  </div>
                </div>
                <div className="organizer-page__profile-meta">
                  <span>Email</span>
                  <strong>{organizerEmail}</strong>
                </div>
                <div className="organizer-page__profile-status">
                  <span className="organizer-page__role-badge">Organizer</span>
                </div>
              </div>
            )}
          </div>

          {/* 2. Logout */}
          <button type="button" className="button button--primary organizer-navbar__btn" onClick={handleLogout}>
            Logout
          </button>

          {/* 3. Dashboard */}
          <Link to="/organizer" className="button button--secondary organizer-navbar__btn">
            Dashboard
          </Link>
        </div>
      </header>

      {/* MAIN CONTAINER: SIDEBAR + CONTENT AREA */}
      <div className="organizer-layout__body">
        {/* MOBILE SIDEBAR BACKDROP */}
        {sidebarOpen && (
          <div
            className="organizer-sidebar__backdrop"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* LEFT SIDEBAR */}
        <aside className={`organizer-sidebar ${sidebarOpen ? 'is-open' : ''}`} aria-label="Organizer sidebar navigation">
          <nav className="organizer-sidebar__nav">
            {navItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                className={({ isActive }) => `organizer-sidebar__link ${isActive ? 'is-active' : ''}`}
                end={item.to === '/organizer'}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="organizer-sidebar__icon">{item.icon}</span>
                <span className="organizer-sidebar__label">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="organizer-layout__main" id="organizer-main-content">
          <div className="organizer-layout__content">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

const OrganizerLogin = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (error) {
      setError('')
    }
  }

  const handleLogin = async (event) => {
    event.preventDefault()
    setIsLoading(true)
    setError('')

    const result = await api.organizerLogin({
      email: form.email,
      password: form.password,
    })

    setIsLoading(false)

    if (result.success) {
      navigate('/organizer')
      return
    }

    setError('Invalid organizer credentials.')
  }

  return (
    <div className="detail-page">
      <div className="container detail-page__panel">
        <div className="detail-page__panel-copy">
          <p className="page-shell__eyebrow">Organizer access</p>
          <h2>Sign in to your dashboard.</h2>
          <p>This area is restricted to authorized organizers.</p>
        </div>

        <div className="detail-page__form-shell detail-page__form-shell--compact">
          <form className="detail-form" onSubmit={handleLogin}>
            {error && (
              <div style={{ padding: '0.8rem 0.9rem', borderRadius: '12px', background: 'rgba(255,79,163,0.08)', color: '#c2348a', border: '1px solid rgba(255,79,163,0.14)' }}>
                {error}
              </div>
            )}

            <label>
              Email
              <input type="email" name="email" value={form.email} onChange={handleChange} required />
            </label>

            <label>
              Password
              <input type="password" name="password" value={form.password} onChange={handleChange} required />
            </label>

            <Button type="submit" kind="primary" disabled={isLoading}>
              {isLoading ? 'Signing in…' : 'Login to Organizer Dashboard'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

const OrganizerPageHeading = ({ eyebrow, title, description, action }) => (
  <div className="organizer-page-heading">
    <div className="organizer-page-heading__copy">
      <p className="page-shell__eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
    {action && <div className="organizer-page-heading__action">{action}</div>}
  </div>
)

const OrganizerDashboardHome = () => {
  return (
    <div className="organizer-page-view organizer-dashboard-home">
      <OrganizerPageHeading eyebrow="Overview" title="Organizer dashboard" description="Use the left sidebar navigation to manage email communication, attendance sessions, participant records, reward certificates, and events." />
      <div className="organizer-page-content-panel">
        <div className="detail-page__info-stack">
        <div className="detail-info-item">
          <span>Operations</span>
          <strong>5 sections</strong>
        </div>
        <div className="detail-info-item">
          <span>Access</span>
          <strong>Restricted to organizers</strong>
        </div>
        </div>

        <div className="organizer-dashboard-home__cards">
        <Link to="/organizer/events" className="detail-card organizer-dashboard-home__card">
          <span className="organizer-dashboard-home__card-icon" aria-hidden="true">📅</span>
          <h3>Events</h3>
          <p>Browse and add festival events backed by the database.</p>
          <span className="organizer-dashboard-home__card-arrow">Open Events →</span>
        </Link>
        <Link to="/organizer/attendance" className="detail-card organizer-dashboard-home__card">
          <span className="organizer-dashboard-home__card-icon" aria-hidden="true">📱</span>
          <h3>Attendance</h3>
          <p>Run dynamic QR check-ins and review live attendance logs.</p>
          <span className="organizer-dashboard-home__card-arrow">Open Attendance →</span>
        </Link>
        <Link to="/organizer/participants" className="detail-card organizer-dashboard-home__card">
          <span className="organizer-dashboard-home__card-icon" aria-hidden="true">👥</span>
          <h3>Participants</h3>
          <p>Filter, search, and inspect registered attendee records.</p>
          <span className="organizer-dashboard-home__card-arrow">Open Participants →</span>
        </Link>
        <Link to="/organizer/rewards" className="detail-card organizer-dashboard-home__card">
          <span className="organizer-dashboard-home__card-icon" aria-hidden="true">🏆</span>
          <h3>Rewards</h3>
          <p>Manage prize workflows and generate completion certificates.</p>
          <span className="organizer-dashboard-home__card-arrow">Open Rewards →</span>
        </Link>
        <Link to="/organizer/email" className="detail-card organizer-dashboard-home__card">
          <span className="organizer-dashboard-home__card-icon" aria-hidden="true">✉️</span>
          <h3>Send Email</h3>
          <p>Dispatch official updates and notices to event participants.</p>
          <span className="organizer-dashboard-home__card-arrow">Open Email →</span>
        </Link>
        </div>
      </div>
    </div>
  )
}

const OrganizerEmailPage = () => {
  const [form, setForm] = useState({ role: '', subject: '', message: '' })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    const result = await api.organizerSendEmail({
      role: form.role,
      subject: form.subject,
      message: form.message,
    })

    setIsLoading(false)

    if (!result.success) {
      setError(result.error?.message || result.message || 'Email sending failed.')
      return
    }

    const sentCount = result.sent !== undefined ? result.sent : (result.data?.sent !== undefined ? result.data.sent : result.data?.participantCount)
    const failedCount = result.failed !== undefined ? result.failed : (result.data?.failed || 0)

    if (sentCount > 0) {
      const failedNote = failedCount > 0 ? ` (${failedCount} failed)` : ''
      setSuccess(`Email sent successfully to ${sentCount} participant(s)${failedNote}.`)
      setForm((prev) => ({ ...prev, subject: '', message: '' }))
    } else if (result.data?.participantCount === 0 || sentCount === 0) {
      setSuccess('No participants found for the selected role.')
    } else {
      setError('Email delivery failed for all recipients.')
    }
  }

  return (
    <div className="organizer-page-view organizer-email-page">
      <OrganizerPageHeading eyebrow="Send Email" title="Email participants" description="Send organizer messages using the real backend email service." action={<Button type="submit" form="organizer-email-form" kind="primary" disabled={isLoading}>{isLoading ? 'Sending…' : 'Send Email'}</Button>} />

      <div className="organizer-page-content-panel">
        <form id="organizer-email-form" className="detail-form organizer-email-page__form" onSubmit={handleSubmit}>
          {error && (
            <div style={{ padding: '0.8rem 0.9rem', borderRadius: '12px', background: 'rgba(255,79,163,0.08)', color: '#c2348a', border: '1px solid rgba(255,79,163,0.14)' }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ padding: '0.8rem 0.9rem', borderRadius: '12px', background: 'rgba(42, 190, 120, 0.08)', color: '#1b8f65', border: '1px solid rgba(42, 190, 120, 0.14)' }}>
              {success}
            </div>
          )}

          <label>
            Role *
            <select name="role" value={form.role || ''} onChange={handleChange} required>
              <option value="">Select your role</option>
              <option value="Student">Student</option>
              <option value="Faculty">Faculty</option>
              <option value="Professional">Professional</option>
              <option value="Other">Other</option>
            </select>
          </label>

          <label>
            Subject
            <input type="text" name="subject" value={form.subject} onChange={handleChange} placeholder="Email subject" required />
          </label>

          <label>
            Message
            <textarea name="message" rows="8" value={form.message} onChange={handleChange} placeholder="Write your message here..." required style={{ width: '100%', borderRadius: '12px', border: '1px solid rgba(255,79,163,0.18)', padding: '0.8rem 0.9rem' }} />
          </label>

        </form>
      </div>
    </div>
  )
}

const QR_REFRESH_SECONDS = 5
const QR_REFRESH_MS = QR_REFRESH_SECONDS * 1000

const OrganizerAttendancePage = () => {
  const [events, setEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [sessionActive, setSessionActive] = useState(false)
  const [qrToken, setQrToken] = useState('')
  const [countdown, setCountdown] = useState(QR_REFRESH_SECONDS)
  const [attendanceCount, setAttendanceCount] = useState(0)
  const [records, setRecords] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [sessionError, setSessionError] = useState('')

  const rotationRequestIdRef = useRef(0)

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true)
      const res = await api.organizerFetchEvents()
      setIsLoading(false)
      if (res.success && res.data) {
        setEvents(res.data)
      }
    }
    fetchEvents()
  }, [])

  const loadAttendanceData = async (eventId) => {
    const res = await api.organizerFetchAttendanceData(eventId)
    if (res.success && res.data) {
      setAttendanceCount(res.data.count || 0)
      setRecords(res.data.records || [])
    }
  }

  const checkAndFetchSessionState = async (eventId) => {
    setSessionError('')
    const reqId = ++rotationRequestIdRef.current
    const res = await api.organizerFetchQrToken(eventId)
    if (reqId !== rotationRequestIdRef.current) return

    if (res.success && res.data?.token) {
      setSessionActive(true)
      setQrToken(res.data.token)
      setCountdown(QR_REFRESH_SECONDS)
    } else {
      setSessionActive(false)
      setQrToken('')
    }
  }

  useEffect(() => {
    if (!selectedEvent) return

    const eventId = selectedEvent.eventId || selectedEvent.event_id
    loadAttendanceData(eventId)
    checkAndFetchSessionState(eventId)

    const tokenInterval = setInterval(async () => {
      if (sessionActive) {
        const reqId = ++rotationRequestIdRef.current
        const res = await api.organizerFetchQrToken(eventId)
        if (reqId !== rotationRequestIdRef.current) return

        if (res.success && res.data?.token) {
          setQrToken(res.data.token)
          setCountdown(QR_REFRESH_SECONDS)
        } else {
          setSessionActive(false)
          setQrToken('')
        }
      }
    }, QR_REFRESH_MS)

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => (prev > 1 ? prev - 1 : QR_REFRESH_SECONDS))
    }, 1000)

    const dataPollInterval = setInterval(() => {
      loadAttendanceData(eventId)
    }, 2000)

    return () => {
      rotationRequestIdRef.current += 1
      clearInterval(tokenInterval)
      clearInterval(countdownInterval)
      clearInterval(dataPollInterval)
    }
  }, [selectedEvent, sessionActive])

  const toggleSession = async () => {
    if (!selectedEvent) return
    const eventId = selectedEvent.eventId || selectedEvent.event_id
    setSessionError('')

    if (sessionActive) {
      rotationRequestIdRef.current += 1
      const stopRes = await api.organizerStopAttendanceSession(eventId)
      if (stopRes.success) {
        setSessionActive(false)
        setQrToken('')
      } else {
        setSessionError(stopRes.error?.message || 'Failed to stop attendance session.')
      }
    } else {
      const reqId = ++rotationRequestIdRef.current
      const startRes = await api.organizerStartAttendanceSession(eventId)
      if (reqId !== rotationRequestIdRef.current) return

      if (startRes.success && startRes.data?.token) {
        setSessionActive(true)
        setQrToken(startRes.data.token)
        setCountdown(QR_REFRESH_SECONDS)
      } else {
        setSessionError(startRes.error?.message || 'Failed to start attendance session.')
      }
    }
  }

  if (!selectedEvent) {
    return (
      <div className="organizer-page-view organizer-attendance-page">
        <OrganizerPageHeading eyebrow="Attendance Management" title="Select an Event for Attendance" description="Select an event below to open its Event Attendance Board and launch dynamic QR code check-in." />

        {isLoading ? (
          <div className="detail-info-item"><span>Loading</span><strong>Fetching events list…</strong></div>
        ) : (
          <div className="organizer-attendance-page__grid">
            {events.map((evt) => (
              <div
                key={evt.eventId}
                className="detail-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justify: 'space-between',
                  padding: '1.25rem',
                  border: '1px solid rgba(255,79,163,0.18)',
                  borderRadius: '16px',
                  background: 'rgba(255,255,255,0.85)',
                }}
              >
                <div>
                  <p className="detail-card__eyebrow" style={{ color: '#ff4fa3' }}>{evt.date}</p>
                  <h3 style={{ fontSize: '1.15rem', margin: '0.4rem 0', color: '#2d253f' }}>{evt.name}</h3>
                  <p style={{ fontSize: '0.9rem', color: '#5f5773', marginBottom: '0.8rem' }}>{evt.description}</p>
                  <span style={{ fontSize: '0.82rem', color: '#88809e' }}>📍 {evt.venue}</span>
                </div>
                <button
                  type="button"
                  className="button button--primary"
                  onClick={() => setSelectedEvent(evt)}
                  style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}
                >
                  Open Attendance Board →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="organizer-page-view organizer-attendance-page">
      <OrganizerPageHeading eyebrow="Event Attendance Board" title={selectedEvent.name} description={`📍 ${selectedEvent.venue} (${selectedEvent.date})`} action={<div className="organizer-page-heading__buttons">
          <button
            type="button"
            className={`button ${sessionActive ? 'button--secondary' : 'button--primary'}`}
            onClick={toggleSession}
          >
            {sessionActive ? 'Stop Session' : 'Start Session'}
          </button>
          <button
            type="button"
            className="button button--secondary"
            onClick={() => {
              setSelectedEvent(null)
              setQrToken('')
            }}
          >
            ← Back to Events List
          </button>
        </div>} />

      <div className="organizer-page-content-panel organizer-attendance-page__board">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '0.5rem' }}>
        {/* Dynamic QR Board */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          border: '1px solid rgba(255, 79, 163, 0.2)',
          borderRadius: '20px',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
        }}>
          <p style={{ fontWeight: 700, color: '#3d2f59', fontSize: '1rem', marginBottom: '0.5rem' }}>
            DYNAMIC ATTENDANCE QR
          </p>

          {sessionActive && qrToken ? (
            <>
              <div style={{
                background: '#ffffff',
                padding: '1rem',
                borderRadius: '16px',
                border: '2px solid rgba(255,79,163,0.3)',
                boxShadow: '0 4px 20px rgba(255,79,163,0.12)',
              }}>
                <QRCodeSVG key={qrToken} value={qrToken} size={210} level="M" includeMargin />
              </div>

              <div style={{ marginTop: '1rem', width: '100%' }}>
                <div style={{
                  display: 'flex',
                  justify: 'space-between',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#6e6584',
                  marginBottom: '0.3rem',
                }}>
                  <span>Backend QR Refresh</span>
                  <span style={{ color: '#ff4fa3' }}>{countdown}s</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,79,163,0.15)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${(countdown / QR_REFRESH_SECONDS) * 100}%`,
                    background: '#ff4fa3',
                    transition: 'width 1s linear',
                  }} />
                </div>
              </div>

              <p style={{ fontSize: '0.8rem', color: '#7a7291', marginTop: '0.75rem' }}>
                🔒 Expiration enforced by backend every {QR_REFRESH_SECONDS} seconds. Screenshots will be rejected.
              </p>
            </>
          ) : (
            <div style={{ padding: '3rem 1rem', color: '#7a7291' }}>
              <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>Attendance Session Paused</p>
              <p style={{ fontSize: '0.9rem' }}>Click "Start Session" above to display the dynamic QR code.</p>
            </div>
          )}

          <div style={{
            marginTop: '1.25rem',
            padding: '0.75rem 1.5rem',
            borderRadius: '14px',
            background: 'rgba(255, 79, 163, 0.08)',
            border: '1px solid rgba(255, 79, 163, 0.2)',
            width: '100%',
          }}>
            <span style={{ fontSize: '0.85rem', color: '#6e6584', display: 'block' }}>Total Marked Present</span>
            <strong style={{ fontSize: '1.8rem', color: '#ff4fa3', fontWeight: 800 }}>{attendanceCount}</strong>
          </div>
        </div>

        {/* Live Attendance Log Table */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          border: '1px solid rgba(255, 79, 163, 0.2)',
          borderRadius: '20px',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#3d2f59' }}>LIVE ATTENDANCE</h3>
            <span style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              padding: '0.25rem 0.6rem',
              borderRadius: '20px',
              background: sessionActive ? 'rgba(42, 190, 120, 0.12)' : 'rgba(120,120,120,0.1)',
              color: sessionActive ? '#1b8f65' : '#666',
            }}>
              {sessionActive ? '● LIVE UPDATES' : 'OFFLINE'}
            </span>
          </div>

          {records.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#7a7291', fontSize: '0.9rem' }}>
              No participants marked present for this event yet.
            </div>
          ) : (
            <div style={{ overflowY: 'auto', maxHeight: '380px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,79,163,0.15)', textAlign: 'left', color: '#6e6584' }}>
                    <th style={{ padding: '0.6rem' }}>Participant</th>
                    <th style={{ padding: '0.6rem' }}>Registration ID</th>
                    <th style={{ padding: '0.6rem' }}>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id || r.registrationId + r.markedAt} style={{ borderBottom: '1px solid rgba(255,79,163,0.08)' }}>
                      <td style={{ padding: '0.6rem' }}>
                        <div style={{ fontWeight: 700, color: '#2d253f' }}>{r.fullName}</div>
                        <div style={{ fontSize: '0.78rem', color: '#7a7291' }}>{r.email}</div>
                      </td>
                      <td style={{ padding: '0.6rem', color: '#ff4fa3', fontWeight: 600 }}>{r.registrationId}</td>
                      <td style={{ padding: '0.6rem', color: '#6e6584', fontSize: '0.8rem' }}>
                        {r.markedAt ? new Date(r.markedAt).toLocaleTimeString() : 'Just now'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  )
}

const OrganizerParticipantsPage = () => {
  const participantRoleOptions = [
    { value: 'STUDENT', label: 'Student' },
    { value: 'FACULTY', label: 'Faculty' },
    { value: 'PROFESSIONAL', label: 'Professional' },
    { value: 'OTHER', label: 'Other' },
  ]
  const [participants, setParticipants] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState('ALL')

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      setError('')
      const result = await api.organizerFetchParticipants()
      setIsLoading(false)

      if (!result.success) {
        setError(result.error?.message || 'Unable to load participants.')
        return
      }

      setParticipants(Array.isArray(result.data) ? result.data : [])
    }

    load()
  }, [])

  const normalizedSearchTerm = searchTerm.trim().toLowerCase()
  const filteredParticipants = participants.filter((participant) => {
    const matchesSearch = !normalizedSearchTerm || `${participant.fullName || ''} ${participant.email || ''}`.toLowerCase().includes(normalizedSearchTerm)
    const matchesRole = selectedRole === 'ALL' || String(participant.role || '').toUpperCase() === selectedRole
    return matchesSearch && matchesRole
  })
  const hasFilters = Boolean(normalizedSearchTerm) || selectedRole !== 'ALL'

  return (
    <div className="organizer-page-view organizer-participants-page">
      <OrganizerPageHeading eyebrow="Participants" title="Registered participant records" />

      {isLoading ? (
        <div className="detail-info-item"><span>Loading</span><strong>Fetching participant records…</strong></div>
      ) : error ? (
        <div style={{ padding: '0.9rem', borderRadius: '12px', background: 'rgba(255,79,163,0.06)', color: '#c2348a', border: '1px solid rgba(255,79,163,0.14)' }}>{error}</div>
      ) : participants.length === 0 ? (
        <div className="detail-info-item"><span>Empty state</span><strong>No participants registered yet.</strong></div>
      ) : (
        <div className="organizer-page-content-panel organizer-participants organizer-participants__body">
          <div className="organizer-participants__filters">
            <label className="organizer-participants__search" htmlFor="participant-search">
              <span>Search participants</span>
              <div className="organizer-participants__search-control">
                <span aria-hidden="true">⌕</span>
                <input id="participant-search" type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search by name or email..." />
                {searchTerm && <button type="button" onClick={() => setSearchTerm('')}>Clear</button>}
              </div>
            </label>
            <label className="organizer-participants__role" htmlFor="participant-role">
              <span>Role</span>
              <select id="participant-role" value={selectedRole} onChange={(event) => setSelectedRole(event.target.value)}>
                <option value="ALL">All Roles</option>
                {participantRoleOptions.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
              </select>
            </label>
          </div>

          <div className="organizer-participants__summary" aria-live="polite">
            <span>{hasFilters ? `Showing ${filteredParticipants.length} of ${participants.length} participants` : `Showing ${participants.length} participants`}</span>
            {hasFilters && <button type="button" onClick={() => { setSearchTerm(''); setSelectedRole('ALL') }}>Clear filters</button>}
          </div>

          <div className="organizer-page__table-wrap organizer-participants__table-wrap">
          <table className="organizer-page__table organizer-participants__table">
            <thead>
              <tr style={{ background: 'rgba(255,79,163,0.06)' }}>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {filteredParticipants.length > 0 ? filteredParticipants.map((participant) => (
                <tr key={participant.registrationId || participant.email} style={{ borderTop: '1px solid rgba(255,79,163,0.08)' }}>
                  <td data-label="Name">{participant.fullName}</td>
                  <td data-label="Email">{participant.email}</td>
                  <td data-label="Role">{participantRoleOptions.find((role) => role.value === String(participant.role || '').toUpperCase())?.label || participant.role}</td>
                </tr>
              )) : <tr className="organizer-participants__empty-row"><td colSpan="3"><strong>No registered participants found.</strong><span>Try searching with a different name or email.</span></td></tr>}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  )
}

const getRewardParticipant = (participant) => participant.fullName || participant.full_name || participant.email || participant.participant_name || participant.participant_email || 'Participant'
const normalizeRewardEvents = (responseData) => {
  const eventRows = Array.isArray(responseData) ? responseData : Array.isArray(responseData?.events) ? responseData.events : []
  return eventRows.map((event) => ({
    ...event,
    event_id: event.event_id || event.eventId,
    event_name: event.event_name || event.eventName || event.name,
    event_type: event.event_type || event.eventType,
  }))
}

const eventTypeCertificateMap = {
  GENERAL: 'GENERAL_EVENT_PARTICIPATION',
  HACKATHON: 'HACKATHON_PARTICIPATION',
  WEBINAR: 'WEBINAR_PARTICIPATION',
  WORKSHOP: 'WORKSHOP_PARTICIPATION',
  BOOTCAMP: 'QUANTUM_BOOTCAMP_COMPLETION',
}

const hackathonPlacements = [
  { value: 'FIRST_POSITION', label: '1st Position' },
  { value: 'FIRST_RUNNERS_UP', label: '1st Runners Up' },
  { value: 'SECOND_RUNNERS_UP', label: '2nd Runners Up' },
]

const OrganizerRewardsPage = () => {
  const [events, setEvents] = useState([])
  const [selectedEventId, setSelectedEventId] = useState('')
  const [eligibleParticipants, setEligibleParticipants] = useState([])
  const [alreadyIssued, setAlreadyIssued] = useState([])
  const [excludedParticipants, setExcludedParticipants] = useState([])
  const [teams, setTeams] = useState([])
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [teamMembers, setTeamMembers] = useState([])
  const [placement, setPlacement] = useState('FIRST_POSITION')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isEligibilityLoading, setIsEligibilityLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const selectedEvent = events.find((event) => event.event_id === selectedEventId) || null
  const eventType = String(selectedEvent?.event_type || '').toUpperCase()
  const certificateType = eventTypeCertificateMap[eventType] || ''
  const isHackathon = eventType === 'HACKATHON'

  const loadEligibility = async (eventId, type) => {
    if (!eventId || !type) return
    setIsEligibilityLoading(true)
    const result = await api.organizerPreviewCertificateEligibility(eventId, type)
    setIsEligibilityLoading(false)
    if (!result.success) {
      setError(result.error?.message || 'Unable to load certificate eligibility.')
      setEligibleParticipants([])
      setAlreadyIssued([])
      setExcludedParticipants([])
      return
    }
    const preview = result.data || {}
    setEligibleParticipants(Array.isArray(preview.eligibleParticipants) ? preview.eligibleParticipants.filter((participant) => !(preview.alreadyIssued || []).some((issued) => String(issued.registrationId) === String(participant.registrationId))) : [])
    setAlreadyIssued(Array.isArray(preview.alreadyIssued) ? preview.alreadyIssued : [])
    setExcludedParticipants(Array.isArray(preview.excludedParticipants) ? preview.excludedParticipants : [])
  }

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      setError('')
      const eventsResult = await api.organizerFetchEvents()
      setIsLoading(false)
      if (!eventsResult.success) {
        setError(eventsResult.error?.message || 'Unable to load events.')
        return
      }
      const nextEvents = normalizeRewardEvents(eventsResult.data)
      setEvents(nextEvents)
      if (nextEvents.length > 0) setSelectedEventId(nextEvents[0].event_id)
    }
    load()
  }, [])

  useEffect(() => {
    setError('')
    setSuccess('')
    setEligibleParticipants([])
    setAlreadyIssued([])
    setExcludedParticipants([])
    setTeams([])
    setSelectedTeamId('')
    setTeamMembers([])
    if (!selectedEventId) return
    if (!certificateType) {
      setError(`Unsupported event type: ${eventType || 'unknown'}.`)
      return
    }
    loadEligibility(selectedEventId, certificateType)
    if (isHackathon) {
      api.organizerFetchTeams(selectedEventId).then((result) => {
        if (!result.success) setError(result.error?.message || 'Unable to load hackathon teams.')
        setTeams(Array.isArray(result.data) ? result.data : [])
      })
    }
  }, [selectedEventId, certificateType, eventType, isHackathon])

  useEffect(() => {
    if (!selectedTeamId) {
      setTeamMembers([])
      return
    }
    api.organizerFetchTeamMembers(selectedTeamId).then((result) => {
      if (!result.success) setError(result.error?.message || 'Unable to load team members.')
      setTeamMembers(Array.isArray(result.data) ? result.data : [])
    })
  }, [selectedTeamId])

  const handleGenerateCertificates = async () => {
    if (!selectedEventId || !certificateType || !eligibleParticipants.length || isGenerating) return
    setIsGenerating(true)
    setError('')
    setSuccess('')
    const result = await api.organizerGenerateCertificates(selectedEventId, {
      certificateType,
      registrationIds: eligibleParticipants.map((participant) => participant.publicRegistrationId),
    })
    setIsGenerating(false)
    if (!result.success) {
      setError(result.error?.message || 'Unable to generate certificates.')
      return
    }
    setSuccess(`${result.data?.length || 0} certificate(s) generated successfully.`)
    await loadEligibility(selectedEventId, certificateType)
  }

  const handleAssignAward = async () => {
    if (!selectedEventId || !selectedTeamId || isAssigning) return
    setIsAssigning(true)
    setError('')
    setSuccess('')
    const result = await api.organizerAssignHackathonAward(selectedEventId, selectedTeamId, placement)
    setIsAssigning(false)
    if (!result.success) {
      setError(result.error?.message || 'Unable to assign hackathon award.')
      return
    }
    setSuccess('Hackathon award assigned successfully.')
    await loadEligibility(selectedEventId, eventTypeCertificateMap.HACKATHON_FIRST_POSITION)
  }

  const handleGenerateAwardCertificates = async () => {
    if (!selectedEventId || !selectedTeamId || isGenerating) return
    setIsGenerating(true)
    setError('')
    setSuccess('')
    const result = await api.organizerGenerateAwardCertificates(selectedEventId, selectedTeamId)
    setIsGenerating(false)
    if (!result.success) {
      setError(result.error?.message || 'Unable to generate award certificates.')
      return
    }
    setSuccess(`${result.data?.length || 0} team certificate(s) generated successfully.`)
  }

  return (
    <div className="organizer-page-view organizer-rewards">
      <OrganizerPageHeading eyebrow="Rewards" title="Certificates and reward records" description="Choose a certificate category to review its reward workflow." />

      {isLoading ? (
        <div className="detail-info-item"><span>Loading</span><strong>Loading events...</strong></div>
      ) : events.length === 0 ? (
        <div className="detail-info-item"><span>Empty state</span><strong>No events are available.</strong></div>
      ) : error ? (
        <div style={{ padding: '0.9rem', borderRadius: '12px', background: 'rgba(255,79,163,0.06)', color: '#c2348a', border: '1px solid rgba(255,79,163,0.14)' }}>{error}</div>
      ) : (
        <div className="organizer-page-content-panel organizer-rewards__content">
          <section className="organizer-rewards__selector" aria-label="Reward category selector">
            <label htmlFor="reward-category">Select event</label>
            <select id="reward-category" value={selectedEventId} onChange={(eventChange) => setSelectedEventId(eventChange.target.value)}>
              {events.map((event) => <option key={event.event_id} value={event.event_id}>{event.event_name}</option>)}
            </select>
          </section>

          {success && <div style={{ padding: '0.9rem', borderRadius: '12px', background: 'rgba(42,190,120,0.08)', color: '#1b8f65', border: '1px solid rgba(42,190,120,0.18)' }}>{success}</div>}
          {isEligibilityLoading && <div className="detail-info-item"><span>Loading</span><strong>Reviewing eligibility...</strong></div>}

          {isHackathon ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Part A: Hackathon Participant Certificates */}
              <section className="organizer-rewards__workflow" style={{ border: '1px solid rgba(255, 79, 163, 0.15)', borderRadius: '12px', padding: '1.5rem', background: '#fff' }}>
                <div className="organizer-rewards__section-heading">
                  <span className="organizer-rewards__kicker">Hackathon Certificates</span>
                  <h3>Hackathon Participant Certificate</h3>
                  <p>Eligibility is determined by valid registered hackathon team membership.</p>
                </div>
                <div className="organizer-rewards__mapping">
                  <span>Eligibility summary</span>
                  <strong>Eligible: {eligibleParticipants.length} | Already issued: {alreadyIssued.length} | Excluded: {excludedParticipants.length}</strong>
                </div>
                <div className="organizer-rewards__participants" style={{ maxHeight: '250px', overflowY: 'auto', marginBottom: '1.2rem', padding: '0.5rem', border: '1px solid #f0f0f0', borderRadius: '8px', background: '#fafafa' }}>
                  {eligibleParticipants.length > 0 ? eligibleParticipants.map((participant) => (
                    <div className="organizer-rewards__participant" key={participant.registrationId || participant.email} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0' }}>
                      <span aria-hidden="true" style={{ color: '#ff4fa3' }}>✓</span>
                      <div>
                        <strong style={{ display: 'block' }}>{getRewardParticipant(participant)}</strong>
                        <small style={{ color: '#666' }}>{participant.publicRegistrationId} · {participant.email} · Team: {participant.teamName || 'N/A'}</small>
                      </div>
                    </div>
                  )) : <p className="organizer-rewards__empty">No eligible participants in the current records.</p>}
                </div>
                <button
                  type="button"
                  className="button button--primary"
                  onClick={handleGenerateCertificates}
                  disabled={!selectedEventId || isEligibilityLoading || isGenerating || eligibleParticipants.length === 0}
                >
                  {isGenerating ? 'Generating Participant Certificates...' : 'Generate Hackathon Participant Certificates'}
                </button>
              </section>

              {/* Part B: Hackathon Award / Winner Certificates */}
              <section className="organizer-rewards__workflow" style={{ border: '1px solid rgba(255, 79, 163, 0.15)', borderRadius: '12px', padding: '1.5rem', background: '#fff' }}>
                <div className="organizer-rewards__section-heading">
                  <span className="organizer-rewards__kicker">Hackathon Certificates</span>
                  <h3>Hackathon Winner Certificates</h3>
                  <p>Choose an award to automatically use its certificate template (1st Position, 1st Runner Up, 2nd Runner Up).</p>
                </div>
                <label htmlFor="reward-team" style={{ display: 'block', marginTop: '1rem', fontWeight: 'bold' }}>Select team</label>
                <select id="reward-team" value={selectedTeamId} onChange={(eventChange) => setSelectedTeamId(eventChange.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #ccc', margin: '0.5rem 0 1rem 0' }}>
                  <option value="">Select Team</option>
                  {teams.map((team) => <option key={team.id} value={team.id}>{team.team_name}</option>)}
                </select>
                <fieldset className="organizer-rewards__award-list" style={{ border: '1px solid #f0f0f0', borderRadius: '8px', padding: '1rem', marginBottom: '1.2rem' }}>
                  <legend style={{ padding: '0 0.5rem', fontWeight: 'bold' }}>Award</legend>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {hackathonPlacements.map((award) => (
                      <label key={award.value} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input type="radio" name="hackathon-award" value={award.value} checked={placement === award.value} onChange={() => setPlacement(award.value)} />
                        {award.label}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <button type="button" className="button button--primary" onClick={handleAssignAward} disabled={!selectedTeamId || isAssigning} style={{ marginBottom: '1rem' }}>
                  {isAssigning ? 'Assigning Award...' : 'Assign Award'}
                </button>
                <div className="organizer-rewards__mapping" style={{ margin: '1rem 0' }}>
                  <span>Team members</span>
                  <strong>{teamMembers.length ? teamMembers.map((member) => member.fullName).join(', ') : 'No team selected'}</strong>
                </div>
                <button type="button" className="button button--secondary" onClick={handleGenerateAwardCertificates} disabled={!selectedTeamId || !teamMembers.length || isGenerating}>
                  {isGenerating ? 'Generating Award Certificates...' : 'Generate Award Certificates'}
                </button>
              </section>
            </div>
          ) : (
            <section className="organizer-rewards__workflow">
              <div className="organizer-rewards__section-heading">
                <span className="organizer-rewards__kicker">{selectedEvent?.name || 'Event'}</span>
                <h3>Eligible participants</h3>
                <p>Eligibility comes from the existing attendance records for this event.</p>
              </div>
              <div className="organizer-rewards__mapping"><span>Eligibility summary</span><strong>Eligible: {eligibleParticipants.length} | Already issued: {alreadyIssued.length} | Excluded: {excludedParticipants.length}</strong></div>
              <div className="organizer-rewards__participants">
                {eligibleParticipants.length > 0 ? eligibleParticipants.map((participant) => (
                  <div className="organizer-rewards__participant" key={participant.registrationId || participant.email}>
                    <span aria-hidden="true">✓</span>
                    <strong>{getRewardParticipant(participant)}</strong>
                    <small>{participant.publicRegistrationId} · {participant.email}</small>
                  </div>
                )) : <p className="organizer-rewards__empty">No eligible participants in the current records.</p>}
              </div>
              <button type="button" className="button button--primary" onClick={handleGenerateCertificates} disabled={!selectedEventId || isEligibilityLoading || isGenerating || eligibleParticipants.length === 0}>{isGenerating ? 'Generating Certificates...' : 'Generate Certificates'}</button>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

const OrganizerEventsPage = () => {
  const [events, setEvents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    event_name: '',
    description: '',
    event_date: '',
    start_time: '',
    end_time: '',
    location: '',
    status: 'active',
  })
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')

  const loadEvents = async () => {
    setIsLoading(true)
    setError('')
    const res = await api.organizerFetchEvents()
    setIsLoading(false)
    if (res.success && Array.isArray(res.data)) {
      setEvents(res.data)
    } else {
      setError(res.error?.message || 'Failed to load events from database.')
    }
  }

  useEffect(() => {
    loadEvents()
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (formError) setFormError('')
  }

  const handleAddEventSubmit = async (e) => {
    e.preventDefault()
    setFormLoading(true)
    setFormError('')
    setFormSuccess('')

    const payload = {
      event_name: formData.event_name.trim(),
      description: formData.description.trim(),
      event_date: formData.event_date,
      start_time: formData.start_time || null,
      end_time: formData.end_time || null,
      location: formData.location.trim(),
      status: formData.status || 'active',
    }

    const res = await api.organizerCreateEvent(payload)
    setFormLoading(false)

    if (!res.success) {
      setFormError(res.error?.message || 'Unable to create event. Please verify your inputs.')
      return
    }

    setFormSuccess('Event successfully created and saved to database!')
    setFormData({
      event_name: '',
      description: '',
      event_date: '',
      start_time: '',
      end_time: '',
      location: '',
      status: 'active',
    })
    await loadEvents()
    setTimeout(() => {
      setModalOpen(false)
      setFormSuccess('')
    }, 1100)
  }

  const formatEventDate = (dateVal) => {
    if (!dateVal) return 'Date TBA'
    const str = String(dateVal).slice(0, 10)
    const parts = str.split('-')
    if (parts.length === 3) {
      const [y, m, d] = parts.map(Number)
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        const localDate = new Date(y, m - 1, d)
        return localDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
      }
    }
    return str
  }

  const formatTimeRange = (start, end) => {
    if (!start && !end) return null
    if (start && end) return `${start.slice(0, 5)} - ${end.slice(0, 5)}`
    if (start) return `Starts at ${start.slice(0, 5)}`
    return `Until ${end.slice(0, 5)}`
  }

  return (
    <div className="organizer-page-view organizer-events-page">
      <OrganizerPageHeading eyebrow="Events Management" title="Events" description="Monitor all scheduled sessions and manage events stored in the database." action={<button
          type="button"
          className="button button--primary organizer-events__add-btn"
          onClick={() => {
            setModalOpen(true)
            setFormError('')
            setFormSuccess('')
          }}
        >
          <span aria-hidden="true" style={{ fontSize: '1.1rem', marginRight: '0.35rem' }}>＋</span>
          Add Event
        </button>} />

      <div className="organizer-page-content-panel">
      {isLoading ? (
        <div className="detail-info-item">
          <span>Loading</span>
          <strong>Fetching events from database…</strong>
        </div>
      ) : error ? (
        <div className="organizer-events__alert organizer-events__alert--error">
          <p>{error}</p>
          <button type="button" className="button button--secondary" onClick={loadEvents} style={{ marginTop: '0.5rem' }}>
            Retry
          </button>
        </div>
      ) : events.length === 0 ? (
        <div className="detail-info-item">
          <span>Empty State</span>
          <strong>No events exist in the database yet. Click "Add Event" to create the first one.</strong>
        </div>
      ) : (
        <div className="organizer-events__grid">
          {events.map((evt) => {
            const timeDisplay = formatTimeRange(evt.startTime || evt.start_time, evt.endTime || evt.end_time)
            const dateDisplay = formatEventDate(evt.date || evt.event_date)
            const statusVal = evt.status || 'active'
            const isConfirmed = statusVal.toLowerCase() === 'active' || statusVal.toLowerCase() === 'confirmed'

            return (
              <div key={evt.eventId || evt.event_id} className="organizer-event-card">
                <div className="organizer-event-card__top">
                  <span className="organizer-event-card__date">{dateDisplay}</span>
                  <span className={`organizer-event-card__status ${isConfirmed ? 'is-active' : ''}`}>
                    {statusVal}
                  </span>
                </div>

                <h3 className="organizer-event-card__title">{evt.name || evt.event_name}</h3>

                {evt.description && (
                  <p className="organizer-event-card__desc">{evt.description}</p>
                )}

                <div className="organizer-event-card__meta">
                  {(evt.venue || evt.location) && (
                    <span className="organizer-event-card__meta-item">
                      <span aria-hidden="true">📍</span> {evt.venue || evt.location}
                    </span>
                  )}
                  {timeDisplay && (
                    <span className="organizer-event-card__meta-item">
                      <span aria-hidden="true">⏰</span> {timeDisplay}
                    </span>
                  )}
                  {(evt.eventId || evt.event_id) && (
                    <span className="organizer-event-card__meta-item organizer-event-card__id">
                      ID: <code>{evt.eventId || evt.event_id}</code>
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
      </div>

      {/* ADD EVENT MODAL */}
      {modalOpen && (
        <div
          className="organizer-modal__backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-event-title"
          onClick={() => setModalOpen(false)}
        >
          <div className="organizer-modal__dialog" onClick={(e) => e.stopPropagation()}>
            <div className="organizer-modal__header">
              <div>
                <p className="page-shell__eyebrow">Database Operation</p>
                <h3 id="add-event-title" style={{ margin: 0 }}>Add Event</h3>
              </div>
              <button
                type="button"
                className="organizer-modal__close-btn"
                onClick={() => setModalOpen(false)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <form className="detail-form organizer-modal__form" onSubmit={handleAddEventSubmit}>
              {formError && (
                <div className="organizer-events__alert organizer-events__alert--error">
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="organizer-events__alert organizer-events__alert--success">
                  {formSuccess}
                </div>
              )}

              <label>
                Event Name *
                <input
                  type="text"
                  name="event_name"
                  value={formData.event_name}
                  onChange={handleInputChange}
                  placeholder="e.g. Quantum Computing Workshop"
                  required
                />
              </label>

              <label>
                Description
                <textarea
                  name="description"
                  rows="3"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Brief summary of this session..."
                  style={{ width: '100%', borderRadius: '12px', border: '1px solid rgba(255,79,163,0.18)', padding: '0.8rem 0.9rem' }}
                />
              </label>

              <div className="organizer-modal__form-row">
                <label>
                  Event Date *
                  <input
                    type="date"
                    name="event_date"
                    value={formData.event_date}
                    onChange={handleInputChange}
                    required
                  />
                </label>
                <label>
                  Status
                  <select name="status" value={formData.status} onChange={handleInputChange}>
                    <option value="active">Active</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="completed">Completed</option>
                  </select>
                </label>
              </div>

              <div className="organizer-modal__form-row">
                <label>
                  Start Time
                  <input
                    type="time"
                    name="start_time"
                    value={formData.start_time}
                    onChange={handleInputChange}
                  />
                </label>
                <label>
                  End Time
                  <input
                    type="time"
                    name="end_time"
                    value={formData.end_time}
                    onChange={handleInputChange}
                  />
                </label>
              </div>

              <label>
                Location / Venue
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g. CUTM-AP Campus Auditorium or Virtual"
                />
              </label>

              <div className="organizer-modal__actions">
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => setModalOpen(false)}
                  disabled={formLoading}
                >
                  Cancel
                </button>
                <Button type="submit" kind="primary" disabled={formLoading}>
                  {formLoading ? 'Saving to Database…' : 'Save Event'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const OrganizerRoutes = () => {
  const location = useLocation()

  if (!isOrganizerAuthenticated()) {
    return <Navigate to="/organizer" replace state={{ from: location }} />
  }

  return (
    <OrganizerLayout>
      <Routes>
        <Route index element={<OrganizerDashboardHome />} />
        <Route path="email" element={<OrganizerEmailPage />} />
        <Route path="attendance" element={<OrganizerAttendancePage />} />
        <Route path="participants" element={<OrganizerParticipantsPage />} />
        <Route path="rewards" element={<OrganizerRewardsPage />} />
        <Route path="events" element={<OrganizerEventsPage />} />
      </Routes>
    </OrganizerLayout>
  )
}

const OrganizerPage = () => {
  const location = useLocation()

  if (!isOrganizerAuthenticated()) {
    return <OrganizerLogin />
  }

  if (location.pathname === '/organizer') {
    return (
      <OrganizerLayout>
        <OrganizerDashboardHome />
      </OrganizerLayout>
    )
  }

  return <OrganizerRoutes />
}

export default OrganizerPage
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import Button from '../../components/Button'
import { api } from '../../services/api'
import ProfileSwitcher from '../../components/ProfileSwitcher'
import { useEventProfile } from '../../context/EventProfileContext'

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
  const { getProfilePath } = useEventProfile()

  useEffect(() => {
    if (!profileOpen) return

    const handlePointerDown = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [profileOpen])

  const organizerToken = getOrganizerToken()
  const organizerProfile = organizerToken ? parseJwtPayload(organizerToken) : null
  const organizerName = organizerProfile?.name || organizerProfile?.fullName || 'Organizer'
  const organizerEmail = organizerProfile?.email || ORGANIZER_EMAIL

  const handleLogout = () => {
    api.clearOrganizerToken()
    navigate(getProfilePath('organizer'))
  }

  const navItems = [
    {
      label: 'Send Email',
      to: getProfilePath('organizer/email'),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
      ),
    },
    {
      label: 'Attendance',
      to: getProfilePath('organizer/attendance'),
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
      to: getProfilePath('organizer/participants'),
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
      label: 'Hackathon',
      to: getProfilePath('organizer/hackathon'),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      ),
    },
    {
      label: 'Rewards',
      to: getProfilePath('organizer/rewards'),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="8" r="6" />
          <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
        </svg>
      ),
    },
    {
      label: 'Events',
      to: getProfilePath('organizer/events'),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
    {
      label: 'Post-Event',
      to: getProfilePath('organizer/post-event'),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
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

        {/* TOP RIGHT NAVIGATION: Exactly [ProfileSwitcher] [Profile Icon] [Dashboard] */}
        <div className="organizer-navbar__actions">
          <ProfileSwitcher compact />
          {/* 1. Profile Icon */}
          <div
            ref={profileRef}
            className="organizer-page__profile-wrap"
          >
            <button
              type="button"
              className="organizer-page__profile-button"
              onClick={() => setProfileOpen((open) => !open)}
              aria-expanded={profileOpen}
              aria-haspopup="menu"
              aria-controls="organizer-profile-popover"
              aria-label="Organizer profile menu"
              title={organizerName}
            >
              <span className="organizer-page__profile-avatar">{organizerName.charAt(0).toUpperCase()}</span>
            </button>

            {profileOpen && (
              <div
                id="organizer-profile-popover"
                className="organizer-page__profile-popover"
                role="menu"
                aria-label="Organizer profile"
              >
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
                <div className="organizer-page__profile-footer">
                  <button
                    type="button"
                    className="button button--primary organizer-page__profile-logout"
                    onClick={() => {
                      setProfileOpen(false)
                      handleLogout()
                    }}
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 2. Dashboard */}
          <Link to={getProfilePath('organizer')} className="button button--secondary organizer-navbar__btn">
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
        <aside className={`organizer-sidebar ${sidebarOpen ? 'is-open' : ''}`} aria-label="Organizer operations navigation">
          <div className="organizer-sidebar__header">
            <span className="organizer-sidebar__section-title">OPERATIONS</span>
            {sidebarOpen && (
              <button
                type="button"
                className="organizer-sidebar__close-btn"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close navigation sidebar"
              >
                ✕
              </button>
            )}
          </div>

          <nav className="organizer-sidebar__nav">
            {navItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                className={({ isActive }) => `organizer-sidebar__link ${isActive ? 'is-active' : ''}`}
                end={item.to === getProfilePath('organizer')}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="organizer-sidebar__indicator" aria-hidden="true" />
                <span className="organizer-sidebar__icon" aria-hidden="true">{item.icon}</span>
                <span className="organizer-sidebar__label">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="organizer-sidebar__footer">
            <div className="organizer-sidebar__footer-badge">
              <span className="organizer-sidebar__footer-dot" aria-hidden="true" />
              <span>Operations Console</span>
            </div>
          </div>
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
  const { getProfilePath } = useEventProfile()
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
      navigate(getProfilePath('organizer'))
      return
    }

    setError('Invalid organizer credentials.')
  }

  const operations = [
    {
      label: 'Participants',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      label: 'Attendance',
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
      label: 'Hackathon',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      ),
    },
    {
      label: 'Rewards',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="8" r="7" />
          <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
        </svg>
      ),
    },
    {
      label: 'Events',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
    {
      label: 'Post-Event',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
      ),
    },
  ]

  return (
    <div className="organizer-login">
      <div className="organizer-login__container">
        {/* TOP BRANDING BAR */}
        <header className="organizer-login__header">
          <Link to={getProfilePath('')} className="organizer-login__brand" title="Return to Event Site">
            <span className="organizer-login__brand-icon" aria-hidden="true">⚛</span>
            <span className="organizer-login__brand-name">Qiskit Fall Fest 2026</span>
          </Link>
          <div className="organizer-login__header-badge">
            <span className="organizer-login__header-badge-dot" aria-hidden="true" />
            <span>Event Operations</span>
          </div>
        </header>

        {/* MAIN TWO-COLUMN GRID */}
        <div className="organizer-login__grid">
          {/* LEFT: CONTEXT / IDENTITY PANEL */}
          <section className="organizer-login__context" aria-labelledby="organizer-login-title">
            <p className="organizer-login__eyebrow">ORGANIZER CONSOLE</p>
            <h1 id="organizer-login-title" className="organizer-login__title">
              Manage Qiskit Fall Fest 2026
            </h1>
            <p className="organizer-login__subtitle">
              Secure access to event operations, attendance, participants, hackathon workflows, rewards, and post-event configuration.
            </p>

            <div className="organizer-login__ops" aria-label="Console operation domains">
              <span className="organizer-login__ops-heading">CONSOLE CAPABILITIES</span>
              <ul className="organizer-login__ops-list" role="list">
                {operations.map((op) => (
                  <li key={op.label} className="organizer-login__op-item">
                    <span className="organizer-login__op-icon" aria-hidden="true">
                      {op.icon}
                    </span>
                    <span className="organizer-login__op-label">{op.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* RIGHT: FOCUSED AUTHENTICATION FORM */}
          <section className="organizer-login__card" aria-labelledby="organizer-signin-heading">
            <div className="organizer-login__card-header">
              <h2 id="organizer-signin-heading" className="organizer-login__card-title">
                Organizer sign in
              </h2>
              <p className="organizer-login__card-subtitle">
                Sign in to access the event operations dashboard.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                aria-live="polite"
                className="organizer-login__error-banner"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="organizer-login__error-icon"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form className="organizer-login__form" onSubmit={handleLogin} noValidate={false}>
              <div className="organizer-login__field">
                <label htmlFor="organizer-email" className="organizer-login__label">
                  Email
                </label>
                <input
                  id="organizer-email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  placeholder="admin@qiskitfallfest.com"
                  required
                  disabled={isLoading}
                  className="organizer-login__input"
                />
              </div>

              <div className="organizer-login__field">
                <label htmlFor="organizer-password" className="organizer-login__label">
                  Password
                </label>
                <input
                  id="organizer-password"
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  required
                  disabled={isLoading}
                  className="organizer-login__input"
                />
              </div>

              <Button
                type="submit"
                kind="primary"
                disabled={isLoading}
                className="organizer-login__submit-btn"
              >
                {isLoading ? 'Signing in…' : 'Sign in to Organizer Dashboard'}
              </Button>
            </form>

            <div className="organizer-login__footer-note">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>Authorized personnel only. Sessions are encrypted and audited.</span>
            </div>
          </section>
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
  const { getProfilePath } = useEventProfile()

  return (
    <div className="organizer-page-view organizer-dashboard-home">
      <OrganizerPageHeading eyebrow="Overview" title="Organizer dashboard" description="Use the left sidebar navigation to manage email communication, attendance sessions, participant records, reward certificates, and events." />
      <div className="organizer-page-content-panel">
        <div className="detail-page__info-stack">
        <div className="detail-info-item">
          <span>Operations</span>
          <strong>7 sections</strong>
        </div>
        <div className="detail-info-item">
          <span>Access</span>
          <strong>Restricted to organizers</strong>
        </div>
        </div>

        <div className="organizer-dashboard-home__cards">
        <Link to={getProfilePath('organizer/events')} className="detail-card organizer-dashboard-home__card">
          <span className="organizer-dashboard-home__card-icon" aria-hidden="true">📅</span>
          <h3>Events</h3>
          <p>Browse and add festival events backed by the database.</p>
          <span className="organizer-dashboard-home__card-arrow">Open Events →</span>
        </Link>
        <Link to={getProfilePath('organizer/attendance')} className="detail-card organizer-dashboard-home__card">
          <span className="organizer-dashboard-home__card-icon" aria-hidden="true">📱</span>
          <h3>Attendance</h3>
          <p>Run dynamic QR check-ins and review live attendance logs.</p>
          <span className="organizer-dashboard-home__card-arrow">Open Attendance →</span>
        </Link>
        <Link to={getProfilePath('organizer/participants')} className="detail-card organizer-dashboard-home__card">
          <span className="organizer-dashboard-home__card-icon" aria-hidden="true">👥</span>
          <h3>Participants</h3>
          <p>Filter, search, and inspect registered attendee records.</p>
          <span className="organizer-dashboard-home__card-arrow">Open Participants →</span>
        </Link>
        <Link to={getProfilePath('organizer/hackathon')} className="detail-card organizer-dashboard-home__card">
          <span className="organizer-dashboard-home__card-icon" aria-hidden="true">💻</span>
          <h3>Hackathon</h3>
          <p>Create problem statements, manage capacity limits, and view team selections.</p>
          <span className="organizer-dashboard-home__card-arrow">Open Hackathon →</span>
        </Link>
        <Link to={getProfilePath('organizer/rewards')} className="detail-card organizer-dashboard-home__card">
          <span className="organizer-dashboard-home__card-icon" aria-hidden="true">🏆</span>
          <h3>Rewards</h3>
          <p>Manage prize workflows and generate completion certificates.</p>
          <span className="organizer-dashboard-home__card-arrow">Open Rewards →</span>
        </Link>
        <Link to={getProfilePath('organizer/email')} className="detail-card organizer-dashboard-home__card">
          <span className="organizer-dashboard-home__card-icon" aria-hidden="true">✉️</span>
          <h3>Send Email</h3>
          <p>Dispatch official updates and notices to event participants.</p>
          <span className="organizer-dashboard-home__card-arrow">Open Email →</span>
        </Link>
        <Link to={getProfilePath('organizer/post-event')} className="detail-card organizer-dashboard-home__card">
          <span className="organizer-dashboard-home__card-icon" aria-hidden="true">⚙️</span>
          <h3>Post-Event</h3>
          <p>Configure and enable the Post-Qiskit phase independently.</p>
          <span className="organizer-dashboard-home__card-arrow">Open Post-Event →</span>
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
  const { activeProfile } = useEventProfile()
  const [events, setEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [sessionActive, setSessionActive] = useState(false)
  const [qrToken, setQrToken] = useState('')
  const [countdown, setCountdown] = useState(QR_REFRESH_SECONDS)
  const [attendanceCount, setAttendanceCount] = useState(0)
  const [records, setRecords] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [sessionError, setSessionError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const rotationRequestIdRef = useRef(0)

  const fetchEvents = useCallback(async () => {
    setIsLoading(true)
    setSessionError('')
    const res = await api.fetchActiveEvents()
    setIsLoading(false)
    if (res.success && res.data) {
      setEvents(res.data)
    } else {
      setEvents([])
      setSessionError(res.error?.message || 'Unable to load attendance sessions.')
    }
  }, [])

  // Re-fetch events and reset selection when activeProfile changes for isolation
  useEffect(() => {
    setSelectedEvent(null)
    setQrToken('')
    setSessionActive(false)
    setRecords([])
    setAttendanceCount(0)
    setSearchTerm('')
    fetchEvents()
  }, [fetchEvents, activeProfile])

  const loadAttendanceData = useCallback(async (eventId) => {
    const res = await api.organizerFetchAttendanceData(eventId)
    if (res.success && res.data) {
      setAttendanceCount(res.data.count || 0)
      setRecords(res.data.records || [])
    }
  }, [])

  const checkAndFetchSessionState = useCallback(async (eventId) => {
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
  }, [])

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
  }, [selectedEvent, sessionActive, loadAttendanceData, checkAndFetchSessionState])

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

  const normalizedSearch = searchTerm.trim().toLowerCase()
  const filteredRecords = useMemo(() => {
    if (!normalizedSearch) return records
    return records.filter((r) =>
      [r.fullName, r.email, r.registrationId, r.status].some((val) =>
        String(val || '').toLowerCase().includes(normalizedSearch)
      )
    )
  }, [records, normalizedSearch])

  const formatCheckinTime = (timeString) => {
    if (!timeString) return 'Just now'
    try {
      const d = new Date(timeString)
      if (isNaN(d.getTime())) return String(timeString)
      return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    } catch {
      return String(timeString)
    }
  }

  // VIEW 1: SESSIONS SELECTION LIST (!selectedEvent)
  if (!selectedEvent) {
    return (
      <div className="organizer-page-view organizer-attendance-page">
        <OrganizerPageHeading
          eyebrow="ATTENDANCE"
          title="Attendance"
          description="Track participant attendance across event sessions and launch dynamic QR check-in."
          action={
            <div className="organizer-attendance__header-badge">
              <span className="organizer-attendance__count-pill" aria-label={`Total sessions: ${events.length}`}>
                {isLoading ? 'Loading…' : `${events.length} ${events.length === 1 ? 'session' : 'sessions'}`}
              </span>
            </div>
          }
        />

        {sessionError ? (
          <div className="organizer-attendance__alert organizer-attendance__alert--error" role="alert" aria-live="polite">
            <div className="organizer-attendance__alert-content">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div>
                <strong>Unable to load attendance sessions.</strong>
                <p>{sessionError}</p>
              </div>
            </div>
            <button type="button" className="button button--secondary organizer-attendance__retry-btn" onClick={fetchEvents}>
              Retry
            </button>
          </div>
        ) : isLoading ? (
          <div className="organizer-page-content-panel organizer-attendance__loading-panel" aria-busy="true" aria-label="Loading event sessions">
            <div className="organizer-attendance__skeleton-grid">
              <div className="organizer-attendance__skeleton-card" />
              <div className="organizer-attendance__skeleton-card" />
              <div className="organizer-attendance__skeleton-card" />
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="organizer-page-content-panel organizer-attendance__empty-panel">
            <div className="organizer-attendance__empty-state">
              <div className="organizer-attendance__empty-icon" aria-hidden="true">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <h3 className="organizer-attendance__empty-title">No attendance sessions available.</h3>
              <p className="organizer-attendance__empty-description">
                Active event sessions will appear here once configured in Events management.
              </p>
            </div>
          </div>
        ) : (
          <div className="organizer-page-content-panel organizer-attendance__sessions-panel">
            {/* SUMMARY STRIP */}
            <div className="organizer-attendance__summary-strip" aria-label="Attendance sessions overview">
              <div className="organizer-attendance__metric-item organizer-attendance__metric-item--total">
                <span className="organizer-attendance__metric-label">Total Sessions</span>
                <strong className="organizer-attendance__metric-value">{events.length}</strong>
              </div>
              <div className="organizer-attendance__metric-item">
                <span className="organizer-attendance__metric-label">Active Sessions</span>
                <strong className="organizer-attendance__metric-value">{events.filter((e) => String(e.status).toUpperCase() === 'ACTIVE').length}</strong>
              </div>
              <div className="organizer-attendance__metric-item">
                <span className="organizer-attendance__metric-label">Profile Context</span>
                <strong className="organizer-attendance__metric-value organizer-attendance__metric-value--text">
                  {activeProfile === 'post-qiskit' ? 'Post-Qiskit' : 'Pre-Qiskit'}
                </strong>
              </div>
            </div>

            {/* SESSIONS GRID */}
            <div className="organizer-attendance__session-grid" aria-label="Available event sessions">
              {events.map((evt) => {
                const isEvtActive = String(evt.status || 'ACTIVE').toUpperCase() === 'ACTIVE'
                return (
                  <article key={evt.eventId || evt.id} className="organizer-attendance__session-card" tabIndex={0}>
                    <div className="organizer-attendance__session-card-header">
                      <span className="organizer-attendance__date-tag">{evt.date || 'Scheduled'}</span>
                      <span className={`organizer-attendance__status-tag ${isEvtActive ? 'organizer-attendance__status-tag--active' : 'organizer-attendance__status-tag--closed'}`}>
                        <span className="organizer-attendance__status-dot" aria-hidden="true" />
                        <span>{isEvtActive ? 'Active' : 'Closed'}</span>
                      </span>
                    </div>

                    <div className="organizer-attendance__session-card-body">
                      <h3 className="organizer-attendance__session-title">{evt.name}</h3>
                      {evt.description && (
                        <p className="organizer-attendance__session-desc">{evt.description}</p>
                      )}
                    </div>

                    <div className="organizer-attendance__session-card-footer">
                      <div className="organizer-attendance__session-meta">
                        <span className="organizer-attendance__venue">📍 {evt.venue || evt.location || 'Online'}</span>
                        {evt.eventType && (
                          <span className="organizer-attendance__type-badge">{evt.eventType}</span>
                        )}
                      </div>
                      <button
                        type="button"
                        className="button button--primary organizer-attendance__open-btn"
                        onClick={() => setSelectedEvent(evt)}
                      >
                        Open Attendance Board →
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  // VIEW 2: LIVE ATTENDANCE BOARD (selectedEvent !== null)
  return (
    <div className="organizer-page-view organizer-attendance-page">
      <OrganizerPageHeading
        eyebrow="ATTENDANCE BOARD"
        title={selectedEvent.name}
        description={`📍 ${selectedEvent.venue || selectedEvent.location || 'Online'} · ${selectedEvent.date || 'Scheduled'}`}
        action={
          <div className="organizer-page-heading__buttons">
            <button
              type="button"
              className={`button ${sessionActive ? 'button--secondary' : 'button--primary'} organizer-attendance__toggle-btn`}
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
                setRecords([])
                setSearchTerm('')
              }}
            >
              ← Back to Sessions
            </button>
          </div>
        }
      />

      {sessionError && (
        <div className="organizer-attendance__alert organizer-attendance__alert--error" role="alert" aria-live="polite">
          <div className="organizer-attendance__alert-content">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>
              <strong>Attendance session notice</strong>
              <p>{sessionError}</p>
            </div>
          </div>
        </div>
      )}

      <div className="organizer-page-content-panel organizer-attendance__board-panel">
        {/* BOARD SUMMARY STRIP */}
        <div className="organizer-attendance__summary-strip" aria-label="Selected session summary">
          <div className="organizer-attendance__metric-item organizer-attendance__metric-item--total">
            <span className="organizer-attendance__metric-label">Total Checked In</span>
            <strong className="organizer-attendance__metric-value">{attendanceCount}</strong>
          </div>
          <div className="organizer-attendance__metric-item">
            <span className="organizer-attendance__metric-label">Session Status</span>
            <strong className="organizer-attendance__metric-value organizer-attendance__metric-value--text">
              {sessionActive ? 'Active' : 'Paused'}
            </strong>
          </div>
          <div className="organizer-attendance__metric-item">
            <span className="organizer-attendance__metric-label">Session Date</span>
            <strong className="organizer-attendance__metric-value organizer-attendance__metric-value--text">
              {selectedEvent.date || '—'}
            </strong>
          </div>
          <div className="organizer-attendance__metric-item">
            <span className="organizer-attendance__metric-label">Live Records</span>
            <strong className="organizer-attendance__metric-value">{records.length}</strong>
          </div>
        </div>

        {/* SESSION SELECTOR QUICK-SWITCH (Requirement 4) */}
        {events.length > 1 && (
          <div className="organizer-attendance__session-switcher">
            <label htmlFor="session-quick-select" className="organizer-attendance__switcher-label">
              Switch Session:
            </label>
            <select
              id="session-quick-select"
              value={selectedEvent.eventId || selectedEvent.event_id}
              onChange={(e) => {
                const target = events.find((evt) => (evt.eventId || evt.event_id) === e.target.value)
                if (target) {
                  setSelectedEvent(target)
                  setQrToken('')
                  setRecords([])
                  setSearchTerm('')
                }
              }}
              className="organizer-attendance__switcher-select"
            >
              {events.map((evt) => (
                <option key={evt.eventId || evt.id} value={evt.eventId || evt.event_id}>
                  {evt.name} ({evt.date})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 2-COLUMN OPERATIONS BOARD */}
        <div className="organizer-attendance__board-layout">
          {/* LEFT: DYNAMIC QR PANEL */}
          <div className="organizer-attendance__qr-card">
            <div className="organizer-attendance__qr-card-header">
              <h3 className="organizer-attendance__qr-card-title">DYNAMIC ATTENDANCE QR</h3>
              <span className={`organizer-attendance__live-pill ${sessionActive ? 'organizer-attendance__live-pill--active' : ''}`}>
                {sessionActive ? '● Rotating Every 5s' : 'Paused'}
              </span>
            </div>

            {sessionActive && qrToken ? (
              <div className="organizer-attendance__qr-active-box">
                <div className="organizer-attendance__qr-frame">
                  <QRCodeSVG key={qrToken} value={qrToken} size={200} level="M" includeMargin />
                </div>

                <div className="organizer-attendance__progress-wrap">
                  <div className="organizer-attendance__progress-labels">
                    <span>Backend QR Refresh</span>
                    <span className="organizer-attendance__countdown">{countdown}s</span>
                  </div>
                  <div className="organizer-attendance__progress-bar-track">
                    <div
                      className="organizer-attendance__progress-bar-fill"
                      style={{
                        width: `${(countdown / QR_REFRESH_SECONDS) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <p className="organizer-attendance__security-note">
                  🔒 Expiration enforced by backend every {QR_REFRESH_SECONDS} seconds. Screenshots will be rejected.
                </p>
              </div>
            ) : (
              <div className="organizer-attendance__qr-paused-box">
                <div className="organizer-attendance__qr-paused-icon" aria-hidden="true">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <rect x="7" y="7" width="3" height="3" />
                    <rect x="14" y="7" width="3" height="3" />
                    <rect x="7" y="14" width="3" height="3" />
                    <line x1="14" y1="14" x2="17" y2="17" />
                  </svg>
                </div>
                <h4 className="organizer-attendance__paused-title">Attendance Session Paused</h4>
                <p className="organizer-attendance__paused-desc">Click "Start Session" above to display the dynamic QR code.</p>
              </div>
            )}

            <div className="organizer-attendance__counter-box">
              <span className="organizer-attendance__counter-label">Total Marked Present</span>
              <strong className="organizer-attendance__counter-value">{attendanceCount}</strong>
            </div>
          </div>

          {/* RIGHT: ATTENDANCE RECORDS PANEL */}
          <div className="organizer-attendance__records-card">
            <div className="organizer-attendance__records-header">
              <div className="organizer-attendance__records-title-group">
                <h3 className="organizer-attendance__records-title">LIVE ATTENDANCE</h3>
                <span className={`organizer-attendance__live-badge ${sessionActive ? 'organizer-attendance__live-badge--active' : ''}`}>
                  {sessionActive ? '● LIVE UPDATES' : 'OFFLINE'}
                </span>
              </div>

              {/* SEARCH INPUT (Requirement 10) */}
              {records.length > 0 && (
                <div className="organizer-attendance__search-wrap">
                  <svg className="organizer-attendance__search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search attendance records..."
                    className="organizer-attendance__search-input"
                    aria-label="Search attendance records"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="organizer-attendance__search-clear"
                      aria-label="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* EMPTY & DATA STATES */}
            {records.length === 0 ? (
              <div className="organizer-attendance__empty-records">
                <div className="organizer-attendance__empty-icon" aria-hidden="true">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <line x1="19" y1="8" x2="19" y2="14" />
                    <line x1="22" y1="11" x2="16" y2="11" />
                  </svg>
                </div>
                <h4 className="organizer-attendance__empty-title">No attendance records for this session.</h4>
                <p className="organizer-attendance__empty-description">
                  Participants will appear here in real time as they complete dynamic QR check-in.
                </p>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="organizer-attendance__empty-records organizer-attendance__empty-records--filtered">
                <h4 className="organizer-attendance__empty-title">No attendance records match your search.</h4>
                <p className="organizer-attendance__empty-description">
                  No check-ins match your current search terms.
                </p>
                <button
                  type="button"
                  className="button button--secondary organizer-attendance__reset-search-btn"
                  onClick={() => setSearchTerm('')}
                >
                  Clear search
                </button>
              </div>
            ) : (
              <>
                {/* DESKTOP TABLE VIEW (> 768px) */}
                <div className="organizer-attendance__table-wrap">
                  <table className="organizer-attendance__table" aria-label="Checked in participants">
                    <thead>
                      <tr>
                        <th scope="col">Participant</th>
                        <th scope="col">Registration ID</th>
                        <th scope="col">Status</th>
                        <th scope="col">Check-in Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.map((r) => (
                        <tr key={r.id || r.registrationId + (r.markedAt || '')} tabIndex={0}>
                          <td className="organizer-attendance__participant-cell">
                            <strong>{r.fullName || '—'}</strong>
                            <small className="organizer-attendance__email-sub">{r.email || '—'}</small>
                          </td>
                          <td>
                            <code className="organizer-attendance__id-code">{r.registrationId || '—'}</code>
                          </td>
                          <td>
                            <span className="organizer-attendance__status-tag organizer-attendance__status-tag--active">
                              <span className="organizer-attendance__status-dot" aria-hidden="true" />
                              <span>{String(r.status || 'PRESENT').toUpperCase()}</span>
                            </span>
                          </td>
                          <td className="organizer-attendance__time-cell">
                            {formatCheckinTime(r.markedAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* MOBILE CARDS VIEW (<= 768px) */}
                <div className="organizer-attendance__mobile-records" aria-label="Checked in participants list">
                  {filteredRecords.map((r) => (
                    <article key={r.id || r.registrationId + (r.markedAt || '')} className="organizer-attendance__mobile-card" tabIndex={0}>
                      <div className="organizer-attendance__mobile-card-top">
                        <div className="organizer-attendance__mobile-card-title">
                          <strong>{r.fullName || '—'}</strong>
                          <span className="organizer-attendance__mobile-email">{r.email || '—'}</span>
                        </div>
                        <span className="organizer-attendance__status-tag organizer-attendance__status-tag--active">
                          <span className="organizer-attendance__status-dot" aria-hidden="true" />
                          <span>{String(r.status || 'PRESENT').toUpperCase()}</span>
                        </span>
                      </div>

                      <div className="organizer-attendance__mobile-card-details">
                        <div className="organizer-attendance__mobile-detail-row">
                          <span className="organizer-attendance__mobile-label">Registration ID</span>
                          <code className="organizer-attendance__id-code">{r.registrationId || '—'}</code>
                        </div>
                        <div className="organizer-attendance__mobile-detail-row">
                          <span className="organizer-attendance__mobile-label">Check-in</span>
                          <span className="organizer-attendance__mobile-time">{formatCheckinTime(r.markedAt)}</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const OrganizerParticipantsPage = () => {
  const { activeProfile } = useEventProfile()
  const [participants, setParticipants] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState('ALL')
  const [selectedAccommodation, setSelectedAccommodation] = useState('ALL')
  const [selectedTransport, setSelectedTransport] = useState('ALL')

  const participantRoleOptions = [
    { value: 'ALL', label: 'All Roles' },
    { value: 'STUDENT', label: 'Student' },
    { value: 'FACULTY', label: 'Faculty' },
    { value: 'PROFESSIONAL', label: 'Professional' },
    { value: 'OTHER', label: 'Other' },
  ]

  const accommodationOptions = [
    { value: 'ALL', label: 'All Accommodation' },
    { value: 'REQUIRED', label: 'Required' },
    { value: 'NOT_REQUIRED', label: 'Not Required' },
  ]

  const transportOptions = [
    { value: 'ALL', label: 'All Local Transport' },
    { value: 'REQUIRED', label: 'Required' },
    { value: 'NOT_REQUIRED', label: 'Not Required' },
  ]

  const load = useCallback(async () => {
    setIsLoading(true)
    setError('')
    const result = await api.organizerFetchParticipants()
    setIsLoading(false)

    if (!result.success) {
      setError(result.error?.message || 'Unable to load participant records.')
      return
    }

    setParticipants(Array.isArray(result.data) ? result.data : [])
  }, [])

  useEffect(() => {
    load()
  }, [load, activeProfile])

  const metrics = useMemo(() => {
    let student = 0
    let faculty = 0
    let professional = 0
    let other = 0
    let accommodationRequired = 0
    let localTransportRequired = 0

    participants.forEach((p) => {
      const role = String(p.role || '').toUpperCase()
      if (role === 'STUDENT') student++
      else if (role === 'FACULTY') faculty++
      else if (role === 'PROFESSIONAL') professional++
      else other++

      if (p.accommodation_required || p.accommodationRequired) accommodationRequired++
      if (p.local_transport_required || p.localTransportRequired) localTransportRequired++
    })

    return {
      total: participants.length,
      student,
      faculty,
      professional,
      other,
      accommodationRequired,
      localTransportRequired,
    }
  }, [participants])

  const normalizedSearchTerm = searchTerm.trim().toLowerCase()
  const filteredParticipants = useMemo(() => {
    return participants.filter((p) => {
      const matchesSearch =
        !normalizedSearchTerm ||
        [p.fullName, p.email, p.phone, p.mobileNumber, p.registrationId, p.instituteName, p.department].some((val) =>
          String(val || '').toLowerCase().includes(normalizedSearchTerm)
        )

      const role = String(p.role || '').toUpperCase()
      const matchesRole = selectedRole === 'ALL' || role === selectedRole

      const isAcc = Boolean(p.accommodation_required ?? p.accommodationRequired)
      const matchesAccommodation =
        selectedAccommodation === 'ALL' ||
        (selectedAccommodation === 'REQUIRED' && isAcc) ||
        (selectedAccommodation === 'NOT_REQUIRED' && !isAcc)

      const isTrans = Boolean(p.local_transport_required ?? p.localTransportRequired)
      const matchesTransport =
        selectedTransport === 'ALL' ||
        (selectedTransport === 'REQUIRED' && isTrans) ||
        (selectedTransport === 'NOT_REQUIRED' && !isTrans)

      return matchesSearch && matchesRole && matchesAccommodation && matchesTransport
    })
  }, [participants, normalizedSearchTerm, selectedRole, selectedAccommodation, selectedTransport])

  const hasActiveFilters = Boolean(normalizedSearchTerm) || selectedRole !== 'ALL' || selectedAccommodation !== 'ALL' || selectedTransport !== 'ALL'

  const handleResetFilters = () => {
    setSearchTerm('')
    setSelectedRole('ALL')
    setSelectedAccommodation('ALL')
    setSelectedTransport('ALL')
  }

  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState('')

  const handleExportExcel = async () => {
    setIsExporting(true)
    setExportError('')
    try {
      const queryParams = {}
      if (normalizedSearchTerm) {
        queryParams.search = normalizedSearchTerm
      }
      if (selectedRole !== 'ALL') {
        queryParams.role = selectedRole.toLowerCase()
      }
      if (selectedAccommodation === 'REQUIRED') {
        queryParams.accommodation = 'required'
      } else if (selectedAccommodation === 'NOT_REQUIRED') {
        queryParams.accommodation = 'not_required'
      }
      if (selectedTransport === 'REQUIRED') {
        queryParams.local_transport = 'required'
      } else if (selectedTransport === 'NOT_REQUIRED') {
        queryParams.local_transport = 'not_required'
      }

      const result = await api.organizerExportParticipants(queryParams)
      if (!result.success) {
        setExportError(result.error?.message || 'Failed to export participants to Excel.')
        return
      }

      const { blob, filename } = result.data
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename || 'Qiskit-Fall-Fest-2026-Participants.xlsx'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setExportError(err.message || 'An unexpected error occurred while exporting.')
    } finally {
      setIsExporting(false)
    }
  }

  const formatParticipantDate = (dateString) => {
    if (!dateString) return '—'
    try {
      const d = new Date(dateString)
      if (isNaN(d.getTime())) return String(dateString)
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return String(dateString)
    }
  }

  const getRoleLabel = (role) => {
    const found = participantRoleOptions.find((opt) => opt.value === String(role || '').toUpperCase())
    return found ? found.label : role || 'Other'
  }

  return (
    <div className="organizer-page-view organizer-participants-page">
      <OrganizerPageHeading
        eyebrow="PARTICIPANTS"
        title="Registered participant records"
        description="Review and manage attendee registrations, institutional affiliations, and participant roles across the active event profile."
        action={
          <div className="organizer-participants__header-badge">
            <span className="organizer-participants__count-pill" aria-label={`Total participants: ${participants.length}`}>
              {isLoading ? 'Loading…' : `${participants.length} ${participants.length === 1 ? 'participant' : 'participants'}`}
            </span>
          </div>
        }
      />

      {error ? (
        <div className="organizer-participants__alert organizer-participants__alert--error" role="alert" aria-live="polite">
          <div className="organizer-participants__alert-content">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>
              <strong>Unable to load participant records.</strong>
              <p>{error}</p>
            </div>
          </div>
          <button type="button" className="button button--secondary organizer-participants__retry-btn" onClick={load}>
            Retry
          </button>
        </div>
      ) : isLoading ? (
        <div className="organizer-page-content-panel organizer-participants__loading-panel" aria-busy="true" aria-label="Loading participant records">
          <div className="organizer-participants__skeleton-header" />
          <div className="organizer-participants__skeleton-row" />
          <div className="organizer-participants__skeleton-row" />
          <div className="organizer-participants__skeleton-row" />
          <div className="organizer-participants__skeleton-row" />
        </div>
      ) : participants.length === 0 ? (
        <div className="organizer-page-content-panel organizer-participants__empty-panel">
          <div className="organizer-participants__empty-state">
            <div className="organizer-participants__empty-icon" aria-hidden="true">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3 className="organizer-participants__empty-title">No participants registered yet.</h3>
            <p className="organizer-participants__empty-description">
              Participant registrations will appear here once attendees complete registration.
            </p>
          </div>
        </div>
      ) : (
        <div className="organizer-page-content-panel organizer-participants__panel">
          {/* SUMMARY METRICS STRIP */}
          <div className="organizer-participants__summary-strip" aria-label="Participant metrics summary">
            <div className="organizer-participants__metric-item organizer-participants__metric-item--total">
              <span className="organizer-participants__metric-label">Total</span>
              <strong className="organizer-participants__metric-value">{metrics.total}</strong>
            </div>
            <div className="organizer-participants__metric-item">
              <span className="organizer-participants__metric-label">Students</span>
              <strong className="organizer-participants__metric-value">{metrics.student}</strong>
            </div>
            <div className="organizer-participants__metric-item">
              <span className="organizer-participants__metric-label">Faculty</span>
              <strong className="organizer-participants__metric-value">{metrics.faculty}</strong>
            </div>
            <div className="organizer-participants__metric-item">
              <span className="organizer-participants__metric-label">Professionals</span>
              <strong className="organizer-participants__metric-value">{metrics.professional}</strong>
            </div>
            <div className="organizer-participants__metric-item">
              <span className="organizer-participants__metric-label">Other</span>
              <strong className="organizer-participants__metric-value">{metrics.other}</strong>
            </div>
            <div className="organizer-participants__metric-item">
              <span className="organizer-participants__metric-label">Accommodation Required</span>
              <strong className="organizer-participants__metric-value">{metrics.accommodationRequired}</strong>
            </div>
            <div className="organizer-participants__metric-item">
              <span className="organizer-participants__metric-label">Local Transport Required</span>
              <strong className="organizer-participants__metric-value">{metrics.localTransportRequired}</strong>
            </div>
          </div>

          {/* SEARCH & FILTERS TOOLBAR */}
          <div className="organizer-participants__toolbar">
            <div className="organizer-participants__search-box">
              <label htmlFor="participant-search" className="visually-hidden">Search participants</label>
              <div className="organizer-participants__search-input-wrap">
                <svg className="organizer-participants__search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  id="participant-search"
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search participants..."
                  className="organizer-participants__search-input"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="organizer-participants__clear-search"
                    aria-label="Clear search text"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div className="organizer-participants__filter-group">
              <label htmlFor="participant-role-filter" className="organizer-participants__filter-label">Role:</label>
              <select
                id="participant-role-filter"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="organizer-participants__role-select"
              >
                {participantRoleOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="organizer-participants__filter-group">
              <label htmlFor="participant-accommodation-filter" className="organizer-participants__filter-label">Accommodation:</label>
              <select
                id="participant-accommodation-filter"
                value={selectedAccommodation}
                onChange={(e) => setSelectedAccommodation(e.target.value)}
                className="organizer-participants__role-select"
              >
                {accommodationOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="organizer-participants__filter-group">
              <label htmlFor="participant-transport-filter" className="organizer-participants__filter-label">Local Transport:</label>
              <select
                id="participant-transport-filter"
                value={selectedTransport}
                onChange={(e) => setSelectedTransport(e.target.value)}
                className="organizer-participants__role-select"
              >
                {transportOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="organizer-participants__reset-btn"
              >
                Clear filters
              </button>
            )}

            <button
              type="button"
              onClick={handleExportExcel}
              disabled={isExporting}
              className="button button--secondary organizer-participants__export-btn"
              title="Export filtered participants to Excel"
            >
              {isExporting ? (
                <>
                  <span className="organizer-participants__btn-spinner" aria-hidden="true" />
                  <span>Exporting…</span>
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>Export Excel</span>
                </>
              )}
            </button>
          </div>

          {exportError && (
            <div className="organizer-participants__alert organizer-participants__alert--error" role="alert" style={{ marginBottom: '1rem' }}>
              <div className="organizer-participants__alert-content">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <div>
                  <strong>Export failed.</strong>
                  <p>{exportError}</p>
                </div>
              </div>
              <button type="button" className="organizer-participants__clear-search" onClick={() => setExportError('')} aria-label="Dismiss error">✕</button>
            </div>
          )}

          {/* STATUS / COUNT BAR */}
          <div className="organizer-participants__status-bar" aria-live="polite">
            <span className="organizer-participants__status-text">
              {hasActiveFilters
                ? `Showing ${filteredParticipants.length} of ${participants.length} participants`
                : `Showing ${participants.length} ${participants.length === 1 ? 'participant' : 'participants'}`}
            </span>
          </div>

          {/* DATA VIEW OR FILTER EMPTY STATE */}
          {filteredParticipants.length === 0 ? (
            <div className="organizer-participants__empty-state organizer-participants__empty-state--filtered">
              <div className="organizer-participants__empty-icon" aria-hidden="true">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  <line x1="8" y1="11" x2="14" y2="11" />
                </svg>
              </div>
              <h3 className="organizer-participants__empty-title">No participants match your search.</h3>
              <p className="organizer-participants__empty-description">
                No participants match your current search or filters. Try adjusting your search terms or clearing your role filter.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="button button--secondary organizer-participants__empty-action"
              >
                Clear search and filters
              </button>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE VIEW (> 768px) */}
              <div className="organizer-participants__table-wrap">
                <table className="organizer-participants__table" aria-label="Registered participants table">
                  <thead>
                    <tr>
                      <th scope="col">Registration ID</th>
                      <th scope="col">Name</th>
                      <th scope="col">Email</th>
                      <th scope="col">Phone</th>
                      <th scope="col">Role</th>
                      <th scope="col">Institution / Dept</th>
                      <th scope="col">Accommodation</th>
                      <th scope="col">Local Transport</th>
                      <th scope="col">Status</th>
                      <th scope="col">Registered At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredParticipants.map((participant) => {
                      const statusText = participant.status || 'CONFIRMED'
                      return (
                        <tr key={participant.registrationId || participant.email} tabIndex={0}>
                          <td>
                            <code className="organizer-participants__id-code">
                              {participant.registrationId || '—'}
                            </code>
                          </td>
                          <td className="organizer-participants__name-cell">
                            <strong>{participant.fullName || '—'}</strong>
                          </td>
                          <td className="organizer-participants__email-cell">
                            {participant.email || '—'}
                          </td>
                          <td className="organizer-participants__phone-cell">
                            {participant.phone || participant.mobileNumber || '—'}
                          </td>
                          <td>
                            <span className={`organizer-participants__role-tag organizer-participants__role-tag--${String(participant.role || 'other').toLowerCase()}`}>
                              {getRoleLabel(participant.role)}
                            </span>
                          </td>
                          <td className="organizer-participants__institution-cell">
                            <span className="organizer-participants__inst-name">{participant.instituteName || '—'}</span>
                            {participant.department && (
                              <small className="organizer-participants__dept-name">{participant.department}</small>
                            )}
                          </td>
                          <td>
                            <span
                              className={`organizer-participants__role-tag ${
                                participant.accommodation_required || participant.accommodationRequired
                                  ? 'organizer-participants__role-tag--faculty'
                                  : 'organizer-participants__role-tag--other'
                              }`}
                              style={{ whiteSpace: 'nowrap' }}
                            >
                              {participant.accommodation_required || participant.accommodationRequired
                                ? 'Required'
                                : 'Not Required'}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`organizer-participants__role-tag ${
                                participant.local_transport_required || participant.localTransportRequired
                                  ? 'organizer-participants__role-tag--student'
                                  : 'organizer-participants__role-tag--other'
                              }`}
                              style={{ whiteSpace: 'nowrap' }}
                            >
                              {participant.local_transport_required || participant.localTransportRequired
                                ? 'Required'
                                : 'Not Required'}
                            </span>
                          </td>
                          <td>
                            <span className="organizer-participants__status-tag">
                              <span className="organizer-participants__status-dot" aria-hidden="true" />
                              <span>{statusText.charAt(0).toUpperCase() + statusText.slice(1).toLowerCase()}</span>
                            </span>
                          </td>
                          <td className="organizer-participants__date-cell">
                            {formatParticipantDate(participant.createdAt)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARDS VIEW (<= 768px) */}
              <div className="organizer-participants__mobile-list" aria-label="Registered participants list">
                {filteredParticipants.map((participant) => {
                  const statusText = participant.status || 'CONFIRMED'
                  return (
                    <article key={participant.registrationId || participant.email} className="organizer-participants__mobile-card" tabIndex={0}>
                      <div className="organizer-participants__mobile-card-header">
                        <div className="organizer-participants__mobile-card-title">
                          <strong>{participant.fullName || '—'}</strong>
                          <span className="organizer-participants__mobile-email">{participant.email || '—'}</span>
                        </div>
                        <span className="organizer-participants__status-tag">
                          <span className="organizer-participants__status-dot" aria-hidden="true" />
                          <span>{statusText.charAt(0).toUpperCase() + statusText.slice(1).toLowerCase()}</span>
                        </span>
                      </div>

                      <div className="organizer-participants__mobile-card-meta">
                        <div className="organizer-participants__mobile-meta-row">
                          <span className="organizer-participants__mobile-label">ID</span>
                          <code className="organizer-participants__id-code">{participant.registrationId || '—'}</code>
                        </div>
                        <div className="organizer-participants__mobile-meta-row">
                          <span className="organizer-participants__mobile-label">Phone</span>
                          <span className="organizer-participants__mobile-value">{participant.phone || participant.mobileNumber || '—'}</span>
                        </div>
                        <div className="organizer-participants__mobile-meta-row">
                          <span className="organizer-participants__mobile-label">Role</span>
                          <span className={`organizer-participants__role-tag organizer-participants__role-tag--${String(participant.role || 'other').toLowerCase()}`}>
                            {getRoleLabel(participant.role)}
                          </span>
                        </div>
                        <div className="organizer-participants__mobile-meta-row">
                          <span className="organizer-participants__mobile-label">Institution</span>
                          <span className="organizer-participants__mobile-value">
                            {participant.instituteName || '—'}
                            {participant.department ? ` (${participant.department})` : ''}
                          </span>
                        </div>
                        <div className="organizer-participants__mobile-meta-row">
                          <span className="organizer-participants__mobile-label">Accommodation</span>
                          <span
                            className={`organizer-participants__role-tag ${
                              participant.accommodation_required || participant.accommodationRequired
                                ? 'organizer-participants__role-tag--faculty'
                                : 'organizer-participants__role-tag--other'
                            }`}
                          >
                            {participant.accommodation_required || participant.accommodationRequired
                              ? 'Required'
                              : 'Not Required'}
                          </span>
                        </div>
                        <div className="organizer-participants__mobile-meta-row">
                          <span className="organizer-participants__mobile-label">Local Transport</span>
                          <span
                            className={`organizer-participants__role-tag ${
                              participant.local_transport_required || participant.localTransportRequired
                                ? 'organizer-participants__role-tag--student'
                                : 'organizer-participants__role-tag--other'
                            }`}
                          >
                            {participant.local_transport_required || participant.localTransportRequired
                              ? 'Required'
                              : 'Not Required'}
                          </span>
                        </div>
                        <div className="organizer-participants__mobile-meta-row">
                          <span className="organizer-participants__mobile-label">Registered</span>
                          <span className="organizer-participants__mobile-value">{formatParticipantDate(participant.createdAt)}</span>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            </>
          )}
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
  { value: 'FIRST_POSITION', label: '1st Position', badge: '1st Place', icon: '🥇', tier: 'gold', desc: 'Champion team of the Qiskit Hackathon.' },
  { value: 'FIRST_RUNNERS_UP', label: '1st Runners Up', badge: '1st Runner Up', icon: '🥈', tier: 'silver', desc: 'Second place team for innovative algorithms.' },
  { value: 'SECOND_RUNNERS_UP', label: '2nd Runners Up', badge: '2nd Runner Up', icon: '🥉', tier: 'bronze', desc: 'Third place team for outstanding implementation.' },
]

const certificateTypeLabels = {
  GENERAL_EVENT_PARTICIPATION: 'Event Participation Certificate',
  HACKATHON_PARTICIPATION: 'Hackathon Participation Certificate',
  WEBINAR_PARTICIPATION: 'Webinar Participation Certificate',
  WORKSHOP_PARTICIPATION: 'Workshop Participation Certificate',
  QUANTUM_BOOTCAMP_COMPLETION: 'Quantum Bootcamp Certificate',
  HACKATHON_FIRST_POSITION: '1st Place Winner Certificate',
  HACKATHON_FIRST_RUNNERS_UP: '1st Runner Up Certificate',
  HACKATHON_SECOND_RUNNERS_UP: '2nd Runner Up Certificate',
}

const formatCertificateDate = (dateString) => {
  if (!dateString) return '—'
  try {
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return String(dateString)
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return String(dateString)
  }
}

const OrganizerRewardsPage = () => {
  const { activeProfile } = useEventProfile()

  const [events, setEvents] = useState([])
  const [selectedEventId, setSelectedEventId] = useState('')
  const [eligibleParticipants, setEligibleParticipants] = useState([])
  const [alreadyIssued, setAlreadyIssued] = useState([])
  const [excludedParticipants, setExcludedParticipants] = useState([])
  const [issuedCertificates, setIssuedCertificates] = useState([])
  const [teams, setTeams] = useState([])
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [teamMembers, setTeamMembers] = useState([])
  const [placement, setPlacement] = useState('FIRST_POSITION')

  // UI state
  const [activeTab, setActiveTab] = useState('participants') // 'participants'/'attendees', 'awards', 'ledger'
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRegistrationIds, setSelectedRegistrationIds] = useState(new Set())
  const [selectedCertModal, setSelectedCertModal] = useState(null)

  // Loading & notification states
  const [isLoading, setIsLoading] = useState(true)
  const [isEligibilityLoading, setIsEligibilityLoading] = useState(false)
  const [isCertificatesLoading, setIsCertificatesLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Selected event metadata (never hardcoded)
  const selectedEvent = events.find((event) => event.event_id === selectedEventId) || null
  const eventType = String(selectedEvent?.event_type || '').toUpperCase()
  const certificateType = eventTypeCertificateMap[eventType] || 'GENERAL_EVENT_PARTICIPATION'
  const isHackathon = eventType === 'HACKATHON'

  // Escape key handler for accessible modal dismissal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedCertModal) {
        setSelectedCertModal(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedCertModal])

  // Load Eligibility for selected event
  const loadEligibility = useCallback(async (eventId, type) => {
    if (!eventId || !type) return
    setIsEligibilityLoading(true)
    try {
      const result = await api.organizerPreviewCertificateEligibility(eventId, type)
      if (!result.success) {
        setError(result.error?.message || 'Unable to load certificate eligibility.')
        setEligibleParticipants([])
        setAlreadyIssued([])
        setExcludedParticipants([])
        return
      }
      const preview = result.data || {}
      const issued = Array.isArray(preview.alreadyIssued) ? preview.alreadyIssued : []
      const eligible = Array.isArray(preview.eligibleParticipants)
        ? preview.eligibleParticipants.filter((participant) => !issued.some((i) => String(i.registrationId) === String(participant.registrationId)))
        : []
      setEligibleParticipants(eligible)
      setAlreadyIssued(issued)
      setExcludedParticipants(Array.isArray(preview.excludedParticipants) ? preview.excludedParticipants : [])
      setSelectedRegistrationIds(new Set())
    } catch (err) {
      setError('A network error occurred while reviewing certificate eligibility.')
    } finally {
      setIsEligibilityLoading(false)
    }
  }, [])

  // Load Issued Certificates ledger (profile-aware)
  const loadIssuedCertificates = useCallback(async () => {
    setIsCertificatesLoading(true)
    try {
      const result = await api.organizerFetchCertificates()
      if (result.success && Array.isArray(result.data)) {
        setIssuedCertificates(result.data)
      } else {
        setIssuedCertificates([])
      }
    } catch (err) {
      setIssuedCertificates([])
    } finally {
      setIsCertificatesLoading(false)
    }
  }, [])

  // Profile-switch sequence: clean reload sequence
  useEffect(() => {
    let isMounted = true

    const initProfile = async () => {
      setSelectedEventId('')
      setEligibleParticipants([])
      setAlreadyIssued([])
      setExcludedParticipants([])
      setIssuedCertificates([])
      setTeams([])
      setSelectedTeamId('')
      setTeamMembers([])
      setSelectedRegistrationIds(new Set())
      setSearchQuery('')
      setSelectedCertModal(null)
      setError('')
      setSuccess('')
      setIsLoading(true)

      try {
        const [eventsRes, certsRes] = await Promise.all([
          api.organizerFetchEvents(),
          api.organizerFetchCertificates(),
        ])

        if (!isMounted) return

        if (certsRes.success && Array.isArray(certsRes.data)) {
          setIssuedCertificates(certsRes.data)
        }

        if (eventsRes.success) {
          const nextEvents = normalizeRewardEvents(eventsRes.data)
          setEvents(nextEvents)
          if (nextEvents.length > 0) {
            setSelectedEventId(nextEvents[0].event_id)
          }
        } else {
          setError(eventsRes.error?.message || 'Unable to load events.')
        }
      } catch (err) {
        if (isMounted) setError('A network error occurred while connecting to the server.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    initProfile()

    return () => {
      isMounted = false
    }
  }, [activeProfile])

  // When selected event changes, reload its eligibility, teams (if hackathon), and reset tab
  useEffect(() => {
    setError('')
    setSuccess('')
    setEligibleParticipants([])
    setAlreadyIssued([])
    setExcludedParticipants([])
    setTeams([])
    setSelectedTeamId('')
    setTeamMembers([])
    setSelectedRegistrationIds(new Set())

    if (!selectedEventId) return

    loadEligibility(selectedEventId, certificateType)

    if (isHackathon) {
      api.organizerFetchTeams(selectedEventId).then((result) => {
        if (!result.success) {
          setError(result.error?.message || 'Unable to load hackathon teams.')
        }
        setTeams(Array.isArray(result.data) ? result.data : [])
      })
      setActiveTab('participants')
    } else {
      setActiveTab('attendees')
    }
  }, [selectedEventId, certificateType, isHackathon, loadEligibility])

  // Load team members when selectedTeamId changes
  useEffect(() => {
    if (!selectedTeamId) {
      setTeamMembers([])
      return
    }
    api.organizerFetchTeamMembers(selectedTeamId).then((result) => {
      if (!result.success) {
        setError(result.error?.message || 'Unable to load team members.')
      }
      setTeamMembers(Array.isArray(result.data) ? result.data : [])
    })
  }, [selectedTeamId])

  // Certificate generation for eligible participants (batch or selection)
  const handleGenerateCertificates = async () => {
    if (!selectedEventId || !certificateType || !eligibleParticipants.length || isGenerating) return

    const targetIds = selectedRegistrationIds.size > 0
      ? Array.from(selectedRegistrationIds)
      : eligibleParticipants.map((p) => p.publicRegistrationId)

    if (!targetIds.length) return

    setIsGenerating(true)
    setError('')
    setSuccess('')

    const result = await api.organizerGenerateCertificates(selectedEventId, {
      certificateType,
      registrationIds: targetIds,
    })

    setIsGenerating(false)

    if (!result.success) {
      setError(result.error?.message || 'Unable to generate certificates.')
      return
    }

    const count = result.data?.length || targetIds.length
    setSuccess(`Successfully generated and dispatched ${count} certificate${count === 1 ? '' : 's'}.`)
    await Promise.all([
      loadEligibility(selectedEventId, certificateType),
      loadIssuedCertificates(),
    ])
  }

  // Hackathon award assignment
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

    const matchedPlacement = hackathonPlacements.find((p) => p.value === placement)
    setSuccess(`Assigned "${matchedPlacement?.label || placement}" award successfully to the selected team.`)
    await loadEligibility(selectedEventId, certificateType)
  }

  // Hackathon award certificates generation
  const handleGenerateAwardCertificates = async () => {
    if (!selectedEventId || !selectedTeamId || isGenerating) return
    setIsGenerating(true)
    setError('')
    setSuccess('')

    const result = await api.organizerGenerateAwardCertificates(selectedEventId, selectedTeamId)
    setIsGenerating(false)

    if (!result.success) {
      setError(result.error?.message || 'Unable to generate award certificates. Make sure the team has an assigned placement first.')
      return
    }

    const count = result.data?.length || teamMembers.length
    setSuccess(`Generated ${count} award winner certificate${count === 1 ? '' : 's'} successfully.`)
    await Promise.all([
      loadEligibility(selectedEventId, certificateType),
      loadIssuedCertificates(),
    ])
  }

  // Selection toggle helpers
  const handleToggleSelectAll = () => {
    if (selectedRegistrationIds.size === eligibleParticipants.length) {
      setSelectedRegistrationIds(new Set())
    } else {
      setSelectedRegistrationIds(new Set(eligibleParticipants.map((p) => p.publicRegistrationId)))
    }
  }

  const handleToggleSelectOne = (regId) => {
    const next = new Set(selectedRegistrationIds)
    if (next.has(regId)) {
      next.delete(regId)
    } else {
      next.add(regId)
    }
    setSelectedRegistrationIds(next)
  }

  // Filtered lists based on search query
  const normalizedQuery = searchQuery.trim().toLowerCase()

  const filteredEligible = useMemo(() => {
    if (!normalizedQuery) return eligibleParticipants
    return eligibleParticipants.filter((p) => {
      const name = String(getRewardParticipant(p)).toLowerCase()
      const email = String(p.email || '').toLowerCase()
      const regId = String(p.publicRegistrationId || '').toLowerCase()
      const team = String(p.teamName || '').toLowerCase()
      return name.includes(normalizedQuery) || email.includes(normalizedQuery) || regId.includes(normalizedQuery) || team.includes(normalizedQuery)
    })
  }, [eligibleParticipants, normalizedQuery])

  const eventIssuedCertificates = useMemo(() => {
    if (!selectedEventId) return issuedCertificates
    return issuedCertificates.filter((cert) => String(cert.eventId) === String(selectedEventId))
  }, [issuedCertificates, selectedEventId])

  const filteredIssued = useMemo(() => {
    if (!normalizedQuery) return eventIssuedCertificates
    return eventIssuedCertificates.filter((cert) => {
      const certNum = String(cert.certificateNumber || '').toLowerCase()
      const certType = String(cert.certificateType || '').toLowerCase()
      const eventName = String(cert.eventName || '').toLowerCase()
      const recipient = String(cert.participantName || cert.recipientName || '').toLowerCase()
      const email = String(cert.participantEmail || cert.recipientEmail || '').toLowerCase()
      const code = String(cert.verificationCode || '').toLowerCase()
      return certNum.includes(normalizedQuery) || certType.includes(normalizedQuery) || eventName.includes(normalizedQuery) || recipient.includes(normalizedQuery) || email.includes(normalizedQuery) || code.includes(normalizedQuery)
    })
  }, [eventIssuedCertificates, normalizedQuery])

  // Get recipient display from certificate or matched issued participant
  const getCertRecipient = (cert) => {
    if (cert.participantName) return cert.participantName
    if (cert.recipientName) return cert.recipientName
    const matched = alreadyIssued.find((p) => String(p.registrationId) === String(cert.registrationId))
    return matched ? getRewardParticipant(matched) : 'Participant'
  }

  const getCertEmail = (cert) => {
    if (cert.participantEmail) return cert.participantEmail
    if (cert.recipientEmail) return cert.recipientEmail
    const matched = alreadyIssued.find((p) => String(p.registrationId) === String(cert.registrationId))
    return matched ? matched.email : '—'
  }

  return (
    <div className="organizer-page-view organizer-rewards-container">
      <OrganizerPageHeading
        eyebrow="REWARDS"
        title="Rewards & Certificates"
        description="Review attendee eligibility, assign hackathon placements, and issue verifiable digital certificates."
        action={
          <div className="organizer-rewards__header-badge">
            <span className="organizer-rewards__profile-pill">
              <span className="organizer-rewards__profile-dot" />
              {activeProfile === 'post-qiskit' ? 'Post-Qiskit' : 'Pre-Qiskit'}
            </span>
            <span className="organizer-rewards__count-pill" aria-label={`Loaded records: ${eligibleParticipants.length + alreadyIssued.length}`}>
              {isLoading ? 'Loading…' : `${eligibleParticipants.length + alreadyIssued.length} Records`}
            </span>
          </div>
        }
      />

      {/* ERROR BANNER */}
      {error && (
        <div className="organizer-rewards__alert organizer-rewards__alert--error" role="alert">
          <div className="organizer-rewards__alert-content">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
          <button type="button" className="organizer-rewards__alert-close" onClick={() => setError('')} aria-label="Dismiss error">×</button>
        </div>
      )}

      {/* SUCCESS BANNER */}
      {success && (
        <div className="organizer-rewards__alert organizer-rewards__alert--success" role="status">
          <div className="organizer-rewards__alert-content">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>{success}</span>
          </div>
          <button type="button" className="organizer-rewards__alert-close" onClick={() => setSuccess('')} aria-label="Dismiss success">×</button>
        </div>
      )}

      {/* SUMMARY KPI STRIP (Derived 100% from backend data) */}
      <div className="organizer-rewards__summary-strip">
        <div className="organizer-rewards__metric-item organizer-rewards__metric-item--total">
          <span className="organizer-rewards__metric-label">Eligible</span>
          <span className="organizer-rewards__metric-value">{isLoading ? '—' : eligibleParticipants.length}</span>
          <span className="organizer-rewards__metric-desc">Pending certificate issuance</span>
        </div>
        <div className="organizer-rewards__metric-item">
          <span className="organizer-rewards__metric-label">Issued for Event</span>
          <span className="organizer-rewards__metric-value">{isLoading ? '—' : alreadyIssued.length}</span>
          <span className="organizer-rewards__metric-desc">Certificates awarded</span>
        </div>
        <div className="organizer-rewards__metric-item">
          <span className="organizer-rewards__metric-label">Excluded</span>
          <span className="organizer-rewards__metric-value">{isLoading ? '—' : excludedParticipants.length}</span>
          <span className="organizer-rewards__metric-desc">Ineligible attendees</span>
        </div>
        {isHackathon && (
          <div className="organizer-rewards__metric-item">
            <span className="organizer-rewards__metric-label">Hackathon Teams</span>
            <span className="organizer-rewards__metric-value">{isLoading ? '—' : teams.length}</span>
            <span className="organizer-rewards__metric-desc">Registered teams</span>
          </div>
        )}
        <div className="organizer-rewards__metric-item">
          <span className="organizer-rewards__metric-label">Total Profile Ledger</span>
          <span className="organizer-rewards__metric-value">{isLoading ? '—' : issuedCertificates.length}</span>
          <span className="organizer-rewards__metric-desc">All certificates issued</span>
        </div>
      </div>

      {/* EVENT SELECTOR CARD */}
      <div className="organizer-rewards__event-selector-card">
        <div className="organizer-rewards__event-selector-left">
          <label htmlFor="organizer-reward-event" className="organizer-rewards__selector-label">
            Target Event
          </label>
          <select
            id="organizer-reward-event"
            className="organizer-rewards__selector-select"
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            disabled={isLoading || events.length === 0}
            aria-label="Select target event for certificates and rewards"
          >
            {events.map((event) => (
              <option key={event.event_id} value={event.event_id}>
                {event.event_name}
              </option>
            ))}
          </select>

          {selectedEvent && (
            <span className="organizer-rewards__event-meta-tag">
              Type: <strong>{eventType || 'GENERAL'}</strong> · Template: <strong>{certificateTypeLabels[certificateType] || certificateType}</strong>
            </span>
          )}
        </div>

        <button
          type="button"
          className="button button--secondary"
          onClick={() => {
            loadEligibility(selectedEventId, certificateType)
            loadIssuedCertificates()
          }}
          disabled={isLoading || !selectedEventId}
          style={{ fontSize: '0.84rem', padding: '0.5rem 1rem' }}
        >
          ↻ Refresh
        </button>
      </div>

      {/* NAVIGATION TABS */}
      <div className="organizer-rewards__tabs" role="tablist" aria-label="Reward operations">
        {isHackathon ? (
          <>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'participants'}
              className={`organizer-rewards__tab ${activeTab === 'participants' ? 'organizer-rewards__tab--active' : ''}`}
              onClick={() => setActiveTab('participants')}
            >
              Participant Certificates
              <span className="organizer-rewards__tab-badge">{eligibleParticipants.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'awards'}
              className={`organizer-rewards__tab ${activeTab === 'awards' ? 'organizer-rewards__tab--active' : ''}`}
              onClick={() => setActiveTab('awards')}
            >
              Awards & Placements
              <span className="organizer-rewards__tab-badge">3 Tiers</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'ledger'}
              className={`organizer-rewards__tab ${activeTab === 'ledger' ? 'organizer-rewards__tab--active' : ''}`}
              onClick={() => setActiveTab('ledger')}
            >
              Issued Certificates Ledger
              <span className="organizer-rewards__tab-badge">{eventIssuedCertificates.length}</span>
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'attendees'}
              className={`organizer-rewards__tab ${activeTab === 'attendees' ? 'organizer-rewards__tab--active' : ''}`}
              onClick={() => setActiveTab('attendees')}
            >
              Eligible Attendees
              <span className="organizer-rewards__tab-badge">{eligibleParticipants.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'ledger'}
              className={`organizer-rewards__tab ${activeTab === 'ledger' ? 'organizer-rewards__tab--active' : ''}`}
              onClick={() => setActiveTab('ledger')}
            >
              Issued Certificates Ledger
              <span className="organizer-rewards__tab-badge">{eventIssuedCertificates.length}</span>
            </button>
          </>
        )}
      </div>

      {/* MAIN CONTENT CARD */}
      <div className="organizer-rewards__card">
        {isLoading ? (
          <div>
            <div className="organizer-rewards__skeleton-row" />
            <div className="organizer-rewards__skeleton-row" />
            <div className="organizer-rewards__skeleton-row" />
            <div className="organizer-rewards__skeleton-row" />
          </div>
        ) : events.length === 0 ? (
          <div className="organizer-rewards__empty">
            <span className="organizer-rewards__empty-icon" aria-hidden="true">📅</span>
            <h4>No Events Available</h4>
            <p>No events were found for the {activeProfile === 'post-qiskit' ? 'Post-Qiskit' : 'Pre-Qiskit'} profile context.</p>
          </div>
        ) : (
          <>
            {/* TAB 1: ELIGIBLE PARTICIPANTS / ATTENDEES */}
            {(activeTab === 'participants' || activeTab === 'attendees') && (
              <>
                <div className="organizer-rewards__toolbar">
                  <div className="organizer-rewards__search-wrap">
                    <span className="organizer-rewards__search-icon" aria-hidden="true">🔍</span>
                    <input
                      type="text"
                      className="organizer-rewards__search-input"
                      placeholder="Search eligible by name, email, reg ID, team…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      aria-label="Search eligible attendees"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        className="organizer-rewards__search-clear"
                        onClick={() => setSearchQuery('')}
                        aria-label="Clear search input"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="organizer-rewards__toolbar-actions">
                    <button
                      type="button"
                      className="button button--primary"
                      onClick={handleGenerateCertificates}
                      disabled={!selectedEventId || isEligibilityLoading || isGenerating || eligibleParticipants.length === 0}
                      style={{ fontSize: '0.88rem', padding: '0.55rem 1.25rem' }}
                    >
                      {isGenerating
                        ? 'Generating Certificates…'
                        : selectedRegistrationIds.size > 0
                        ? `Generate for Selected (${selectedRegistrationIds.size})`
                        : `Generate All Eligible (${eligibleParticipants.length})`}
                    </button>
                  </div>
                </div>

                {isEligibilityLoading ? (
                  <div>
                    <div className="organizer-rewards__skeleton-row" />
                    <div className="organizer-rewards__skeleton-row" />
                    <div className="organizer-rewards__skeleton-row" />
                  </div>
                ) : filteredEligible.length === 0 ? (
                  <div className="organizer-rewards__empty">
                    <span className="organizer-rewards__empty-icon" aria-hidden="true">
                      {searchQuery ? '🔎' : '🎓'}
                    </span>
                    <h4>
                      {searchQuery ? 'No Matching Eligible Participants' : 'No Eligible Participants Pending'}
                    </h4>
                    <p>
                      {searchQuery
                        ? 'Try clearing or changing your search terms.'
                        : alreadyIssued.length > 0
                        ? `All ${alreadyIssued.length} eligible participants have already received their certificates for this event.`
                        : isHackathon
                        ? 'Eligibility requires registered team membership. Check the Hackathon section to manage teams.'
                        : 'Eligibility is derived from present attendance records for this session.'}
                    </p>
                    {searchQuery && (
                      <button
                        type="button"
                        className="button button--secondary"
                        onClick={() => setSearchQuery('')}
                        style={{ marginTop: '0.5rem' }}
                      >
                        Clear Search
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    {/* DESKTOP TABLE */}
                    <div className="organizer-rewards__table-wrap">
                      <table className="organizer-rewards__table" aria-label="Eligible participants table">
                        <thead>
                          <tr>
                            <th className="organizer-rewards__th" style={{ width: '40px' }}>
                              <input
                                type="checkbox"
                                aria-label="Select all eligible participants"
                                checked={selectedRegistrationIds.size === eligibleParticipants.length && eligibleParticipants.length > 0}
                                onChange={handleToggleSelectAll}
                                style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#ff4fa3' }}
                              />
                            </th>
                            <th className="organizer-rewards__th">Participant</th>
                            <th className="organizer-rewards__th">Registration ID</th>
                            <th className="organizer-rewards__th">{isHackathon ? 'Team Name' : 'Email Address'}</th>
                            <th className="organizer-rewards__th">Eligibility Source</th>
                            <th className="organizer-rewards__th">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredEligible.map((p) => {
                            const isSelected = selectedRegistrationIds.has(p.publicRegistrationId)
                            return (
                              <tr
                                key={p.publicRegistrationId || p.registrationId || p.email}
                                className={`organizer-rewards__tr ${isSelected ? 'organizer-rewards__tr--selected' : ''}`}
                              >
                                <td className="organizer-rewards__td">
                                  <input
                                    type="checkbox"
                                    aria-label={`Select ${getRewardParticipant(p)}`}
                                    checked={isSelected}
                                    onChange={() => handleToggleSelectOne(p.publicRegistrationId)}
                                    style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#ff4fa3' }}
                                  />
                                </td>
                                <td className="organizer-rewards__td">
                                  <strong style={{ display: 'block', color: '#241938' }}>{getRewardParticipant(p)}</strong>
                                  <small style={{ color: '#7b6f93' }}>{p.email}</small>
                                </td>
                                <td className="organizer-rewards__td">
                                  <span className="organizer-rewards__code-pill">{p.publicRegistrationId || '—'}</span>
                                </td>
                                <td className="organizer-rewards__td">
                                  {isHackathon ? (
                                    <strong style={{ color: '#4b3d68' }}>{p.teamName || '—'}</strong>
                                  ) : (
                                    <span style={{ color: '#4b3d68' }}>{p.email}</span>
                                  )}
                                </td>
                                <td className="organizer-rewards__td">
                                  <span className="organizer-rewards__badge organizer-rewards__badge--eligible">
                                    {isHackathon ? 'Team Member' : 'Attended Session'}
                                  </span>
                                </td>
                                <td className="organizer-rewards__td">
                                  <span className="organizer-rewards__badge organizer-rewards__badge--eligible">
                                    ✓ Eligible
                                  </span>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* MOBILE CARDS VIEW */}
                    <div className="organizer-rewards__mobile-records">
                      {filteredEligible.map((p) => {
                        const isSelected = selectedRegistrationIds.has(p.publicRegistrationId)
                        return (
                          <div key={p.publicRegistrationId || p.registrationId} className="organizer-rewards__mobile-card">
                            <div className="organizer-rewards__mobile-card-header">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleSelectOne(p.publicRegistrationId)}
                                  style={{ width: '18px', height: '18px', accentColor: '#ff4fa3' }}
                                  aria-label={`Select ${getRewardParticipant(p)}`}
                                />
                                <div className="organizer-rewards__mobile-card-title">
                                  <strong>{getRewardParticipant(p)}</strong>
                                  <span>{p.email}</span>
                                </div>
                              </div>
                              <span className="organizer-rewards__badge organizer-rewards__badge--eligible">
                                Eligible
                              </span>
                            </div>

                            <div className="organizer-rewards__mobile-card-body">
                              <div className="organizer-rewards__mobile-detail-row">
                                <span style={{ color: '#7b6f93' }}>Reg ID:</span>
                                <span className="organizer-rewards__code-pill">{p.publicRegistrationId}</span>
                              </div>
                              {isHackathon && (
                                <div className="organizer-rewards__mobile-detail-row">
                                  <span style={{ color: '#7b6f93' }}>Team:</span>
                                  <strong>{p.teamName || '—'}</strong>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </>
            )}

            {/* TAB 2: HACKATHON AWARDS & PLACEMENTS (Hackathon only) */}
            {activeTab === 'awards' && isHackathon && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#241938', margin: '0 0 0.35rem 0' }}>
                    Select Placement Tier
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#7b6f93', margin: 0 }}>
                    Choose the placement award to assign and generate verified winner certificates.
                  </p>
                </div>

                {/* PLACEMENT CARDS */}
                <div className="organizer-rewards__awards-grid" role="radiogroup" aria-label="Hackathon placement tiers">
                  {hackathonPlacements.map((p) => {
                    const isSelected = placement === p.value
                    return (
                      <div
                        key={p.value}
                        className={`organizer-rewards__placement-card ${isSelected ? 'organizer-rewards__placement-card--selected' : ''}`}
                        onClick={() => setPlacement(p.value)}
                        role="radio"
                        aria-checked={isSelected}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === ' ' || e.key === 'Enter') {
                            e.preventDefault()
                            setPlacement(p.value)
                          }
                        }}
                      >
                        <div className="organizer-rewards__placement-top">
                          <span className="organizer-rewards__placement-icon" aria-hidden="true">{p.icon}</span>
                          <input
                            type="radio"
                            name="placement-tier"
                            value={p.value}
                            checked={isSelected}
                            onChange={() => setPlacement(p.value)}
                            className="organizer-rewards__placement-radio"
                            aria-label={p.label}
                          />
                        </div>
                        <h4 className="organizer-rewards__placement-title">{p.label}</h4>
                        <p className="organizer-rewards__placement-desc">{p.desc}</p>
                        <span className={`organizer-rewards__badge organizer-rewards__badge--${p.tier}`}>
                          {p.badge}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* TEAM ASSIGNMENT CONSOLE */}
                <div className="organizer-rewards__assign-section">
                  <div className="organizer-rewards__assign-header">
                    <div>
                      <h4 style={{ margin: '0 0 0.25rem 0', color: '#241938', fontSize: '1rem', fontWeight: '700' }}>
                        Assign Team & Generate Winner Certificates
                      </h4>
                      <p style={{ margin: 0, color: '#7b6f93', fontSize: '0.84rem' }}>
                        Select a registered hackathon team to assign the chosen placement.
                      </p>
                    </div>

                    <select
                      id="organizer-award-team-select"
                      className="organizer-rewards__selector-select"
                      value={selectedTeamId}
                      onChange={(e) => setSelectedTeamId(e.target.value)}
                      aria-label="Select winning team"
                    >
                      <option value="">— Select Winning Team —</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.team_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* TEAM ROSTER PREVIEW */}
                  {selectedTeamId ? (
                    <div className="organizer-rewards__team-roster">
                      <span className="organizer-rewards__roster-title">
                        Team Roster ({teamMembers.length} {teamMembers.length === 1 ? 'member' : 'members'})
                      </span>
                      {teamMembers.length > 0 ? (
                        <div className="organizer-rewards__roster-list">
                          {teamMembers.map((member) => (
                            <div key={member.publicRegistrationId || member.registrationId} className="organizer-rewards__roster-tag">
                              <span style={{ color: '#ff4fa3' }}>👤</span>
                              <strong>{member.fullName}</strong>
                              <small style={{ color: '#7b6f93' }}>({member.publicRegistrationId})</small>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ fontSize: '0.84rem', color: '#7b6f93', margin: 0 }}>
                          Loading team members…
                        </p>
                      )}
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.84rem', color: '#7b6f93', margin: 0 }}>
                      No team selected. Choose a team above to view its member roster.
                    </p>
                  )}

                  <div className="organizer-rewards__assign-actions">
                    <button
                      type="button"
                      className="button button--primary"
                      onClick={handleAssignAward}
                      disabled={!selectedTeamId || isAssigning}
                      style={{ fontSize: '0.88rem', padding: '0.6rem 1.3rem' }}
                    >
                      {isAssigning ? 'Assigning Award…' : '1. Assign Award Placement'}
                    </button>

                    <button
                      type="button"
                      className="button button--secondary"
                      onClick={handleGenerateAwardCertificates}
                      disabled={!selectedTeamId || !teamMembers.length || isGenerating}
                      style={{ fontSize: '0.88rem', padding: '0.6rem 1.3rem' }}
                    >
                      {isGenerating ? 'Generating Winner Certificates…' : '2. Generate Winner Certificates'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: ISSUED CERTIFICATES LEDGER */}
            {activeTab === 'ledger' && (
              <>
                <div className="organizer-rewards__toolbar">
                  <div className="organizer-rewards__search-wrap">
                    <span className="organizer-rewards__search-icon" aria-hidden="true">🔍</span>
                    <input
                      type="text"
                      className="organizer-rewards__search-input"
                      placeholder="Search ledger by cert #, recipient, type, verification code…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      aria-label="Search issued certificates ledger"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        className="organizer-rewards__search-clear"
                        onClick={() => setSearchQuery('')}
                        aria-label="Clear search input"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="organizer-rewards__toolbar-actions">
                    <span style={{ fontSize: '0.84rem', color: '#7b6f93' }}>
                      Showing {filteredIssued.length} of {eventIssuedCertificates.length} certificates
                    </span>
                  </div>
                </div>

                {isCertificatesLoading ? (
                  <div>
                    <div className="organizer-rewards__skeleton-row" />
                    <div className="organizer-rewards__skeleton-row" />
                    <div className="organizer-rewards__skeleton-row" />
                  </div>
                ) : filteredIssued.length === 0 ? (
                  <div className="organizer-rewards__empty">
                    <span className="organizer-rewards__empty-icon" aria-hidden="true">
                      {searchQuery ? '🔎' : '📜'}
                    </span>
                    <h4>
                      {searchQuery ? 'No Matching Certificates' : 'No Certificates Issued Yet'}
                    </h4>
                    <p>
                      {searchQuery
                        ? 'Try clearing or changing your search terms.'
                        : 'Certificates generated for this event will appear in this ledger with verifiable security codes and PDF download links.'}
                    </p>
                    {searchQuery && (
                      <button
                        type="button"
                        className="button button--secondary"
                        onClick={() => setSearchQuery('')}
                        style={{ marginTop: '0.5rem' }}
                      >
                        Clear Search
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    {/* DESKTOP TABLE */}
                    <div className="organizer-rewards__table-wrap">
                      <table className="organizer-rewards__table" aria-label="Issued certificates table">
                        <thead>
                          <tr>
                            <th className="organizer-rewards__th">Certificate #</th>
                            <th className="organizer-rewards__th">Recipient</th>
                            <th className="organizer-rewards__th">Certificate Type</th>
                            <th className="organizer-rewards__th">Issue Date</th>
                            <th className="organizer-rewards__th">Status</th>
                            <th className="organizer-rewards__th">Verification Code</th>
                            <th className="organizer-rewards__th" style={{ textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredIssued.map((cert) => (
                            <tr key={cert.certificateId || cert.certificateNumber} className="organizer-rewards__tr">
                              <td className="organizer-rewards__td">
                                <strong style={{ color: '#241938' }}>{cert.certificateNumber}</strong>
                              </td>
                              <td className="organizer-rewards__td">
                                <strong style={{ display: 'block', color: '#241938' }}>{getCertRecipient(cert)}</strong>
                                <small style={{ color: '#7b6f93' }}>{getCertEmail(cert)}</small>
                              </td>
                              <td className="organizer-rewards__td">
                                <span className={`organizer-rewards__badge ${cert.certificateType?.includes('FIRST') ? 'organizer-rewards__badge--gold' : 'organizer-rewards__badge--issued'}`}>
                                  {certificateTypeLabels[cert.certificateType] || cert.certificateType}
                                </span>
                              </td>
                              <td className="organizer-rewards__td">
                                <span style={{ color: '#4b3d68', fontSize: '0.82rem' }}>
                                  {formatCertificateDate(cert.issuedAt)}
                                </span>
                              </td>
                              <td className="organizer-rewards__td">
                                <span className="organizer-rewards__badge organizer-rewards__badge--eligible">
                                  ● {cert.status || 'issued'}
                                </span>
                              </td>
                              <td className="organizer-rewards__td">
                                <span className="organizer-rewards__code-pill">{cert.verificationCode || '—'}</span>
                              </td>
                              <td className="organizer-rewards__td" style={{ textAlign: 'right' }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                                  {(cert.viewUrl || cert.downloadUrl) && (
                                    <a
                                      href={cert.viewUrl || cert.downloadUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="button button--secondary"
                                      style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                                    >
                                      View PDF
                                    </a>
                                  )}
                                  <button
                                    type="button"
                                    className="button button--secondary"
                                    style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                                    onClick={() => setSelectedCertModal(cert)}
                                  >
                                    Details
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* MOBILE CARDS VIEW */}
                    <div className="organizer-rewards__mobile-records">
                      {filteredIssued.map((cert) => (
                        <div key={cert.certificateId || cert.certificateNumber} className="organizer-rewards__mobile-card">
                          <div className="organizer-rewards__mobile-card-header">
                            <div className="organizer-rewards__mobile-card-title">
                              <strong>{cert.certificateNumber}</strong>
                              <span>{getCertRecipient(cert)}</span>
                            </div>
                            <span className="organizer-rewards__badge organizer-rewards__badge--eligible">
                              ● {cert.status || 'issued'}
                            </span>
                          </div>

                          <div className="organizer-rewards__mobile-card-body">
                            <div className="organizer-rewards__mobile-detail-row">
                              <span style={{ color: '#7b6f93' }}>Type:</span>
                              <span style={{ fontWeight: 600 }}>
                                {certificateTypeLabels[cert.certificateType] || cert.certificateType}
                              </span>
                            </div>
                            <div className="organizer-rewards__mobile-detail-row">
                              <span style={{ color: '#7b6f93' }}>Issued:</span>
                              <span>{formatCertificateDate(cert.issuedAt)}</span>
                            </div>
                            <div className="organizer-rewards__mobile-detail-row">
                              <span style={{ color: '#7b6f93' }}>Verify Code:</span>
                              <span className="organizer-rewards__code-pill">{cert.verificationCode}</span>
                            </div>
                          </div>

                          <div className="organizer-rewards__mobile-card-actions">
                            {(cert.viewUrl || cert.downloadUrl) && (
                              <a
                                href={cert.viewUrl || cert.downloadUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="button button--primary"
                                style={{ flex: 1, fontSize: '0.82rem', padding: '0.45rem 0.75rem', textAlign: 'center' }}
                              >
                                View / Download PDF
                              </a>
                            )}
                            <button
                              type="button"
                              className="button button--secondary"
                              style={{ flex: 1, fontSize: '0.82rem', padding: '0.45rem 0.75rem' }}
                              onClick={() => setSelectedCertModal(cert)}
                            >
                              Inspect Details
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* CERTIFICATE DETAILS INSPECTION MODAL */}
      {selectedCertModal && (
        <div
          className="organizer-rewards__modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedCertModal(null)
          }}
          role="presentation"
        >
          <div
            className="organizer-rewards__modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cert-modal-title"
          >
            <div className="organizer-rewards__modal-header">
              <div>
                <h3 id="cert-modal-title" className="organizer-rewards__modal-title">
                  Certificate Details
                </h3>
                <p className="organizer-rewards__modal-subtitle">
                  {selectedCertModal.certificateNumber}
                </p>
              </div>
              <button
                type="button"
                className="organizer-rewards__modal-close"
                onClick={() => setSelectedCertModal(null)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="organizer-rewards__modal-body">
              <div className="organizer-rewards__modal-field">
                <span className="organizer-rewards__modal-field-label">Recipient Name</span>
                <span className="organizer-rewards__modal-field-value">{getCertRecipient(selectedCertModal)}</span>
              </div>
              <div className="organizer-rewards__modal-field">
                <span className="organizer-rewards__modal-field-label">Recipient Email</span>
                <span className="organizer-rewards__modal-field-value">{getCertEmail(selectedCertModal)}</span>
              </div>
              <div className="organizer-rewards__modal-field">
                <span className="organizer-rewards__modal-field-label">Certificate Type</span>
                <span className="organizer-rewards__modal-field-value">
                  {certificateTypeLabels[selectedCertModal.certificateType] || selectedCertModal.certificateType}
                </span>
              </div>
              <div className="organizer-rewards__modal-field">
                <span className="organizer-rewards__modal-field-label">Event</span>
                <span className="organizer-rewards__modal-field-value">{selectedCertModal.eventName || selectedEvent?.event_name || '—'}</span>
              </div>
              <div className="organizer-rewards__modal-field">
                <span className="organizer-rewards__modal-field-label">Issued Timestamp</span>
                <span className="organizer-rewards__modal-field-value">{formatCertificateDate(selectedCertModal.issuedAt)}</span>
              </div>
              <div className="organizer-rewards__modal-field">
                <span className="organizer-rewards__modal-field-label">Verification Code</span>
                <span className="organizer-rewards__code-pill" style={{ fontSize: '0.88rem', padding: '0.35rem 0.65rem' }}>
                  {selectedCertModal.verificationCode}
                </span>
              </div>
              <div className="organizer-rewards__modal-field">
                <span className="organizer-rewards__modal-field-label">Status</span>
                <span className="organizer-rewards__badge organizer-rewards__badge--eligible" style={{ width: 'fit-content' }}>
                  ● {selectedCertModal.status || 'issued'}
                </span>
              </div>
            </div>

            <div className="organizer-rewards__modal-footer">
              {(selectedCertModal.viewUrl || selectedCertModal.downloadUrl) && (
                <a
                  href={selectedCertModal.viewUrl || selectedCertModal.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="button button--primary"
                  style={{ fontSize: '0.88rem' }}
                >
                  Download Certificate PDF ↗
                </a>
              )}
              <button
                type="button"
                className="button button--secondary"
                onClick={() => setSelectedCertModal(null)}
                style={{ fontSize: '0.88rem' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const OrganizerEventsPage = () => {
  const { activeProfile } = useEventProfile()

  const [events, setEvents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [deleteModalEvent, setDeleteModalEvent] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState(null)

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTab, setFilterTab] = useState('ALL') // 'ALL', 'ACTIVE', 'CLOSED', 'UPCOMING', 'TODAY', 'HACKATHON', 'WORKSHOP', 'WEBINAR', 'GENERAL'

  const initialFormData = {
    event_type: 'HACKATHON',
    event_name: '',
    description: '',
    event_date: '',
    start_time: '',
    end_time: '',
    location: '',
    status: 'ACTIVE',
    max_participants: '',
    registration_info: '',
  }

  const [formData, setFormData] = useState(initialFormData)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')

  // Date & Schedule boundary calculation helpers (Single source of truth)
  const getTodayDateStr = () => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  const getScheduleStatus = (dateVal) => {
    if (!dateVal) return null
    const dateStr = String(dateVal).slice(0, 10)
    const todayStr = getTodayDateStr()
    if (dateStr > todayStr) return 'UPCOMING'
    if (dateStr === todayStr) return 'TODAY'
    return 'CONCLUDED'
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

  const getEventTypeClass = (type) => {
    switch (String(type || '').toUpperCase()) {
      case 'HACKATHON': return 'organizer-events__type-pill--hackathon'
      case 'WORKSHOP': return 'organizer-events__type-pill--workshop'
      case 'WEBINAR': return 'organizer-events__type-pill--webinar'
      case 'BOOTCAMP': return 'organizer-events__type-pill--bootcamp'
      case 'GENERAL': return 'organizer-events__type-pill--general'
      default: return 'organizer-events__type-pill--other'
    }
  }

  // Load events via profile-aware API
  const loadEvents = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const res = await api.organizerFetchEvents()
      if (res.success && Array.isArray(res.data)) {
        setEvents(res.data)
      } else {
        setError(res.error?.message || 'Failed to load events from database.')
      }
    } catch (err) {
      setError('A network error occurred while loading events.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Profile-isolation: clean reset and reload whenever activeProfile changes
  useEffect(() => {
    setEvents([])
    setEditingEvent(null)
    setDeleteModalEvent(null)
    setModalOpen(false)
    setSearchQuery('')
    setFilterTab('ALL')
    setError('')
    setSuccess('')
    loadEvents()
  }, [activeProfile, loadEvents])

  // Accessible keyboard dismissal for modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (modalOpen && !formLoading) {
          setModalOpen(false)
        }
        if (deleteModalEvent && !isDeleting) {
          setDeleteModalEvent(null)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [modalOpen, formLoading, deleteModalEvent, isDeleting])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (formError) setFormError('')
  }

  const handleOpenCreateModal = () => {
    setEditingEvent(null)
    setFormData(initialFormData)
    setFormError('')
    setFormSuccess('')
    setModalOpen(true)
  }

  const handleOpenEditModal = (evt) => {
    setEditingEvent(evt)
    setFormData({
      event_type: String(evt.eventType || evt.event_type || 'HACKATHON').toUpperCase(),
      event_name: evt.name || evt.event_name || '',
      description: evt.description || '',
      event_date: (evt.date || evt.event_date || '').slice(0, 10),
      start_time: evt.startTime || evt.start_time || '',
      end_time: evt.endTime || evt.end_time || '',
      location: evt.venue || evt.location || '',
      status: String(evt.status || 'ACTIVE').toUpperCase(),
      max_participants: evt.maxParticipants !== null && evt.maxParticipants !== undefined ? String(evt.maxParticipants) : '',
      registration_info: evt.registrationInfo || evt.registration_info || '',
    })
    setFormError('')
    setFormSuccess('')
    setModalOpen(true)
  }

  const handleEventFormSubmit = async (e) => {
    e.preventDefault()
    setFormLoading(true)
    setFormError('')
    setFormSuccess('')

    const payload = {
      event_type: formData.event_type,
      event_name: (formData.event_name || '').trim(),
      description: (formData.description || '').trim() || null,
      event_date: formData.event_date,
      start_time: formData.start_time || null,
      end_time: formData.end_time || null,
      location: (formData.location || '').trim() || null,
      status: formData.status || 'ACTIVE',
      max_participants: formData.max_participants ? Number(formData.max_participants) : null,
      registration_info: (formData.registration_info || '').trim() || null,
    }

    const eventId = editingEvent ? (editingEvent.eventId || editingEvent.event_id) : null
    const res = editingEvent
      ? await api.organizerUpdateEvent(eventId, payload)
      : await api.organizerCreateEvent(payload)

    setFormLoading(false)

    if (!res.success) {
      setFormError(res.error?.message || 'Unable to save event. Please verify your inputs.')
      return
    }

    setFormSuccess(editingEvent ? 'Event updated successfully!' : 'Event successfully created and saved to database!')
    await loadEvents()
    setTimeout(() => {
      setModalOpen(false)
      setEditingEvent(null)
      setFormData(initialFormData)
      setFormSuccess('')
    }, 900)
  }

  const handleToggleStatus = async (evt) => {
    const eventId = evt.eventId || evt.event_id
    const currentStatus = String(evt.status || 'ACTIVE').toUpperCase()
    const nextStatus = currentStatus === 'ACTIVE' ? 'CLOSED' : 'ACTIVE'

    setActionLoadingId(eventId)
    const res = await api.organizerUpdateEventStatus(eventId, nextStatus)
    setActionLoadingId(null)

    if (res.success) {
      setSuccess(`Event "${evt.name || evt.event_name}" status changed to ${nextStatus}.`)
      await loadEvents()
    } else {
      setError(res.error?.message || `Failed to change status to ${nextStatus}.`)
    }
  }

  const handleDeleteEventConfirm = async () => {
    if (!deleteModalEvent) return
    const eventId = deleteModalEvent.eventId || deleteModalEvent.event_id
    setIsDeleting(true)
    const res = await api.organizerDeleteEvent(eventId)
    setIsDeleting(false)

    if (res.success) {
      setDeleteModalEvent(null)
      setSuccess(`Event "${deleteModalEvent.name || deleteModalEvent.event_name}" was deleted successfully.`)
      await loadEvents()
    } else {
      setError(res.error?.message || 'Failed to delete event. Dependent records may exist.')
      setDeleteModalEvent(null)
    }
  }

  // Summary Metrics (100% derived from loaded events)
  const totalCount = events.length
  const activeCount = events.filter((e) => String(e.status || 'ACTIVE').toUpperCase() === 'ACTIVE').length
  const closedCount = events.filter((e) => String(e.status || '').toUpperCase() === 'CLOSED').length
  const upcomingCount = events.filter((e) => getScheduleStatus(e.date || e.event_date) === 'UPCOMING').length
  const todayCount = events.filter((e) => getScheduleStatus(e.date || e.event_date) === 'TODAY').length
  const hackathonCount = events.filter((e) => String(e.eventType || e.event_type || '').toUpperCase() === 'HACKATHON').length
  const workshopCount = events.filter((e) => ['WORKSHOP', 'WEBINAR'].includes(String(e.eventType || e.event_type || '').toUpperCase())).length

  // Filtered Events (Client-side search & filter)
  const filteredEvents = events.filter((evt) => {
    // Tab filter
    if (filterTab === 'ACTIVE' && String(evt.status || 'ACTIVE').toUpperCase() !== 'ACTIVE') return false
    if (filterTab === 'CLOSED' && String(evt.status || '').toUpperCase() !== 'CLOSED') return false
    if (filterTab === 'UPCOMING' && getScheduleStatus(evt.date || evt.event_date) !== 'UPCOMING') return false
    if (filterTab === 'TODAY' && getScheduleStatus(evt.date || evt.event_date) !== 'TODAY') return false
    if (filterTab === 'HACKATHON' && String(evt.eventType || evt.event_type || '').toUpperCase() !== 'HACKATHON') return false
    if (filterTab === 'WORKSHOP' && String(evt.eventType || evt.event_type || '').toUpperCase() !== 'WORKSHOP') return false
    if (filterTab === 'WEBINAR' && String(evt.eventType || evt.event_type || '').toUpperCase() !== 'WEBINAR') return false
    if (filterTab === 'GENERAL' && String(evt.eventType || evt.event_type || '').toUpperCase() !== 'GENERAL') return false

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const name = String(evt.name || evt.event_name || '').toLowerCase()
      const id = String(evt.eventId || evt.event_id || '').toLowerCase()
      const type = String(evt.eventType || evt.event_type || '').toLowerCase()
      const loc = String(evt.venue || evt.location || '').toLowerCase()
      const desc = String(evt.description || '').toLowerCase()
      if (!name.includes(q) && !id.includes(q) && !type.includes(q) && !loc.includes(q) && !desc.includes(q)) {
        return false
      }
    }
    return true
  })

  return (
    <div className="organizer-page-view organizer-events-container">
      <OrganizerPageHeading
        eyebrow="EVENT OPERATIONS"
        title="Events"
        description="Monitor scheduled sessions, configure event metadata, and manage event lifecycles."
        action={
          <div className="organizer-events__header-badge">
            <span className="organizer-events__profile-pill">
              <span className="organizer-events__profile-dot" />
              {activeProfile === 'post-qiskit' ? 'Post-Qiskit' : 'Pre-Qiskit'}
            </span>
            <span className="organizer-events__count-pill" aria-label={`Loaded events: ${totalCount}`}>
              {isLoading ? 'Loading…' : `${totalCount} Event${totalCount === 1 ? '' : 's'}`}
            </span>
            <div className="organizer-events__header-actions">
              <button
                type="button"
                className="organizer-events__btn-secondary"
                onClick={loadEvents}
                disabled={isLoading}
                title="Reload events from database"
                aria-label="Refresh events list"
              >
                <span aria-hidden="true">↻</span> Refresh
              </button>
              <button
                type="button"
                className="organizer-events__btn-primary"
                onClick={handleOpenCreateModal}
                aria-label="Create new event"
              >
                <span aria-hidden="true">＋</span> Create New Event
              </button>
            </div>
          </div>
        }
      />

      {/* ERROR BANNER */}
      {error && (
        <div className="organizer-events__alert organizer-events__alert--error" role="alert">
          <div className="organizer-events__alert-content">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
          <button type="button" className="organizer-events__alert-close" onClick={() => setError('')} aria-label="Dismiss error">×</button>
        </div>
      )}

      {/* SUCCESS BANNER */}
      {success && (
        <div className="organizer-events__alert organizer-events__alert--success" role="status">
          <div className="organizer-events__alert-content">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>{success}</span>
          </div>
          <button type="button" className="organizer-events__alert-close" onClick={() => setSuccess('')} aria-label="Dismiss message">×</button>
        </div>
      )}

      {/* SUMMARY KPI STRIP */}
      <div className="organizer-events__summary-strip">
        <div className="organizer-events__metric-item organizer-events__metric-item--total">
          <span className="organizer-events__metric-label">Total Events</span>
          <span className="organizer-events__metric-value">{isLoading ? '—' : totalCount}</span>
          <span className="organizer-events__metric-desc">Configured sessions</span>
        </div>
        <div className="organizer-events__metric-item organizer-events__metric-item--active">
          <span className="organizer-events__metric-label">Active Access</span>
          <span className="organizer-events__metric-value">{isLoading ? '—' : activeCount}</span>
          <span className="organizer-events__metric-desc">Open for attendance</span>
        </div>
        <div className="organizer-events__metric-item organizer-events__metric-item--closed">
          <span className="organizer-events__metric-label">Closed Access</span>
          <span className="organizer-events__metric-value">{isLoading ? '—' : closedCount}</span>
          <span className="organizer-events__metric-desc">Access restricted</span>
        </div>
        <div className="organizer-events__metric-item organizer-events__metric-item--upcoming">
          <span className="organizer-events__metric-label">Upcoming Schedule</span>
          <span className="organizer-events__metric-value">{isLoading ? '—' : upcomingCount}</span>
          <span className="organizer-events__metric-desc">Strictly future dates</span>
        </div>
        <div className="organizer-events__metric-item organizer-events__metric-item--hackathon">
          <span className="organizer-events__metric-label">Hackathons</span>
          <span className="organizer-events__metric-value">{isLoading ? '—' : hackathonCount}</span>
          <span className="organizer-events__metric-desc">Team problem tracks</span>
        </div>
        <div className="organizer-events__metric-item">
          <span className="organizer-events__metric-label">Workshops & Webinars</span>
          <span className="organizer-events__metric-value">{isLoading ? '—' : workshopCount}</span>
          <span className="organizer-events__metric-desc">Learning tracks</span>
        </div>
      </div>

      {/* MAIN DATA PANEL */}
      <div className="organizer-events__panel">
        {/* TOOLBAR */}
        <div className="organizer-events__toolbar">
          <div className="organizer-events__toolbar-top">
            {/* SEARCH */}
            <div className="organizer-events__search-wrap">
              <span className="organizer-events__search-icon" aria-hidden="true">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="text"
                className="organizer-events__search-input"
                placeholder="Search by name, ID, venue, or type…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search events"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="organizer-events__search-clear"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* FILTER TABS */}
            <div className="organizer-events__filter-tabs" role="tablist" aria-label="Event filter tabs">
              <button
                type="button"
                role="tab"
                aria-selected={filterTab === 'ALL'}
                className={`organizer-events__tab-btn ${filterTab === 'ALL' ? 'organizer-events__tab-btn--active' : ''}`}
                onClick={() => setFilterTab('ALL')}
              >
                All <span className="organizer-events__tab-count">{totalCount}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={filterTab === 'ACTIVE'}
                className={`organizer-events__tab-btn ${filterTab === 'ACTIVE' ? 'organizer-events__tab-btn--active' : ''}`}
                onClick={() => setFilterTab('ACTIVE')}
              >
                Active <span className="organizer-events__tab-count">{activeCount}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={filterTab === 'CLOSED'}
                className={`organizer-events__tab-btn ${filterTab === 'CLOSED' ? 'organizer-events__tab-btn--active' : ''}`}
                onClick={() => setFilterTab('CLOSED')}
              >
                Closed <span className="organizer-events__tab-count">{closedCount}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={filterTab === 'UPCOMING'}
                className={`organizer-events__tab-btn ${filterTab === 'UPCOMING' ? 'organizer-events__tab-btn--active' : ''}`}
                onClick={() => setFilterTab('UPCOMING')}
              >
                Upcoming <span className="organizer-events__tab-count">{upcomingCount}</span>
              </button>
              {todayCount > 0 && (
                <button
                  type="button"
                  role="tab"
                  aria-selected={filterTab === 'TODAY'}
                  className={`organizer-events__tab-btn ${filterTab === 'TODAY' ? 'organizer-events__tab-btn--active' : ''}`}
                  onClick={() => setFilterTab('TODAY')}
                >
                  Today <span className="organizer-events__tab-count">{todayCount}</span>
                </button>
              )}
              <button
                type="button"
                role="tab"
                aria-selected={filterTab === 'HACKATHON'}
                className={`organizer-events__tab-btn ${filterTab === 'HACKATHON' ? 'organizer-events__tab-btn--active' : ''}`}
                onClick={() => setFilterTab('HACKATHON')}
              >
                Hackathon <span className="organizer-events__tab-count">{hackathonCount}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={filterTab === 'WORKSHOP'}
                className={`organizer-events__tab-btn ${filterTab === 'WORKSHOP' ? 'organizer-events__tab-btn--active' : ''}`}
                onClick={() => setFilterTab('WORKSHOP')}
              >
                Workshop <span className="organizer-events__tab-count">{events.filter((e) => String(e.eventType || e.event_type || '').toUpperCase() === 'WORKSHOP').length}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={filterTab === 'WEBINAR'}
                className={`organizer-events__tab-btn ${filterTab === 'WEBINAR' ? 'organizer-events__tab-btn--active' : ''}`}
                onClick={() => setFilterTab('WEBINAR')}
              >
                Webinar <span className="organizer-events__tab-count">{events.filter((e) => String(e.eventType || e.event_type || '').toUpperCase() === 'WEBINAR').length}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={filterTab === 'GENERAL'}
                className={`organizer-events__tab-btn ${filterTab === 'GENERAL' ? 'organizer-events__tab-btn--active' : ''}`}
                onClick={() => setFilterTab('GENERAL')}
              >
                General <span className="organizer-events__tab-count">{events.filter((e) => String(e.eventType || e.event_type || '').toUpperCase() === 'GENERAL').length}</span>
              </button>
            </div>
          </div>

          {/* TOOLBAR META */}
          <div className="organizer-events__toolbar-meta">
            <span>
              Showing <strong>{filteredEvents.length}</strong> of <strong>{totalCount}</strong> event{totalCount === 1 ? '' : 's'}
            </span>
            {(searchQuery || filterTab !== 'ALL') && (
              <button
                type="button"
                className="organizer-events__clear-filter-link"
                onClick={() => {
                  setSearchQuery('')
                  setFilterTab('ALL')
                }}
              >
                Reset search & filters
              </button>
            )}
          </div>
        </div>

        {/* LOADING SKELETON */}
        {isLoading ? (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="organizer-events__skeleton organizer-events__skeleton--line" style={{ width: '40%' }} />
            <div className="organizer-events__skeleton organizer-events__skeleton--card" />
            <div className="organizer-events__skeleton organizer-events__skeleton--card" />
            <div className="organizer-events__skeleton organizer-events__skeleton--card" />
          </div>
        ) : events.length === 0 ? (
          /* EMPTY STATE (DATABASE EMPTY) */
          <div className="organizer-events__empty">
            <span className="organizer-events__empty-icon" aria-hidden="true">📅</span>
            <h3 className="organizer-events__empty-title">No events configured for this profile</h3>
            <p className="organizer-events__empty-desc">
              No sessions exist in the {activeProfile === 'post-qiskit' ? 'Post-Qiskit' : 'Pre-Qiskit'} database yet. Click "Create New Event" above to create the first event.
            </p>
            <button
              type="button"
              className="organizer-events__btn-primary"
              style={{ marginTop: '0.5rem' }}
              onClick={handleOpenCreateModal}
            >
              ＋ Create First Event
            </button>
          </div>
        ) : filteredEvents.length === 0 ? (
          /* EMPTY STATE (SEARCH/FILTER EMPTY) */
          <div className="organizer-events__empty">
            <span className="organizer-events__empty-icon" aria-hidden="true">🔍</span>
            <h3 className="organizer-events__empty-title">No matching events found</h3>
            <p className="organizer-events__empty-desc">
              None of your configured events matched the current search query or filter criteria.
            </p>
            <button
              type="button"
              className="organizer-events__btn-secondary"
              style={{ marginTop: '0.5rem' }}
              onClick={() => {
                setSearchQuery('')
                setFilterTab('ALL')
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            {/* DESKTOP SEMANTIC TABLE (>768px) */}
            <div className="organizer-events__table-wrap">
              <table className="organizer-events__table">
                <thead>
                  <tr>
                    <th scope="col">Event Details</th>
                    <th scope="col">Type</th>
                    <th scope="col">Schedule</th>
                    <th scope="col">Location</th>
                    <th scope="col">Capacity</th>
                    <th scope="col">Access Status</th>
                    <th scope="col" style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((evt) => {
                    const eventId = evt.eventId || evt.event_id
                    const name = evt.name || evt.event_name
                    const type = String(evt.eventType || evt.event_type || 'GENERAL').toUpperCase()
                    const dateDisplay = formatEventDate(evt.date || evt.event_date)
                    const timeDisplay = formatTimeRange(evt.startTime || evt.start_time, evt.endTime || evt.end_time)
                    const schedStatus = getScheduleStatus(evt.date || evt.event_date)
                    const accessStatus = String(evt.status || 'ACTIVE').toUpperCase()
                    const isActive = accessStatus === 'ACTIVE'
                    const isBusy = actionLoadingId === eventId

                    return (
                      <tr key={eventId}>
                        {/* Event details cell */}
                        <td>
                          <div className="organizer-events__name-cell">
                            <span className="organizer-events__event-name">{name}</span>
                            <span className="organizer-events__id-code">ID: {eventId}</span>
                            {evt.description && (
                              <span className="organizer-events__desc-preview" title={evt.description}>
                                {evt.description}
                              </span>
                            )}
                            {evt.registrationInfo && (
                              <span className="organizer-events__reg-note">
                                <span aria-hidden="true">ℹ</span> {evt.registrationInfo}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Type cell */}
                        <td>
                          <span className={`organizer-events__type-pill ${getEventTypeClass(type)}`}>
                            {type}
                          </span>
                        </td>

                        {/* Schedule cell */}
                        <td>
                          <div className="organizer-events__schedule-cell">
                            <span className="organizer-events__date-text">{dateDisplay}</span>
                            {timeDisplay && (
                              <span className="organizer-events__time-text">{timeDisplay}</span>
                            )}
                            {schedStatus && (
                              <span
                                className={`organizer-events__schedule-badge ${
                                  schedStatus === 'UPCOMING'
                                    ? 'organizer-events__schedule-badge--upcoming'
                                    : schedStatus === 'TODAY'
                                    ? 'organizer-events__schedule-badge--today'
                                    : 'organizer-events__schedule-badge--concluded'
                                }`}
                              >
                                {schedStatus === 'UPCOMING' ? 'Upcoming' : schedStatus === 'TODAY' ? 'Happening Today' : 'Concluded'}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Venue cell */}
                        <td>
                          <div className="organizer-events__venue-cell">
                            {evt.venue || evt.location ? (
                              <span>📍 {evt.venue || evt.location}</span>
                            ) : (
                              <span style={{ color: '#8c82a2', fontStyle: 'italic' }}>Location TBA</span>
                            )}
                          </div>
                        </td>

                        {/* Capacity cell */}
                        <td>
                          <span className="organizer-events__capacity-cell">
                            {evt.maxParticipants ? `Max: ${evt.maxParticipants}` : 'Open / Unlimited'}
                          </span>
                        </td>

                        {/* Access Status cell */}
                        <td>
                          <span
                            className={`organizer-events__status-badge ${
                              isActive ? 'organizer-events__status-badge--active' : 'organizer-events__status-badge--closed'
                            }`}
                          >
                            {isActive ? '● ACTIVE' : '○ CLOSED'}
                          </span>
                        </td>

                        {/* Actions cell */}
                        <td>
                          <div className="organizer-events__action-group" style={{ justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              className="organizer-events__action-btn organizer-events__action-btn--edit"
                              onClick={() => handleOpenEditModal(evt)}
                              disabled={isBusy}
                              title="Edit event details"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className={`organizer-events__action-btn ${
                                isActive ? 'organizer-events__action-btn--close' : 'organizer-events__action-btn--reopen'
                              }`}
                              onClick={() => handleToggleStatus(evt)}
                              disabled={isBusy}
                              title={isActive ? 'Close event access' : 'Reopen event access'}
                            >
                              {isBusy ? 'Saving…' : isActive ? 'Close Event' : 'Reopen Event'}
                            </button>

                            <button
                              type="button"
                              className="organizer-events__action-btn organizer-events__action-btn--delete"
                              onClick={() => setDeleteModalEvent(evt)}
                              disabled={isBusy}
                              title="Delete event"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* RESPONSIVE MOBILE CARDS (<= 768px down to 390px) */}
            <div className="organizer-events__mobile-cards">
              {filteredEvents.map((evt) => {
                const eventId = evt.eventId || evt.event_id
                const name = evt.name || evt.event_name
                const type = String(evt.eventType || evt.event_type || 'GENERAL').toUpperCase()
                const dateDisplay = formatEventDate(evt.date || evt.event_date)
                const timeDisplay = formatTimeRange(evt.startTime || evt.start_time, evt.endTime || evt.end_time)
                const schedStatus = getScheduleStatus(evt.date || evt.event_date)
                const accessStatus = String(evt.status || 'ACTIVE').toUpperCase()
                const isActive = accessStatus === 'ACTIVE'
                const isBusy = actionLoadingId === eventId

                return (
                  <div
                    key={eventId}
                    className={`organizer-events__mobile-card ${!isActive ? 'organizer-events__mobile-card--closed' : ''}`}
                  >
                    {/* Top Row: Type and Access Status */}
                    <div className="organizer-events__mobile-top">
                      <span className={`organizer-events__type-pill ${getEventTypeClass(type)}`}>
                        {type}
                      </span>
                      <span
                        className={`organizer-events__status-badge ${
                          isActive ? 'organizer-events__status-badge--active' : 'organizer-events__status-badge--closed'
                        }`}
                      >
                        {isActive ? '● ACTIVE' : '○ CLOSED'}
                      </span>
                    </div>

                    {/* Title and ID */}
                    <div>
                      <h3 className="organizer-events__mobile-title">{name}</h3>
                      <span className="organizer-events__id-code" style={{ marginTop: '0.25rem' }}>
                        ID: {eventId}
                      </span>
                    </div>

                    {/* Metadata Grid */}
                    <div className="organizer-events__mobile-grid">
                      <div className="organizer-events__mobile-meta-item">
                        <span className="organizer-events__mobile-meta-label">Schedule Date</span>
                        <span className="organizer-events__mobile-meta-val">{dateDisplay}</span>
                      </div>
                      <div className="organizer-events__mobile-meta-item">
                        <span className="organizer-events__mobile-meta-label">Schedule Timeline</span>
                        <span className="organizer-events__mobile-meta-val">
                          {schedStatus === 'UPCOMING' ? 'Upcoming' : schedStatus === 'TODAY' ? 'Happening Today' : 'Concluded'}
                        </span>
                      </div>
                      {timeDisplay && (
                        <div className="organizer-events__mobile-meta-item">
                          <span className="organizer-events__mobile-meta-label">Time Window</span>
                          <span className="organizer-events__mobile-meta-val">{timeDisplay}</span>
                        </div>
                      )}
                      <div className="organizer-events__mobile-meta-item">
                        <span className="organizer-events__mobile-meta-label">Capacity</span>
                        <span className="organizer-events__mobile-meta-val">
                          {evt.maxParticipants ? `${evt.maxParticipants} max` : 'Open / Unlimited'}
                        </span>
                      </div>
                      {(evt.venue || evt.location) && (
                        <div className="organizer-events__mobile-meta-item" style={{ gridColumn: '1 / -1' }}>
                          <span className="organizer-events__mobile-meta-label">Venue</span>
                          <span className="organizer-events__mobile-meta-val">📍 {evt.venue || evt.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Description preview */}
                    {evt.description && (
                      <p className="organizer-events__desc-preview" style={{ margin: 0 }}>
                        {evt.description}
                      </p>
                    )}

                    {/* Registration note */}
                    {evt.registrationInfo && (
                      <span className="organizer-events__reg-note">
                        <span aria-hidden="true">ℹ</span> {evt.registrationInfo}
                      </span>
                    )}

                    {/* Mobile Action Buttons (min-height 44px touch targets) */}
                    <div className="organizer-events__mobile-actions">
                      <button
                        type="button"
                        className="organizer-events__action-btn organizer-events__action-btn--edit"
                        onClick={() => handleOpenEditModal(evt)}
                        disabled={isBusy}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className={`organizer-events__action-btn ${
                          isActive ? 'organizer-events__action-btn--close' : 'organizer-events__action-btn--reopen'
                        }`}
                        onClick={() => handleToggleStatus(evt)}
                        disabled={isBusy}
                      >
                        {isBusy ? 'Saving…' : isActive ? 'Close Event' : 'Reopen Event'}
                      </button>

                      <button
                        type="button"
                        className="organizer-events__action-btn organizer-events__action-btn--delete"
                        onClick={() => setDeleteModalEvent(evt)}
                        disabled={isBusy}
                      >
                        Delete Event
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* CREATE / EDIT EVENT MODAL */}
      {modalOpen && (
        <div
          className="organizer-events__modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="event-modal-title"
          onClick={() => !formLoading && setModalOpen(false)}
        >
          <div className="organizer-events__modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="organizer-events__modal-header">
              <div>
                <p className="organizer-events__modal-eyebrow">Database Operation</p>
                <h3 id="event-modal-title" className="organizer-events__modal-title">
                  {editingEvent ? 'Edit Event Configuration' : 'Create New Event'}
                </h3>
              </div>
              <button
                type="button"
                className="organizer-events__modal-close"
                onClick={() => !formLoading && setModalOpen(false)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <form className="organizer-events__modal-form" onSubmit={handleEventFormSubmit}>
              {formError && (
                <div className="organizer-events__alert organizer-events__alert--error" role="alert">
                  <span>{formError}</span>
                </div>
              )}
              {formSuccess && (
                <div className="organizer-events__alert organizer-events__alert--success" role="status">
                  <span>{formSuccess}</span>
                </div>
              )}

              {/* Requirement #1 & Adjustment #2: FIRST FIELD MUST BE EVENT TYPE with ALL valid types */}
              <div className="organizer-events__field-group organizer-events__field-group--full">
                <label className="organizer-events__label organizer-events__label--highlight" htmlFor="modal-event-type">
                  Event Type *
                </label>
                <select
                  id="modal-event-type"
                  name="event_type"
                  value={formData.event_type}
                  onChange={handleInputChange}
                  required
                  className="organizer-events__select organizer-events__select--primary"
                >
                  <option value="HACKATHON">Hackathon</option>
                  <option value="WORKSHOP">Workshop</option>
                  <option value="WEBINAR">Webinar</option>
                  <option value="BOOTCAMP">Bootcamp</option>
                  <option value="GENERAL">General</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              {/* Event Name */}
              <div className="organizer-events__field-group organizer-events__field-group--full">
                <label className="organizer-events__label" htmlFor="modal-event-name">
                  Event Name *
                </label>
                <input
                  id="modal-event-name"
                  type="text"
                  name="event_name"
                  value={formData.event_name}
                  onChange={handleInputChange}
                  placeholder="e.g. Qiskit Quantum Hackathon"
                  required
                  className="organizer-events__input"
                />
              </div>

              {/* Description */}
              <div className="organizer-events__field-group organizer-events__field-group--full">
                <label className="organizer-events__label" htmlFor="modal-event-desc">
                  Description
                </label>
                <textarea
                  id="modal-event-desc"
                  name="description"
                  rows="3"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Brief summary and topics of this session…"
                  className="organizer-events__textarea"
                />
              </div>

              {/* Date & Access Status */}
              <div className="organizer-events__form-row">
                <div className="organizer-events__field-group">
                  <label className="organizer-events__label" htmlFor="modal-event-date">
                    Event Date *
                  </label>
                  <input
                    id="modal-event-date"
                    type="date"
                    name="event_date"
                    value={formData.event_date}
                    onChange={handleInputChange}
                    required
                    className="organizer-events__input"
                  />
                </div>

                <div className="organizer-events__field-group">
                  <label className="organizer-events__label" htmlFor="modal-event-status">
                    Access Status
                  </label>
                  <select
                    id="modal-event-status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="organizer-events__select"
                  >
                    <option value="ACTIVE">ACTIVE (Open)</option>
                    <option value="CLOSED">CLOSED (Restricted)</option>
                  </select>
                </div>
              </div>

              {/* Start & End Time */}
              <div className="organizer-events__form-row">
                <div className="organizer-events__field-group">
                  <label className="organizer-events__label" htmlFor="modal-start-time">
                    Start Time
                  </label>
                  <input
                    id="modal-start-time"
                    type="time"
                    name="start_time"
                    value={formData.start_time}
                    onChange={handleInputChange}
                    className="organizer-events__input"
                  />
                </div>

                <div className="organizer-events__field-group">
                  <label className="organizer-events__label" htmlFor="modal-end-time">
                    End Time
                  </label>
                  <input
                    id="modal-end-time"
                    type="time"
                    name="end_time"
                    value={formData.end_time}
                    onChange={handleInputChange}
                    className="organizer-events__input"
                  />
                </div>
              </div>

              {/* Venue / Location */}
              <div className="organizer-events__field-group organizer-events__field-group--full">
                <label className="organizer-events__label" htmlFor="modal-location">
                  Venue / Location
                </label>
                <input
                  id="modal-location"
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g. CUTM-AP Campus Auditorium or Virtual (Webex)"
                  className="organizer-events__input"
                />
              </div>

              {/* Capacity & Registration Info */}
              <div className="organizer-events__form-row">
                <div className="organizer-events__field-group">
                  <label className="organizer-events__label" htmlFor="modal-max-participants">
                    Max Participants (Optional)
                  </label>
                  <input
                    id="modal-max-participants"
                    type="number"
                    name="max_participants"
                    min="1"
                    value={formData.max_participants}
                    onChange={handleInputChange}
                    placeholder="e.g. 100"
                    className="organizer-events__input"
                  />
                </div>

                <div className="organizer-events__field-group">
                  <label className="organizer-events__label" htmlFor="modal-reg-info">
                    Registration Info (Optional)
                  </label>
                  <input
                    id="modal-reg-info"
                    type="text"
                    name="registration_info"
                    value={formData.registration_info}
                    onChange={handleInputChange}
                    placeholder="e.g. Open to registered attendees"
                    className="organizer-events__input"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="organizer-events__modal-actions">
                <button
                  type="button"
                  className="organizer-events__btn-secondary"
                  onClick={() => setModalOpen(false)}
                  disabled={formLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="organizer-events__btn-primary"
                  disabled={formLoading}
                >
                  {formLoading ? 'Saving to Database…' : editingEvent ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE EVENT CONFIRMATION MODAL */}
      {deleteModalEvent && (
        <div
          className="organizer-events__modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-event-dialog-title"
          onClick={() => !isDeleting && setDeleteModalEvent(null)}
        >
          <div
            className="organizer-events__modal-dialog organizer-events__modal-dialog--destructive"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="organizer-events__modal-header" style={{ borderBottomColor: 'rgba(239, 68, 68, 0.2)' }}>
              <div>
                <p className="organizer-events__modal-eyebrow" style={{ color: '#dc2626' }}>
                  Destructive Action
                </p>
                <h3 id="delete-event-dialog-title" className="organizer-events__modal-title" style={{ color: '#991b1b' }}>
                  Delete this event?
                </h3>
              </div>
              <button
                type="button"
                className="organizer-events__modal-close"
                onClick={() => !isDeleting && setDeleteModalEvent(null)}
                disabled={isDeleting}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <div className="organizer-events__modal-body--delete">
              <p style={{ margin: '0 0 0.5rem 0' }}>
                Are you sure you want to permanently delete this event record?
              </p>
              <div className="organizer-events__delete-target">
                <span>{deleteModalEvent.name || deleteModalEvent.event_name}</span>
                <span className="organizer-events__id-code">
                  ID: {deleteModalEvent.eventId || deleteModalEvent.event_id}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.84rem', color: '#6b7280' }}>
                This will delete the event and its associated records from the active database. If dependent records exist that prevent deletion, the database will block this operation and leave your data intact.
              </p>
            </div>

            <div className="organizer-events__modal-actions">
              <button
                type="button"
                className="organizer-events__btn-secondary"
                onClick={() => setDeleteModalEvent(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="organizer-events__btn-delete-confirm"
                onClick={handleDeleteEventConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting…' : 'Delete Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


const OrganizerPostEventPage = () => {
  const { activeProfile, switchProfile, refreshPostQiskitConfig } = useEventProfile()

  const [config, setConfig] = useState(null)
  const [configForm, setConfigForm] = useState({
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    timezone: '',
    coordinator_name: '',
    coordinator_contact: '',
    venue: '',
    location: '',
    description: '',
    activities: '',
  })

  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSavingConfig, setIsSavingConfig] = useState(false)
  const [isTogglingAccess, setIsTogglingAccess] = useState(false)
  const [isTogglingReg, setIsTogglingReg] = useState(false)

  const [accessModalOpen, setAccessModalOpen] = useState(false)
  const [registrationModalOpen, setRegistrationModalOpen] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Load authoritative configuration directly from backend
  const fetchConfig = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }
    setError('')

    try {
      const result = await api.getPostEventConfig()
      if (result.success && result.data) {
        const d = result.data
        setConfig(d)
        setConfigForm({
          start_date: d.start_date ? String(d.start_date).slice(0, 10) : '',
          end_date: d.end_date ? String(d.end_date).slice(0, 10) : '',
          start_time: d.start_time ? String(d.start_time).slice(0, 5) : '',
          end_time: d.end_time ? String(d.end_time).slice(0, 5) : '',
          timezone: d.timezone || 'Asia/Kolkata',
          coordinator_name: d.coordinator_name || '',
          coordinator_contact: d.coordinator_contact || '',
          venue: d.venue || '',
          location: d.location || '',
          description: d.description || '',
          activities: d.activities || '',
        })
        if (isManualRefresh) {
          setSuccess('Configuration refreshed from database.')
        }
      } else {
        setError(result.error?.message || 'Failed to load Post-Event configuration.')
      }
    } catch (_err) {
      setError('Unable to reach server to load Post-Event configuration.')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  // Accessible keyboard dismissal for modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (accessModalOpen && !isTogglingAccess) setAccessModalOpen(false)
        if (registrationModalOpen && !isTogglingReg) setRegistrationModalOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [accessModalOpen, isTogglingAccess, registrationModalOpen, isTogglingReg])

  // Helper: Get today's YYYY-MM-DD date in a specific timezone
  const getTodayInTimezone = (tz = 'Asia/Kolkata') => {
    try {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
      return formatter.format(new Date())
    } catch {
      const d = new Date()
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    }
  }

  // Dynamic schedule status calculated from configured dates and timezone
  const computeScheduleStatus = (sDate, eDate, tz) => {
    if (!sDate || !eDate) return 'UPCOMING'
    const today = getTodayInTimezone(tz || 'Asia/Kolkata')
    const s = String(sDate).slice(0, 10)
    const e = String(eDate).slice(0, 10)
    if (today < s) return 'UPCOMING'
    if (today > e) return 'CONCLUDED'
    return 'TODAY'
  }

  // Formatted date range display helper (e.g. October 5 – 10, 2026)
  const formatDisplayDateRange = (sDate, eDate) => {
    if (!sDate) return 'Dates unconfigured'
    try {
      const [sY, sM, sD] = String(sDate).slice(0, 10).split('-').map(Number)
      if (!eDate || String(sDate).slice(0, 10) === String(eDate).slice(0, 10)) {
        return new Date(Date.UTC(sY, sM - 1, sD)).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
          timeZone: 'UTC',
        })
      }
      const [eY, eM, eD] = String(eDate).slice(0, 10).split('-').map(Number)
      const startObj = new Date(Date.UTC(sY, sM - 1, sD))
      const endObj = new Date(Date.UTC(eY, eM - 1, eD))

      if (sY === eY && sM === eM) {
        const month = startObj.toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' })
        return `${month} ${sD} – ${eD}, ${sY}`
      }
      return `${startObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })} – ${endObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}`
    } catch {
      return `${sDate} – ${eDate || sDate}`
    }
  }

  // Authoritative status values
  const isEnabled = Boolean(config?.enabled)
  const isRegistrationOpen = Boolean(config?.registration_open)
  const scheduleStatus = computeScheduleStatus(config?.start_date, config?.end_date, config?.timezone)
  const displayDates = formatDisplayDateRange(config?.start_date, config?.end_date)
  const displayStartTime = config?.start_time ? String(config.start_time).slice(0, 5) : '09:00'
  const displayEndTime = config?.end_time ? String(config.end_time).slice(0, 5) : '17:00'
  const displayTimezone = config?.timezone || 'Asia/Kolkata'

  // Form input change handler
  const handleConfigChange = (e) => {
    const { name, value } = e.target
    setConfigForm((prev) => ({ ...prev, [name]: value }))
    if (error) setError('')
    if (success) setSuccess('')
  }

  // Toggle Event Access (Confirmed)
  const handleConfirmToggleAccess = async () => {
    setIsTogglingAccess(true)
    setError('')
    setSuccess('')

    try {
      const willEnable = !isEnabled
      const result = willEnable
        ? await api.enablePostEvent()
        : await api.disablePostEvent()

      if (result.success) {
        await fetchConfig()
        await refreshPostQiskitConfig()

        if (willEnable && activeProfile === 'pre-qiskit') {
          switchProfile('post-qiskit')
        } else if (!willEnable && activeProfile === 'post-qiskit') {
          switchProfile('pre-qiskit')
        }

        setSuccess(willEnable ? 'Post-Qiskit access enabled.' : 'Post-Qiskit access disabled.')
      } else {
        setError(result.error?.message || 'Failed to update event access.')
      }
    } catch (_err) {
      setError('An error occurred while communicating with the server.')
    } finally {
      setIsTogglingAccess(false)
      setAccessModalOpen(false)
    }
  }

  // Toggle Registration (Confirmed)
  const handleConfirmToggleRegistration = async () => {
    setIsTogglingReg(true)
    setError('')
    setSuccess('')

    try {
      const result = isRegistrationOpen
        ? await api.closePostEventRegistration()
        : await api.openPostEventRegistration()

      if (result.success) {
        setSuccess(isRegistrationOpen ? 'Registration closed.' : 'Registration opened.')
        await fetchConfig()
        await refreshPostQiskitConfig()
      } else {
        setError(result.error?.message || 'Failed to update registration status.')
      }
    } catch (_err) {
      setError('An error occurred while communicating with the server.')
    } finally {
      setIsTogglingReg(false)
      setRegistrationModalOpen(false)
    }
  }

  // Save Schedule & Details Configuration
  const handleSaveConfig = async (e) => {
    e.preventDefault()
    setIsSavingConfig(true)
    setError('')
    setSuccess('')

    // Validation matching backend contract
    if (!configForm.start_date || !configForm.end_date) {
      setError('Start date and end date are required.')
      setIsSavingConfig(false)
      return
    }

    if (configForm.start_date > configForm.end_date) {
      setError('Start date cannot be after end date.')
      setIsSavingConfig(false)
      return
    }

    if (!configForm.timezone.trim()) {
      setError('Timezone is required.')
      setIsSavingConfig(false)
      return
    }

    try {
      const payload = {
        start_date: configForm.start_date,
        end_date: configForm.end_date,
        start_time: configForm.start_time ? (configForm.start_time.length === 5 ? `${configForm.start_time}:00` : configForm.start_time) : null,
        end_time: configForm.end_time ? (configForm.end_time.length === 5 ? `${configForm.end_time}:00` : configForm.end_time) : null,
        timezone: configForm.timezone.trim() || 'Asia/Kolkata',
        coordinator_name: configForm.coordinator_name.trim() || null,
        coordinator_contact: configForm.coordinator_contact.trim() || null,
        venue: configForm.venue.trim() || null,
        location: configForm.location.trim() || null,
        description: configForm.description.trim() || null,
        activities: configForm.activities.trim() || null,
      }

      const result = await api.updatePostEventConfig(payload)
      if (result.success) {
        setSuccess('Event schedule and session details saved successfully.')
        await fetchConfig()
        await refreshPostQiskitConfig()
      } else {
        setError(result.error?.message || 'Failed to save event schedule and session details.')
      }
    } catch (_err) {
      setError('An unexpected error occurred while saving configuration.')
    } finally {
      setIsSavingConfig(false)
    }
  }

  // Scroll to Schedule Configuration section
  const scrollToConfigEditor = () => {
    const el = document.getElementById('schedule-config-section')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      const firstInput = el.querySelector('input')
      if (firstInput) {
        firstInput.focus()
      }
    }
  }

  // Reset form to currently loaded authoritative config
  const handleResetConfig = () => {
    if (config) {
      setConfigForm({
        start_date: config.start_date ? String(config.start_date).slice(0, 10) : '',
        end_date: config.end_date ? String(config.end_date).slice(0, 10) : '',
        start_time: config.start_time ? String(config.start_time).slice(0, 5) : '',
        end_time: config.end_time ? String(config.end_time).slice(0, 5) : '',
        timezone: config.timezone || 'Asia/Kolkata',
        coordinator_name: config.coordinator_name || '',
        coordinator_contact: config.coordinator_contact || '',
        venue: config.venue || '',
        location: config.location || '',
        description: config.description || '',
        activities: config.activities || '',
      })
      setError('')
      setSuccess('')
    }
  }

  return (
    <div className="organizer-page-view organizer-post-event-container">
      {/* 1. OPERATIONS HEADER */}
      <OrganizerPageHeading
        eyebrow="POST-EVENT OPERATIONS"
        title="Post-Event"
        description="Manage Post-Qiskit public access, schedule visibility, and registration availability."
        action={
          <div className="organizer-post-event__header-badge">
            <span className="organizer-post-event__context-pill">
              <span className="organizer-post-event__context-dot" aria-hidden="true" />
              Affects: Post-Qiskit Profile
            </span>
            <button
              type="button"
              className="organizer-post-event__refresh-btn"
              onClick={() => fetchConfig(true)}
              disabled={isLoading || isRefreshing}
              title="Reload authoritative configuration from database"
              aria-label="Refresh Post-Event settings"
            >
              <span aria-hidden="true">{isRefreshing ? '⌛' : '↻'}</span>
              {isRefreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        }
      />

      {/* ERROR BANNER */}
      {error && (
        <div className="organizer-post-event__alert organizer-post-event__alert--error" role="alert">
          <div className="organizer-post-event__alert-content">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
          <button type="button" className="organizer-post-event__alert-close" onClick={() => setError('')} aria-label="Dismiss error">×</button>
        </div>
      )}

      {/* SUCCESS BANNER */}
      {success && (
        <div className="organizer-post-event__alert organizer-post-event__alert--success" role="status">
          <div className="organizer-post-event__alert-content">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>{success}</span>
          </div>
          <button type="button" className="organizer-post-event__alert-close" onClick={() => setSuccess('')} aria-label="Dismiss message">×</button>
        </div>
      )}

      {/* LOADING SKELETON */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 0' }}>
          <div className="organizer-post-event__skeleton" style={{ height: '80px' }} />
          <div className="organizer-post-event__skeleton" style={{ height: '260px' }} />
          <div className="organizer-post-event__skeleton" style={{ height: '240px' }} />
        </div>
      ) : (
        <>
          {/* 2. CURRENT STATUS SUMMARY (3 Discrete Concepts) */}
          <div className="organizer-post-event__status-strip">
            {/* Concept A: Event Access */}
            <div className={`organizer-post-event__status-card ${isEnabled ? 'organizer-post-event__status-card--access' : 'organizer-post-event__status-card--access-disabled'}`}>
              <span className="organizer-post-event__status-label">Event Access</span>
              <div className="organizer-post-event__status-val">
                <span className={`organizer-post-event__badge ${isEnabled ? 'organizer-post-event__badge--enabled' : 'organizer-post-event__badge--disabled'}`}>
                  {isEnabled ? '● ENABLED' : '○ DISABLED'}
                </span>
              </div>
              <span className="organizer-post-event__status-desc">
                {isEnabled ? 'Public visitors can enter Post-Qiskit' : 'Public entry to Post-Qiskit is locked'}
              </span>
            </div>

            {/* Concept B: Schedule */}
            <div className="organizer-post-event__status-card organizer-post-event__status-card--schedule">
              <span className="organizer-post-event__status-label">Schedule</span>
              <div className="organizer-post-event__status-val">
                <span className="organizer-post-event__badge organizer-post-event__badge--upcoming">
                  {scheduleStatus}
                </span>
              </div>
              <span className="organizer-post-event__status-desc">
                {displayDates}
              </span>
            </div>

            {/* Concept C: Registration */}
            <div className={`organizer-post-event__status-card ${isRegistrationOpen ? 'organizer-post-event__status-card--registration-open' : 'organizer-post-event__status-card--registration-closed'}`}>
              <span className="organizer-post-event__status-label">Registration</span>
              <div className="organizer-post-event__status-val">
                <span className={`organizer-post-event__badge ${isRegistrationOpen ? 'organizer-post-event__badge--open' : 'organizer-post-event__badge--closed'}`}>
                  {isRegistrationOpen ? '● OPEN' : '○ CLOSED'}
                </span>
              </div>
              <span className="organizer-post-event__status-desc">
                {isRegistrationOpen ? 'Accepting new attendee submissions' : 'Registration submissions closed'}
              </span>
            </div>
          </div>

          {/* 3. DISCRETE 3-CARD CONTROL CLUSTER */}
          <div className="organizer-post-event__control-grid">
            {/* CARD A: EVENT ACCESS */}
            <div className="organizer-post-event__card">
              <div className="organizer-post-event__card-header">
                <div>
                  <p className="organizer-post-event__card-eyebrow">Portal Control</p>
                  <h3 className="organizer-post-event__card-title">Event Access</h3>
                </div>
                <span className={`organizer-post-event__badge ${isEnabled ? 'organizer-post-event__badge--enabled' : 'organizer-post-event__badge--disabled'}`}>
                  {isEnabled ? '● ENABLED' : '○ DISABLED'}
                </span>
              </div>

              <div className="organizer-post-event__card-body">
                <p className="organizer-post-event__card-desc">
                  {isEnabled
                    ? 'Post-Qiskit portal is accessible. Public visitors can enter and explore Post-Qiskit event content.'
                    : 'Post-Qiskit is locked. Public attendees cannot enter the Post-Qiskit portal from the landing page.'}
                </p>

                <div className="organizer-post-event__card-meta-list">
                  <div className="organizer-post-event__card-meta-item">
                    <span className="organizer-post-event__card-meta-label">Landing Page Enter Button</span>
                    <span className="organizer-post-event__card-meta-val">{isEnabled ? 'Active' : 'Inactive'}</span>
                  </div>
                  <div className="organizer-post-event__card-meta-item">
                    <span className="organizer-post-event__card-meta-label">Registration Dependency</span>
                    <span className="organizer-post-event__card-meta-val">Independent</span>
                  </div>
                </div>
              </div>

              <div className="organizer-post-event__card-footer">
                <button
                  type="button"
                  className={`organizer-post-event__action-btn ${isEnabled ? 'organizer-post-event__action-btn--danger' : 'organizer-post-event__action-btn--primary'}`}
                  onClick={() => setAccessModalOpen(true)}
                  disabled={isTogglingAccess}
                >
                  {isEnabled ? 'Disable Post-Event' : 'Enable Post-Event'}
                </button>
              </div>
            </div>

            {/* CARD B: SCHEDULE (ORGANIZER-CONFIGURED) */}
            <div className="organizer-post-event__card">
              <div className="organizer-post-event__card-header">
                <div>
                  <p className="organizer-post-event__card-eyebrow">Event Timeline</p>
                  <h3 className="organizer-post-event__card-title">Schedule</h3>
                </div>
                <span className="organizer-post-event__badge organizer-post-event__badge--upcoming">
                  {scheduleStatus}
                </span>
              </div>

              <div className="organizer-post-event__card-body">
                <p className="organizer-post-event__card-desc">
                  Organizer-configured schedule for the Post-Qiskit phase. Schedule status is calculated dynamically from the configured dates and timezone.
                </p>

                <div className="organizer-post-event__card-meta-list">
                  <div className="organizer-post-event__card-meta-item">
                    <span className="organizer-post-event__card-meta-label">Event Dates</span>
                    <span className="organizer-post-event__card-meta-val">{displayDates}</span>
                  </div>
                  <div className="organizer-post-event__card-meta-item">
                    <span className="organizer-post-event__card-meta-label">Daily Operational Window</span>
                    <span className="organizer-post-event__card-meta-val">{displayStartTime} – {displayEndTime}</span>
                  </div>
                  <div className="organizer-post-event__card-meta-item">
                    <span className="organizer-post-event__card-meta-label">Timezone</span>
                    <span className="organizer-post-event__card-meta-val">{displayTimezone}</span>
                  </div>
                </div>
              </div>

              <div className="organizer-post-event__card-footer">
                <button
                  type="button"
                  className="organizer-post-event__action-btn organizer-post-event__action-btn--secondary"
                  onClick={scrollToConfigEditor}
                >
                  Edit Schedule & Details
                </button>
              </div>
            </div>

            {/* CARD C: REGISTRATION CONTROL */}
            <div className="organizer-post-event__card">
              <div className="organizer-post-event__card-header">
                <div>
                  <p className="organizer-post-event__card-eyebrow">Registration Gateway</p>
                  <h3 className="organizer-post-event__card-title">Registration</h3>
                </div>
                <span className={`organizer-post-event__badge ${isRegistrationOpen ? 'organizer-post-event__badge--open' : 'organizer-post-event__badge--closed'}`}>
                  {isRegistrationOpen ? '● OPEN' : '○ CLOSED'}
                </span>
              </div>

              <div className="organizer-post-event__card-body">
                <p className="organizer-post-event__card-desc">
                  {isRegistrationOpen
                    ? 'Registration for Post-Qiskit is active. Public attendees can submit new participant registrations.'
                    : 'Registration for Post-Qiskit is closed. Attendees cannot register. Pre-Qiskit registration remains permanently closed.'}
                </p>

                <div className="organizer-post-event__card-meta-list">
                  <div className="organizer-post-event__card-meta-item">
                    <span className="organizer-post-event__card-meta-label">Submission Status</span>
                    <span className="organizer-post-event__card-meta-val">{isRegistrationOpen ? 'Accepting' : 'Blocked'}</span>
                  </div>
                  <div className="organizer-post-event__card-meta-item">
                    <span className="organizer-post-event__card-meta-label">Access Dependency</span>
                    <span className="organizer-post-event__card-meta-val">Independent</span>
                  </div>
                </div>
              </div>

              <div className="organizer-post-event__card-footer">
                <button
                  type="button"
                  className={`organizer-post-event__action-btn ${isRegistrationOpen ? 'organizer-post-event__action-btn--purple-outline' : 'organizer-post-event__action-btn--purple'}`}
                  onClick={() => setRegistrationModalOpen(true)}
                  disabled={isTogglingReg}
                >
                  {isRegistrationOpen ? 'Close Registration' : 'Open Registration'}
                </button>
              </div>
            </div>
          </div>

          {/* 4. INFORMATIVE OPERATIONAL RULES BOX */}
          <div className="organizer-post-event__rules-box">
            <span className="organizer-post-event__rules-icon" aria-hidden="true">💡</span>
            <div className="organizer-post-event__rules-content">
              <h4 className="organizer-post-event__rules-title">Decoupled Operational States</h4>
              <p style={{ margin: 0 }}>
                <strong>Event Access</strong>, <strong>Schedule</strong>, and <strong>Registration Control</strong> operate completely independently. Changing the schedule does not open/close registration or lock/unlock the portal. Pre-Qiskit records and data remain strictly isolated at all times.
              </p>
            </div>
          </div>

          {/* 5. CONFIGURATION & DETAILS EDITOR */}
          <div id="schedule-config-section" className="organizer-post-event__metadata-card">
            <div className="organizer-post-event__metadata-header">
              <div>
                <h3 className="organizer-post-event__metadata-title">Event Schedule & Session Details</h3>
                <p className="organizer-post-event__metadata-desc">
                  Configure event dates, daily operational hours, timezone, coordinator contact, and session logistics for Post-Qiskit.
                </p>
              </div>
            </div>

            <form className="organizer-post-event__form" onSubmit={handleSaveConfig}>
              {/* SECTION A: SCHEDULE CONFIGURATION */}
              <div className="organizer-post-event__form-section">
                <h4 className="organizer-post-event__section-title">
                  <span aria-hidden="true">📅</span> Schedule Configuration
                </h4>
                <p className="organizer-post-event__section-subtitle">
                  Set the start date, end date, daily operational window, and timezone for the Post-Qiskit phase.
                </p>

                <div className="organizer-post-event__form-grid">
                  <div className="organizer-post-event__field-group">
                    <label className="organizer-post-event__label" htmlFor="cfg-start-date">
                      Post-Event Start Date <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      id="cfg-start-date"
                      type="date"
                      name="start_date"
                      value={configForm.start_date}
                      onChange={handleConfigChange}
                      required
                      className="organizer-post-event__input"
                    />
                  </div>

                  <div className="organizer-post-event__field-group">
                    <label className="organizer-post-event__label" htmlFor="cfg-end-date">
                      Post-Event End Date <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      id="cfg-end-date"
                      type="date"
                      name="end_date"
                      value={configForm.end_date}
                      onChange={handleConfigChange}
                      required
                      className="organizer-post-event__input"
                    />
                  </div>
                </div>

                <div className="organizer-post-event__form-grid">
                  <div className="organizer-post-event__field-group">
                    <label className="organizer-post-event__label" htmlFor="cfg-start-time">
                      Daily Start Time
                    </label>
                    <input
                      id="cfg-start-time"
                      type="time"
                      name="start_time"
                      value={configForm.start_time}
                      onChange={handleConfigChange}
                      className="organizer-post-event__input"
                    />
                  </div>

                  <div className="organizer-post-event__field-group">
                    <label className="organizer-post-event__label" htmlFor="cfg-end-time">
                      Daily End Time
                    </label>
                    <input
                      id="cfg-end-time"
                      type="time"
                      name="end_time"
                      value={configForm.end_time}
                      onChange={handleConfigChange}
                      className="organizer-post-event__input"
                    />
                  </div>
                </div>

                <div className="organizer-post-event__form-grid">
                  <div className="organizer-post-event__field-group organizer-post-event__field-group--full">
                    <label className="organizer-post-event__label" htmlFor="cfg-timezone">
                      Timezone <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      id="cfg-timezone"
                      type="text"
                      name="timezone"
                      list="timezone-datalist"
                      value={configForm.timezone}
                      onChange={handleConfigChange}
                      required
                      placeholder="e.g. Asia/Kolkata"
                      className="organizer-post-event__input"
                    />
                    <datalist id="timezone-datalist">
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">America/New_York (EST/EDT)</option>
                      <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
                      <option value="Europe/London">Europe/London (GMT/BST)</option>
                      <option value="Europe/Berlin">Europe/Berlin (CET/CEST)</option>
                      <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                      <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                    </datalist>
                    <span style={{ fontSize: '0.75rem', color: '#7b6f93', marginTop: '0.2rem' }}>
                      Standard IANA timezone identifier (e.g. Asia/Kolkata, UTC, America/New_York).
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION B: SUPPORTING SESSION DETAILS */}
              <div className="organizer-post-event__form-section" style={{ marginTop: '0.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(120, 89, 202, 0.12)' }}>
                <h4 className="organizer-post-event__section-title">
                  <span aria-hidden="true">📋</span> Supporting Session Details
                </h4>
                <p className="organizer-post-event__section-subtitle">
                  Update coordinator contacts, campus venue, and session summary for attendee reference.
                </p>

                <div className="organizer-post-event__form-grid">
                  <div className="organizer-post-event__field-group">
                    <label className="organizer-post-event__label" htmlFor="meta-coordinator-name">
                      Coordinator Name
                    </label>
                    <input
                      id="meta-coordinator-name"
                      type="text"
                      name="coordinator_name"
                      value={configForm.coordinator_name}
                      onChange={handleConfigChange}
                      placeholder="e.g. Dr. Jane Doe"
                      className="organizer-post-event__input"
                    />
                  </div>

                  <div className="organizer-post-event__field-group">
                    <label className="organizer-post-event__label" htmlFor="meta-coordinator-contact">
                      Coordinator Contact / Email
                    </label>
                    <input
                      id="meta-coordinator-contact"
                      type="text"
                      name="coordinator_contact"
                      value={configForm.coordinator_contact}
                      onChange={handleConfigChange}
                      placeholder="e.g. coordinator@example.com / +91-9876543210"
                      className="organizer-post-event__input"
                    />
                  </div>
                </div>

                <div className="organizer-post-event__form-grid">
                  <div className="organizer-post-event__field-group">
                    <label className="organizer-post-event__label" htmlFor="meta-venue">
                      Venue / Campus Location
                    </label>
                    <input
                      id="meta-venue"
                      type="text"
                      name="venue"
                      value={configForm.venue}
                      onChange={handleConfigChange}
                      placeholder="e.g. CUTM-AP Campus Auditorium"
                      className="organizer-post-event__input"
                    />
                  </div>

                  <div className="organizer-post-event__field-group">
                    <label className="organizer-post-event__label" htmlFor="meta-location">
                      City / Format
                    </label>
                    <input
                      id="meta-location"
                      type="text"
                      name="location"
                      value={configForm.location}
                      onChange={handleConfigChange}
                      placeholder="e.g. Andhra Pradesh / Hybrid"
                      className="organizer-post-event__input"
                    />
                  </div>
                </div>

                <div className="organizer-post-event__field-group organizer-post-event__field-group--full">
                  <label className="organizer-post-event__label" htmlFor="meta-description">
                    Post-Event Description
                  </label>
                  <textarea
                    id="meta-description"
                    name="description"
                    rows={3}
                    value={configForm.description}
                    onChange={handleConfigChange}
                    placeholder="Summary of Post-Qiskit Fall Fest event scope, goals, and focus…"
                    className="organizer-post-event__textarea"
                  />
                </div>

                <div className="organizer-post-event__field-group organizer-post-event__field-group--full">
                  <label className="organizer-post-event__label" htmlFor="meta-activities">
                    Event Activities & Tracks
                  </label>
                  <textarea
                    id="meta-activities"
                    name="activities"
                    rows={3}
                    value={configForm.activities}
                    onChange={handleConfigChange}
                    placeholder="Key activities, workshops, keynote presentations, and hackathon milestones…"
                    className="organizer-post-event__textarea"
                  />
                </div>
              </div>

              <div className="organizer-post-event__form-actions" style={{ gap: '0.75rem' }}>
                <button
                  type="button"
                  className="organizer-post-event__reset-btn"
                  onClick={handleResetConfig}
                  disabled={isSavingConfig}
                >
                  Reset
                </button>
                <button
                  type="submit"
                  className="organizer-post-event__save-btn"
                  disabled={isSavingConfig}
                >
                  {isSavingConfig ? 'Saving Changes…' : 'Save Schedule & Details'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* 6. CONFIRMATION MODAL: EVENT ACCESS */}
      {accessModalOpen && (
        <div
          className="organizer-post-event__modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="access-modal-title"
          onClick={() => !isTogglingAccess && setAccessModalOpen(false)}
        >
          <div className="organizer-post-event__modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="organizer-post-event__modal-header">
              <div>
                <p className="organizer-post-event__modal-eyebrow">
                  {isEnabled ? 'Disable Access' : 'Enable Access'}
                </p>
                <h3 id="access-modal-title" className="organizer-post-event__modal-title">
                  {isEnabled ? 'Disable Post-Qiskit Access?' : 'Enable Post-Qiskit Access?'}
                </h3>
              </div>
              <button
                type="button"
                className="organizer-post-event__modal-close"
                onClick={() => !isTogglingAccess && setAccessModalOpen(false)}
                disabled={isTogglingAccess}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <div className="organizer-post-event__modal-body">
              <p style={{ margin: 0 }}>
                {isEnabled
                  ? 'Disabling Post-Qiskit will lock the portal. Public visitors will no longer be able to enter the Post-Qiskit profile from the landing page.'
                  : 'Enabling Post-Qiskit will make the event profile publicly accessible. Visitors will be able to enter and view Post-Qiskit content.'}
              </p>

              <div className="organizer-post-event__modal-callout">
                <span><strong>Schedule:</strong> {scheduleStatus} ({displayDates})</span>
                <span><strong>Registration:</strong> Remains {isRegistrationOpen ? 'OPEN' : 'CLOSED'} (unaffected)</span>
                <span style={{ color: '#7859ca', marginTop: '0.2rem' }}>
                  ℹ Event access, schedule, and registration are separate controls.
                </span>
              </div>
            </div>

            <div className="organizer-post-event__modal-footer">
              <button
                type="button"
                className="organizer-post-event__modal-cancel"
                onClick={() => setAccessModalOpen(false)}
                disabled={isTogglingAccess}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`organizer-post-event__action-btn ${isEnabled ? 'organizer-post-event__action-btn--danger' : 'organizer-post-event__action-btn--primary'}`}
                style={{ width: 'auto' }}
                onClick={handleConfirmToggleAccess}
                disabled={isTogglingAccess}
              >
                {isTogglingAccess
                  ? 'Updating…'
                  : isEnabled
                  ? 'Disable Post-Event'
                  : 'Enable Post-Event'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. CONFIRMATION MODAL: REGISTRATION */}
      {registrationModalOpen && (
        <div
          className="organizer-post-event__modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reg-modal-title"
          onClick={() => !isTogglingReg && setRegistrationModalOpen(false)}
        >
          <div className="organizer-post-event__modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="organizer-post-event__modal-header">
              <div>
                <p className="organizer-post-event__modal-eyebrow" style={{ color: '#9333ea' }}>
                  {isRegistrationOpen ? 'Close Registration' : 'Open Registration'}
                </p>
                <h3 id="reg-modal-title" className="organizer-post-event__modal-title">
                  {isRegistrationOpen ? 'Close Post-Qiskit Registration?' : 'Open Post-Qiskit Registration?'}
                </h3>
              </div>
              <button
                type="button"
                className="organizer-post-event__modal-close"
                onClick={() => !isTogglingReg && setRegistrationModalOpen(false)}
                disabled={isTogglingReg}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <div className="organizer-post-event__modal-body">
              <p style={{ margin: 0 }}>
                {isRegistrationOpen
                  ? 'Closing registration prevents public attendees from submitting new registrations for Post-Qiskit. Existing registrations will remain intact.'
                  : 'Opening registration allows public attendees to submit registrations for Post-Qiskit Fall Fest.'}
              </p>

              <div className="organizer-post-event__modal-callout">
                <span><strong>Event Access:</strong> Remains {isEnabled ? 'ENABLED' : 'DISABLED'} (unaffected)</span>
                <span><strong>Schedule:</strong> {scheduleStatus} ({displayDates})</span>
                <span style={{ color: '#9333ea', marginTop: '0.2rem' }}>
                  ℹ Changing registration does not change Post-Qiskit event access or schedule.
                </span>
              </div>
            </div>

            <div className="organizer-post-event__modal-footer">
              <button
                type="button"
                className="organizer-post-event__modal-cancel"
                onClick={() => setRegistrationModalOpen(false)}
                disabled={isTogglingReg}
              >
                Cancel
              </button>
              <button
                type="button"
                className="organizer-post-event__action-btn organizer-post-event__action-btn--purple"
                style={{ width: 'auto' }}
                onClick={handleConfirmToggleRegistration}
                disabled={isTogglingReg}
              >
                {isTogglingReg
                  ? 'Updating…'
                  : isRegistrationOpen
                  ? 'Close Registration'
                  : 'Open Registration'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


const OrganizerHackathonPage = () => {
  const { activeProfile } = useEventProfile()
  const [hackathonEvents, setHackathonEvents] = useState([])
  const [selectedEventId, setSelectedEventId] = useState('')
  const [loadingEvents, setLoadingEvents] = useState(true)

  const [stats, setStats] = useState({
    totalProblems: 0,
    totalTeams: 0,
    totalSelections: 0,
    availableProblems: 0,
    fullProblems: 0,
  })
  const [problems, setProblems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTab, setFilterTab] = useState('ALL') // 'ALL', 'ACTIVE', 'AVAILABLE', 'FULL', 'INACTIVE'
  const [viewMode, setViewMode] = useState('table') // 'table' | 'card'

  // Create / Edit Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProblem, setEditingProblem] = useState(null)
  const [modalForm, setModalForm] = useState({
    eventId: '',
    title: '',
    description: '',
    isLimited: false,
    maxCapacity: '10',
    isActive: true,
    pendingFiles: [],
    existingAttachments: [],
  })
  const [deletingFileId, setDeletingFileId] = useState(null)
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // View Selections / Roster Modal
  const [selectionsModal, setSelectionsModal] = useState({
    isOpen: false,
    problem: null,
    loading: false,
    data: null,
    error: '',
  })

  // Delete Confirmation Modal
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    problem: null,
    isDeleting: false,
    error: '',
  })

  // Hackathon Teams State
  const [teams, setTeams] = useState([])
  const [teamStats, setTeamStats] = useState({
    totalTeams: 0,
    totalMembers: 0,
    problemSelectedCount: 0,
    problemNotSelectedCount: 0,
  })
  const [loadingTeams, setLoadingTeams] = useState(true)
  const [teamsError, setTeamsError] = useState('')
  const [teamsSearch, setTeamsSearch] = useState('')
  const [teamsFilter, setTeamsFilter] = useState('ALL') // 'ALL', 'SELECTED', 'NOT_SELECTED'
  const [teamsProblemFilter, setTeamsProblemFilter] = useState('ALL')
  const [isExportingTeams, setIsExportingTeams] = useState(false)
  const [teamsExportError, setTeamsExportError] = useState('')
  const [selectedTeamModal, setSelectedTeamModal] = useState({
    isOpen: false,
    team: null,
  })

  // Escape key handler for accessible modal dismissal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (modalOpen && !isSubmitting) setModalOpen(false)
        if (selectionsModal.isOpen) setSelectionsModal({ isOpen: false, problem: null, loading: false, data: null, error: '' })
        if (deleteModal.isOpen && !deleteModal.isDeleting) setDeleteModal({ isOpen: false, problem: null, isDeleting: false, error: '' })
        if (selectedTeamModal.isOpen) setSelectedTeamModal({ isOpen: false, team: null })
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [modalOpen, isSubmitting, selectionsModal.isOpen, deleteModal.isOpen, deleteModal.isDeleting, selectedTeamModal.isOpen])

  const loadTeams = useCallback(async (targetEventId) => {
    const eventIdToUse = targetEventId !== undefined ? targetEventId : selectedEventId
    setLoadingTeams(true)
    setTeamsError('')
    try {
      const params = {}
      if (eventIdToUse) params.eventId = eventIdToUse
      const res = await api.organizerFetchHackathonTeams(params)
      if (res.success) {
        setTeams(res.data || [])
        if (res.stats) {
          setTeamStats(res.stats)
        }
      } else {
        setTeamsError(res.error?.message || 'Unable to load hackathon teams.')
      }
    } catch (_err) {
      setTeamsError('Unable to load hackathon teams.')
    } finally {
      setLoadingTeams(false)
    }
  }, [selectedEventId])

  const loadData = useCallback(async (targetEventId) => {
    const eventIdToUse = targetEventId !== undefined ? targetEventId : selectedEventId
    setIsLoading(true)
    setError('')
    try {
      const [statsRes, problemsRes] = await Promise.all([
        api.organizerFetchHackathonStats(eventIdToUse || null),
        api.organizerFetchProblemStatements(eventIdToUse || null),
        loadTeams(eventIdToUse || null),
      ])

      if (statsRes.success) {
        setStats(statsRes.data || {
          totalProblems: 0,
          totalTeams: 0,
          totalSelections: 0,
          availableProblems: 0,
          fullProblems: 0,
        })
      } else {
        setError(statsRes.error?.message || 'Unable to load hackathon statistics.')
      }

      if (problemsRes.success) {
        setProblems(problemsRes.data || [])
      } else {
        setError(problemsRes.error?.message || 'Unable to load problem statements.')
      }
    } catch (err) {
      setError('A network error occurred while connecting to the server.')
    } finally {
      setIsLoading(false)
    }
  }, [selectedEventId])

  // Profile-switch sequence: clean reload sequence
  useEffect(() => {
    let isMounted = true

    const initProfile = async () => {
      setSelectedEventId('')
      setSelectionsModal({ isOpen: false, problem: null, loading: false, data: null, error: '' })
      setDeleteModal({ isOpen: false, problem: null, isDeleting: false, error: '' })
      setModalOpen(false)
      setProblems([])
      setStats({ totalProblems: 0, totalTeams: 0, totalSelections: 0, availableProblems: 0, fullProblems: 0 })
      setSearchQuery('')
      setFilterTab('ALL')
      setError('')
      setSuccess('')
      setIsLoading(true)
      setLoadingEvents(true)

      try {
        const res = await api.fetchActiveHackathons()
        if (!isMounted) return

        if (res.success && Array.isArray(res.data)) {
          setHackathonEvents(res.data)
          setLoadingEvents(false)
          if (res.data.length > 0) {
            const firstId = res.data[0].eventId || res.data[0].event_id
            setSelectedEventId(firstId)
            await loadData(firstId)
          } else {
            setHackathonEvents([])
            await loadData('')
          }
        } else {
          setHackathonEvents([])
          setLoadingEvents(false)
          await loadData('')
        }
      } catch (err) {
        if (!isMounted) return
        setLoadingEvents(false)
        setIsLoading(false)
        setError('A network error occurred while loading hackathon events.')
      }
    }

    initProfile()

    return () => {
      isMounted = false
    }
  }, [activeProfile]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleEventChange = (newId) => {
    setSelectedEventId(newId)
    loadData(newId)
  }

  const openCreateModal = () => {
    setEditingProblem(null)
    setModalForm({
      eventId: selectedEventId || (hackathonEvents[0]?.eventId || hackathonEvents[0]?.event_id || ''),
      title: '',
      description: '',
      isLimited: false,
      maxCapacity: '10',
      isActive: true,
      pendingFiles: [],
      existingAttachments: [],
    })
    setFormError('')
    setModalOpen(true)
  }

  const openEditModal = (problem) => {
    setEditingProblem(problem)
    setModalForm({
      eventId: problem.eventId || selectedEventId || '',
      title: problem.title || '',
      description: problem.description || '',
      isLimited: problem.maxCapacity !== null,
      maxCapacity: problem.maxCapacity !== null ? String(problem.maxCapacity) : '10',
      isActive: problem.isActive !== false,
      pendingFiles: [],
      existingAttachments: Array.isArray(problem.attachments) ? problem.attachments : [],
    })
    setFormError('')
    setModalOpen(true)
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf']
    const maxSizeBytes = 10 * 1024 * 1024 // 10 MB

    const validNewFiles = []
    let errorMsg = ''

    for (const file of files) {
      const ext = '.' + file.name.split('.').pop().toLowerCase()
      if (!allowedExtensions.includes(ext)) {
        errorMsg = `File "${file.name}" has an unsupported format. Only JPG, PNG, and PDF files are allowed.`
        break
      }
      if (file.size > maxSizeBytes) {
        errorMsg = `File "${file.name}" exceeds the maximum allowed size of 10 MB.`
        break
      }
      const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null
      validNewFiles.push({
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        previewUrl,
      })
    }

    if (errorMsg) {
      setFormError(errorMsg)
      e.target.value = ''
      return
    }

    setFormError('')
    setModalForm((prev) => ({
      ...prev,
      pendingFiles: [...prev.pendingFiles, ...validNewFiles],
    }))
    e.target.value = ''
  }

  const removePendingFile = (indexToRemove) => {
    setModalForm((prev) => {
      const target = prev.pendingFiles[indexToRemove]
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl)
      }
      return {
        ...prev,
        pendingFiles: prev.pendingFiles.filter((_, idx) => idx !== indexToRemove),
      }
    })
  }

  const handleDeleteExistingAttachment = async (fileId) => {
    if (!editingProblem) return
    if (!window.confirm('Are you sure you want to delete this attachment?')) return

    setDeletingFileId(fileId)
    try {
      const res = await api.organizerDeleteProblemStatementFile(editingProblem.id, fileId)
      if (res.success) {
        setModalForm((prev) => ({
          ...prev,
          existingAttachments: prev.existingAttachments.filter((f) => String(f.id) !== String(fileId)),
        }))
        setProblems((prev) =>
          prev.map((p) => {
            if (String(p.id) === String(editingProblem.id)) {
              return {
                ...p,
                attachments: (p.attachments || []).filter((f) => String(f.id) !== String(fileId)),
              }
            }
            return p
          })
        )
      } else {
        setFormError(res.error?.message || 'Failed to delete attachment.')
      }
    } catch (err) {
      setFormError('Network error while deleting attachment.')
    } finally {
      setDeletingFileId(null)
    }
  }

  const handleModalSubmit = async (e) => {
    e.preventDefault()
    const selectedEvent = (modalForm.eventId || '').trim()
    if (!selectedEvent && !editingProblem) {
      setFormError('Please select a hackathon event.')
      return
    }

    const trimmedTitle = modalForm.title.trim()
    const trimmedDesc = modalForm.description.trim()

    if (!trimmedTitle || trimmedTitle.length < 3) {
      setFormError('Title must be at least 3 characters long.')
      return
    }
    if (trimmedTitle.length > 255) {
      setFormError('Title must be under 255 characters.')
      return
    }
    if (!trimmedDesc || trimmedDesc.length < 5) {
      setFormError('Description must be at least 5 characters long.')
      return
    }

    let capacityVal = null
    if (modalForm.isLimited) {
      const parsed = parseInt(modalForm.maxCapacity, 10)
      if (isNaN(parsed) || parsed < 0) {
        setFormError('Capacity must be a non-negative integer.')
        return
      }
      capacityVal = parsed
    }

    setIsSubmitting(true)
    try {
      let payload
      const hasFiles = modalForm.pendingFiles.length > 0
      if (hasFiles) {
        payload = new FormData()
        payload.append('title', trimmedTitle)
        payload.append('description', trimmedDesc)
        if (capacityVal !== null) {
          payload.append('maxCapacity', String(capacityVal))
        } else {
          payload.append('maxCapacity', '')
        }
        payload.append('isActive', String(modalForm.isActive))
        if (!editingProblem) {
          payload.append('eventId', selectedEvent)
        }
        modalForm.pendingFiles.forEach((item) => {
          payload.append('files', item.file)
        })
      } else {
        payload = {
          title: trimmedTitle,
          description: trimmedDesc,
          maxCapacity: capacityVal,
          isActive: modalForm.isActive,
          ...(!editingProblem ? { eventId: selectedEvent } : {}),
        }
      }

      if (editingProblem) {
        const res = await api.organizerUpdateProblemStatement(editingProblem.id, payload)
        if (!res.success) {
          setFormError(res.error?.message || 'Failed to update problem statement.')
          return
        }
        setSuccess(`Problem statement "${trimmedTitle}" updated successfully!`)
      } else {
        const res = await api.organizerCreateProblemStatement(payload)
        if (!res.success) {
          setFormError(res.error?.message || 'Failed to create problem statement.')
          return
        }
        setSuccess(`Problem statement "${trimmedTitle}" created successfully!`)
      }

      modalForm.pendingFiles.forEach((f) => {
        if (f.previewUrl) URL.revokeObjectURL(f.previewUrl)
      })

      setModalOpen(false)
      if (selectedEvent && selectedEvent !== selectedEventId) {
        setSelectedEventId(selectedEvent)
        await loadData(selectedEvent)
      } else {
        await loadData()
      }
    } catch (err) {
      setFormError('Network error while saving problem statement.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleActive = async (problem) => {
    setError('')
    try {
      const res = await api.organizerUpdateProblemStatement(problem.id, {
        isActive: !problem.isActive,
      })
      if (res.success) {
        setSuccess(`Problem statement ${!problem.isActive ? 'activated' : 'deactivated'} successfully.`)
        await loadData()
      } else {
        setError(res.error?.message || 'Failed to toggle status.')
      }
    } catch (err) {
      setError('Network error while updating problem statement status.')
    }
  }

  const openSelectionsModal = async (problem) => {
    setSelectionsModal({
      isOpen: true,
      problem,
      loading: true,
      data: null,
      error: '',
    })

    try {
      const res = await api.organizerFetchProblemSelections(problem.id)
      if (res.success) {
        setSelectionsModal((prev) => ({ ...prev, loading: false, data: res.data }))
      } else {
        setSelectionsModal((prev) => ({
          ...prev,
          loading: false,
          error: res.error?.message || 'Unable to load selections.',
        }))
      }
    } catch (err) {
      setSelectionsModal((prev) => ({
        ...prev,
        loading: false,
        error: 'Network error while loading team selections.',
      }))
    }
  }

  const openDeleteModal = (problem) => {
    setDeleteModal({
      isOpen: true,
      problem,
      isDeleting: false,
      error: '',
    })
  }

  const handleDeleteConfirm = async () => {
    const { problem } = deleteModal
    if (!problem) return

    setDeleteModal((prev) => ({ ...prev, isDeleting: true, error: '' }))
    try {
      const res = await api.organizerDeleteProblemStatement(problem.id)
      if (res.success) {
        setSuccess(`Problem statement "${problem.title}" deleted successfully.`)
        setDeleteModal({ isOpen: false, problem: null, isDeleting: false, error: '' })
        await loadData()
      } else {
        setDeleteModal((prev) => ({
          ...prev,
          isDeleting: false,
          error: res.error?.message || 'Failed to delete problem statement.',
        }))
      }
    } catch (err) {
      setDeleteModal((prev) => ({
        ...prev,
        isDeleting: false,
        error: 'Network error while deleting problem statement.',
      }))
    }
  }

  // Filtered problems based on search and tab filters
  const filteredProblems = useMemo(() => {
    return problems.filter((p) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matches =
          p.title?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          String(p.problemNumber).includes(q)
        if (!matches) return false
      }

      if (filterTab === 'ACTIVE') return p.isActive
      if (filterTab === 'INACTIVE') return !p.isActive
      if (filterTab === 'AVAILABLE') return p.isActive && !p.isFull && (p.maxCapacity === null || p.remainingCapacity > 0)
      if (filterTab === 'FULL') return p.isFull
      return true
    })
  }, [problems, searchQuery, filterTab])

  // Tab counts for badge display
  const tabCounts = useMemo(() => {
    return {
      ALL: problems.length,
      ACTIVE: problems.filter((p) => p.isActive).length,
      AVAILABLE: problems.filter((p) => p.isActive && !p.isFull && (p.maxCapacity === null || p.remainingCapacity > 0)).length,
      FULL: problems.filter((p) => p.isFull).length,
      INACTIVE: problems.filter((p) => !p.isActive).length,
    }
  }, [problems])

  const clearFilters = () => {
    setSearchQuery('')
    setFilterTab('ALL')
  }

  const filteredTeams = useMemo(() => {
    let list = teams

    if (teamsFilter === 'SELECTED') {
      list = list.filter((t) => t.problemStatement !== null)
    } else if (teamsFilter === 'NOT_SELECTED') {
      list = list.filter((t) => t.problemStatement === null)
    }

    if (teamsProblemFilter !== 'ALL') {
      list = list.filter((t) => t.problemStatement?.id === teamsProblemFilter)
    }

    const q = teamsSearch.trim().toLowerCase()
    if (q) {
      list = list.filter((t) => {
        const matchName = t.teamName && t.teamName.toLowerCase().includes(q)
        const matchLeader =
          t.teamLeader &&
          ((t.teamLeader.name && t.teamLeader.name.toLowerCase().includes(q)) ||
            (t.teamLeader.email && t.teamLeader.email.toLowerCase().includes(q)) ||
            (t.teamLeader.registrationId && t.teamLeader.registrationId.toLowerCase().includes(q)))
        const matchMember = (t.members || []).some(
          (m) =>
            (m.name && m.name.toLowerCase().includes(q)) ||
            (m.fullName && m.fullName.toLowerCase().includes(q)) ||
            (m.email && m.email.toLowerCase().includes(q)) ||
            (m.registrationId && m.registrationId.toLowerCase().includes(q)),
        )
        const matchProblem =
          t.problemStatement && t.problemStatement.title && t.problemStatement.title.toLowerCase().includes(q)

        return matchName || matchLeader || matchMember || matchProblem
      })
    }

    return list
  }, [teams, teamsFilter, teamsProblemFilter, teamsSearch])

  const handleExportTeams = async () => {
    setIsExportingTeams(true)
    setTeamsExportError('')
    try {
      const params = {}
      if (selectedEventId) params.eventId = selectedEventId
      if (teamsSearch.trim()) params.search = teamsSearch.trim()
      if (teamsFilter === 'SELECTED') params.selectionStatus = 'selected'
      if (teamsFilter === 'NOT_SELECTED') params.selectionStatus = 'not_selected'
      if (teamsProblemFilter !== 'ALL') params.problemStatementId = teamsProblemFilter

      const res = await api.organizerExportHackathonTeams(params)
      if (!res.success) {
        setTeamsExportError(res.error?.message || 'Unable to export hackathon teams.')
        return
      }

      const { blob, filename } = res.data
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename || 'Qiskit-Fall-Fest-2026-Hackathon-Teams.xlsx'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setTeamsExportError(err.message || 'Unable to export hackathon teams.')
    } finally {
      setIsExportingTeams(false)
    }
  }

  return (
    <div className="organizer-page-view organizer-hackathon-page">
      {/* PAGE HEADING */}
      <OrganizerPageHeading
        eyebrow="HACKATHON"
        title="Hackathon"
        description="Create and configure problem statements, manage team capacity limits, and monitor live problem selections in real time."
        action={
          <div className="organizer-hackathon__header-actions">
            <div className="organizer-hackathon__header-badge">
              <span className="organizer-hackathon__count-pill" aria-label={`Total problems: ${problems.length}`}>
                {isLoading ? 'Loading…' : `${problems.length} ${problems.length === 1 ? 'problem' : 'problems'}`}
              </span>
              <span className="organizer-hackathon__profile-pill" aria-label={`Context: ${activeProfile === 'post-qiskit' ? 'Post-Qiskit' : 'Pre-Qiskit'}`}>
                {activeProfile === 'post-qiskit' ? 'Post-Qiskit' : 'Pre-Qiskit'}
              </span>
            </div>

            <button
              type="button"
              className="button button--secondary"
              onClick={() => loadData()}
              disabled={isLoading}
              title="Refresh hackathon statistics and problem statements"
            >
              🔄 Refresh
            </button>
            <button
              type="button"
              className="button button--primary"
              onClick={openCreateModal}
            >
              + Add Problem Statement
            </button>
          </div>
        }
      />

      {/* TOAST ALERTS */}
      {success && (
        <div className="organizer-hackathon__alert organizer-hackathon__alert--success" role="status">
          <div className="organizer-hackathon__alert-content">
            <span aria-hidden="true">✓</span>
            <span>{success}</span>
          </div>
          <button
            type="button"
            className="organizer-hackathon__alert-close"
            onClick={() => setSuccess('')}
            aria-label="Dismiss message"
          >
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="organizer-hackathon__alert organizer-hackathon__alert--error" role="alert">
          <div className="organizer-hackathon__alert-content">
            <span aria-hidden="true">⚠️</span>
            <span>{error}</span>
          </div>
          <button
            type="button"
            className="organizer-hackathon__alert-close"
            onClick={() => setError('')}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {/* 1. SUMMARY KPI STRIP (DIRECT FROM BACKEND STATS) */}
      <div className="organizer-hackathon__summary-strip" aria-label="Hackathon statistics overview">
        <div className="organizer-hackathon__metric-item organizer-hackathon__metric-item--total">
          <span className="organizer-hackathon__metric-label">Total Problems</span>
          <strong className="organizer-hackathon__metric-value">{stats.totalProblems}</strong>
        </div>
        <div className="organizer-hackathon__metric-item">
          <span className="organizer-hackathon__metric-label">Total Teams</span>
          <strong className="organizer-hackathon__metric-value">{stats.totalTeams}</strong>
        </div>
        <div className="organizer-hackathon__metric-item">
          <span className="organizer-hackathon__metric-label">Total Selections</span>
          <strong className="organizer-hackathon__metric-value">{stats.totalSelections}</strong>
        </div>
        <div className="organizer-hackathon__metric-item organizer-hackathon__metric-item--available">
          <span className="organizer-hackathon__metric-label">Available Problems</span>
          <strong className="organizer-hackathon__metric-value">{stats.availableProblems}</strong>
        </div>
        <div className="organizer-hackathon__metric-item organizer-hackathon__metric-item--full">
          <span className="organizer-hackathon__metric-label">Full Problems</span>
          <strong className="organizer-hackathon__metric-value">{stats.fullProblems}</strong>
        </div>
      </div>

      {/* 2. MAIN OPERATIONS PANEL: TOOLBAR + DATA VIEW */}
      <div className="organizer-hackathon__panel">
        {/* TOOLBAR */}
        <div className="organizer-hackathon__toolbar">
          <div className="organizer-hackathon__toolbar-row">
            {/* Event Selector */}
            <div className="organizer-hackathon__event-select-wrap">
              <label htmlFor="hackathon-event-filter" className="organizer-hackathon__event-select-label">
                Event:
              </label>
              <select
                id="hackathon-event-filter"
                value={selectedEventId}
                onChange={(e) => handleEventChange(e.target.value)}
                disabled={loadingEvents || hackathonEvents.length === 0}
                className="organizer-hackathon__event-select"
              >
                {hackathonEvents.length === 0 ? (
                  <option value="">No hackathon events</option>
                ) : (
                  hackathonEvents.map((evt) => (
                    <option key={evt.eventId || evt.event_id} value={evt.eventId || evt.event_id}>
                      {evt.name || evt.event_name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Search Input */}
            <div className="organizer-hackathon__search-wrap">
              <svg className="organizer-hackathon__search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search problem statements..."
                className="organizer-hackathon__search-input"
                aria-label="Search problem statements"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="organizer-hackathon__search-clear"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* View Mode Toggle (Desktop) */}
            <div className="organizer-hackathon__view-toggle" role="group" aria-label="View layout switcher">
              <button
                type="button"
                className={`organizer-hackathon__view-btn ${viewMode === 'table' ? 'organizer-hackathon__view-btn--active' : ''}`}
                onClick={() => setViewMode('table')}
                title="Table view"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 3h18v18H3zM3 9h18M3 15h18M9 3v18M15 3v18" />
                </svg>
                Table
              </button>
              <button
                type="button"
                className={`organizer-hackathon__view-btn ${viewMode === 'card' ? 'organizer-hackathon__view-btn--active' : ''}`}
                onClick={() => setViewMode('card')}
                title="Cards view"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
                Cards
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="organizer-hackathon__filter-tabs" role="tablist" aria-label="Problem statement status filters">
            {[
              { key: 'ALL', label: 'All' },
              { key: 'ACTIVE', label: 'Active' },
              { key: 'AVAILABLE', label: 'Available' },
              { key: 'FULL', label: 'Full' },
              { key: 'INACTIVE', label: 'Inactive' },
            ].map(({ key, label }) => {
              const isActive = filterTab === key
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`organizer-hackathon__tab-btn ${isActive ? 'organizer-hackathon__tab-btn--active' : ''}`}
                  onClick={() => setFilterTab(key)}
                >
                  <span>{label}</span>
                  <span className="organizer-hackathon__tab-count">{tabCounts[key] || 0}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 3. DATA VIEWS / STATES */}
        {isLoading ? (
          <div className="organizer-hackathon__skeleton-grid" aria-busy="true" aria-label="Loading problem statements">
            <div className="organizer-hackathon__skeleton-card" />
            <div className="organizer-hackathon__skeleton-card" />
            <div className="organizer-hackathon__skeleton-card" />
          </div>
        ) : hackathonEvents.length === 0 ? (
          <div className="organizer-hackathon__empty-state">
            <div className="organizer-hackathon__empty-icon" aria-hidden="true">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <h3 className="organizer-hackathon__empty-title">No hackathon events configured.</h3>
            <p className="organizer-hackathon__empty-desc">
              Create an active event of type "HACKATHON" in Events management to begin adding problem statements.
            </p>
          </div>
        ) : problems.length === 0 ? (
          <div className="organizer-hackathon__empty-state">
            <div className="organizer-hackathon__empty-icon" aria-hidden="true">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <h3 className="organizer-hackathon__empty-title">No problem statements created yet.</h3>
            <p className="organizer-hackathon__empty-desc">
              Get started by adding the first challenge for this hackathon event.
            </p>
            <button type="button" className="button button--primary organizer-hackathon__reset-btn" onClick={openCreateModal}>
              + Add Problem Statement
            </button>
          </div>
        ) : filteredProblems.length === 0 ? (
          <div className="organizer-hackathon__empty-state">
            <div className="organizer-hackathon__empty-icon" aria-hidden="true">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <h3 className="organizer-hackathon__empty-title">No problem statements match your search.</h3>
            <p className="organizer-hackathon__empty-desc">
              No problem statements matched your current search query or filter criteria.
            </p>
            <button type="button" className="button button--secondary organizer-hackathon__reset-btn" onClick={clearFilters}>
              Clear search and filters
            </button>
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE VIEW (> 768px when viewMode === 'table') */}
            {viewMode === 'table' && (
              <div className="organizer-hackathon__table-wrap">
                <table className="organizer-hackathon__table" aria-label="Hackathon problem statements table">
                  <thead>
                    <tr>
                      <th scope="col">#</th>
                      <th scope="col">Problem Statement</th>
                      <th scope="col">Capacity</th>
                      <th scope="col">Status</th>
                      <th scope="col">Attachments</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProblems.map((problem) => {
                      const numStr = String(problem.problemNumber).padStart(2, '0')
                      const isFull = problem.isFull
                      const isInactive = !problem.isActive
                      const isUnlimited = problem.isUnlimited
                      const pct = isUnlimited
                        ? 0
                        : Math.min(100, Math.round((problem.selectedTeams / (problem.maxCapacity || 1)) * 100))

                      return (
                        <tr key={problem.id} tabIndex={0}>
                          <td>
                            <span className="organizer-hackathon__num-pill">#{numStr}</span>
                          </td>
                          <td>
                            <div className="organizer-hackathon__title-cell">
                              <span className="organizer-hackathon__problem-title">{problem.title}</span>
                              <span className="organizer-hackathon__desc-sub" title={problem.description}>
                                {problem.description}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className="organizer-hackathon__capacity-cell">
                              <div className="organizer-hackathon__capacity-label">
                                <strong>{problem.selectedTeams}</strong>
                                <span>{isUnlimited ? '∞ Unlimited' : `/ ${problem.maxCapacity}`}</span>
                              </div>
                              <div className="organizer-hackathon__progress-track" aria-hidden="true">
                                <div
                                  className={`organizer-hackathon__progress-fill ${isFull ? 'organizer-hackathon__progress-fill--full' : ''}`}
                                  style={{ width: isUnlimited ? '100%' : `${pct}%`, opacity: isUnlimited ? 0.4 : 1 }}
                                />
                              </div>
                              <small style={{ fontSize: '0.74rem', color: '#7b6f93' }}>
                                {problem.selectedParticipants} participants
                              </small>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', alignItems: 'flex-start' }}>
                              <span className={`organizer-hackathon__status-tag ${isInactive ? 'organizer-hackathon__status-tag--inactive' : 'organizer-hackathon__status-tag--active'}`}>
                                <span className="organizer-hackathon__status-dot" aria-hidden="true" />
                                <span>{isInactive ? 'INACTIVE' : 'ACTIVE'}</span>
                              </span>

                              {isUnlimited ? (
                                <span className="organizer-hackathon__status-tag organizer-hackathon__status-tag--unlimited">
                                  ∞ Unlimited
                                </span>
                              ) : isFull ? (
                                <span className="organizer-hackathon__status-tag organizer-hackathon__status-tag--full">
                                  FULL
                                </span>
                              ) : (
                                <span className="organizer-hackathon__status-tag organizer-hackathon__status-tag--available">
                                  {problem.remainingCapacity} Left
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            {Array.isArray(problem.attachments) && problem.attachments.length > 0 ? (
                              <span className="organizer-hackathon__attachment-tag" title={`${problem.attachments.length} attached file(s)`}>
                                📎 {problem.attachments.length}
                              </span>
                            ) : (
                              <span style={{ color: '#a095bd', fontSize: '0.8rem' }}>—</span>
                            )}
                          </td>
                          <td>
                            <div className="organizer-hackathon__actions-cell">
                              <button
                                type="button"
                                className="organizer-hackathon__action-btn organizer-hackathon__action-btn--roster"
                                onClick={() => openSelectionsModal(problem)}
                                title="View team selections and rosters"
                              >
                                👥 Roster
                                <span className="organizer-hackathon__action-btn--roster-count">
                                  {problem.selectedTeams}
                                </span>
                              </button>

                              <button
                                type="button"
                                className="organizer-hackathon__action-btn organizer-hackathon__action-btn--edit"
                                onClick={() => openEditModal(problem)}
                                title="Edit problem statement"
                              >
                                ✏️ Edit
                              </button>

                              <button
                                type="button"
                                className={`organizer-hackathon__action-btn ${isInactive ? 'organizer-hackathon__action-btn--toggle-active' : 'organizer-hackathon__action-btn--toggle-inactive'}`}
                                onClick={() => handleToggleActive(problem)}
                                title={isInactive ? 'Activate this challenge' : 'Deactivate this challenge'}
                              >
                                {isInactive ? 'Activate' : 'Deactivate'}
                              </button>

                              <button
                                type="button"
                                className="organizer-hackathon__action-btn organizer-hackathon__action-btn--delete"
                                onClick={() => openDeleteModal(problem)}
                                title={problem.selectedTeams > 0 ? 'Cannot delete: selected by teams' : 'Delete problem statement'}
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* CARDS VIEW (When viewMode === 'card' on desktop, or ALWAYS on mobile <= 768px) */}
            <div className="organizer-hackathon__cards-grid" style={{ display: viewMode === 'card' ? 'grid' : undefined }}>
              {filteredProblems.map((problem) => {
                const numStr = String(problem.problemNumber).padStart(2, '0')
                const isFull = problem.isFull
                const isInactive = !problem.isActive
                const isUnlimited = problem.isUnlimited
                const pct = isUnlimited
                  ? 0
                  : Math.min(100, Math.round((problem.selectedTeams / (problem.maxCapacity || 1)) * 100))

                return (
                  <article
                    key={problem.id}
                    className={`organizer-hackathon__card ${isInactive ? 'organizer-hackathon__card--inactive' : ''}`}
                    tabIndex={0}
                  >
                    <div>
                      {/* Card Header Badges */}
                      <div className="organizer-hackathon__card-header">
                        <span className="organizer-hackathon__num-pill">Problem #{numStr}</span>

                        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                          <span className={`organizer-hackathon__status-tag ${isInactive ? 'organizer-hackathon__status-tag--inactive' : 'organizer-hackathon__status-tag--active'}`}>
                            <span className="organizer-hackathon__status-dot" aria-hidden="true" />
                            <span>{isInactive ? 'INACTIVE' : 'ACTIVE'}</span>
                          </span>

                          {isUnlimited ? (
                            <span className="organizer-hackathon__status-tag organizer-hackathon__status-tag--unlimited">
                              ∞ Unlimited
                            </span>
                          ) : isFull ? (
                            <span className="organizer-hackathon__status-tag organizer-hackathon__status-tag--full">
                              FULL
                            </span>
                          ) : (
                            <span className="organizer-hackathon__status-tag organizer-hackathon__status-tag--available">
                              {problem.remainingCapacity} Left
                            </span>
                          )}

                          {Array.isArray(problem.attachments) && problem.attachments.length > 0 && (
                            <span className="organizer-hackathon__attachment-tag">
                              📎 {problem.attachments.length}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Title & Description */}
                      <div className="organizer-hackathon__card-title-group">
                        <h3 className="organizer-hackathon__card-title">{problem.title}</h3>
                        <p className="organizer-hackathon__card-desc" title={problem.description}>
                          {problem.description}
                        </p>
                      </div>

                      {/* Capacity Box */}
                      <div className="organizer-hackathon__card-capacity">
                        <div className="organizer-hackathon__capacity-label">
                          <span>
                            Teams: <strong>{problem.selectedTeams}</strong>
                            {isUnlimited ? ' (Unlimited)' : ` / ${problem.maxCapacity}`}
                          </span>
                          <span style={{ fontSize: '0.78rem', color: '#7b6f93' }}>
                            <strong>{problem.selectedParticipants}</strong> participants
                          </span>
                        </div>
                        <div className="organizer-hackathon__progress-track" aria-hidden="true" style={{ marginTop: '0.4rem' }}>
                          <div
                            className={`organizer-hackathon__progress-fill ${isFull ? 'organizer-hackathon__progress-fill--full' : ''}`}
                            style={{ width: isUnlimited ? '100%' : `${pct}%`, opacity: isUnlimited ? 0.4 : 1 }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Actions Footer */}
                    <div className="organizer-hackathon__card-footer">
                      <div className="organizer-hackathon__card-actions">
                        <button
                          type="button"
                          className="organizer-hackathon__action-btn organizer-hackathon__action-btn--roster"
                          onClick={() => openSelectionsModal(problem)}
                        >
                          👥 View Roster
                          <span className="organizer-hackathon__action-btn--roster-count">
                            {problem.selectedTeams}
                          </span>
                        </button>

                        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                          <button
                            type="button"
                            className="organizer-hackathon__action-btn organizer-hackathon__action-btn--edit"
                            onClick={() => openEditModal(problem)}
                          >
                            ✏️ Edit
                          </button>

                          <button
                            type="button"
                            className={`organizer-hackathon__action-btn ${isInactive ? 'organizer-hackathon__action-btn--toggle-active' : 'organizer-hackathon__action-btn--toggle-inactive'}`}
                            onClick={() => handleToggleActive(problem)}
                          >
                            {isInactive ? 'Activate' : 'Deactivate'}
                          </button>

                          <button
                            type="button"
                            className="organizer-hackathon__action-btn organizer-hackathon__action-btn--delete"
                            onClick={() => openDeleteModal(problem)}
                            title={problem.selectedTeams > 0 ? 'Cannot delete: selected by teams' : 'Delete'}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. HACKATHON TEAMS SECTION                                                */}
      {/* ========================================================================= */}
      <div className="organizer-page-content-panel organizer-hackathon__panel organizer-hackathon-teams__section">
        {/* Section Heading */}
        <div className="organizer-hackathon-teams__header">
          <div>
            <h2 className="organizer-hackathon-teams__title">Hackathon Teams</h2>
            <p className="organizer-hackathon-teams__subtitle">
              View registered teams, members, and problem-statement selections.
            </p>
          </div>
          <div className="organizer-hackathon-teams__header-actions">
            <span className="organizer-hackathon__count-pill" aria-label={`Total teams: ${teams.length}`}>
              {loadingTeams ? 'Loading…' : `${teams.length} ${teams.length === 1 ? 'team' : 'teams'}`}
            </span>
          </div>
        </div>

        {/* Teams Summary Strip */}
        <div className="organizer-hackathon__summary-strip" aria-label="Hackathon teams summary">
          <div className="organizer-hackathon__stat-card">
            <span className="organizer-hackathon__stat-label">Total Teams</span>
            <strong className="organizer-hackathon__stat-value">{teamStats.totalTeams || teams.length}</strong>
          </div>
          <div className="organizer-hackathon__stat-card">
            <span className="organizer-hackathon__stat-label">Total Participants</span>
            <strong className="organizer-hackathon__stat-value">{teamStats.totalMembers}</strong>
          </div>
          <div className="organizer-hackathon__stat-card">
            <span className="organizer-hackathon__stat-label">Problem Selected</span>
            <strong className="organizer-hackathon__stat-value" style={{ color: '#059669' }}>
              {teamStats.problemSelectedCount}
            </strong>
          </div>
          <div className="organizer-hackathon__stat-card">
            <span className="organizer-hackathon__stat-label">Problem Not Selected</span>
            <strong className="organizer-hackathon__stat-value" style={{ color: '#d97706' }}>
              {teamStats.problemNotSelectedCount}
            </strong>
          </div>
        </div>

        {/* Teams Toolbar */}
        <div className="organizer-hackathon__toolbar">
          <div className="organizer-hackathon__search-box">
            <label htmlFor="teams-search-input" className="visually-hidden">Search teams</label>
            <div className="organizer-hackathon__search-wrap">
              <svg className="organizer-hackathon__search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                id="teams-search-input"
                type="search"
                value={teamsSearch}
                onChange={(e) => setTeamsSearch(e.target.value)}
                placeholder="Search by team, leader, member, email, ID..."
                className="organizer-hackathon__search-input"
              />
              {teamsSearch && (
                <button
                  type="button"
                  onClick={() => setTeamsSearch('')}
                  className="organizer-hackathon__clear-search"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="organizer-participants__filter-group">
            <label htmlFor="teams-filter-status" className="organizer-participants__filter-label">Filter:</label>
            <select
              id="teams-filter-status"
              value={teamsFilter}
              onChange={(e) => setTeamsFilter(e.target.value)}
              className="organizer-participants__role-select"
            >
              <option value="ALL">All Teams</option>
              <option value="SELECTED">Problem Selected</option>
              <option value="NOT_SELECTED">Problem Not Selected</option>
            </select>
          </div>

          <div className="organizer-participants__filter-group">
            <label htmlFor="teams-filter-problem" className="organizer-participants__filter-label">Problem:</label>
            <select
              id="teams-filter-problem"
              value={teamsProblemFilter}
              onChange={(e) => setTeamsProblemFilter(e.target.value)}
              className="organizer-participants__role-select"
              style={{ maxWidth: '200px' }}
            >
              <option value="ALL">All Problems</option>
              {problems.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>

          {(teamsSearch || teamsFilter !== 'ALL' || teamsProblemFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setTeamsSearch('')
                setTeamsFilter('ALL')
                setTeamsProblemFilter('ALL')
              }}
              className="organizer-participants__reset-btn"
            >
              Clear filters
            </button>
          )}

          <button
            type="button"
            onClick={handleExportTeams}
            disabled={isExportingTeams}
            className="button button--secondary organizer-participants__export-btn"
            title="Export hackathon teams to Excel"
          >
            {isExportingTeams ? (
              <>
                <span className="organizer-participants__btn-spinner" aria-hidden="true" />
                <span>Exporting…</span>
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Export Excel</span>
              </>
            )}
          </button>
        </div>

        {teamsExportError && (
          <div className="organizer-hackathon__alert organizer-hackathon__alert--error" role="alert" style={{ marginBottom: '1rem' }}>
            <div className="organizer-hackathon__alert-content">
              <span>{teamsExportError}</span>
            </div>
            <button type="button" className="organizer-hackathon__alert-close" onClick={() => setTeamsExportError('')}>✕</button>
          </div>
        )}

        {/* Teams Table or Empty State */}
        {teamsError ? (
          <div className="organizer-hackathon__alert organizer-hackathon__alert--error" role="alert">
            <div className="organizer-hackathon__alert-content">
              <strong>Unable to load hackathon teams.</strong>
              <p>{teamsError}</p>
            </div>
            <button type="button" className="button button--secondary" onClick={() => loadTeams()}>
              Retry
            </button>
          </div>
        ) : loadingTeams ? (
          <div className="organizer-hackathon__loading-wrap" aria-busy="true">
            <span className="organizer-hackathon__spinner" aria-hidden="true" />
            <p>Loading hackathon teams...</p>
          </div>
        ) : teams.length === 0 ? (
          <div className="organizer-hackathon__empty-state">
            <div className="organizer-hackathon__empty-icon" aria-hidden="true">
              👥
            </div>
            <h3 className="organizer-hackathon__empty-title">No hackathon teams registered yet.</h3>
            <p className="organizer-hackathon__empty-desc">
              Teams will appear here once attendees create or join teams for this hackathon.
            </p>
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="organizer-hackathon__empty-state">
            <div className="organizer-hackathon__empty-icon" aria-hidden="true">
              🔍
            </div>
            <h3 className="organizer-hackathon__empty-title">No hackathon teams match your search.</h3>
            <p className="organizer-hackathon__empty-desc">
              Try adjusting your search terms or clearing your filter selections.
            </p>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => {
                setTeamsSearch('')
                setTeamsFilter('ALL')
                setTeamsProblemFilter('ALL')
              }}
            >
              Clear search and filters
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="organizer-hackathon__table-wrap organizer-hackathon-teams__table-wrap">
              <table className="organizer-hackathon__table organizer-hackathon-teams__table" aria-label="Hackathon teams table">
                <thead>
                  <tr>
                    <th scope="col">Team Name</th>
                    <th scope="col">Team Leader</th>
                    <th scope="col">Members</th>
                    <th scope="col">Problem Statement</th>
                    <th scope="col">Status / Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeams.map((team) => {
                    const hasProblem = Boolean(team.problemStatement)
                    return (
                      <tr
                        key={team.teamId}
                        className="organizer-hackathon-teams__row--clickable"
                        tabIndex={0}
                        onClick={() => setSelectedTeamModal({ isOpen: true, team })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            setSelectedTeamModal({ isOpen: true, team })
                          }
                        }}
                        aria-label={`View details for team ${team.teamName}`}
                      >
                        <td className="organizer-hackathon-teams__name-cell">
                          <strong>{team.teamName}</strong>
                        </td>
                        <td>
                          <div className="organizer-hackathon-teams__leader-cell">
                            <span className="organizer-hackathon-teams__leader-name-text">{team.teamLeader?.name || '—'}</span>
                            {team.teamLeader?.registrationId && (
                              <small className="organizer-hackathon-teams__reg-id">
                                {team.teamLeader.registrationId}
                              </small>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="organizer-hackathon-teams__member-pill">
                            👥 {team.memberCount} {team.memberCount === 1 ? 'Member' : 'Members'}
                          </span>
                        </td>
                        <td>
                          {hasProblem ? (
                            <div className="organizer-hackathon-teams__problem-title" title={team.problemStatement.title}>
                              {team.problemStatement.title}
                            </div>
                          ) : (
                            <span className="organizer-hackathon-teams__problem-unselected">
                              Problem Statement Not Selected Yet
                            </span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                            <span className="organizer-hackathon__status-tag organizer-hackathon__status-tag--active">
                              <span className="organizer-hackathon__status-dot" aria-hidden="true" />
                              Active
                            </span>
                            <span className="organizer-hackathon-teams__view-arrow">View Details →</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="organizer-hackathon-teams__mobile-list">
              {filteredTeams.map((team) => {
                const hasProblem = Boolean(team.problemStatement)
                return (
                  <article
                    key={team.teamId}
                    className="organizer-hackathon-teams__mobile-card"
                    tabIndex={0}
                    onClick={() => setSelectedTeamModal({ isOpen: true, team })}
                  >
                    <div className="organizer-hackathon-teams__mobile-header">
                      <strong>{team.teamName}</strong>
                      <span className="organizer-hackathon-teams__member-pill">
                        👥 {team.memberCount}
                      </span>
                    </div>

                    <div className="organizer-hackathon-teams__mobile-body">
                      <div className="organizer-hackathon-teams__mobile-row">
                        <span className="organizer-hackathon-teams__mobile-label">Leader:</span>
                        <span>{team.teamLeader?.name || '—'}</span>
                      </div>
                      <div className="organizer-hackathon-teams__mobile-row">
                        <span className="organizer-hackathon-teams__mobile-label">Problem:</span>
                        {hasProblem ? (
                          <span className="organizer-hackathon-teams__problem-title">{team.problemStatement.title}</span>
                        ) : (
                          <span className="organizer-hackathon-teams__problem-unselected">
                            Problem Statement Not Selected Yet
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="organizer-hackathon-teams__mobile-footer">
                      <span className="organizer-hackathon-teams__view-arrow">View Full Team Details →</span>
                    </div>
                  </article>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* TEAM DETAILS POPUP / MODAL */}
      {selectedTeamModal.isOpen && selectedTeamModal.team && (
        <div
          className="organizer-hackathon__modal-backdrop"
          onClick={() => setSelectedTeamModal({ isOpen: false, team: null })}
          role="presentation"
        >
          <div
            className="organizer-hackathon__modal-card organizer-hackathon-teams__modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="team-details-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="organizer-hackathon__modal-header">
              <div>
                <h3 id="team-details-modal-title" className="organizer-hackathon__modal-title">
                  Team: {selectedTeamModal.team.teamName}
                </h3>
                <span className="organizer-hackathon-teams__modal-subtitle">
                  {selectedTeamModal.team.memberCount} {selectedTeamModal.team.memberCount === 1 ? 'Registered Member' : 'Registered Members'}
                </span>
              </div>
              <button
                type="button"
                className="organizer-hackathon__modal-close"
                onClick={() => setSelectedTeamModal({ isOpen: false, team: null })}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Modal Body with internal scroll */}
            <div className="organizer-hackathon__modal-body organizer-hackathon-teams__modal-body">
              {/* Team Leader Box */}
              <div className="organizer-hackathon-teams__leader-box">
                <span className="organizer-hackathon-teams__section-title">Team Leader</span>
                {selectedTeamModal.team.teamLeader ? (
                  <div className="organizer-hackathon-teams__leader-card">
                    <div className="organizer-hackathon-teams__leader-name">
                      <strong>{selectedTeamModal.team.teamLeader.name}</strong>
                      <span className="organizer-hackathon-teams__role-badge organizer-hackathon-teams__role-badge--lead">
                        Team Leader
                      </span>
                    </div>
                    {selectedTeamModal.team.teamLeader.email && (
                      <div className="organizer-hackathon-teams__detail-line">
                        Email: <span>{selectedTeamModal.team.teamLeader.email}</span>
                      </div>
                    )}
                    {selectedTeamModal.team.teamLeader.registrationId && (
                      <div className="organizer-hackathon-teams__detail-line">
                        Registration ID: <code>{selectedTeamModal.team.teamLeader.registrationId}</code>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ color: '#7b6f93', fontStyle: 'italic' }}>No leader assigned</div>
                )}
              </div>

              {/* Team Members List */}
              <div className="organizer-hackathon-teams__members-box">
                <span className="organizer-hackathon-teams__section-title">Team Members</span>
                <div className="organizer-hackathon-teams__member-list">
                  {(selectedTeamModal.team.members || []).map((m, idx) => (
                    <div key={m.registrationId || idx} className="organizer-hackathon-teams__member-card">
                      <div className="organizer-hackathon-teams__member-card-header">
                        <span className="organizer-hackathon-teams__member-num">#{idx + 1}</span>
                        <strong>{m.name || m.fullName || '—'}</strong>
                        <span className={`organizer-hackathon-teams__role-badge ${m.isTeamLead ? 'organizer-hackathon-teams__role-badge--lead' : 'organizer-hackathon-teams__role-badge--member'}`}>
                          {m.role || (m.isTeamLead ? 'Team Leader' : 'Member')}
                        </span>
                      </div>
                      <div className="organizer-hackathon-teams__detail-line">
                        Email: <span>{m.email || '—'}</span>
                      </div>
                      <div className="organizer-hackathon-teams__detail-line">
                        Registration ID: <code>{m.registrationId || '—'}</code>
                      </div>
                      {m.instituteName && (
                        <div className="organizer-hackathon-teams__detail-line">
                          Institution: <span>{m.instituteName}{m.department ? ` (${m.department})` : ''}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Problem Statement Box */}
              <div className="organizer-hackathon-teams__problem-box">
                <span className="organizer-hackathon-teams__section-title">Problem Statement</span>
                {selectedTeamModal.team.problemStatement ? (
                  <div className="organizer-hackathon-teams__problem-detail-card">
                    <h4 className="organizer-hackathon-teams__problem-detail-title">
                      {selectedTeamModal.team.problemStatement.title}
                    </h4>
                    {selectedTeamModal.team.problemStatement.description && (
                      <p className="organizer-hackathon-teams__problem-detail-desc">
                        {selectedTeamModal.team.problemStatement.description}
                      </p>
                    )}
                    {selectedTeamModal.team.problemStatement.selectedAt && (
                      <small style={{ color: '#7b6f93', marginTop: '0.4rem', display: 'block' }}>
                        Selected: {new Date(selectedTeamModal.team.problemStatement.selectedAt).toLocaleString()}
                      </small>
                    )}
                  </div>
                ) : (
                  <div className="organizer-hackathon-teams__problem-unselected-box">
                    <span>Problem Statement Not Selected Yet</span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="organizer-hackathon__modal-footer">
              <button
                type="button"
                className="button button--secondary"
                onClick={() => setSelectedTeamModal({ isOpen: false, team: null })}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. CREATE / EDIT MODAL */}
      {modalOpen && (
        <div
          className="organizer-hackathon__modal-backdrop"
          onClick={() => !isSubmitting && setModalOpen(false)}
          role="presentation"
        >
          <div
            className="organizer-hackathon__modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="hackathon-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="organizer-hackathon__modal-header">
              <div>
                <h3 id="hackathon-modal-title" className="organizer-hackathon__modal-title">
                  {editingProblem ? 'Edit Problem Statement' : 'Add Problem Statement'}
                </h3>
                <p className="organizer-hackathon__modal-subtitle">
                  {editingProblem ? `Updating Problem #${editingProblem.problemNumber}` : 'Create a new hackathon challenge'}
                </p>
              </div>
              <button
                type="button"
                className="organizer-hackathon__modal-close"
                onClick={() => setModalOpen(false)}
                disabled={isSubmitting}
                aria-label="Close dialog"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleModalSubmit}>
              <div className="organizer-hackathon__modal-body">
                {formError && (
                  <div className="organizer-hackathon__alert organizer-hackathon__alert--error" role="alert">
                    <span>⚠️ {formError}</span>
                  </div>
                )}

                {/* Event Selector */}
                <div className="organizer-hackathon__form-group">
                  <label htmlFor="modal-event-select" className="organizer-hackathon__form-label">
                    Select Hackathon Event *
                  </label>
                  {hackathonEvents.length === 0 ? (
                    <div className="organizer-hackathon__alert organizer-hackathon__alert--error">
                      No hackathon events available. Please create a hackathon event first.
                    </div>
                  ) : (
                    <select
                      id="modal-event-select"
                      value={modalForm.eventId}
                      onChange={(e) => setModalForm((prev) => ({ ...prev, eventId: e.target.value }))}
                      required
                      disabled={Boolean(editingProblem)}
                      className="organizer-hackathon__form-select"
                    >
                      <option value="" disabled>-- Select Hackathon Event --</option>
                      {hackathonEvents.map((evt) => (
                        <option key={evt.eventId || evt.event_id} value={evt.eventId || evt.event_id}>
                          {evt.name || evt.event_name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Title */}
                <div className="organizer-hackathon__form-group">
                  <label htmlFor="modal-title-input" className="organizer-hackathon__form-label">
                    Problem Statement Title *
                  </label>
                  <input
                    id="modal-title-input"
                    type="text"
                    placeholder="e.g. Quantum Optimization for Smart Energy Grid"
                    value={modalForm.title}
                    onChange={(e) => setModalForm((prev) => ({ ...prev, title: e.target.value }))}
                    required
                    className="organizer-hackathon__form-input"
                  />
                </div>

                {/* Description */}
                <div className="organizer-hackathon__form-group">
                  <label htmlFor="modal-desc-input" className="organizer-hackathon__form-label">
                    Description *
                  </label>
                  <textarea
                    id="modal-desc-input"
                    rows={4}
                    placeholder="Describe the challenge, goals, technical scope, and expected deliverables..."
                    value={modalForm.description}
                    onChange={(e) => setModalForm((prev) => ({ ...prev, description: e.target.value }))}
                    required
                    className="organizer-hackathon__form-textarea"
                  />
                </div>

                {/* Capacity Selector */}
                <div className="organizer-hackathon__form-group">
                  <span className="organizer-hackathon__form-label">Maximum Capacity (Teams Allowed) *</span>
                  <div className="organizer-hackathon__capacity-options">
                    <label className={`organizer-hackathon__capacity-option ${!modalForm.isLimited ? 'organizer-hackathon__capacity-option--active' : ''}`}>
                      <input
                        type="radio"
                        name="capacityType"
                        checked={!modalForm.isLimited}
                        onChange={() => setModalForm((prev) => ({ ...prev, isLimited: false }))}
                      />
                      <div>
                        <strong>∞ Unlimited</strong>
                        <div style={{ fontSize: '0.76rem', color: '#7b6f93' }}>No team limit</div>
                      </div>
                    </label>

                    <label className={`organizer-hackathon__capacity-option ${modalForm.isLimited ? 'organizer-hackathon__capacity-option--active' : ''}`}>
                      <input
                        type="radio"
                        name="capacityType"
                        checked={modalForm.isLimited}
                        onChange={() => setModalForm((prev) => ({ ...prev, isLimited: true }))}
                      />
                      <div>
                        <strong>Limited Capacity</strong>
                        <div style={{ fontSize: '0.76rem', color: '#7b6f93' }}>Cap selections</div>
                      </div>
                    </label>
                  </div>

                  {modalForm.isLimited && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <label htmlFor="modal-capacity-input" style={{ fontSize: '0.84rem', color: '#4b3d68', display: 'block', marginBottom: '0.25rem' }}>
                        Maximum Teams Allowed:
                      </label>
                      <input
                        id="modal-capacity-input"
                        type="number"
                        min="0"
                        value={modalForm.maxCapacity}
                        onChange={(e) => setModalForm((prev) => ({ ...prev, maxCapacity: e.target.value }))}
                        required
                        className="organizer-hackathon__form-input"
                        style={{ maxWidth: '160px' }}
                      />
                      <small style={{ color: '#7b6f93', display: 'block', marginTop: '0.25rem' }}>
                        Set to 0 if temporarily unavailable, or any positive integer (e.g. 10).
                      </small>
                    </div>
                  )}
                </div>

                {/* Status Selector */}
                <div className="organizer-hackathon__form-group">
                  <span className="organizer-hackathon__form-label">Initial Status</span>
                  <div style={{ display: 'flex', gap: '1.25rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                      <input
                        type="radio"
                        name="modalStatus"
                        checked={modalForm.isActive}
                        onChange={() => setModalForm((prev) => ({ ...prev, isActive: true }))}
                      />
                      <span style={{ color: '#065f46', fontWeight: 600 }}>Active</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                      <input
                        type="radio"
                        name="modalStatus"
                        checked={!modalForm.isActive}
                        onChange={() => setModalForm((prev) => ({ ...prev, isActive: false }))}
                      />
                      <span style={{ color: '#4b5563', fontWeight: 600 }}>Inactive</span>
                    </label>
                  </div>
                </div>

                {/* Attachments */}
                <div className="organizer-hackathon__form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span className="organizer-hackathon__form-label">Supporting Attachments</span>
                    <span style={{ fontSize: '0.76rem', color: '#7b6f93' }}>JPG, PNG, PDF (max 10 MB per file)</span>
                  </div>

                  {/* Existing Attachments */}
                  {editingProblem && modalForm.existingAttachments.length > 0 && (
                    <div style={{ display: 'grid', gap: '0.4rem', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#5c4779' }}>
                        Current Attachments ({modalForm.existingAttachments.length}):
                      </span>
                      <div className="organizer-hackathon__file-list">
                        {modalForm.existingAttachments.map((file) => {
                          const isPdf = file.mimeType === 'application/pdf' || file.originalFilename?.toLowerCase().endsWith('.pdf')
                          const sizeKb = Math.round((file.fileSize || 0) / 1024)
                          const sizeStr = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`
                          const isDeleting = deletingFileId === file.id

                          return (
                            <div key={file.id} className="organizer-hackathon__file-item">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                                <span style={{ fontSize: '1.1rem' }}>{isPdf ? '📄' : '🖼️'}</span>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '240px' }} title={file.originalFilename}>
                                    {file.originalFilename}
                                  </div>
                                  <small style={{ color: '#7b6f93' }}>{sizeStr}</small>
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <a
                                  href={file.viewUrl ? `${file.viewUrl}?token=${api.getOrganizerToken()}` : '#'}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="button button--secondary"
                                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.74rem' }}
                                >
                                  View
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteExistingAttachment(file.id)}
                                  disabled={isDeleting}
                                  style={{ background: 'none', border: 'none', color: '#d32f2f', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                                >
                                  {isDeleting ? 'Deleting…' : '✕ Remove'}
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Dropzone */}
                  <label className="organizer-hackathon__dropzone">
                    <input
                      type="file"
                      multiple
                      accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                    />
                    <span style={{ fontSize: '1.4rem', marginBottom: '0.25rem' }}>📎</span>
                    <strong style={{ fontSize: '0.88rem', color: '#241938' }}>Click to select files to attach</strong>
                    <span style={{ fontSize: '0.76rem', color: '#7b6f93', marginTop: '0.15rem' }}>
                      Diagrams, datasets, and problem briefs (JPG, PNG, PDF)
                    </span>
                  </label>

                  {/* Pending New Files */}
                  {modalForm.pendingFiles.length > 0 && (
                    <div style={{ display: 'grid', gap: '0.4rem', marginTop: '0.4rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#065f46' }}>
                        Ready to upload ({modalForm.pendingFiles.length}):
                      </span>
                      <div className="organizer-hackathon__file-list">
                        {modalForm.pendingFiles.map((item, idx) => {
                          const isPdf = item.type === 'application/pdf' || item.name.toLowerCase().endsWith('.pdf')
                          const sizeKb = Math.round(item.size / 1024)
                          const sizeStr = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`

                          return (
                            <div key={idx} className="organizer-hackathon__file-item">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                                {item.previewUrl ? (
                                  <img src={item.previewUrl} alt="Preview" style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'cover' }} />
                                ) : (
                                  <span style={{ fontSize: '1.1rem' }}>{isPdf ? '📄' : '🖼️'}</span>
                                )}
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '240px' }} title={item.name}>
                                    {item.name}
                                  </div>
                                  <small style={{ color: '#7b6f93' }}>{sizeStr} • New</small>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removePendingFile(idx)}
                                style={{ background: 'none', border: 'none', color: '#d32f2f', cursor: 'pointer', fontSize: '1rem', padding: '0.1rem 0.3rem' }}
                                title="Remove file"
                              >
                                ✕
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="organizer-hackathon__modal-footer">
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => setModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button button--primary"
                  disabled={isSubmitting || (!editingProblem && hackathonEvents.length === 0)}
                >
                  {isSubmitting
                    ? (modalForm.pendingFiles.length > 0 ? 'Uploading files…' : 'Saving…')
                    : editingProblem ? 'Save Changes' : 'Create Problem Statement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. VIEW PARTICIPANTS / SELECTIONS ROSTER MODAL */}
      {selectionsModal.isOpen && (
        <div
          className="organizer-hackathon__modal-backdrop"
          onClick={() => setSelectionsModal({ isOpen: false, problem: null, loading: false, data: null, error: '' })}
          role="presentation"
        >
          <div
            className="organizer-hackathon__modal-card organizer-hackathon__modal-card--roster"
            role="dialog"
            aria-modal="true"
            aria-labelledby="roster-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="organizer-hackathon__modal-header">
              <div>
                <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#553c8b', fontWeight: 700 }}>
                  Selected Teams Roster
                </span>
                <h3 id="roster-modal-title" className="organizer-hackathon__modal-title">
                  {selectionsModal.problem?.title}
                </h3>
                <p className="organizer-hackathon__modal-subtitle">
                  <strong>{selectionsModal.data?.selectedTeamsCount || 0}</strong> Teams Selected (
                  {selectionsModal.data?.selectedParticipantsCount || 0} Participants)
                </p>
              </div>
              <button
                type="button"
                className="organizer-hackathon__modal-close"
                onClick={() => setSelectionsModal({ isOpen: false, problem: null, loading: false, data: null, error: '' })}
                aria-label="Close roster"
              >
                ×
              </button>
            </div>

            <div className="organizer-hackathon__modal-body">
              {selectionsModal.loading ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#7b6f93' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⏳</div>
                  <p>Loading teams and participant details…</p>
                </div>
              ) : selectionsModal.error ? (
                <div className="organizer-hackathon__alert organizer-hackathon__alert--error" role="alert">
                  <span>⚠️ {selectionsModal.error}</span>
                </div>
              ) : !selectionsModal.data?.teams || selectionsModal.data.teams.length === 0 ? (
                <div className="organizer-hackathon__empty-state" style={{ padding: '2.5rem 1rem' }}>
                  <div className="organizer-hackathon__empty-icon" aria-hidden="true">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <h4 className="organizer-hackathon__empty-title">No teams have selected this problem statement yet.</h4>
                  <p className="organizer-hackathon__empty-desc">
                    When registered teams select this challenge, their rosters and contact info will appear here.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '0.85rem' }}>
                  {selectionsModal.data.teams.map((t, idx) => (
                    <div key={t.teamId} className="organizer-hackathon__roster-team">
                      <div className="organizer-hackathon__roster-team-header">
                        <div>
                          <span style={{ fontSize: '0.74rem', color: '#7859ca', fontWeight: 700, textTransform: 'uppercase' }}>
                            Team #{idx + 1}
                          </span>
                          <h4 style={{ margin: '0.1rem 0 0', fontSize: '1.05rem', color: '#241938' }}>{t.teamName}</h4>
                        </div>
                        <span style={{ fontSize: '0.78rem', color: '#7b6f93' }}>
                          Selected: {new Date(t.selectedAt).toLocaleDateString()} {new Date(t.selectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gap: '0.4rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4b3d68' }}>
                          Members ({t.members.length}):
                        </span>
                        {t.members.map((m) => (
                          <div key={m.registrationId} className="organizer-hackathon__roster-member">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                              <strong style={{ color: '#241938' }}>{m.fullName}</strong>
                              {m.isTeamLead && (
                                <span className="organizer-hackathon__lead-badge">LEAD</span>
                              )}
                              <code style={{ fontSize: '0.74rem', background: '#f4f1fa', padding: '0.1rem 0.35rem', borderRadius: '4px', color: '#553c8b' }}>
                                {m.registrationId}
                              </code>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#7b6f93', textAlign: 'right' }}>
                              <span>{m.email}</span>
                              {m.instituteName && (
                                <span style={{ marginLeft: '0.4rem' }}>• {m.instituteName}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="organizer-hackathon__modal-footer">
              <button
                type="button"
                className="button button--secondary"
                onClick={() => setSelectionsModal({ isOpen: false, problem: null, loading: false, data: null, error: '' })}
              >
                Close Roster
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. DELETE / DEACTIVATE CONFIRMATION MODAL */}
      {deleteModal.isOpen && deleteModal.problem && (
        <div
          className="organizer-hackathon__modal-backdrop"
          onClick={() => !deleteModal.isDeleting && setDeleteModal({ isOpen: false, problem: null, isDeleting: false, error: '' })}
          role="presentation"
        >
          <div
            className="organizer-hackathon__modal-card organizer-hackathon__modal-card--delete"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            {deleteModal.problem.selectedTeams > 0 ? (
              <>
                <div className="organizer-hackathon__modal-header">
                  <h3 id="delete-modal-title" className="organizer-hackathon__modal-title" style={{ color: '#c2185b' }}>
                    Cannot Delete Selected Problem
                  </h3>
                  <button
                    type="button"
                    className="organizer-hackathon__modal-close"
                    onClick={() => setDeleteModal({ isOpen: false, problem: null, isDeleting: false, error: '' })}
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>
                <div className="organizer-hackathon__modal-body">
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#4b3d68', lineHeight: 1.5 }}>
                    This problem statement has already been selected by{' '}
                    <strong>{deleteModal.problem.selectedTeams} team(s)</strong>. Direct deletion is prohibited to preserve participant records.
                  </p>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#4b3d68', lineHeight: 1.5 }}>
                    Would you like to <strong>Deactivate</strong> it instead so no new teams can select it?
                  </p>
                </div>
                <div className="organizer-hackathon__modal-footer">
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={() => setDeleteModal({ isOpen: false, problem: null, isDeleting: false, error: '' })}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="button button--primary"
                    onClick={async () => {
                      await handleToggleActive(deleteModal.problem)
                      setDeleteModal({ isOpen: false, problem: null, isDeleting: false, error: '' })
                    }}
                  >
                    Deactivate Problem
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="organizer-hackathon__modal-header">
                  <h3 id="delete-modal-title" className="organizer-hackathon__modal-title" style={{ color: '#d32f2f' }}>
                    Delete Problem Statement?
                  </h3>
                  <button
                    type="button"
                    className="organizer-hackathon__modal-close"
                    onClick={() => setDeleteModal({ isOpen: false, problem: null, isDeleting: false, error: '' })}
                    disabled={deleteModal.isDeleting}
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>
                <div className="organizer-hackathon__modal-body">
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#4b3d68', lineHeight: 1.5 }}>
                    Are you sure you want to permanently delete{' '}
                    <strong>"{deleteModal.problem.title}"</strong>? This action cannot be undone.
                  </p>

                  {deleteModal.error && (
                    <div className="organizer-hackathon__alert organizer-hackathon__alert--error" role="alert">
                      <span>⚠️ {deleteModal.error}</span>
                    </div>
                  )}
                </div>
                <div className="organizer-hackathon__modal-footer">
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={() => setDeleteModal({ isOpen: false, problem: null, isDeleting: false, error: '' })}
                    disabled={deleteModal.isDeleting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteConfirm}
                    disabled={deleteModal.isDeleting}
                    style={{
                      padding: '0.55rem 1.1rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#d32f2f',
                      color: '#ffffff',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {deleteModal.isDeleting ? 'Deleting…' : 'Delete Permanently'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const OrganizerRoutes = () => {
  const location = useLocation()
  const { getProfilePath } = useEventProfile()

  if (!isOrganizerAuthenticated()) {
    return <Navigate to={getProfilePath('organizer')} replace state={{ from: location }} />
  }

  return (
    <OrganizerLayout>
      <Routes>
        <Route index element={<OrganizerDashboardHome />} />
        <Route path="email" element={<OrganizerEmailPage />} />
        <Route path="attendance" element={<OrganizerAttendancePage />} />
        <Route path="participants" element={<OrganizerParticipantsPage />} />
        <Route path="hackathon" element={<OrganizerHackathonPage />} />
        <Route path="rewards" element={<OrganizerRewardsPage />} />
        <Route path="events" element={<OrganizerEventsPage />} />
        <Route path="post-event" element={<OrganizerPostEventPage />} />
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
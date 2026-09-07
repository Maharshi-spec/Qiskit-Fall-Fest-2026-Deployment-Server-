import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { EVENT_PROFILES, calculateProfileStatus } from '../../config/eventProfiles'
import { useEventProfile } from '../../context/EventProfileContext'
import qiskitBadge from '../../assets/qiskit/badge-pink.png.png'

const statusStyles = {
  GOING: {
    label: 'GOING',
    bg: '#ecfdf5',
    color: '#059669',
    border: '#a7f3d0',
    dot: '#10b981',
  },
  UPCOMING: {
    label: 'UPCOMING',
    bg: '#eff6ff',
    color: '#2563eb',
    border: '#bfdbfe',
    dot: '#3b82f6',
  },
  COMPLETED: {
    label: 'COMPLETED',
    bg: '#f3f4f6',
    color: '#4b5563',
    border: '#e5e7eb',
    dot: '#9ca3af',
  },
}

const ProfileSelection = () => {
  const navigate = useNavigate()
  const { switchProfile } = useEventProfile()

  const preProfile = EVENT_PROFILES['pre-qiskit']
  const postProfile = EVENT_PROFILES['post-qiskit']

  const preStatus = calculateProfileStatus('pre-qiskit')
  const postStatus = calculateProfileStatus('post-qiskit')

  const handleSelect = (profileId) => {
    switchProfile(profileId)
    navigate(`/${profileId}`)
  }

  const profiles = [
    {
      config: preProfile,
      status: preStatus,
      badge: statusStyles[preStatus] || statusStyles.GOING,
    },
    {
      config: postProfile,
      status: postStatus,
      badge: statusStyles[postStatus] || statusStyles.UPCOMING,
    },
  ]

  return (
    <div className="profile-selection-page">
      <motion.div
        className="profile-selection-container"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <header className="profile-selection-header">
          <img src={qiskitBadge} alt="Qiskit Fall Fest Logo" className="profile-selection-logo" />
          <div className="profile-selection-eyebrow">IBM Quantum Community</div>
          <h1 className="profile-selection-title">QISKIT FALL FEST</h1>
          <p className="profile-selection-subtitle">
            Choose an event profile to explore schedules, registrations, workshops, and rewards.
          </p>
        </header>

        <div className="profile-cards-grid">
          {profiles.map(({ config, status, badge }) => (
            <motion.div
              key={config.id}
              className={`profile-card profile-card--${config.id}`}
              whileHover={{ y: -6, scale: 1.015 }}
              whileTap={{ scale: 0.99 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              onClick={() => handleSelect(config.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleSelect(config.id)
                }
              }}
            >
              <div className="profile-card__header">
                <span
                  className="profile-card__badge"
                  style={{
                    backgroundColor: badge.bg,
                    color: badge.color,
                    borderColor: badge.border,
                  }}
                >
                  <span
                    className="profile-card__badge-dot"
                    style={{ backgroundColor: badge.dot }}
                  />
                  {status}
                </span>
                <span className="profile-card__tag">{config.shortDateLabel}</span>
              </div>

              <div className="profile-card__body">
                <h2 className="profile-card__name">{config.displayName}</h2>
                <div className="profile-card__date-range">{config.dateLabel}</div>
                <p className="profile-card__desc">{config.description}</p>
              </div>

              <div className="profile-card__footer">
                <button
                  type="button"
                  className="profile-card__enter-btn button button--primary"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSelect(config.id)
                  }}
                >
                  ENTER
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="profile-card__enter-icon"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

export default ProfileSelection

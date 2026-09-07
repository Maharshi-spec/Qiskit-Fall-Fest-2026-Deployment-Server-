import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { EVENT_PROFILES, calculateProfileStatus } from '../../config/eventProfiles'
import { useEventProfile } from '../../context/EventProfileContext'
import qiskitBadge from '../../assets/qiskit/badge-pink.png.png'

// ─── Status badge styles ──────────────────────────────────────────────────────
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
  DISABLED: {
    label: 'UPCOMING',
    bg: '#f9f5ff',
    color: '#7c3aed',
    border: '#ddd6fe',
    dot: '#8b5cf6',
  },
}

// ─── ProfileSelection ─────────────────────────────────────────────────────────
const ProfileSelection = () => {
  const navigate = useNavigate()
  const {
    switchProfile,
    postQiskitEnabled,
    postQiskitStatus,
    postQiskitConfig,
    postQiskitConfigLoading,
  } = useEventProfile()

  const preProfile = EVENT_PROFILES['pre-qiskit']
  const preStatus = calculateProfileStatus('pre-qiskit')

  // Post-Qiskit display data: prefer backend config over static config
  const postDateLabel = postQiskitConfig?.start_date && postQiskitConfig?.end_date
    ? (() => {
        const s = new Date(postQiskitConfig.start_date + 'T12:00:00Z')
        const e = new Date(postQiskitConfig.end_date + 'T12:00:00Z')
        const fmt = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
        return `${fmt(s)} – ${fmt(e)}`
      })()
    : EVENT_PROFILES['post-qiskit'].dateLabel

  const postShortDateLabel = postQiskitConfig?.start_date && postQiskitConfig?.end_date
    ? (() => {
        const s = new Date(postQiskitConfig.start_date + 'T12:00:00Z')
        const e = new Date(postQiskitConfig.end_date + 'T12:00:00Z')
        const shortFmt = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })
        return `${shortFmt(s)} – ${shortFmt(e)}`
      })()
    : EVENT_PROFILES['post-qiskit'].shortDateLabel

  const postDescription = postQiskitConfig?.description || EVENT_PROFILES['post-qiskit'].description

  // The status shown on the card
  const displayPostStatus = postQiskitConfigLoading ? 'DISABLED' : (postQiskitStatus || 'DISABLED')
  const isPostEnabled = !postQiskitConfigLoading && postQiskitEnabled

  const handleSelect = (profileId) => {
    if (profileId === 'post-qiskit' && !isPostEnabled) return
    switchProfile(profileId)
    navigate(`/${profileId}`)
  }

  const getPreBadge = () => statusStyles[preStatus] || statusStyles.GOING
  const getPostBadge = () => {
    if (!isPostEnabled) return statusStyles.DISABLED
    return statusStyles[displayPostStatus] || statusStyles.DISABLED
  }

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
          {/* ── PRE-QISKIT CARD ─────────────────────────────────────────────── */}
          <ProfileCard
            config={preProfile}
            status={preStatus}
            badge={getPreBadge()}
            dateLabel={preProfile.dateLabel}
            shortDateLabel={preProfile.shortDateLabel}
            description={preProfile.description}
            disabled={false}
            onSelect={() => handleSelect('pre-qiskit')}
          />

          {/* ── POST-QISKIT CARD ─────────────────────────────────────────────── */}
          <ProfileCard
            config={EVENT_PROFILES['post-qiskit']}
            status={displayPostStatus}
            badge={getPostBadge()}
            dateLabel={postDateLabel}
            shortDateLabel={postShortDateLabel}
            description={postDescription}
            disabled={!isPostEnabled}
            onSelect={() => handleSelect('post-qiskit')}
          />
        </div>
      </motion.div>
    </div>
  )
}

// ─── ProfileCard ──────────────────────────────────────────────────────────────
const ProfileCard = ({ config, status, badge, dateLabel, shortDateLabel, description, disabled, onSelect }) => {
  const handleClick = () => {
    if (disabled) return
    onSelect()
  }

  const handleKeyDown = (e) => {
    if (disabled) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect()
    }
  }

  const handleEnterClick = (e) => {
    e.stopPropagation()
    if (disabled) return
    onSelect()
  }

  return (
    <motion.div
      className={`profile-card profile-card--${config.id}${disabled ? ' profile-card--disabled' : ''}`}
      whileHover={disabled ? {} : { y: -6, scale: 1.015 }}
      whileTap={disabled ? {} : { scale: 0.99 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      onClick={handleClick}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onKeyDown={handleKeyDown}
      style={disabled ? { cursor: 'default', opacity: 0.72 } : {}}
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
          {disabled ? 'COMING SOON' : status}
        </span>
        <span className="profile-card__tag">{shortDateLabel}</span>
      </div>

      <div className="profile-card__body">
        <h2 className="profile-card__name">{config.displayName}</h2>
        <div className="profile-card__date-range">{dateLabel}</div>
        <p className="profile-card__desc">{description}</p>

        {/* Show disabled explanation under the description */}
        {disabled && (
          <p
            className="profile-card__disabled-note"
            style={{
              fontSize: '0.8rem',
              color: '#8b849c',
              marginTop: '0.5rem',
              fontStyle: 'italic',
            }}
          >
            Not yet available — awaiting organizer activation.
          </p>
        )}
      </div>

      <div className="profile-card__footer">
        <button
          type="button"
          className={`profile-card__enter-btn button${disabled ? ' button--secondary' : ' button--primary'}`}
          onClick={handleEnterClick}
          disabled={disabled}
          aria-disabled={disabled}
          style={disabled ? { cursor: 'not-allowed', opacity: 0.5 } : {}}
        >
          {disabled ? 'NOT AVAILABLE' : 'ENTER'}
          {!disabled && (
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
          )}
          {disabled && (
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
              aria-hidden="true"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          )}
        </button>
      </div>
    </motion.div>
  )
}

export default ProfileSelection

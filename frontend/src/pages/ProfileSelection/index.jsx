import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { EVENT_PROFILES, calculateProfileStatus } from '../../config/eventProfiles'
import { useEventProfile } from '../../context/EventProfileContext'
import qiskitBadge from '../../assets/qiskit/badge-pink.png.png'

// ─── Status badge mapping ───────────────────────────────────────────────────
// Schedule badges: describe the date-based schedule status — independent of access
const statusStyles = {
  GOING: {
    label: 'LIVE NOW',
    className: 'status-badge--success',
  },
  UPCOMING: {
    label: 'UPCOMING',
    className: 'status-badge--purple',
  },
  COMPLETED: {
    label: 'COMPLETED',
    className: 'status-badge--neutral',
  },
  DISABLED: {
    label: 'COMING SOON',
    className: 'status-badge--purple',
  },
}

// ─── ProfileSelection Component ─────────────────────────────────────────────
const ProfileSelection = () => {
  const navigate = useNavigate()
  const {
    switchProfile,
    postQiskitEnabled,
    postQiskitScheduleStatus,
    postQiskitConfig,
    postQiskitConfigLoading,
  } = useEventProfile()

  const preProfile = EVENT_PROFILES['pre-qiskit']
  const preStatus = calculateProfileStatus('pre-qiskit')

  // EVENT ACCESS: Post-Qiskit is accessible when the organizer has explicitly enabled it.
  const isPostActive = !postQiskitConfigLoading && postQiskitEnabled
  const isPostDisabled = !isPostActive

  // CRITICAL PUBLIC EVENT SWITCHING RULE:
  // Before Post-Qiskit activation: Pre-Qiskit is enterable; Post-Qiskit is locked.
  // After Post-Qiskit activation: Post-Qiskit is enterable; Pre-Qiskit is no longer publicly enterable through the selector.
  const isPreDisabled = isPostActive

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

  // SCHEDULE STATUS: strictly date-derived (UPCOMING, GOING, COMPLETED)
  const displayPostScheduleStatus = postQiskitScheduleStatus || 'UPCOMING'

  const handleSelect = (profileId) => {
    if (profileId === 'pre-qiskit' && isPreDisabled) return
    if (profileId === 'post-qiskit' && isPostDisabled) return
    switchProfile(profileId)
    navigate(`/${profileId}`)
  }

  const getPreBadge = () => statusStyles[preStatus] || statusStyles.COMPLETED
  const getPostBadge = () => {
    if (isPostDisabled) return statusStyles.DISABLED
    // Event is enabled — show real schedule status badge (UPCOMING / GOING / COMPLETED)
    return statusStyles[displayPostScheduleStatus] || statusStyles.UPCOMING
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
            badge={getPreBadge()}
            dateLabel={preProfile.dateLabel}
            shortDateLabel={preProfile.shortDateLabel}
            description={preProfile.description}
            disabled={isPreDisabled}
            disabledNote={isPreDisabled ? 'Pre-Qiskit Fall Fest has concluded.' : null}
            buttonText={isPreDisabled ? 'CONCLUDED' : 'ENTER'}
            onSelect={() => handleSelect('pre-qiskit')}
          />

          {/* ── POST-QISKIT CARD ─────────────────────────────────────────────── */}
          <ProfileCard
            config={EVENT_PROFILES['post-qiskit']}
            badge={getPostBadge()}
            dateLabel={postDateLabel}
            shortDateLabel={postShortDateLabel}
            description={postDescription}
            disabled={isPostDisabled}
            disabledNote={isPostDisabled ? 'Not yet available — awaiting organizer activation.' : null}
            buttonText={isPostDisabled ? 'COMING SOON' : 'ENTER EVENT'}
            onSelect={() => handleSelect('post-qiskit')}
          />
        </div>
      </motion.div>
    </div>
  )
}

// ─── ProfileCard Component ──────────────────────────────────────────────────
const ProfileCard = ({
  config,
  badge,
  dateLabel,
  shortDateLabel,
  description,
  disabled,
  disabledNote,
  buttonText,
  onSelect,
}) => {
  const handleClick = (e) => {
    if (disabled) {
      e.preventDefault()
      e.stopPropagation()
      return
    }
    onSelect()
  }

  const handleKeyDown = (e) => {
    if (disabled) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect()
    }
  }

  return (
    <motion.div
      className={`profile-card profile-card--${config.id}${disabled ? ' profile-card--disabled' : ''}`}
      whileHover={disabled ? {} : { y: -6, scale: 1.015 }}
      whileTap={disabled ? {} : { scale: 0.99 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      onClick={handleClick}
      role={disabled ? undefined : 'button'}
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onKeyDown={handleKeyDown}
      style={disabled ? { cursor: 'not-allowed', opacity: 0.75 } : { cursor: 'pointer' }}
    >
      <div className="profile-card__header">
        <span className={`profile-card__badge status-badge ${badge.className}`}>
          <span className="status-badge__dot" />
          {badge.label}
        </span>
        <span className="profile-card__tag">{shortDateLabel}</span>
      </div>

      <div className="profile-card__body">
        <h2 className="profile-card__name">{config.displayName}</h2>
        <div className="profile-card__date-range">{dateLabel}</div>
        <p className="profile-card__desc">{description}</p>

        {disabled && disabledNote && (
          <p
            className="profile-card__disabled-note"
            style={{
              fontSize: '0.8125rem',
              color: 'var(--color-text-muted)',
              marginTop: '0.6rem',
              fontStyle: 'italic',
            }}
          >
            {disabledNote}
          </p>
        )}
      </div>

      <div className="profile-card__footer">
        <span
          className={`profile-card__enter-btn button ${disabled ? 'button--secondary' : 'button--primary'}`}
          style={disabled ? { cursor: 'not-allowed', opacity: 0.6 } : {}}
          aria-hidden="true"
        >
          {buttonText || (disabled ? 'NOT AVAILABLE' : 'ENTER')}
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
        </span>
      </div>
    </motion.div>
  )
}

export default ProfileSelection

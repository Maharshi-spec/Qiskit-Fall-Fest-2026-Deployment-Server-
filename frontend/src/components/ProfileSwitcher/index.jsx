import { motion } from 'framer-motion'
import { useEventProfile } from '../../context/EventProfileContext'

const ProfileSwitcher = ({ className = '', compact = false }) => {
  const { activeProfile, switchProfile, postQiskitEnabled, postQiskitScheduleStatus } = useEventProfile()
  const isOrganizer = typeof window !== 'undefined' && Boolean(localStorage.getItem('qff-organizer-token'))

  // Pre-Qiskit is permanently completed
  const preStatus = 'COMPLETED'
  // Post-Qiskit schedule status is strictly date-derived (UPCOMING, GOING, COMPLETED)
  const postStatus = postQiskitScheduleStatus || 'UPCOMING'

  // CRITICAL PUBLIC EVENT SWITCHING RULE:
  // Before activation: Pre-Qiskit is enterable; Post-Qiskit is locked.
  // After activation: Post-Qiskit is enterable; Pre-Qiskit is NOT publicly enterable through the switcher (unless organizer).
  const isPreDisabled = postQiskitEnabled && !isOrganizer
  const isPostDisabled = !postQiskitEnabled && !isOrganizer

  const profiles = [
    {
      id: 'pre-qiskit',
      label: 'Pre-Qiskit',
      fullLabel: 'Pre-Qiskit Fall Fest',
      status: preStatus,
      disabled: isPreDisabled,
      title: isPreDisabled
        ? 'Pre-Qiskit Fall Fest has concluded.'
        : `Pre-Qiskit Fall Fest (${preStatus})`,
    },
    {
      id: 'post-qiskit',
      label: 'Post-Qiskit',
      fullLabel: 'Post-Qiskit Fall Fest',
      status: postStatus,
      disabled: isPostDisabled,
      title: isPostDisabled
        ? 'Post-Qiskit is not yet available — awaiting organizer activation.'
        : `Post-Qiskit Fall Fest (${postStatus})`,
    },
  ]

  const handleProfileClick = (p) => {
    if (p.disabled) return
    switchProfile(p.id)
  }

  return (
    <div className={`profile-switcher ${compact ? 'profile-switcher--compact' : ''} ${className}`}>
      {profiles.map((p) => {
        const isActive = activeProfile === p.id
        return (
          <button
            key={p.id}
            type="button"
            className={`profile-switcher__btn ${isActive ? 'profile-switcher__btn--active' : ''} ${p.disabled ? 'profile-switcher__btn--disabled' : ''}`}
            onClick={() => handleProfileClick(p)}
            aria-pressed={isActive}
            aria-disabled={p.disabled}
            disabled={p.disabled}
            title={p.title}
            style={p.disabled ? { cursor: 'not-allowed', opacity: 0.55 } : {}}
          >
            {isActive && (
              <motion.span
                layoutId="active-profile-pill"
                className="profile-switcher__pill"
                transition={{ duration: 0.22, ease: 'easeOut' }}
              />
            )}
            <span className="profile-switcher__text">
              {p.label}
            </span>
            <span className={`profile-switcher__status-dot profile-switcher__status-dot--${p.status.toLowerCase()}`} />
          </button>
        )
      })}
    </div>
  )
}

export default ProfileSwitcher

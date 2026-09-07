import { motion } from 'framer-motion'
import { useEventProfile } from '../../context/EventProfileContext'
import { EVENT_PROFILES, calculateProfileStatus } from '../../config/eventProfiles'

const ProfileSwitcher = ({ className = '', compact = false }) => {
  const { activeProfile, switchProfile } = useEventProfile()

  const profiles = [
    {
      id: 'pre-qiskit',
      label: 'Pre-Qiskit',
      fullLabel: 'Pre-Qiskit Fall Fest',
      status: calculateProfileStatus('pre-qiskit'),
    },
    {
      id: 'post-qiskit',
      label: 'Post-Qiskit',
      fullLabel: 'Post-Qiskit Fall Fest',
      status: calculateProfileStatus('post-qiskit'),
    },
  ]

  return (
    <div className={`profile-switcher ${compact ? 'profile-switcher--compact' : ''} ${className}`}>
      {profiles.map((p) => {
        const isActive = activeProfile === p.id
        return (
          <button
            key={p.id}
            type="button"
            className={`profile-switcher__btn ${isActive ? 'profile-switcher__btn--active' : ''}`}
            onClick={() => switchProfile(p.id)}
            aria-pressed={isActive}
            title={`${p.fullLabel} (${p.status})`}
          >
            {isActive && (
              <motion.span
                layoutId="active-profile-pill"
                className="profile-switcher__pill"
                transition={{ duration: 0.22, ease: 'easeOut' }}
              />
            )}
            <span className="profile-switcher__text">
              {compact ? p.label : p.label}
            </span>
            <span className={`profile-switcher__status-dot profile-switcher__status-dot--${p.status.toLowerCase()}`} />
          </button>
        )
      })}
    </div>
  )
}

export default ProfileSwitcher

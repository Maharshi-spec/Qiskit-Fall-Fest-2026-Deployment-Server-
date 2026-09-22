import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  EVENT_PROFILES,
  DEFAULT_PROFILE,
  ALLOWED_PROFILES,
  isValidProfile,
  normalizeProfile,
  calculateProfileStatus,
  getAllProfilesSummary,
} from '../config/eventProfiles'
import { api } from '../services/api'

const STORAGE_KEY = 'qff_active_profile'

const EventProfileContext = createContext({
  activeProfile: DEFAULT_PROFILE,
  profileConfig: EVENT_PROFILES[DEFAULT_PROFILE],
  status: 'COMPLETED',
  allProfiles: [],
  postQiskitConfig: null,
  postQiskitEnabled: false,
  postQiskitScheduleStatus: 'UPCOMING',
  postQiskitRegistrationOpen: false,
  postQiskitStatus: 'DISABLED',
  refreshPostQiskitConfig: () => {},
  switchProfile: () => {},
  getProfilePath: () => '',
  isProfileRoute: false,
})

export const EventProfileProvider = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()

  // Derive profile from current URL path (/pre-qiskit/... or /post-qiskit/...)
  const detectedFromUrl = useMemo(() => {
    const parts = location.pathname.split('/').filter(Boolean)
    if (parts.length > 0 && isValidProfile(parts[0])) {
      return parts[0].toLowerCase()
    }
    return null
  }, [location.pathname])

  const [activeProfile, setActiveProfile] = useState(() => {
    if (detectedFromUrl) return detectedFromUrl
    const stored = localStorage.getItem(STORAGE_KEY)
    return normalizeProfile(stored) || DEFAULT_PROFILE
  })

  // Post-Qiskit backend config state
  const [postQiskitConfig, setPostQiskitConfig] = useState(null)
  const [postQiskitConfigLoading, setPostQiskitConfigLoading] = useState(true)

  // Fetch Post-Qiskit public status from backend on mount and after changes
  const refreshPostQiskitConfig = useCallback(async () => {
    try {
      setPostQiskitConfigLoading(true)
      const result = await api.getPostEventStatus()
      if (result.success && result.data) {
        setPostQiskitConfig(result.data)
      }
    } catch (_err) {
      // Silently fail — UI falls back to disabled state
    } finally {
      setPostQiskitConfigLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshPostQiskitConfig()
  }, [refreshPostQiskitConfig])

  useEffect(() => {
    if (detectedFromUrl && detectedFromUrl !== activeProfile) {
      setActiveProfile(detectedFromUrl)
      localStorage.setItem(STORAGE_KEY, detectedFromUrl)
      api.setEventProfile(detectedFromUrl)
    } else if (!detectedFromUrl) {
      api.setEventProfile(activeProfile)
    }
  }, [detectedFromUrl, activeProfile])

  const profileConfig = useMemo(() => {
    return EVENT_PROFILES[activeProfile] || EVENT_PROFILES[DEFAULT_PROFILE]
  }, [activeProfile])

  // Derive Post-Qiskit enabled, schedule status, and registration state from backend config
  const postQiskitEnabled = useMemo(() => {
    if (!postQiskitConfig) return false
    return Boolean(postQiskitConfig.enabled)
  }, [postQiskitConfig])

  const postQiskitRegistrationOpen = useMemo(() => {
    if (!postQiskitConfig) return false
    return Boolean(postQiskitConfig.registration_open || postQiskitConfig.registrationOpen)
  }, [postQiskitConfig])

  // Pure date-driven schedule status (UPCOMING, GOING, COMPLETED)
  const postQiskitScheduleStatus = useMemo(() => {
    if (!postQiskitConfig) return 'UPCOMING'
    if (postQiskitConfig.schedule_status) return postQiskitConfig.schedule_status
    if (postQiskitConfig.start_date && postQiskitConfig.end_date) {
      return calculateProfileStatus('post-qiskit', new Date(), {
        startDate: postQiskitConfig.start_date,
        endDate: postQiskitConfig.end_date,
        timezone: postQiskitConfig.timezone,
      })
    }
    return calculateProfileStatus('post-qiskit')
  }, [postQiskitConfig])

  const postQiskitStatus = useMemo(() => {
    if (!postQiskitConfig) return 'DISABLED'
    return postQiskitConfig.status || 'DISABLED'
  }, [postQiskitConfig])

  // Chronological schedule status for active profile
  const status = useMemo(() => {
    if (activeProfile === 'post-qiskit') {
      return postQiskitScheduleStatus
    }
    return calculateProfileStatus(activeProfile)
  }, [activeProfile, postQiskitScheduleStatus])

  // Registration state: Pre-Qiskit is permanently closed; Post-Qiskit requires both enabled and registration_open
  const isRegistrationOpen = useMemo(() => {
    if (activeProfile === 'pre-qiskit') {
      return false
    }
    if (activeProfile === 'post-qiskit') {
      return postQiskitEnabled && postQiskitRegistrationOpen
    }
    return false
  }, [activeProfile, postQiskitEnabled, postQiskitRegistrationOpen])

  const allProfiles = useMemo(() => {
    return getAllProfilesSummary()
  }, [])

  const getProfilePath = useCallback((subpath = '', profile = activeProfile) => {
    const cleanSub = String(subpath || '').replace(/^\//, '')
    const targetProfile = isValidProfile(profile) ? profile : DEFAULT_PROFILE
    return cleanSub ? `/${targetProfile}/${cleanSub}` : `/${targetProfile}`
  }, [activeProfile])

  const switchProfile = useCallback((newProfile) => {
    const normalized = normalizeProfile(newProfile)
    if (!normalized || normalized === activeProfile) return

    setActiveProfile(normalized)
    localStorage.setItem(STORAGE_KEY, normalized)
    api.setEventProfile(normalized)

    // Calculate replacement path preserving subroute
    const pathParts = location.pathname.split('/').filter(Boolean)
    let newPath = `/${normalized}`
    if (pathParts.length > 0 && isValidProfile(pathParts[0])) {
      const remaining = pathParts.slice(1).join('/')
      newPath = remaining ? `/${normalized}/${remaining}` : `/${normalized}`
    }

    navigate(newPath + location.search + location.hash)
  }, [activeProfile, location.pathname, location.search, location.hash, navigate])

  const isProfileRoute = Boolean(detectedFromUrl)

  const value = useMemo(() => ({
    activeProfile,
    profileConfig,
    status,
    allProfiles,
    postQiskitConfig,
    postQiskitEnabled,
    postQiskitScheduleStatus,
    postQiskitRegistrationOpen,
    postQiskitStatus,
    postQiskitConfigLoading,
    isRegistrationOpen,
    refreshPostQiskitConfig,
    switchProfile,
    getProfilePath,
    isProfileRoute,
  }), [activeProfile, profileConfig, status, allProfiles, postQiskitConfig, postQiskitEnabled, postQiskitScheduleStatus, postQiskitRegistrationOpen, postQiskitStatus, postQiskitConfigLoading, isRegistrationOpen, refreshPostQiskitConfig, switchProfile, getProfilePath, isProfileRoute])

  return (
    <EventProfileContext.Provider value={value}>
      {children}
    </EventProfileContext.Provider>
  )
}

export const useEventProfile = () => useContext(EventProfileContext)

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
  status: 'GOING',
  allProfiles: [],
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

  const status = useMemo(() => {
    return calculateProfileStatus(activeProfile)
  }, [activeProfile])

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
    switchProfile,
    getProfilePath,
    isProfileRoute,
  }), [activeProfile, profileConfig, status, allProfiles, switchProfile, getProfilePath, isProfileRoute])

  return (
    <EventProfileContext.Provider value={value}>
      {children}
    </EventProfileContext.Provider>
  )
}

export const useEventProfile = () => useContext(EventProfileContext)

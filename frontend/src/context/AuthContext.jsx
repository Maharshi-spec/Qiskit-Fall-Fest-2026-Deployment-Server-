import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api } from '../services/api'
import { useEventProfile } from './EventProfileContext'

const AuthContext = createContext({
  isLoggedIn: false,
  userRegistration: null,
  token: null,
  isLoading: true,
  isLoginModalOpen: false,
  openLoginModal: () => {},
  closeLoginModal: () => {},
  login: () => {},
  logout: () => {},
  getStoredToken: () => null,
})

const BASE_AUTH_TOKEN_KEY = 'qff_auth_token'

export const getProfileTokenKey = () => {
  const profile = api.getEventProfile?.() || 'pre-qiskit'
  return profile === 'pre-qiskit' ? BASE_AUTH_TOKEN_KEY : `${BASE_AUTH_TOKEN_KEY}_${profile}`
}

export const getStoredToken = () => {
  const key = getProfileTokenKey()
  const token = localStorage.getItem(key)
  if (token) return token
  // Fallback for pre-qiskit legacy storage
  if ((api.getEventProfile?.() || 'pre-qiskit') === 'pre-qiskit') {
    return localStorage.getItem(BASE_AUTH_TOKEN_KEY)
  }
  return null
}

export const AuthProvider = ({ children }) => {
  const { activeProfile } = useEventProfile()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRegistration, setUserRegistration] = useState(null)
  const [token, setToken] = useState(() => getStoredToken())
  const [isLoading, setIsLoading] = useState(true)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)

  const openLoginModal = useCallback(() => setIsLoginModalOpen(true), [])
  const closeLoginModal = useCallback(() => setIsLoginModalOpen(false), [])

  const login = useCallback((newToken, registrationData) => {
    if (newToken) {
      localStorage.setItem(getProfileTokenKey(), newToken)
      if ((api.getEventProfile?.() || 'pre-qiskit') === 'pre-qiskit') {
        localStorage.setItem(BASE_AUTH_TOKEN_KEY, newToken)
      }
      setToken(newToken)
    }
    setIsLoggedIn(true)
    setUserRegistration(registrationData)
    setIsLoginModalOpen(false)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(getProfileTokenKey())
    if ((api.getEventProfile?.() || 'pre-qiskit') === 'pre-qiskit') {
      localStorage.removeItem(BASE_AUTH_TOKEN_KEY)
    }
    setToken(null)
    setIsLoggedIn(false)
    setUserRegistration(null)
  }, [])

  const verifySession = useCallback(async () => {
    const currentToken = getStoredToken()
    setToken(currentToken)

    if (!currentToken) {
      setIsLoggedIn(false)
      setUserRegistration(null)
      setIsLoading(false)
      return
    }

    try {
      const result = await api.getCurrentUser(currentToken)

      if (result.success && result.data?.registration) {
        setIsLoggedIn(true)
        setUserRegistration(result.data.registration)
      } else {
        const isAuthInvalid =
          result.status === 401 ||
          result.status === 404 ||
          ['UNAUTHORIZED', 'INVALID_TOKEN', 'REGISTRATION_NOT_FOUND'].includes(result.error?.code)

        if (isAuthInvalid) {
          localStorage.removeItem(getProfileTokenKey())
          if ((api.getEventProfile?.() || 'pre-qiskit') === 'pre-qiskit') {
            localStorage.removeItem(BASE_AUTH_TOKEN_KEY)
          }
          setToken(null)
          setIsLoggedIn(false)
          setUserRegistration(null)
        } else {
          console.warn('[AUTH SESSION] Temporary verification issue:', result.error?.message)
        }
      }
    } catch (err) {
      console.warn('[AUTH SESSION] Failed to verify session due to network error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    setIsLoading(true)
    verifySession()
  }, [activeProfile, verifySession])

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        userRegistration,
        token,
        isLoading,
        isLoginModalOpen,
        openLoginModal,
        closeLoginModal,
        login,
        logout,
        getStoredToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

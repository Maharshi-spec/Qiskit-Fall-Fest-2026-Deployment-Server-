import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api } from '../services/api'

const AuthContext = createContext({
  isLoggedIn: false,
  userRegistration: null,
  isLoading: true,
  isLoginModalOpen: false,
  openLoginModal: () => {},
  closeLoginModal: () => {},
  login: () => {},
  logout: () => {},
})

const AUTH_TOKEN_KEY = 'qff_auth_token'

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRegistration, setUserRegistration] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)

  const openLoginModal = useCallback(() => setIsLoginModalOpen(true), [])
  const closeLoginModal = useCallback(() => setIsLoginModalOpen(false), [])

  const login = useCallback((token, registrationData) => {
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token)
    }
    setIsLoggedIn(true)
    setUserRegistration(registrationData)
    setIsLoginModalOpen(false)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    setIsLoggedIn(false)
    setUserRegistration(null)
  }, [])

  const verifySession = useCallback(async () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)

    if (!token) {
      setIsLoggedIn(false)
      setUserRegistration(null)
      setIsLoading(false)
      return
    }

    try {
      const result = await api.getCurrentUser(token)

      if (result.success && result.data?.registration) {
        setIsLoggedIn(true)
        setUserRegistration(result.data.registration)
      } else {
        const isAuthInvalid =
          result.status === 401 ||
          result.status === 404 ||
          ['UNAUTHORIZED', 'INVALID_TOKEN', 'REGISTRATION_NOT_FOUND'].includes(result.error?.code)

        if (isAuthInvalid) {
          localStorage.removeItem(AUTH_TOKEN_KEY)
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
    verifySession()
  }, [verifySession])

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        userRegistration,
        isLoading,
        isLoginModalOpen,
        openLoginModal,
        closeLoginModal,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

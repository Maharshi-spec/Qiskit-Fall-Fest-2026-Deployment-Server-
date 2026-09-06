import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'

const DISMISSED_KEY = 'qff_login_modal_dismissed'

const LoginModal = () => {
  const { isLoggedIn, isLoading, isLoginModalOpen, closeLoginModal, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [step, setStep] = useState('role_select') // 'role_select' | 'participant_form'
  const [email, setEmail] = useState('')
  const [registrationId, setRegistrationId] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  const isHomepage = location.pathname === '/'

  useEffect(() => {
    const dismissed = sessionStorage.getItem(DISMISSED_KEY) === 'true'
    setIsDismissed(dismissed)
  }, [])

  const shouldShow = (!isLoading && !isLoggedIn && isHomepage && !isDismissed) || isLoginModalOpen

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, 'true')
    setIsDismissed(true)
    closeLoginModal()
  }

  const handleRoleSelect = (role) => {
    setErrorMessage('')
    if (role === 'ORGANIZER') {
      handleDismiss()
      navigate('/organizer')
    } else if (role === 'PARTICIPANT') {
      setStep('participant_form')
    }
  }

  const handleParticipantLogin = async (e) => {
    e.preventDefault()
    setErrorMessage('')

    if (!email.trim() || !registrationId.trim()) {
      setErrorMessage('Email and Registration ID are required.')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await api.loginParticipant({
        email: email.trim(),
        registrationId: registrationId.trim(),
      })

      if (result.success && result.data?.token) {
        login(result.data.token, result.data.registration)
        sessionStorage.setItem(DISMISSED_KEY, 'true')
        setIsDismissed(true)
      } else {
        setErrorMessage(result.error?.message || 'Invalid email or registration ID.')
      }
    } catch (err) {
      setErrorMessage('Invalid email or registration ID.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!shouldShow) return null

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 10, 25, 0.65)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.25rem',
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) handleDismiss()
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(255, 79, 163, 0.15)',
            width: '100%',
            maxWidth: '440px',
            padding: '2rem',
            position: 'relative',
            color: '#1a1829',
          }}
        >
          <button
            type="button"
            onClick={handleDismiss}
            style={{
              position: 'absolute',
              top: '1.25rem',
              right: '1.25rem',
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#8b849c',
              padding: '0.25rem 0.5rem',
              lineHeight: 1,
            }}
            aria-label="Close modal"
          >
            ×
          </button>

          {step === 'role_select' ? (
            <div>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ff4fa3', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                Welcome
              </p>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1a1829', marginBottom: '0.75rem', lineHeight: 1.2 }}>
                Who are you?
              </h2>
              <p style={{ fontSize: '0.95rem', color: '#5e5670', marginBottom: '1.75rem' }}>
                Select your role to access your event dashboard or register for Qiskit Fall Fest 2026.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <button
                  type="button"
                  onClick={() => handleRoleSelect('PARTICIPANT')}
                  style={{
                    padding: '1rem 1.25rem',
                    borderRadius: '14px',
                    border: '2px solid rgba(255, 79, 163, 0.25)',
                    backgroundColor: 'rgba(255, 79, 163, 0.04)',
                    color: '#c2348a',
                    fontWeight: 700,
                    fontSize: '1.05rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span>PARTICIPANT</span>
                  <span style={{ fontSize: '1.2rem' }}>→</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleSelect('ORGANIZER')}
                  style={{
                    padding: '1rem 1.25rem',
                    borderRadius: '14px',
                    border: '2px solid rgba(139, 132, 156, 0.25)',
                    backgroundColor: 'rgba(139, 132, 156, 0.05)',
                    color: '#3d2f59',
                    fontWeight: 700,
                    fontSize: '1.05rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span>ORGANIZER</span>
                  <span style={{ fontSize: '1.2rem' }}>→</span>
                </button>
              </div>
            </div>
          ) : (
            <div>
              <button
                type="button"
                onClick={() => setStep('role_select')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ff4fa3',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  padding: 0,
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                ← Back
              </button>

              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1a1829', marginBottom: '0.5rem' }}>
                Participant Login
              </h2>
              <p style={{ fontSize: '0.9rem', color: '#5e5670', marginBottom: '1.25rem' }}>
                Enter your registered Email and Registration ID to restore your session.
              </p>

              {errorMessage && (
                <div
                  style={{
                    padding: '0.75rem 0.9rem',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255, 79, 163, 0.08)',
                    border: '1px solid rgba(255, 79, 163, 0.25)',
                    color: '#c2348a',
                    fontSize: '0.9rem',
                    marginBottom: '1rem',
                    fontWeight: 500,
                  }}
                >
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleParticipantLogin}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#3d2f59', marginBottom: '0.4rem' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                    style={{
                      width: '100%',
                      padding: '0.8rem 0.9rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(139, 132, 156, 0.3)',
                      fontSize: '0.95rem',
                      outline: 'none',
                      backgroundColor: '#fbf9fe',
                      color: '#1a1829',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#3d2f59', marginBottom: '0.4rem' }}>
                    Registration ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. QFF26-R-00001"
                    value={registrationId}
                    onChange={(e) => setRegistrationId(e.target.value)}
                    disabled={isSubmitting}
                    style={{
                      width: '100%',
                      padding: '0.8rem 0.9rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(139, 132, 156, 0.3)',
                      fontSize: '0.95rem',
                      outline: 'none',
                      backgroundColor: '#fbf9fe',
                      color: '#1a1829',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    padding: '0.9rem',
                    borderRadius: '14px',
                    border: 'none',
                    backgroundColor: '#ff4fa3',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '1rem',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.7 : 1,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {isSubmitting ? 'Verifying...' : 'LOGIN'}
                </button>
              </form>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default LoginModal

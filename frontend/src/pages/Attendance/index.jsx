import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Html5QrcodeScanner } from 'html5-qrcode'
import Button from '../../components/Button'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'
import sticker01 from '../../assets/qiskit/Sticker 01.svg'

const Attendance = () => {
  const { isLoggedIn, userRegistration, isLoading: authLoading } = useAuth()
  const [isScanning, setIsScanning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusResult, setStatusResult] = useState(null)
  const scannerRef = useRef(null)

  useEffect(() => {
    if (!isScanning) return

    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      },
      false,
    )

    scannerRef.current = scanner

    scanner.render(
      async (decodedText) => {
        scanner.clear()
        setIsScanning(false)
        await handleScannedToken(decodedText)
      },
      (error) => {
        // Ignore scan frame noise
      },
    )

    return () => {
      try {
        if (scannerRef.current) {
          scannerRef.current.clear()
        }
      } catch (e) {
        // Cleanup ignore
      }
    }
  }, [isScanning])

  const handleScannedToken = async (token) => {
    setIsSubmitting(true)
    setStatusResult(null)

    const result = await api.markAttendance(token)
    setIsSubmitting(false)

    if (result.success) {
      setStatusResult({
        type: result.alreadyMarked ? 'info' : 'success',
        message: result.message || 'You have been successfully marked present for this event.',
        alreadyMarked: result.alreadyMarked,
      })
    } else {
      setStatusResult({
        type: 'error',
        code: result.code,
        message: result.message || 'Attendance check-in failed. Please try again.',
      })
    }
  }

  const startScanner = () => {
    setStatusResult(null)
    setIsScanning(true)
  }

  const stopScanner = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear()
      } catch (e) {}
    }
    setIsScanning(false)
  }

  return (
    <motion.section className="detail-page" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="container detail-page__header">
        <div className="detail-page__intro">
          <p className="page-shell__eyebrow">Attendance Check-in</p>
          <h1>Mark your attendance.</h1>
          <p>
            Scan the dynamic QR code displayed by the organizer to automatically record your attendance for the current event session.
          </p>
        </div>
        <div className="detail-page__visual">
          <img src={sticker01} alt="" className="detail-page__sticker" />
        </div>
      </div>

      <div className="container detail-page__panel">
        {!isLoggedIn ? (
          <div className="detail-page__panel-copy">
            <p className="page-shell__eyebrow" style={{ color: '#c2348a' }}>Authentication Required</p>
            <h2>Please sign in to mark attendance</h2>
            <p>
              You must be logged in as a registered participant to mark attendance. Use the top navigation bar or homepage modal to log in.
            </p>
            <div style={{ marginTop: '1.25rem' }}>
              <Button to="/register" kind="primary">Register or Log in →</Button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1.5rem', width: '100%' }}>
            <div className="detail-page__panel-copy">
              <p className="page-shell__eyebrow" style={{ color: '#ff4fa3' }}>✓ Logged in as {userRegistration?.fullName || 'Participant'}</p>
              <h2>Mark attendance for an event</h2>
              <p>
                Registration ID: <strong style={{ color: '#ff4fa3' }}>{userRegistration?.registrationId || 'Confirmed'}</strong>
              </p>
            </div>

            {statusResult && (
              <div
                style={{
                  padding: '1.1rem 1.25rem',
                  borderRadius: '16px',
                  background:
                    statusResult.type === 'success'
                      ? 'rgba(42, 190, 120, 0.1)'
                      : statusResult.type === 'info'
                      ? 'rgba(42, 120, 240, 0.1)'
                      : 'rgba(255, 79, 163, 0.1)',
                  border: `1px solid ${
                    statusResult.type === 'success'
                      ? 'rgba(42, 190, 120, 0.3)'
                      : statusResult.type === 'info'
                      ? 'rgba(42, 120, 240, 0.3)'
                      : 'rgba(255, 79, 163, 0.3)'
                  }`,
                  color:
                    statusResult.type === 'success'
                      ? '#1b8f65'
                      : statusResult.type === 'info'
                      ? '#1b5fbf'
                      : '#c2348a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  fontSize: '0.98rem',
                  fontWeight: 600,
                }}
              >
                <span style={{ fontSize: '1.4rem' }}>
                  {statusResult.type === 'success' || statusResult.type === 'info' ? '✓' : '⚠️'}
                </span>
                <div>{statusResult.message}</div>
              </div>
            )}

            {isSubmitting && (
              <div className="detail-info-item">
                <span>Processing</span>
                <strong>Validating QR token with backend…</strong>
              </div>
            )}

            {!isScanning ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1rem' }}>
                <button
                  type="button"
                  className="button button--primary"
                  onClick={startScanner}
                  disabled={isSubmitting}
                  style={{
                    padding: '0.9rem 1.8rem',
                    fontSize: '1.05rem',
                    borderRadius: '14px',
                    justifyContent: 'center',
                  }}
                >
                  📷 SCAN TO MARK ATTENDANCE
                </button>
                <p style={{ fontSize: '0.88rem', color: '#6e6584' }}>
                  Clicking will open your device camera to scan the organizer's QR code.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem', maxWidth: '460px' }}>
                <div id="qr-reader" style={{ border: '2px solid rgba(255, 79, 163, 0.3)', borderRadius: '16px', overflow: 'hidden' }} />
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={stopScanner}
                  style={{ justifyContent: 'center' }}
                >
                  Cancel Scanner
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="container detail-page__cta-row">
        <Button to="/" kind="secondary">Back to home</Button>
        <Button to="/certificates" kind="primary">View certificates</Button>
      </div>
    </motion.section>
  )
}

export default Attendance

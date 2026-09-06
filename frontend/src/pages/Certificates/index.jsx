import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import Button from '../../components/Button'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'
import sticker02 from '../../assets/qiskit/Sticker 02.svg'
import sticker07 from '../../assets/qiskit/Sticker 07.svg'

const formatCertificateType = (type) => {
  if (!type) return { typeLabel: 'Certificate', title: 'Participation' }

  const map = {
    HACKATHON_PARTICIPATION: { typeLabel: 'Hackathon', title: 'Participation' },
    HACKATHON_FIRST_POSITION: { typeLabel: 'Hackathon', title: '1st Position' },
    HACKATHON_FIRST_RUNNERS_UP: { typeLabel: 'Hackathon', title: '1st Runner Up' },
    HACKATHON_FIRST_RUNNER_UP: { typeLabel: 'Hackathon', title: '1st Runner Up' },
    HACKATHON_SECOND_RUNNERS_UP: { typeLabel: 'Hackathon', title: '2nd Runner Up' },
    HACKATHON_SECOND_RUNNER_UP: { typeLabel: 'Hackathon', title: '2nd Runner Up' },
    GENERAL_EVENT_PARTICIPATION: { typeLabel: 'Event', title: 'Participation' },
    WORKSHOP_PARTICIPATION: { typeLabel: 'Workshop', title: 'Participation' },
    WEBINAR_PARTICIPATION: { typeLabel: 'Webinar', title: 'Participation' },
    QUANTUM_BOOTCAMP_COMPLETION: { typeLabel: 'BootCamp', title: 'Completion' },
  }

  if (map[type]) return map[type]

  const parts = type.split('_')
  if (parts.length > 1) {
    const category = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase()
    const detail = parts.slice(1).map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ')
    return { typeLabel: category, title: detail }
  }

  return { typeLabel: 'Certificate', title: type }
}

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A'
  try {
    const d = new Date(dateStr)
    if (Number.isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch (err) {
    return dateStr
  }
}

const Certificates = () => {
  const { isLoggedIn, isLoading: authLoading, openLoginModal } = useAuth()
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchCertificates = useCallback(async () => {
    const token = localStorage.getItem('qff_auth_token')
    if (!token) {
      setCertificates([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await api.fetchParticipantCertificates(token)
      if (result.success) {
        setCertificates(result.data || [])
      } else {
        setError(result.error?.message || 'Unable to load certificates.')
      }
    } catch (err) {
      setError('Unable to connect to the server. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authLoading) {
      if (isLoggedIn) {
        fetchCertificates()
      } else {
        setLoading(false)
        setCertificates([])
      }
    }
  }, [isLoggedIn, authLoading, fetchCertificates])

  return (
    <motion.section className="detail-page" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="container detail-page__header">
        <div className="detail-page__intro">
          <p className="page-shell__eyebrow">Certificates</p>
          <h1>Your Qiskit Fall Fest 2026 Certificate.</h1>
          <p>
            Participants can receive certificates based on their involvement in Qiskit Fall Fest 2026. Whether you attend the main event, take part in the hackathon, join a workshop, or participate in the BootCamp, your participation can be recognized with the corresponding certificate.
          </p>
        </div>
        <div className="detail-page__visual">
          <img src={sticker07} alt="" className="detail-page__sticker" />
        </div>
      </div>

      <div className="container certificate-collection">
        <div className="detail-page__panel-copy">
          <p className="page-shell__eyebrow">My certificates</p>
          <h2>Your certificates</h2>
          <p>Certificates issued to you through Qiskit Fall Fest 2026.</p>
        </div>

        {authLoading || loading ? (
          <div className="certificate-empty-state">
            <h3>Loading your certificates...</h3>
            <p>Please wait while we retrieve your issued certificates.</p>
          </div>
        ) : !isLoggedIn ? (
          <div className="certificate-empty-state">
            <h3>Please log in to view your certificates.</h3>
            <p>Log in with your registered account to access certificates earned during Qiskit Fall Fest 2026.</p>
            <div style={{ marginTop: '1.25rem' }}>
              <Button kind="primary" onClick={openLoginModal}>Log In</Button>
            </div>
          </div>
        ) : error ? (
          <div className="certificate-empty-state">
            <h3>Unable to load certificates</h3>
            <p>{error}</p>
            <div style={{ marginTop: '1.25rem' }}>
              <Button kind="primary" onClick={fetchCertificates}>Retry</Button>
            </div>
          </div>
        ) : certificates.length > 0 ? (
          <div className="certificate-grid">
            {certificates.map((certificate) => {
              const { typeLabel, title } = formatCertificateType(certificate.certificateType)
              const issuedDate = formatDate(certificate.issuedAt)
              const certNumber = certificate.certificateNumber || certificate.certificateId || 'N/A'

              return (
                <article key={certificate.certificateId || certNumber} className="certificate-card">
                  <div>
                    <p className="certificate-card__type">{typeLabel}</p>
                    <h3>{certificate.eventName ? `${certificate.eventName} - ${title}` : title}</h3>
                  </div>
                  <div className="certificate-card__details">
                    <div className="detail-info-item">
                      <span>Certificate ID</span>
                      <strong>{certNumber}</strong>
                    </div>
                    <p className="certificate-card__issued">Issued: {issuedDate}</p>
                  </div>
                  <div className="certificate-card__actions">
                    <Button
                      kind="primary"
                      disabled={!certificate.viewUrl}
                      onClick={() => {
                        if (certificate.viewUrl) {
                          window.open(certificate.viewUrl, '_blank', 'noopener,noreferrer')
                        }
                      }}
                    >
                      View Certificate
                    </Button>
                    <Button
                      kind="secondary"
                      disabled={!certificate.downloadUrl}
                      onClick={() => {
                        if (certificate.downloadUrl) {
                          const link = document.createElement('a')
                          link.href = certificate.downloadUrl
                          link.target = '_blank'
                          link.rel = 'noopener noreferrer'
                          link.download = `${certNumber}.pdf`
                          document.body.appendChild(link)
                          link.click()
                          document.body.removeChild(link)
                        }
                      }}
                    >
                      Download PDF
                    </Button>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="certificate-empty-state">
            <h3>No certificates have been issued to you yet.</h3>
            <p>Certificates you earn during Qiskit Fall Fest 2026 will appear here after they are generated by the organizers.</p>
          </div>
        )}
      </div>

      <div className="container detail-page__visual-row">
        <img src={sticker02} alt="" className="detail-page__sticker detail-page__sticker--small" />
      </div>

      <div className="container detail-page__cta-row">
        <Button to="/" kind="secondary">Back to home</Button>
        {!isLoggedIn && <Button to="/register" kind="primary">Register for the event</Button>}
      </div>
    </motion.section>
  )
}

export default Certificates
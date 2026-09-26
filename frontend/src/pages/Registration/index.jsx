import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Button from '../../components/Button'
import { api } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useEventProfile } from '../../context/EventProfileContext'
import sticker01 from '../../assets/qiskit/Sticker 01.svg'
import sticker02 from '../../assets/qiskit/Sticker 02.svg'

const audience = [
  'Students exploring quantum for the first time',
  'Developers and learners looking to build practical Qiskit skills',
  'Researchers, enthusiasts, and curious community members',
]

const Registration = () => {
  const { isLoggedIn, userRegistration, isLoading: isAuthLoading, login, logout } = useAuth()
  const { status, getProfilePath, activeProfile, isRegistrationOpen } = useEventProfile()

  const isRegistrationClosed = !isRegistrationOpen

  const registrationHighlights = [
    {
      title: 'What to expect',
      text: 'A welcoming environment for learning, experimentation, workshops, and community discussion around quantum computing.',
    },
    {
      title: 'What you will learn',
      text: 'Foundational quantum concepts, key Qiskit ideas, hands-on experimentation, and ways to connect with others in the field.',
    },
    {
      title: 'Registration status',
      text: isRegistrationClosed
        ? `Registration for ${activeProfile === 'post-qiskit' ? 'Post-Qiskit' : 'Pre-Qiskit'} Fall Fest 2026 is currently closed.`
        : 'Live registration is now active. Complete the form below to secure your spot at Qiskit Fall Fest 2026.',
    },
  ]

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobileNumber: '',
    role: '',
    instituteName: '',
    department: '',
    knowsPython: false,
    aicteQuantumCourse: false,
    knowsQuantumBasics: false,
    usedQiskitBefore: false,
    accommodationRequired: false,
    localTransportRequired: false,
  })

  const [idCard, setIdCard] = useState(null)
  const [idCardName, setIdCardName] = useState('')
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [submittedData, setSubmittedData] = useState(null)
  const [apiError, setApiError] = useState(null)

  useEffect(() => {
    if (isLoggedIn && userRegistration) {
      setSubmittedData(userRegistration)
    }
  }, [isLoggedIn, userRegistration])

  const activeRegistration = submittedData || (isLoggedIn ? userRegistration : null)

  const isFormValid = Boolean(
    formData.fullName.trim() &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) &&
    formData.mobileNumber.trim() &&
    formData.role &&
    formData.instituteName.trim() &&
    formData.department.trim() &&
    idCard &&
    idCard.size <= 500 * 1024,
  )

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    })
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' })
    }
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    if (file.size > 500 * 1024) {
      setIdCard(null)
      setIdCardName('')
      event.target.value = ''
      setErrors({ ...errors, idCard: 'File size must not exceed 500 KB.' })
      return
    }

    setIdCard(file)
    setIdCardName(file.name)
    if (errors.idCard) {
      setErrors({ ...errors, idCard: '' })
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (isRegistrationClosed) return
    setApiError(null)

    const newErrors = {}
    if (!formData.fullName.trim()) newErrors.fullName = 'Full Name is required.'
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Valid Email is required.'
    if (!formData.mobileNumber.trim()) newErrors.mobileNumber = 'Mobile Number is required.'
    if (!formData.role) newErrors.role = 'Please select your role.'
    if (!formData.instituteName.trim()) newErrors.instituteName = 'Institute / Organization is required.'
    if (!formData.department.trim()) newErrors.department = 'Department / Stream is required.'
    if (!idCard) newErrors.idCard = 'ID Card / Document upload is required.'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)
    try {
      const payload = new FormData()
      Object.entries(formData).forEach(([key, val]) => {
        payload.append(key, String(val))
      })
      payload.append('accommodation_required', String(formData.accommodationRequired))
      payload.append('local_transport_required', String(formData.localTransportRequired))
      payload.append('idCard', idCard)

      const result = await api.submitRegistration(payload)
      if (result.success && result.data) {
        const token = result.data.token || result.token
        const registration = result.data.registration || result.registration || result.data
        if (token) {
          login(token, registration)
        }
        setSubmittedData(registration)
      } else {
        setApiError(result.error?.message || 'Registration failed. Please try again.')
      }
    } catch (err) {
      setApiError(err.message || 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isAuthLoading) {
    return (
      <div className="container" style={{ padding: '6rem 0', textAlign: 'center' }}>
        <h2 style={{ color: '#3d2f59' }}>Verifying session...</h2>
      </div>
    )
  }

  return (
    <motion.section className="detail-page" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="container detail-page__header">
        <div className="detail-page__intro">
          <p className="page-shell__eyebrow">Registration</p>
          <h1>Join Qiskit Fall Fest 2026.</h1>
          <p>
            Qiskit Fall Fest 2026 brings together students, learners, and curious minds for a practical, welcoming introduction to quantum computing and Qiskit.
          </p>
        </div>
        <div className="detail-page__visual">
          <img src={sticker01} alt="" className="detail-page__sticker" />
        </div>
      </div>

      <div className="container detail-page__grid detail-page__grid--three">
        <div className="detail-card">
          <p className="detail-card__eyebrow">Who should register</p>
          <ul className="detail-list">
            {audience.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        {registrationHighlights.map((item) => (
          <div key={item.title} className="detail-card">
            <p className="detail-card__eyebrow">{item.title}</p>
            <p>{item.text}</p>
          </div>
        ))}
      </div>

      {activeRegistration ? (
        <div className="container detail-page__panel detail-page__panel--registration">
          <div className="detail-page__panel-copy">
            <p className="page-shell__eyebrow" style={{ color: '#ff4fa3' }}>✓ Registration Confirmed</p>
            <h2 style={{ color: '#3d2f59' }}>You're all set!</h2>
            <p>
              Your registration for Qiskit Fall Fest 2026 is confirmed and active on this device.
            </p>

            <div className="detail-page__info-stack" style={{ marginTop: '1.5rem' }}>
              <div className="detail-info-item">
                <span>Registration ID</span>
                <strong>{activeRegistration.registrationId || 'Processing...'}</strong>
              </div>
              <div className="detail-info-item">
                <span>Name</span>
                <strong>{activeRegistration.fullName || 'Registered Participant'}</strong>
              </div>
              <div className="detail-info-item">
                <span>Email</span>
                <strong>{activeRegistration.email || '—'}</strong>
              </div>
              {activeRegistration.instituteName && (
                <div className="detail-info-item">
                  <span>Institution</span>
                  <strong>{activeRegistration.instituteName}</strong>
                </div>
              )}
              <div className="detail-info-item">
                <span>Status</span>
                <strong>{activeRegistration.status || 'Confirmed'}</strong>
              </div>
              <div className="detail-info-item">
                <span>Accommodation</span>
                <strong>{activeRegistration.accommodationRequired || activeRegistration.accommodation_required ? 'Required' : 'Not Required'}</strong>
              </div>
              <div className="detail-info-item">
                <span>Local Transport</span>
                <strong>{activeRegistration.localTransportRequired || activeRegistration.local_transport_required ? 'Required' : 'Not Required'}</strong>
              </div>
              {activeRegistration.idCardUrl && (
                <div className="detail-info-item">
                  <span>ID Card</span>
                  <a
                    href={activeRegistration.idCardUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#ff4fa3', textDecoration: 'underline', fontWeight: 600 }}
                  >
                    View Uploaded Document →
                  </a>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
            <Button to={getProfilePath('')} kind="primary">Back to home</Button>
            <Button to={getProfilePath('day-1')} kind="secondary">View schedule</Button>
            <button
              type="button"
              onClick={logout}
              style={{
                marginTop: '0.5rem',
                background: 'none',
                border: '1px solid rgba(139, 132, 156, 0.3)',
                borderRadius: '12px',
                padding: '0.65rem',
                color: '#5e5670',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              Sign out on this device
            </button>
          </div>
        </div>
      ) : isRegistrationClosed ? (
        <div className="container registration-closed-wrapper">
          <div className="registration-closed-card">
            <span className="status-badge status-badge--neutral registration-closed-card__badge">
              <span className="status-badge__dot" />
              Registration Closed
            </span>
            <h2 id="registration-anchor-heading" className="registration-closed-card__heading">
              Registration for {activeProfile === 'post-qiskit' ? 'Post-Qiskit' : 'Pre-Qiskit'} Fall Fest 2026 is Closed
            </h2>
            <p className="registration-closed-card__description">
              Registration has ended for this event. Explore the program, workshops, hackathon, and session schedule to see what the festival offers.
            </p>
            <div className="registration-closed-card__actions">
              <Button to={getProfilePath('')} kind="primary">Explore Event</Button>
              <Button to={getProfilePath('day-1')} kind="secondary">View Schedule</Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="container detail-page__panel detail-page__panel--registration">
          <div className="detail-page__panel-copy">
            <p className="page-shell__eyebrow">Registration form</p>
            <h2 id="registration-anchor-heading">Secure your spot today.</h2>
            <p>
              Complete the form to register for Qiskit Fall Fest 2026. We'll send you all the details you need to participate.
            </p>
          </div>

          <div className="detail-page__form-shell">
            <form className="detail-form" onSubmit={handleSubmit}>
              {apiError && (
                <div className="detail-form__error-banner" role="alert">
                  <span className="detail-form__error-icon" aria-hidden="true">⚠️</span>
                  <div className="detail-form__error-text">{apiError}</div>
                </div>
              )}

              <label>
                <span>Full Name *</span>
                <input
                  type="text"
                  name="fullName"
                  placeholder="e.g. Ada Lovelace"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
                {errors.fullName && <span className="field-error">{errors.fullName}</span>}
              </label>

              <label>
                <span>Email Address *</span>
                <input
                  type="email"
                  name="email"
                  placeholder="e.g. ada@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
                {errors.email && <span className="field-error">{errors.email}</span>}
              </label>

              <label>
                <span>Mobile Number *</span>
                <input
                  type="tel"
                  name="mobileNumber"
                  placeholder="e.g. +91 98765 43210"
                  value={formData.mobileNumber}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
                {errors.mobileNumber && <span className="field-error">{errors.mobileNumber}</span>}
              </label>

              <label>
                <span>Role *</span>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  disabled={isLoading}
                >
                  <option value="">Select your role</option>
                  <option value="STUDENT">Student</option>
                  <option value="FACULTY">Faculty</option>
                  <option value="PROFESSIONAL">Industry Professional / Researcher</option>
                  <option value="OTHER">Other</option>
                </select>
                {errors.role && <span className="field-error">{errors.role}</span>}
              </label>

              <label>
                <span>Institute / Organization *</span>
                <input
                  type="text"
                  name="instituteName"
                  placeholder="e.g. ABC Institute of Technology"
                  value={formData.instituteName}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
                {errors.instituteName && <span className="field-error">{errors.instituteName}</span>}
              </label>

              <label>
                <span>Department / Stream *</span>
                <input
                  type="text"
                  name="department"
                  placeholder="e.g. Computer Science & Engineering"
                  value={formData.department}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
                {errors.department && <span className="field-error">{errors.department}</span>}
              </label>

              <div className="detail-form__field">
                <span className="detail-form__field-label">Do you require accommodation?</span>
                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.25rem' }}>
                  <label className="checkbox-label" style={{ cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="accommodationRequired"
                      checked={formData.accommodationRequired === true}
                      onChange={() => setFormData((prev) => ({ ...prev, accommodationRequired: true }))}
                      disabled={isLoading}
                    />
                    <span>Yes</span>
                  </label>
                  <label className="checkbox-label" style={{ cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="accommodationRequired"
                      checked={formData.accommodationRequired === false}
                      onChange={() => setFormData((prev) => ({ ...prev, accommodationRequired: false }))}
                      disabled={isLoading}
                    />
                    <span>No</span>
                  </label>
                </div>
              </div>

              <div className="detail-form__field">
                <span className="detail-form__field-label">Do you require local transport?</span>
                <span className="detail-form__hint" style={{ marginTop: '0.1rem', marginBottom: '0.25rem', color: '#6e6284', fontSize: '0.85rem' }}>
                  Local transport is provided only between VZM and CUTMAP (VZM ↔ CUTMAP).
                </span>
                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.25rem' }}>
                  <label className="checkbox-label" style={{ cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="localTransportRequired"
                      checked={formData.localTransportRequired === true}
                      onChange={() => setFormData((prev) => ({ ...prev, localTransportRequired: true }))}
                      disabled={isLoading}
                    />
                    <span>Yes</span>
                  </label>
                  <label className="checkbox-label" style={{ cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="localTransportRequired"
                      checked={formData.localTransportRequired === false}
                      onChange={() => setFormData((prev) => ({ ...prev, localTransportRequired: false }))}
                      disabled={isLoading}
                    />
                    <span>No</span>
                  </label>
                </div>
              </div>

              <fieldset className="detail-form__fieldset">
                <legend>Background & Experience</legend>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="knowsPython"
                    checked={formData.knowsPython}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                  <span>I have basic knowledge of Python programming</span>
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="aicteQuantumCourse"
                    checked={formData.aicteQuantumCourse}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                  <span>I have enrolled in / completed an AICTE or university Quantum course</span>
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="knowsQuantumBasics"
                    checked={formData.knowsQuantumBasics}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                  <span>I am familiar with basic Quantum Computing concepts (qubits, superposition, etc.)</span>
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="usedQiskitBefore"
                    checked={formData.usedQiskitBefore}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                  <span>I have used Qiskit SDK before</span>
                </label>
              </fieldset>

              <div className="detail-form__field">
                <span className="detail-form__field-label">Student / Institutional ID Card (Image or PDF, max 500 KB) *</span>
                <div className="detail-form__file-wrap">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    disabled={isLoading}
                    id="idCardInput"
                    style={{ display: 'none' }}
                  />
                  <label
                    htmlFor="idCardInput"
                    className={`detail-form__file-button ${errors.idCard ? 'detail-form__file-button--error' : ''}`}
                    style={{ cursor: isLoading ? 'not-allowed' : 'pointer' }}
                  >
                    📁 {idCardName || 'Choose ID card file'}
                  </label>
                </div>
                <span className="detail-form__hint">Maximum file size: 500 KB. (JPEG, PNG, or PDF)</span>
                {errors.idCard && <span className="field-error">{errors.idCard}</span>}
              </div>

              <button
                type="submit"
                className="button button--primary"
                disabled={isLoading || !isFormValid}
                style={{
                  opacity: isLoading || !isFormValid ? 0.65 : 1,
                  cursor: isLoading || !isFormValid ? 'not-allowed' : 'pointer',
                  background: isLoading || !isFormValid ? '#b8b8be' : undefined,
                  color: isLoading || !isFormValid ? '#f5f5f6' : undefined,
                  boxShadow: isLoading || !isFormValid ? 'none' : undefined,
                  filter: isLoading || !isFormValid ? 'grayscale(1)' : undefined,
                }}
              >
                {isLoading ? 'Submitting...' : 'Complete registration'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="container detail-page__cta-row">
        <Button to={getProfilePath('')} kind="secondary">Back to home</Button>
        <Button to={getProfilePath('hackathon')} kind="primary">Explore the hackathon</Button>
      </div>

      <div className="container detail-page__visual-row">
        <img src={sticker02} alt="" className="detail-page__sticker detail-page__sticker--small" />
      </div>
    </motion.section>
  )
}

export default Registration

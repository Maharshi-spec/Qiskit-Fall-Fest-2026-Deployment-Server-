import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Button from '../../components/Button'
import { api } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import sticker01 from '../../assets/qiskit/Sticker 01.svg'
import sticker02 from '../../assets/qiskit/Sticker 02.svg'

const audience = [
  'Students exploring quantum for the first time',
  'Developers and learners looking to build practical Qiskit skills',
  'Researchers, enthusiasts, and curious community members',
]

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
    text: 'Live registration is now active. Complete the form below to secure your spot at Qiskit Fall Fest 2026.',
  },
]

const Registration = () => {
  const { isLoggedIn, userRegistration, isLoading: isAuthLoading, login, logout } = useAuth()

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

  const validateForm = () => {
    const newErrors = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile number is required'
    }

    if (!formData.role) {
      newErrors.role = 'Please select your role'
    }

    if (!formData.instituteName.trim()) {
      newErrors.instituteName = 'Institution name is required'
    }

    if (!formData.department.trim()) {
      newErrors.department = 'Department is required'
    }

    if (!idCard) {
      newErrors.idCard = 'ID card is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setApiError(null)

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const data = new FormData()
      data.append('fullName', formData.fullName)
      data.append('email', formData.email)
      data.append('mobileNumber', formData.mobileNumber)
      data.append('role', formData.role)
      data.append('instituteName', formData.instituteName)
      data.append('department', formData.department)
      data.append('knowsPython', String(formData.knowsPython))
      data.append('aicteQuantumCourse', String(formData.aicteQuantumCourse))
      data.append('knowsQuantumBasics', String(formData.knowsQuantumBasics))
      data.append('usedQiskitBefore', String(formData.usedQiskitBefore))
      if (idCard) {
        data.append('idCard', idCard)
      }

      const result = await api.submitRegistration(data)

      if (result.success) {
        const regData = result.data.registration || {
          registrationId: result.data.registrationId,
          status: result.data.status,
          idCardUrl: result.data.idCardUrl,
          fullName: formData.fullName,
          email: formData.email,
          instituteName: formData.instituteName,
          role: formData.role,
        }

        setSubmittedData(regData)
        if (result.data.token) {
          login(result.data.token, regData)
        }

        setFormData({
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
        })
        setIdCard(null)
        setIdCardName('')
      } else {
        const errorCode = result.error?.code
        const errorMessage = result.error?.message

        if (errorCode === 'EMAIL_ALREADY_REGISTERED') {
          setApiError('This email is already registered.')
        } else if (errorCode === 'FILE_TOO_LARGE') {
          setErrors({ ...errors, idCard: errorMessage || 'File size must not exceed 500 KB.' })
        } else {
          setApiError(errorMessage || 'Registration failed. Please try again.')
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (isAuthLoading) {
    return (
      <div className="detail-page container" style={{ paddingTop: '5rem', paddingBottom: '5rem', textAlign: 'center' }}>
        <p className="page-shell__eyebrow">Registration</p>
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
        <div className="container detail-page__panel">
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
            <Button to="/" kind="primary">Back to home</Button>
            <Button to="/#program" kind="secondary">View the program</Button>
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
      ) : (
        <div className="container detail-page__panel">
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
                <div style={{
                  padding: '0.9rem',
                  borderRadius: '12px',
                  background: 'rgba(255, 79, 163, 0.08)',
                  border: '1px solid rgba(255, 79, 163, 0.2)',
                  color: '#c2348a',
                  fontSize: '0.95rem',
                  marginBottom: '1rem',
                }}>
                  {apiError}
                </div>
              )}

              <label>
                Full name *
                <input
                  type="text"
                  name="fullName"
                  placeholder="Your name"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
                {errors.fullName && <span style={{ color: '#c2348a', fontSize: '0.85rem', marginTop: '0.3rem' }}>{errors.fullName}</span>}
              </label>

              <label>
                Email address *
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
                {errors.email && <span style={{ color: '#c2348a', fontSize: '0.85rem', marginTop: '0.3rem' }}>{errors.email}</span>}
              </label>

              <label>
                Mobile number *
                <input
                  type="tel"
                  name="mobileNumber"
                  placeholder="+91 XXXXX XXXXX"
                  value={formData.mobileNumber}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
                {errors.mobileNumber && <span style={{ color: '#c2348a', fontSize: '0.85rem', marginTop: '0.3rem' }}>{errors.mobileNumber}</span>}
              </label>

              <label>
                Role *
                <select name="role" value={formData.role} onChange={handleInputChange} disabled={isLoading}>
                  <option value="">Select your role</option>
                  <option value="STUDENT">Student</option>
                  <option value="FACULTY">Faculty</option>
                  <option value="PROFESSIONAL">Professional</option>
                  <option value="OTHER">Other</option>
                </select>
                {errors.role && <span style={{ color: '#c2348a', fontSize: '0.85rem', marginTop: '0.3rem' }}>{errors.role}</span>}
              </label>

              <label>
                Institution name *
                <input
                  type="text"
                  name="instituteName"
                  placeholder="Your institution"
                  value={formData.instituteName}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
                {errors.instituteName && <span style={{ color: '#c2348a', fontSize: '0.85rem', marginTop: '0.3rem' }}>{errors.instituteName}</span>}
              </label>

              <label>
                Department *
                <input
                  type="text"
                  name="department"
                  placeholder="Your department"
                  value={formData.department}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
                {errors.department && <span style={{ color: '#c2348a', fontSize: '0.85rem', marginTop: '0.3rem' }}>{errors.department}</span>}
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', marginBottom: '0.85rem' }}>
                <input
                  type="checkbox"
                  name="knowsPython"
                  checked={formData.knowsPython}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  style={{ cursor: 'pointer', width: '1.1rem', height: '1.1rem' }}
                />
                <span style={{ color: '#4d2f74', fontWeight: 600 }}>I know Python</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', marginBottom: '0.85rem' }}>
                <input
                  type="checkbox"
                  name="aicteQuantumCourse"
                  checked={formData.aicteQuantumCourse}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  style={{ cursor: 'pointer', width: '1.1rem', height: '1.1rem' }}
                />
                <span style={{ color: '#4d2f74', fontWeight: 600 }}>I have completed an AICTE quantum course</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', marginBottom: '0.85rem' }}>
                <input
                  type="checkbox"
                  name="knowsQuantumBasics"
                  checked={formData.knowsQuantumBasics}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  style={{ cursor: 'pointer', width: '1.1rem', height: '1.1rem' }}
                />
                <span style={{ color: '#4d2f74', fontWeight: 600 }}>I know quantum computing basics</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', marginBottom: '0.85rem' }}>
                <input
                  type="checkbox"
                  name="usedQiskitBefore"
                  checked={formData.usedQiskitBefore}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  style={{ cursor: 'pointer', width: '1.1rem', height: '1.1rem' }}
                />
                <span style={{ color: '#4d2f74', fontWeight: 600 }}>I have used Qiskit before</span>
              </label>

              <label>
                ID card (upload image or PDF) — Max 500 KB *
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  marginTop: '0.45rem',
                }}>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileChange}
                    disabled={isLoading}
                    style={{ display: 'none' }}
                    id="idCardInput"
                  />
                  <label
                    htmlFor="idCardInput"
                    style={{
                      flex: 1,
                      padding: '0.8rem 0.9rem',
                      border: `1px solid ${errors.idCard ? '#c2348a' : 'rgba(255, 79, 163, 0.18)'}`,
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.9)',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      color: '#5a5d6b',
                      fontSize: '0.95rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {idCardName || 'Choose ID card file'}
                  </label>
                </div>
                <span style={{ display: 'block', color: '#5a5d6b', fontSize: '0.8rem', marginTop: '0.3rem' }}>Maximum file size: 500 KB.</span>
                {errors.idCard && <span style={{ color: '#c2348a', fontSize: '0.85rem', marginTop: '0.3rem' }}>{errors.idCard}</span>}
              </label>

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
        <Button to="/" kind="secondary">Back to home</Button>
        <Button to="/hackathon" kind="primary">Explore the hackathon</Button>
      </div>

      <div className="container detail-page__visual-row">
        <img src={sticker02} alt="" className="detail-page__sticker detail-page__sticker--small" />
      </div>
    </motion.section>
  )
}

export default Registration

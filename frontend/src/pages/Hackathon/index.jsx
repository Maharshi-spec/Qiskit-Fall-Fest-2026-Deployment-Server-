import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import Button from '../../components/Button'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'
import { hackathon } from '../../data/hackathon'
import sticker03 from '../../assets/qiskit/Sticker 03.svg'
import sticker04 from '../../assets/qiskit/Sticker 04.svg'

const hackathonSteps = [
  {
    title: 'Explore the challenge',
    text: 'Look at the problem space and think through how quantum ideas could be used in a practical context.',
  },
  {
    title: 'Build with Qiskit',
    text: 'Use Qiskit concepts, experimentation, and coding workflows to turn ideas into demonstrable exploration.',
  },
  {
    title: 'Collaborate and refine',
    text: 'Work with peers, share feedback, and improve the direction of your approach through hands-on iteration.',
  },
  {
    title: 'Share your results',
    text: 'Present your progress and learning outcomes to the broader event community in a clear, accessible way.',
  },
]

const Hackathon = () => {
  const { isLoggedIn, userRegistration, isLoading: authLoading, openLoginModal } = useAuth()
  const [team, setTeam] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showMembers, setShowMembers] = useState(true)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  const [teamName, setTeamName] = useState('')

  const initialMemberState = { email: '', fullName: '', collegeName: '', status: 'idle', error: '' }
  const [member2, setMember2] = useState(initialMemberState)
  const [member3, setMember3] = useState(initialMemberState)
  const [member4, setMember4] = useState(initialMemberState)

  const loadTeam = useCallback(async () => {
    const token = localStorage.getItem('qff_auth_token')
    if (!token) {
      setTeam(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await api.fetchMyTeam(token)
      if (res.success) {
        setTeam(res.data)
        setError(null)
      } else if (res.error?.code === 'REGISTRATION_NOT_FOUND' || res.error?.code === 'TEAM_NOT_FOUND' || res.error?.code === 'NOT_FOUND') {
        setTeam(null)
        setError(null)
      } else {
        setError(res.error?.message || 'Unable to load team details.')
      }
    } catch (err) {
      setError('Unable to connect to server.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authLoading) {
      if (isLoggedIn) {
        loadTeam()
      } else {
        setLoading(false)
        setTeam(null)
      }
    }
  }, [isLoggedIn, authLoading, loadTeam])

  const getMemberSetter = (key) => {
    if (key === 'member2') return setMember2
    if (key === 'member3') return setMember3
    if (key === 'member4') return setMember4
    return () => {}
  }

  const getMemberState = (key) => {
    if (key === 'member2') return member2
    if (key === 'member3') return member3
    if (key === 'member4') return member4
    return initialMemberState
  }

  const verifyTeammate = async (key, emailToVerify) => {
    const setter = getMemberSetter(key)
    const trimmed = (emailToVerify || '').trim()

    if (!trimmed) {
      setter({ email: '', fullName: '', collegeName: '', status: 'idle', error: '' })
      return true
    }

    // Check if adding self
    const myEmail = (userRegistration?.email || '').trim().toLowerCase()
    if (trimmed.toLowerCase() === myEmail) {
      setter({
        email: trimmed,
        fullName: '',
        collegeName: '',
        status: 'error',
        error: 'The Team Lead cannot add their own email again as a teammate.'
      })
      return false
    }

    // Check duplicate among member inputs
    const otherKeys = ['member2', 'member3', 'member4'].filter((k) => k !== key)
    const isDuplicate = otherKeys.some((k) => {
      const state = getMemberState(k)
      return state.email.trim().toLowerCase() === trimmed.toLowerCase()
    })

    if (isDuplicate) {
      setter({
        email: trimmed,
        fullName: '',
        collegeName: '',
        status: 'error',
        error: 'Do not allow the same participant to be added twice.'
      })
      return false
    }

    setter((prev) => ({ ...prev, email: trimmed, status: 'loading', error: '' }))

    const token = localStorage.getItem('qff_auth_token')
    try {
      const res = await api.verifyHackathonParticipant(token, trimmed)
      if (res.success && res.data) {
        setter({
          email: trimmed,
          fullName: res.data.fullName,
          collegeName: res.data.instituteName,
          status: 'verified',
          error: ''
        })
        return true
      } else {
        const msg = res.error?.message || 'Participant not found. All team members must be registered.'
        setter({
          email: trimmed,
          fullName: '',
          collegeName: '',
          status: 'error',
          error: msg
        })
        return false
      }
    } catch (err) {
      setter({
        email: trimmed,
        fullName: '',
        collegeName: '',
        status: 'error',
        error: 'Participant not found. All team members must be registered.'
      })
      return false
    }
  }

  const handleEmailChange = (key, value) => {
    const setter = getMemberSetter(key)
    if (!value.trim()) {
      setter({ email: value, fullName: '', collegeName: '', status: 'idle', error: '' })
    } else {
      setter((prev) => ({ ...prev, email: value, status: 'idle', error: '' }))
    }
  }

  const handleEmailBlur = (key) => {
    const state = getMemberState(key)
    if (state.email.trim()) {
      verifyTeammate(key, state.email)
    }
  }

  const handleCreateSubmit = async (e) => {
    e.preventDefault()

    if (!teamName.trim()) {
      setSubmitError('Team name is required.')
      return
    }

    const token = localStorage.getItem('qff_auth_token')
    if (!token) {
      setSubmitError('Authentication session expired. Please log in again.')
      return
    }

    // Verify all entered non-empty emails
    setIsSubmitting(true)
    setSubmitError(null)

    const memberKeys = ['member2', 'member3', 'member4']
    let allValid = true

    for (const key of memberKeys) {
      const mState = getMemberState(key)
      if (mState.email.trim()) {
        if (mState.status !== 'verified') {
          const isValid = await verifyTeammate(key, mState.email)
          if (!isValid) {
            allValid = false
          }
        }
      }
    }

    if (!allValid) {
      setSubmitError('Participant not found. All team members must be registered.')
      setIsSubmitting(false)
      return
    }

    const members = []
    if (member2.email.trim() && member2.status === 'verified') {
      members.push({ email: member2.email.trim() })
    }
    if (member3.email.trim() && member3.status === 'verified') {
      members.push({ email: member3.email.trim() })
    }
    if (member4.email.trim() && member4.status === 'verified') {
      members.push({ email: member4.email.trim() })
    }

    try {
      const res = await api.createTeam(token, { teamName: teamName.trim(), members })
      if (res.success && res.data) {
        setTeam(res.data)
        setIsCreateOpen(false)
        setTeamName('')
        setMember2(initialMemberState)
        setMember3(initialMemberState)
        setMember4(initialMemberState)
      } else {
        setSubmitError(res.error?.message || 'Unable to create hackathon team.')
      }
    } catch (err) {
      setSubmitError('An unexpected error occurred while creating team.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderMemberSection = (key, labelNumber) => {
    const mState = getMemberState(key)

    return (
      <div key={key} style={{ marginBottom: '1.75rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>MEMBER {labelNumber}</h3>
            <span
              style={{
                background: '#e9ecef',
                color: '#495057',
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '0.15rem 0.55rem',
                borderRadius: '10px',
              }}
            >
              OPTIONAL
            </span>
          </div>
          {mState.status === 'verified' && (
            <span style={{ color: '#2b8a3e', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              ✓ Registered participant
            </span>
          )}
          {mState.status === 'loading' && (
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
              Verifying...
            </span>
          )}
        </div>

        <div style={{ marginBottom: mState.status === 'verified' ? '1rem' : '0' }}>
          <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.85rem', fontWeight: 600 }}>
            Email
          </label>
          <input
            type="email"
            value={mState.email}
            onChange={(e) => handleEmailChange(key, e.target.value)}
            onBlur={() => handleEmailBlur(key)}
            placeholder="teammate@example.com"
            style={{
              width: '100%',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              border: mState.error ? '1px solid #ff6b6b' : '1px solid var(--color-border)',
              background: '#fff',
              fontSize: '0.95rem',
            }}
          />
          {mState.error && (
            <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.85rem', color: '#c92a2a', fontWeight: 500 }}>
              {mState.error}
            </p>
          )}
        </div>

        {mState.status === 'verified' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                Full Name
              </label>
              <input
                type="text"
                disabled
                readOnly
                value={mState.fullName}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  background: '#f8f9fa',
                  color: '#495057',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                College Name
              </label>
              <input
                type="text"
                disabled
                readOnly
                value={mState.collegeName}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  background: '#f8f9fa',
                  color: '#495057',
                }}
              />
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <motion.section className="detail-page" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="container detail-page__header">
        <div className="detail-page__intro">
          <p className="page-shell__eyebrow">Hackathon</p>
          <h1>Build something quantum.</h1>
          <p>{hackathon[0]?.description || 'Participants explore quantum computing through projects, experiment with Qiskit, and collaborate through practical problem solving.'}</p>
        </div>
        <div className="detail-page__visual">
          <img src={sticker04} alt="" className="detail-page__sticker" />
        </div>
      </div>

      <div className="container detail-page__grid detail-page__grid--four">
        {hackathonSteps.map((step, index) => (
          <div key={step.title} className="detail-card detail-card--feature">
            <p className="detail-card__eyebrow">0{index + 1}</p>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </div>
        ))}
      </div>

      {/* MY HACKATHON TEAM SECTION */}
      <div className="container detail-page__panel" style={{ marginTop: '2.5rem', marginBottom: '2.5rem' }}>
        <div className="detail-page__panel-copy" style={{ maxWidth: '100%', width: '100%' }}>
          <p className="page-shell__eyebrow">Team Management</p>
          <h2>MY HACKATHON TEAM</h2>

          {authLoading || loading ? (
            <div style={{ padding: '1.5rem 0' }}>
              <p>Loading team information...</p>
            </div>
          ) : !isLoggedIn ? (
            <div style={{ padding: '1rem 0' }}>
              <p>Please log in with your participant account to view or create your hackathon team.</p>
              <div style={{ marginTop: '1.25rem' }}>
                <Button kind="primary" onClick={openLoginModal}>Log In</Button>
              </div>
            </div>
          ) : error ? (
            <div style={{ padding: '1rem 0' }}>
              <p style={{ color: 'var(--color-primary-strong)' }}>{error}</p>
              <div style={{ marginTop: '1rem' }}>
                <Button kind="primary" onClick={loadTeam}>Retry</Button>
              </div>
            </div>
          ) : team ? (
            <div>
              <div className="detail-page__info-stack" style={{ marginBottom: '2rem', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                <div className="detail-info-item">
                  <span>Team Name</span>
                  <strong style={{ fontSize: '1.3rem' }}>{team.teamName}</strong>
                </div>
                <div className="detail-info-item">
                  <span>TEAM STATUS</span>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--color-primary-strong)', textTransform: 'uppercase' }}>
                    {team.status || 'ACTIVE'}
                  </strong>
                </div>
                <div className="detail-info-item">
                  <span>TEAM SIZE</span>
                  <strong>{team.members?.length || 0} / 4 MEMBERS</strong>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', marginTop: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', margin: 0 }}>TEAM MEMBERS</h3>
                <Button
                  kind="secondary"
                  onClick={() => setShowMembers((prev) => !prev)}
                  style={{ fontSize: '0.85rem', padding: '0.45rem 1rem' }}
                >
                  {showMembers ? 'Hide Team Members' : 'View Team Members'}
                </Button>
              </div>

              {showMembers && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                  {team.members?.map((member, idx) => (
                    <div
                      key={member.registrationId || member.email}
                      style={{
                        background: 'var(--color-surface-alt)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '1.25rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                          Member {idx + 1}
                        </p>
                        {member.isTeamLead && (
                          <span
                            style={{
                              background: 'var(--color-primary)',
                              color: '#fff',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              padding: '0.2rem 0.6rem',
                              borderRadius: '12px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                            }}
                          >
                            TEAM LEAD
                          </span>
                        )}
                      </div>
                      <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: 'var(--color-text)' }}>
                        {member.fullName || 'Registered Participant'}
                      </h4>
                      <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                        <strong>Email:</strong> {member.email}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                        <strong>College Name:</strong> {member.instituteName || 'N/A'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <p style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.25rem' }}>
                You haven't created a team yet.
              </p>
              <p style={{ margin: '0 0 0.75rem 0' }}>Create your team with up to 4 members.</p>

              {/* Informational notice per requirement #1 */}
              <div
                style={{
                  background: 'rgba(214, 51, 132, 0.06)',
                  border: '1px solid rgba(214, 51, 132, 0.25)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.85rem 1.1rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem',
                }}
              >
                <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--color-primary-strong)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>ℹ</span> All team members must be registered.
                </p>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                  Team size: 1–4 members
                </p>
              </div>

              {!isCreateOpen ? (
                <div style={{ marginTop: '1rem' }}>
                  <Button kind="primary" onClick={() => setIsCreateOpen(true)}>
                    Create Team
                  </Button>
                </div>
              ) : (
                <form
                  onSubmit={handleCreateSubmit}
                  style={{
                    marginTop: '1.5rem',
                    background: 'var(--color-surface-alt)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius)',
                    padding: '1.75rem',
                  }}
                >
                  {submitError && (
                    <div
                      style={{
                        background: '#fff0f3',
                        border: '1px solid #ffb3c1',
                        color: '#c92a2a',
                        padding: '0.85rem 1rem',
                        borderRadius: 'var(--radius-sm)',
                        marginBottom: '1.5rem',
                        fontSize: '0.95rem',
                      }}
                    >
                      {submitError}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.15rem', color: 'var(--color-primary-strong)', margin: 0 }}>
                      TEAM DETAILS
                    </h3>
                    <span
                      style={{
                        fontSize: '0.8rem',
                        background: 'var(--color-primary-soft)',
                        color: 'var(--color-primary-strong)',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontWeight: 600,
                      }}
                    >
                      Team size: 1–4 members
                    </span>
                  </div>

                  <div style={{ marginBottom: '1.75rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.9rem' }}>
                      Team Name <span style={{ color: 'red' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="e.g. Quantum Explorers"
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--color-border)',
                        background: '#fff',
                        fontSize: '1rem',
                      }}
                    />
                  </div>

                  {/* MEMBER 1 — TEAM LEAD */}
                  <div style={{ marginBottom: '1.75rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
                      <h3 style={{ fontSize: '1.1rem', margin: 0 }}>MEMBER 1</h3>
                      <span
                        style={{
                          background: 'var(--color-primary)',
                          color: '#fff',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.55rem',
                          borderRadius: '10px',
                          letterSpacing: '0.04em',
                        }}
                      >
                        TEAM LEAD
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                          Full Name
                        </label>
                        <input
                          type="text"
                          disabled
                          readOnly
                          value={userRegistration?.fullName || userRegistration?.full_name || ''}
                          style={{
                            width: '100%',
                            padding: '0.65rem 0.85rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--color-border)',
                            background: '#f8f9fa',
                            color: '#495057',
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                          Email
                        </label>
                        <input
                          type="email"
                          disabled
                          readOnly
                          value={userRegistration?.email || ''}
                          style={{
                            width: '100%',
                            padding: '0.65rem 0.85rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--color-border)',
                            background: '#f8f9fa',
                            color: '#495057',
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                          College Name
                        </label>
                        <input
                          type="text"
                          disabled
                          readOnly
                          value={userRegistration?.instituteName || userRegistration?.institute_name || ''}
                          style={{
                            width: '100%',
                            padding: '0.65rem 0.85rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--color-border)',
                            background: '#f8f9fa',
                            color: '#495057',
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* MEMBERS 2, 3, 4 */}
                  {renderMemberSection('member2', 2)}
                  {renderMemberSection('member3', 3)}
                  {renderMemberSection('member4', 4)}

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                    <Button kind="primary" type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Creating Team...' : 'Create Team'}
                    </Button>
                    <Button
                      kind="secondary"
                      type="button"
                      onClick={() => {
                        setIsCreateOpen(false)
                        setSubmitError(null)
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="container detail-page__panel detail-page__panel--split">
        <div className="detail-page__panel-copy">
          <p className="page-shell__eyebrow">What to expect</p>
          <h2>Practical quantum learning and collaborative building.</h2>
          <p>
            The hackathon experience is designed around experimentation, learning, and teamwork. Participants explore ideas in a flexible environment that encourages honest experimentation and guided discovery.
          </p>
        </div>

        <div className="detail-page__info-stack">
          <div className="detail-info-item">
            <span>Focus</span>
            <strong>Qiskit + quantum problem solving</strong>
          </div>
          <div className="detail-info-item">
            <span>Approach</span>
            <strong>Hands-on and collaborative</strong>
          </div>
          <div className="detail-info-item">
            <span>Status</span>
            <strong>Details coming soon</strong>
          </div>
        </div>
      </div>

      <div className="container detail-page__visual-row">
        <img src={sticker03} alt="" className="detail-page__sticker detail-page__sticker--small" />
      </div>

      <div className="container detail-page__cta-row">
        {!isLoggedIn && <Button to="/register" kind="primary">Register your interest</Button>}
        <Button to="/workshops" kind="secondary">Browse workshops</Button>
      </div>
    </motion.section>
  )
}

export default Hackathon

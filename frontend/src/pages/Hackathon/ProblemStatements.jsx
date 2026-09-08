import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '../../components/Button'
import { useAuth } from '../../context/AuthContext'
import { useEventProfile } from '../../context/EventProfileContext'
import { api } from '../../services/api'
import sticker03 from '../../assets/qiskit/Sticker 03.svg'

const ArrowLeft = ({ className = '', style = {} }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
)

const ArrowRight = ({ className = '', style = {} }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
)

const CheckCircle2 = ({ className = '', style = {} }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
)

const AlertTriangle = ({ className = '', style = {} }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)

const Users = ({ className = '', style = {} }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const Lock = ({ className = '', style = {} }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

const X = ({ className = '', style = {} }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const Sparkles = ({ className = '', style = {} }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
  </svg>
)

const ShieldAlert = ({ className = '', style = {} }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
)

const Loader2 = ({ className = '', style = {} }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ animation: 'spin 1s linear infinite', ...style }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
)

const FileText = ({ className = '', style = {} }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
)

const DownloadIcon = ({ className = '', style = {} }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)

const ExternalLink = ({ className = '', style = {} }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
)

const ProblemStatements = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryEventId = searchParams.get('eventId') || searchParams.get('event_id') || ''
  const { isLoggedIn, openLoginModal } = useAuth()
  const { getProfilePath } = useEventProfile()

  const [problems, setProblems] = useState([])
  const [team, setTeam] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Floating modal states
  const [activeModalProblem, setActiveModalProblem] = useState(null)
  const [isConfirming, setIsConfirming] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [selectionSuccess, setSelectionSuccess] = useState(null)
  const [lightboxImage, setLightboxImage] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    const token = localStorage.getItem('qff_auth_token')

    try {
      let teamData = null
      if (token) {
        const teamRes = await api.fetchMyTeam(token)
        if (teamRes?.success) {
          teamData = teamRes.data || null
          setTeam(teamData)
        }
      }

      const eventIdToUse = queryEventId || teamData?.eventId || teamData?.event_id || null
      const problemsRes = await api.fetchParticipantProblemStatements(token, eventIdToUse)

      if (problemsRes.success) {
        setProblems(problemsRes.data || [])
      } else {
        setError(problemsRes.error?.message || 'Unable to load problem statements.')
      }
    } catch (err) {
      setError('Unable to connect to the server. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }, [queryEventId])

  useEffect(() => {
    loadData()
  }, [loadData])

  // ESC key handler for modal & lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (lightboxImage) {
          setLightboxImage(null)
        } else if (activeModalProblem && !isSubmitting) {
          closeModal()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxImage, activeModalProblem, isSubmitting])

  const openProblemModal = (problem) => {
    setActiveModalProblem(problem)
    setIsConfirming(false)
    setSubmitError(null)
    setSelectionSuccess(null)
  }

  const closeModal = () => {
    if (isSubmitting) return
    setActiveModalProblem(null)
    setIsConfirming(false)
    setSubmitError(null)
    setSelectionSuccess(null)
  }

  const handleSelectConfirm = async () => {
    if (!activeModalProblem) return
    const token = localStorage.getItem('qff_auth_token')
    if (!token) {
      setSubmitError('Authentication expired. Please log in again.')
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const res = await api.selectProblemStatement(token, activeModalProblem.id)
      if (res.success && res.data) {
        setSelectionSuccess({
          problemTitle: activeModalProblem.title,
          selectedAt: res.data.selectedAt || new Date().toISOString(),
        })
        // Refresh team & problem data in background
        await loadData()
      } else {
        const code = res.error?.code
        let msg = res.error?.message || 'Failed to select problem statement.'
        if (code === 'ALREADY_SELECTED') {
          msg = 'Your team has already selected a problem statement.'
        } else if (code === 'PROBLEM_STATEMENT_FULL') {
          msg = 'This problem statement has just reached maximum capacity.'
        } else if (code === 'TEAM_NOT_FOUND') {
          msg = 'You must form or join a team before selecting a problem statement.'
        }
        setSubmitError(msg)
      }
    } catch (err) {
      setSubmitError('A network error occurred while submitting your selection.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Helper to determine problem status badge
  const getProblemStatus = (problem) => {
    if (problem.isFull) {
      return { label: 'FULL', color: '#e03131', bg: 'rgba(224, 49, 49, 0.1)', border: 'rgba(224, 49, 49, 0.25)' }
    }
    if (!problem.isUnlimited && problem.remainingCapacity !== null && problem.remainingCapacity <= 2 && problem.remainingCapacity > 0) {
      return { label: 'ALMOST FULL', color: '#f59f00', bg: 'rgba(245, 159, 0, 0.1)', border: 'rgba(245, 159, 0, 0.25)' }
    }
    if (problem.isUnlimited) {
      return { label: 'UNLIMITED', color: '#1098ad', bg: 'rgba(16, 152, 173, 0.1)', border: 'rgba(16, 152, 173, 0.25)' }
    }
    return { label: 'AVAILABLE', color: '#2b8a3e', bg: 'rgba(43, 138, 62, 0.1)', border: 'rgba(43, 138, 62, 0.25)' }
  }

  const teamHasSelection = Boolean(team?.problemSelection)
  const selectedProblemId = team?.problemSelection?.problemStatementId

  return (
    <motion.section
      className="detail-page"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      style={{ paddingBottom: '4rem' }}
    >
      <div className="container" style={{ marginBottom: '1.5rem', paddingTop: '1rem' }}>
        <Link
          to={getProfilePath('hackathon')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--color-primary-strong)',
            fontWeight: 600,
            fontSize: '0.92rem',
            textDecoration: 'none',
            padding: '0.4rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--color-primary-soft)',
          }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Hackathon
        </Link>
      </div>

      <div className="container detail-page__header">
        <div className="detail-page__intro">
          <p className="page-shell__eyebrow">Hackathon Challenge</p>
          <h1>Problem Statements</h1>
          <p>
            Explore the available quantum computing challenges for Qiskit Fall Fest 2026.
            Each team selects exactly one challenge to build, experiment, and present.
          </p>
        </div>
        <div className="detail-page__visual">
          <img src={sticker03} alt="" className="detail-page__sticker" />
        </div>
      </div>

      {/* PERMANENCE WARNING BANNER */}
      <div className="container" style={{ marginBottom: '2rem' }}>
        <div
          style={{
            background: teamHasSelection ? 'rgba(43, 138, 62, 0.08)' : 'rgba(214, 51, 132, 0.08)',
            border: teamHasSelection ? '1px solid rgba(43, 138, 62, 0.3)' : '1px solid rgba(214, 51, 132, 0.3)',
            borderRadius: 'var(--radius)',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem',
          }}
        >
          {teamHasSelection ? (
            <CheckCircle2 className="w-6 h-6" style={{ color: '#2b8a3e', flexShrink: 0, marginTop: '2px' }} />
          ) : (
            <ShieldAlert className="w-6 h-6" style={{ color: 'var(--color-primary-strong)', flexShrink: 0, marginTop: '2px' }} />
          )}
          <div>
            <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.05rem', color: teamHasSelection ? '#2b8a3e' : 'var(--color-primary-strong)' }}>
              {teamHasSelection ? "Your Team's Problem Statement is Locked" : 'Important Selection Rule'}
            </h3>
            <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--color-text)', lineHeight: 1.5 }}>
              {teamHasSelection ? (
                <>
                  Your team <strong>({team?.teamName})</strong> has selected{' '}
                  <strong>"{team.problemSelection.problemTitle}"</strong>. This selection is final and permanently locked.
                </>
              ) : (
                <>
                  You can select only <strong>ONE</strong> problem statement for your team. Once selected, it{' '}
                  <strong>CANNOT be changed, switched, or removed</strong>. Ensure your team agrees on the choice before confirming.
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* TEAM STATUS CHECK BANNER */}
      {!isLoggedIn ? (
        <div className="container" style={{ marginBottom: '2.5rem' }}>
          <div
            style={{
              background: 'var(--color-surface-alt)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              padding: '1.75rem',
              textAlign: 'center',
            }}
          >
            <Users className="w-8 h-8" style={{ color: 'var(--color-primary-strong)', margin: '0 auto 0.75rem auto' }} />
            <h3 style={{ margin: '0 0 0.5rem 0' }}>Log In Required</h3>
            <p style={{ margin: '0 0 1.25rem 0', color: 'var(--color-text-muted)' }}>
              Log in with your registered account to view your team's status and select a problem statement.
            </p>
            <Button kind="primary" onClick={openLoginModal}>
              Log In
            </Button>
          </div>
        </div>
      ) : !team ? (
        <div className="container" style={{ marginBottom: '2.5rem' }}>
          <div
            style={{
              background: '#fff9db',
              border: '1px solid #fcc419',
              borderRadius: 'var(--radius)',
              padding: '1.5rem',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <AlertTriangle className="w-6 h-6" style={{ color: '#e67700', flexShrink: 0 }} />
              <div>
                <p style={{ margin: 0, fontWeight: 700, color: '#e67700', fontSize: '1rem' }}>
                  Create or join a team before selecting a problem statement.
                </p>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.88rem', color: '#495057' }}>
                  Problem statements are selected at the team level. You must form a team of 1–4 members first.
                </p>
              </div>
            </div>
            <Link
              to={getProfilePath('hackathon')}
              style={{
                background: 'var(--color-primary)',
                color: '#fff',
                padding: '0.6rem 1.25rem',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                fontSize: '0.9rem',
                textDecoration: 'none',
              }}
            >
              Form Team →
            </Link>
          </div>
        </div>
      ) : teamHasSelection ? (
        /* PROMINENT SELECTED CARD FOR TEAM */
        <div className="container" style={{ marginBottom: '3rem' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(214, 51, 132, 0.04) 0%, rgba(214, 51, 132, 0.12) 100%)',
              border: '2px solid var(--color-primary)',
              borderRadius: 'var(--radius)',
              padding: '2rem',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <span
                  style={{
                    background: '#2b8a3e',
                    color: '#fff',
                    padding: '0.3rem 0.85rem',
                    borderRadius: '20px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  YOUR TEAM'S SELECTED PROBLEM STATEMENT
                </span>
                <p style={{ margin: '0.65rem 0 0.25rem 0', fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                  Team: {team.teamName}
                </p>
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                Selected on {new Date(team.problemSelection.selectedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            <h2 style={{ fontSize: '1.65rem', margin: '0 0 1rem 0', color: 'var(--color-text)' }}>
              {team.problemSelection.problemTitle}
            </h2>

            <p style={{ fontSize: '1rem', lineHeight: 1.6, color: 'var(--color-text)', whiteSpace: 'pre-wrap', marginBottom: '1.5rem' }}>
              {team.problemSelection.problemDescription}
            </p>

            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid rgba(214, 51, 132, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>
                <Lock className="w-4 h-4" />
                This selection is final and locked.
              </div>
              <Link
                to={getProfilePath('hackathon')}
                style={{
                  color: 'var(--color-primary-strong)',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  textDecoration: 'underline',
                }}
              >
                View My Team Dashboard →
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {/* PROBLEM STATEMENT CARDS GRID */}
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem' }}>
              {teamHasSelection ? 'All Challenges' : 'Available Challenges'}
            </h2>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
              {teamHasSelection
                ? 'All problem statements for the hackathon (browsing mode).'
                : 'Click any card to inspect full details and confirm your team selection.'}
            </p>
          </div>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-primary-strong)' }}>
            {problems.length} Challenges Available
          </span>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="detail-card"
                style={{
                  height: '240px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--color-surface-alt)',
                }}
              >
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-primary)' }} />
              </div>
            ))}
          </div>
        ) : error ? (
          <div
            style={{
              padding: '2rem',
              textAlign: 'center',
              background: '#fff0f3',
              border: '1px solid #ffb3c1',
              borderRadius: 'var(--radius)',
              color: '#c92a2a',
            }}
          >
            <p style={{ margin: '0 0 1rem 0', fontWeight: 600 }}>{error}</p>
            <Button kind="primary" onClick={loadData}>
              Try Again
            </Button>
          </div>
        ) : problems.length === 0 ? (
          <div
            style={{
              padding: '3rem 2rem',
              textAlign: 'center',
              background: 'var(--color-surface-alt)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
            }}
          >
            <Sparkles className="w-10 h-10" style={{ color: 'var(--color-primary)', margin: '0 auto 1rem auto' }} />
            <h3 style={{ margin: '0 0 0.5rem 0' }}>No problem statements are available yet.</h3>
            <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>
              The organizers are preparing the hackathon challenges. Please check back soon!
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1.75rem',
            }}
          >
            {problems.map((prob, idx) => {
              const status = getProblemStatus(prob)
              const isSelectedByMyTeam = teamHasSelection && String(prob.id) === String(selectedProblemId)
              const problemNumStr = String(prob.problemNumber || idx + 1).padStart(2, '0')

              return (
                <motion.div
                  key={prob.id}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  onClick={() => openProblemModal(prob)}
                  style={{
                    background: '#fff',
                    border: isSelectedByMyTeam ? '2px solid #2b8a3e' : '1px solid var(--color-border)',
                    borderRadius: 'var(--radius)',
                    padding: '1.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: isSelectedByMyTeam ? '0 8px 24px rgba(43, 138, 62, 0.15)' : '0 4px 16px rgba(0,0,0,0.03)',
                    position: 'relative',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span
                          style={{
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            letterSpacing: '0.08em',
                            color: 'var(--color-primary-strong)',
                          }}
                        >
                          PROBLEM {problemNumStr}
                        </span>
                        {Array.isArray(prob.attachments) && prob.attachments.length > 0 && (
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              color: '#1976d2',
                              background: 'rgba(33, 150, 243, 0.08)',
                              border: '1px solid rgba(33, 150, 243, 0.22)',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '10px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.2rem',
                            }}
                            title={`${prob.attachments.length} attached file(s)`}
                          >
                            📎 {prob.attachments.length} {prob.attachments.length === 1 ? 'file' : 'files'}
                          </span>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: status.color,
                          background: status.bg,
                          border: `1px solid ${status.border}`,
                          padding: '0.2rem 0.55rem',
                          borderRadius: '12px',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {status.label}
                      </span>
                    </div>

                    <h3
                      style={{
                        margin: '0 0 0.75rem 0',
                        fontSize: '1.2rem',
                        color: 'var(--color-text)',
                        lineHeight: 1.35,
                      }}
                    >
                      {prob.title}
                    </h3>

                    <p
                      style={{
                        margin: '0 0 1.25rem 0',
                        fontSize: '0.92rem',
                        color: 'var(--color-text-muted)',
                        lineHeight: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {prob.description}
                    </p>
                  </div>

                  <div>
                    {/* CAPACITY INDICATOR */}
                    <div
                      style={{
                        background: 'var(--color-surface-alt)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.75rem 0.9rem',
                        marginBottom: '1rem',
                        fontSize: '0.85rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <span style={{ color: 'var(--color-text-muted)' }}>Selected:</span>
                        <strong style={{ color: 'var(--color-text)' }}>
                          {prob.isUnlimited
                            ? `${prob.selectedTeams} teams`
                            : `${prob.selectedTeams} / ${prob.maxCapacity} teams`}
                        </strong>
                      </div>

                      {!prob.isUnlimited && (
                        <>
                          <div
                            style={{
                              width: '100%',
                              height: '5px',
                              background: '#e9ecef',
                              borderRadius: '3px',
                              overflow: 'hidden',
                              marginBottom: '0.35rem',
                            }}
                          >
                            <div
                              style={{
                                width: `${Math.min(100, Math.round((prob.selectedTeams / (prob.maxCapacity || 1)) * 100))}%`,
                                height: '100%',
                                background: prob.isFull ? '#e03131' : 'var(--color-primary)',
                                transition: 'width 0.3s ease',
                              }}
                            />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                            <span style={{ color: prob.isFull ? '#e03131' : 'var(--color-text-muted)' }}>
                              {prob.isFull ? 'No slots remaining' : `${prob.remainingCapacity} slots remaining`}
                            </span>
                          </div>
                        </>
                      )}

                      {prob.isUnlimited && (
                        <span style={{ fontSize: '0.8rem', color: '#1098ad', fontWeight: 500 }}>
                          ∞ Unlimited capacity
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span
                        style={{
                          fontSize: '0.88rem',
                          fontWeight: 600,
                          color: isSelectedByMyTeam ? '#2b8a3e' : 'var(--color-primary-strong)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        {isSelectedByMyTeam ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            Selected by your team
                          </>
                        ) : (
                          <>
                            View Problem <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* EXPANDED FLOATING MODAL (FRAMER MOTION) */}
      <AnimatePresence>
        {activeModalProblem && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(6px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
            }}
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#fff',
                borderRadius: 'var(--radius)',
                width: '100%',
                maxWidth: '680px',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '2.25rem',
                position: 'relative',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
              }}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={closeModal}
                disabled={isSubmitting}
                style={{
                  position: 'absolute',
                  top: '1.25rem',
                  right: '1.25rem',
                  background: '#f1f3f5',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  color: '#495057',
                }}
              >
                <X className="w-5 h-5" />
              </button>

              {selectionSuccess ? (
                /* SUCCESS STATE */
                <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: 'rgba(43, 138, 62, 0.12)',
                      color: '#2b8a3e',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 1.25rem auto',
                    }}
                  >
                    <CheckCircle2 className="w-9 h-9" />
                  </div>

                  <span
                    style={{
                      background: '#2b8a3e',
                      color: '#fff',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Problem Statement Selected
                  </span>

                  <h2 style={{ margin: '1rem 0 0.5rem 0', fontSize: '1.65rem' }}>
                    {selectionSuccess.problemTitle}
                  </h2>

                  <p style={{ color: '#2b8a3e', fontWeight: 600, margin: '0 0 1.25rem 0' }}>
                    Your team has successfully selected this problem statement.
                  </p>

                  <div
                    style={{
                      background: '#f8f9fa',
                      border: '1px solid #e9ecef',
                      borderRadius: 'var(--radius-sm)',
                      padding: '1rem',
                      marginBottom: '2rem',
                      fontSize: '0.92rem',
                      color: '#495057',
                      lineHeight: 1.5,
                    }}
                  >
                    🔒 <strong>This selection is final and cannot be changed.</strong>
                    <br />
                    All team members will now see this challenge on their hackathon dashboard.
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Button
                      kind="primary"
                      onClick={() => {
                        closeModal()
                        navigate(getProfilePath('hackathon'))
                      }}
                    >
                      View My Team
                    </Button>
                    <Button kind="secondary" onClick={closeModal}>
                      View Problem Statement
                    </Button>
                  </div>
                </div>
              ) : isConfirming ? (
                /* CONFIRMATION STEP */
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
                    <AlertTriangle className="w-6 h-6" style={{ color: '#e03131' }} />
                    <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#c92a2a' }}>
                      Are you sure?
                    </h2>
                  </div>

                  <p style={{ fontSize: '1.05rem', color: 'var(--color-text)', margin: '0 0 1rem 0' }}>
                    You are selecting:
                  </p>

                  <div
                    style={{
                      background: 'rgba(214, 51, 132, 0.05)',
                      border: '1px solid rgba(214, 51, 132, 0.25)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '1.25rem',
                      marginBottom: '1.5rem',
                    }}
                  >
                    <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.25rem', color: 'var(--color-primary-strong)' }}>
                      {activeModalProblem.title}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                      Capacity: {activeModalProblem.isUnlimited ? 'Unlimited' : `${activeModalProblem.maxCapacity} teams`}
                    </p>
                  </div>

                  <div
                    style={{
                      background: '#fff5f5',
                      border: '1px solid #ffc9c9',
                      borderRadius: 'var(--radius-sm)',
                      padding: '1.1rem',
                      color: '#c92a2a',
                      fontSize: '0.95rem',
                      lineHeight: 1.5,
                      marginBottom: '1.75rem',
                    }}
                  >
                    <strong>⚠️ CRITICAL PERMANENCE WARNING:</strong>
                    <br />
                    Once selected, your team <strong>CANNOT change, switch, or remove</strong> this problem statement under any circumstances.
                  </div>

                  {submitError && (
                    <div
                      style={{
                        background: '#ffe3e3',
                        border: '1px solid #ffa8a8',
                        color: '#c92a2a',
                        padding: '0.85rem 1rem',
                        borderRadius: 'var(--radius-sm)',
                        marginBottom: '1.25rem',
                        fontSize: '0.92rem',
                      }}
                    >
                      {submitError}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <Button
                      kind="secondary"
                      onClick={() => setIsConfirming(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      kind="primary"
                      onClick={handleSelectConfirm}
                      disabled={isSubmitting}
                      style={{ background: '#c92a2a', borderColor: '#c92a2a' }}
                    >
                      {isSubmitting ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Locking Selection...
                        </span>
                      ) : (
                        'Confirm Selection'
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                /* DETAIL VIEW (STEP 1) */
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <span
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        color: 'var(--color-primary-strong)',
                      }}
                    >
                      PROBLEM {String(activeModalProblem.problemNumber || 1).padStart(2, '0')}
                    </span>
                    {(() => {
                      const st = getProblemStatus(activeModalProblem)
                      return (
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: st.color,
                            background: st.bg,
                            border: `1px solid ${st.border}`,
                            padding: '0.2rem 0.6rem',
                            borderRadius: '12px',
                          }}
                        >
                          {st.label}
                        </span>
                      )
                    })()}
                  </div>

                  <h2 style={{ fontSize: '1.6rem', margin: '0 0 1.25rem 0', color: 'var(--color-text)', lineHeight: 1.3 }}>
                    {activeModalProblem.title}
                  </h2>

                  {/* CAPACITY HIGHLIGHT BOX */}
                  <div
                    style={{
                      background: 'var(--color-surface-alt)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '1.25rem',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                      gap: '1rem',
                      marginBottom: '1.75rem',
                    }}
                  >
                    <div>
                      <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.2rem' }}>
                        Selected Teams
                      </span>
                      <strong style={{ fontSize: '1.25rem' }}>{activeModalProblem.selectedTeams}</strong>
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.2rem' }}>
                        Capacity
                      </span>
                      <strong style={{ fontSize: '1.25rem' }}>
                        {activeModalProblem.isUnlimited ? '∞ Unlimited' : activeModalProblem.maxCapacity}
                      </strong>
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.2rem' }}>
                        Remaining Slots
                      </span>
                      <strong
                        style={{
                          fontSize: '1.25rem',
                          color: activeModalProblem.isFull ? '#e03131' : '#2b8a3e',
                        }}
                      >
                        {activeModalProblem.isUnlimited
                          ? 'Unlimited'
                          : activeModalProblem.isFull
                          ? 'FULL (0)'
                          : activeModalProblem.remainingCapacity}
                      </strong>
                    </div>
                  </div>

                  <div style={{ marginBottom: '2rem' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem', color: 'var(--color-text)' }}>
                      Challenge Description
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.98rem', lineHeight: 1.65, color: 'var(--color-text)', whiteSpace: 'pre-wrap' }}>
                      {activeModalProblem.description}
                    </p>
                  </div>

                  {/* PROBLEM SUPPORTING FILES */}
                  {Array.isArray(activeModalProblem.attachments) && activeModalProblem.attachments.length > 0 && (
                    <div style={{ marginBottom: '2rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--color-text)' }}>
                          Supporting Files & Resources
                        </h4>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                          {activeModalProblem.attachments.length} {activeModalProblem.attachments.length === 1 ? 'attachment' : 'attachments'}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gap: '0.75rem' }}>
                        {activeModalProblem.attachments.map((file) => {
                          const isPdf = file.mimeType === 'application/pdf' || file.originalFilename?.toLowerCase().endsWith('.pdf')
                          const isImage = file.mimeType?.startsWith('image/') || !isPdf
                          const sizeKb = Math.round((file.fileSize || 0) / 1024)
                          const sizeStr = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`
                          const userToken = localStorage.getItem('qff_auth_token') || ''
                          const fileViewUrl = file.viewUrl ? `${file.viewUrl}?token=${encodeURIComponent(userToken)}` : '#'
                          const fileDownloadUrl = file.downloadUrl ? `${file.downloadUrl}?token=${encodeURIComponent(userToken)}` : '#'

                          return (
                            <div
                              key={file.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.85rem 1rem',
                                background: 'var(--color-surface-alt)',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-sm)',
                                flexWrap: 'wrap',
                                gap: '0.75rem',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flex: '1 1 200px' }}>
                                {isImage ? (
                                  <div
                                    style={{
                                      width: '42px',
                                      height: '42px',
                                      borderRadius: '8px',
                                      overflow: 'hidden',
                                      background: '#f1f3f5',
                                      flexShrink: 0,
                                      cursor: 'pointer',
                                      border: '1px solid rgba(0,0,0,0.08)',
                                    }}
                                    onClick={() => setLightboxImage({ url: fileViewUrl, filename: file.originalFilename, downloadUrl: fileDownloadUrl })}
                                    title="Click to zoom image"
                                  >
                                    <img
                                      src={fileViewUrl}
                                      alt={file.originalFilename}
                                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                      onError={(e) => {
                                        e.target.style.display = 'none'
                                        e.target.parentNode.textContent = '🖼️'
                                      }}
                                    />
                                  </div>
                                ) : (
                                  <div
                                    style={{
                                      width: '42px',
                                      height: '42px',
                                      borderRadius: '8px',
                                      background: 'rgba(214, 51, 132, 0.08)',
                                      color: 'var(--color-primary-strong)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      flexShrink: 0,
                                    }}
                                  >
                                    <FileText className="w-5 h-5" />
                                  </div>
                                )}

                                <div style={{ minWidth: 0 }}>
                                  <div
                                    style={{
                                      fontWeight: 600,
                                      color: 'var(--color-text)',
                                      fontSize: '0.92rem',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                    }}
                                    title={file.originalFilename}
                                  >
                                    {file.originalFilename}
                                  </div>
                                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                                    {isPdf ? 'PDF Document' : 'Image Asset'} • {sizeStr}
                                  </div>
                                </div>
                              </div>

                              {/* Action buttons */}
                              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                {isImage ? (
                                  <button
                                    type="button"
                                    onClick={() => setLightboxImage({ url: fileViewUrl, filename: file.originalFilename, downloadUrl: fileDownloadUrl })}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.35rem',
                                      background: '#fff',
                                      border: '1px solid var(--color-border)',
                                      borderRadius: '8px',
                                      padding: '0.35rem 0.65rem',
                                      fontSize: '0.82rem',
                                      fontWeight: 600,
                                      color: 'var(--color-text)',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    🔍 Preview
                                  </button>
                                ) : (
                                  <a
                                    href={fileViewUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.35rem',
                                      background: '#fff',
                                      border: '1px solid var(--color-border)',
                                      borderRadius: '8px',
                                      padding: '0.35rem 0.65rem',
                                      fontSize: '0.82rem',
                                      fontWeight: 600,
                                      color: 'var(--color-text)',
                                      textDecoration: 'none',
                                    }}
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    View PDF
                                  </a>
                                )}

                                <a
                                  href={fileDownloadUrl}
                                  download={file.originalFilename}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    background: 'var(--color-primary-soft, rgba(214, 51, 132, 0.08))',
                                    border: '1px solid rgba(214, 51, 132, 0.25)',
                                    borderRadius: '8px',
                                    padding: '0.35rem 0.65rem',
                                    fontSize: '0.82rem',
                                    fontWeight: 600,
                                    color: 'var(--color-primary-strong)',
                                    textDecoration: 'none',
                                  }}
                                  title={`Download ${file.originalFilename}`}
                                >
                                  <DownloadIcon className="w-3.5 h-3.5" />
                                  Download
                                </a>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Permanence Alert Callout */}
                  <div
                    style={{
                      background: 'rgba(214, 51, 132, 0.06)',
                      border: '1px solid rgba(214, 51, 132, 0.2)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.9rem 1.1rem',
                      marginBottom: '1.75rem',
                      fontSize: '0.88rem',
                      color: 'var(--color-text)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                    }}
                  >
                    <ShieldAlert className="w-5 h-5" style={{ color: 'var(--color-primary-strong)', flexShrink: 0 }} />
                    <span>
                      <strong>Permanent Selection:</strong> Once confirmed, this selection cannot be changed for your team.
                    </span>
                  </div>

                  {submitError && (
                    <div
                      style={{
                        background: '#ffe3e3',
                        border: '1px solid #ffa8a8',
                        color: '#c92a2a',
                        padding: '0.85rem 1rem',
                        borderRadius: 'var(--radius-sm)',
                        marginBottom: '1.5rem',
                        fontSize: '0.92rem',
                      }}
                    >
                      {submitError}
                    </div>
                  )}

                  {/* ACTION BUTTONS */}
                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <Button kind="secondary" onClick={closeModal}>
                      Close
                    </Button>

                    {!isLoggedIn ? (
                      <Button kind="primary" onClick={openLoginModal}>
                        Log In to Select
                      </Button>
                    ) : !team ? (
                      <Button
                        kind="primary"
                        onClick={() => {
                          closeModal()
                          navigate(getProfilePath('hackathon'))
                        }}
                      >
                        Create Team First
                      </Button>
                    ) : teamHasSelection ? (
                      <button
                        type="button"
                        disabled
                        style={{
                          background: '#e9ecef',
                          color: '#868e96',
                          border: '1px solid #dee2e6',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.65rem 1.25rem',
                          fontWeight: 600,
                          cursor: 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                        }}
                      >
                        <Lock className="w-4 h-4" />
                        Team Already Has Selected Problem
                      </button>
                    ) : activeModalProblem.isFull ? (
                      <button
                        type="button"
                        disabled
                        style={{
                          background: '#f8d7da',
                          color: '#721c24',
                          border: '1px solid #f5c6cb',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.65rem 1.25rem',
                          fontWeight: 600,
                          cursor: 'not-allowed',
                        }}
                      >
                        Problem Statement Full
                      </button>
                    ) : (
                      <Button kind="primary" onClick={() => setIsConfirming(true)}>
                        Select Problem Statement
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* IMAGE LIGHTBOX MODAL */}
      <AnimatePresence>
        {lightboxImage && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 110,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem',
            }}
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLightboxImage(null)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(15, 10, 25, 0.88)',
                backdropFilter: 'blur(8px)',
              }}
            />

            {/* Lightbox Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{
                position: 'relative',
                zIndex: 111,
                maxWidth: '90vw',
                maxHeight: '88vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: '#1a1424',
                borderRadius: '16px',
                padding: '1.25rem',
                border: '1px solid rgba(255, 79, 163, 0.3)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Lightbox Header Bar */}
              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem',
                  gap: '1rem',
                }}
              >
                <div style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {lightboxImage.filename}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                  <a
                    href={lightboxImage.downloadUrl}
                    download={lightboxImage.filename}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      background: 'rgba(255, 79, 163, 0.2)',
                      border: '1px solid rgba(255, 79, 163, 0.4)',
                      borderRadius: '8px',
                      padding: '0.35rem 0.75rem',
                      color: '#ff80bf',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    <DownloadIcon className="w-3.5 h-3.5" />
                    Download
                  </a>
                  <button
                    type="button"
                    onClick={() => setLightboxImage(null)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.12)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      cursor: 'pointer',
                      fontSize: '1.2rem',
                    }}
                    title="Close preview (Esc)"
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Lightbox Image View */}
              <div
                style={{
                  width: '100%',
                  maxHeight: 'calc(88vh - 80px)',
                  overflow: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={lightboxImage.url}
                  alt={lightboxImage.filename}
                  style={{
                    maxWidth: '100%',
                    maxHeight: 'calc(88vh - 90px)',
                    objectFit: 'contain',
                    borderRadius: '8px',
                  }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.section>
  )
}

export default ProblemStatements

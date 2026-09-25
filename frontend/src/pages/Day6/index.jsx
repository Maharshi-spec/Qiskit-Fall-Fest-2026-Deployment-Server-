import { useEffect, useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Button from '../../components/Button'
import { useEventProfile } from '../../context/EventProfileContext'
import { postQiskitProgramDays } from '../../data/program'
import sticker06 from '../../assets/qiskit/Sticker 06.svg'

const Day6 = () => {
  const { profile } = useParams()
  const { getProfilePath, activeProfile } = useEventProfile()
  const isPostQiskit = profile === 'post-qiskit' || activeProfile === 'post-qiskit'

  // Safety guard: Day 6 only exists in Post-Qiskit
  if (!isPostQiskit) {
    return <Navigate to="/pre-qiskit/day-4" replace />
  }

  const day = postQiskitProgramDays[5]
  const [expandedId, setExpandedId] = useState(day?.sessions[0]?.id || null)

  useEffect(() => {
    setExpandedId(day?.sessions[0]?.id || null)
  }, [day])

  return (
    <motion.section
      className="detail-page day-page day6-page"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="container detail-page__header">
        <div className="detail-page__intro">
          <p className="page-shell__eyebrow">DAY 6 — 10 OCTOBER 2026</p>
          <h1>{day?.title || 'Venkat Swamy Tadikonda, Best Presentations, Prizes & Conclusion Address'}</h1>
          <p>
            {day?.description ||
              'Venkat Swamy Tadikonda session, Hackathon Best Presentations, Awards Distribution, Conclusion Address.'}
          </p>
        </div>
        <div className="detail-page__visual">
          <img src={sticker06} alt="" className="detail-page__sticker" />
        </div>
      </div>

      <div className="container day-schedule-container">
        <div className="day-schedule-header">
          <div>
            <p className="page-shell__eyebrow">Day 6 Schedule</p>
            <h2>Official Timetable</h2>
          </div>
          <span className="day-schedule-badge">
            {day?.sessions?.length || 5} Sessions
          </span>
        </div>

        <div className="detail-page__session-shell">
          {day?.sessions?.map((session) => {
            const isExpanded = expandedId === session.id
            return (
              <article
                key={session.id}
                className={`program-session ${isExpanded ? 'program-session--expanded' : ''}`}
              >
                <button
                  type="button"
                  className="program-session__toggle"
                  onClick={() => setExpandedId((current) => (current === session.id ? null : session.id))}
                  aria-expanded={isExpanded}
                >
                  <div className="program-session__row">
                    <span className="program-session__time">{session.time}</span>
                    <span className="program-session__type">{session.type}</span>
                  </div>
                  <div className="program-session__heading-row">
                    <h4>{session.title}</h4>
                    <span className="program-session__expand" aria-hidden="true">
                      {isExpanded ? '−' : '+'}
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="program-session__content">
                    <p>{session.description}</p>
                    {session.points && session.points.length > 0 && (
                      <ul>
                        {session.points.map((point) => (
                          <li key={point}>{point}</li>
                        ))}
                      </ul>
                    )}
                    <div className="program-session__meta">
                      {session.speaker && <span><strong>Speaker:</strong> {session.speaker}</span>}
                      {session.location && <span><strong>Location:</strong> {session.location}</span>}
                      {session.duration && <span><strong>Duration:</strong> {session.duration}</span>}
                    </div>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </div>

      <div className="container detail-page__cta-row">
        <Button to={getProfilePath('day-5')} kind="secondary">← Day 5</Button>
        <Button to={getProfilePath('certificates')} kind="primary">Explore Certificates →</Button>
      </div>
    </motion.section>
  )
}

export default Day6

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Button from '../../components/Button'
import { useEventProfile } from '../../context/EventProfileContext'
import { programDays, postQiskitProgramDays } from '../../data/program'
import sticker07 from '../../assets/qiskit/Sticker 07.svg'

const Day1 = () => {
  const { getProfilePath, activeProfile } = useEventProfile()
  const isPostQiskit = activeProfile === 'post-qiskit'
  const day = isPostQiskit ? postQiskitProgramDays[0] : programDays[0]
  const [expandedId, setExpandedId] = useState(day?.sessions[0]?.id || null)

  useEffect(() => {
    setExpandedId(day?.sessions[0]?.id || null)
  }, [day])

  return (
    <motion.section
      className="detail-page day-page day1-page"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="container detail-page__header">
        <div className="detail-page__intro">
          <p className="page-shell__eyebrow">
            {isPostQiskit ? 'DAY 1 — 5 OCTOBER 2026' : 'DAY 1 · BOOTCAMP — SEPTEMBER 7, 2026'}
          </p>
          <h1>{day?.title || (isPostQiskit ? 'Welcoming the guests to the dias and Lamp Lighting Ceremony' : 'Start with the fundamentals.')}</h1>
          <p>
            {day?.description ||
              (isPostQiskit
                ? 'Welcoming the guests, addresses by dignitaries, and technical sessions.'
                : 'A beginner-friendly deep dive into quantum computing, qubits, superposition, quantum circuits, and getting started with Qiskit.')}
          </p>
        </div>
        <div className="detail-page__visual">
          <img src={sticker07} alt="" className="detail-page__sticker" />
        </div>
      </div>

      <div className="container day-schedule-container">

        <div className="day-schedule-header">
          <div>
            <p className="page-shell__eyebrow">Day 1 Schedule</p>
            <h2>{isPostQiskit ? 'Official Timetable' : 'Bootcamp Timetable'}</h2>
          </div>
          <span className="day-schedule-badge">
            {isPostQiskit ? `${day?.sessions?.length || 9} Sessions` : '5 Sessions · Main Auditorium & Labs'}
          </span>
        </div>

        <div className="detail-page__session-shell">
          {day?.sessions.map((session) => {
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
        <Button to={getProfilePath('')} kind="secondary">← Back to Home</Button>
        <Button to={getProfilePath('day-2')} kind="primary">
          {isPostQiskit ? 'Next: Day 2 →' : 'Next: Day 2 Hackathon →'}
        </Button>
      </div>
    </motion.section>
  )
}

export default Day1

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Button from '../../components/Button'
import { useEventProfile } from '../../context/EventProfileContext'
import { programDays } from '../../data/program'
import sticker08 from '../../assets/qiskit/Sticker 08.svg'

const Day2 = () => {
  const { getProfilePath } = useEventProfile()
  const day = programDays[1]
  const [expandedId, setExpandedId] = useState(day?.sessions[0]?.id || null)

  useEffect(() => {
    setExpandedId(day?.sessions[0]?.id || null)
  }, [day])

  return (
    <motion.section
      className="detail-page day-page day2-page"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="container detail-page__header">
        <div className="detail-page__intro">
          <p className="page-shell__eyebrow">DAY 2 · HACKATHON — SEPTEMBER 8, 2026</p>
          <h1>{day?.title || 'Experiment and build.'}</h1>
          <p>
            {day?.description ||
              'The hackathon begins. Form teams, brainstorm problem statements, start building quantum projects, and experiment with quantum algorithms.'}
          </p>
        </div>
        <div className="detail-page__visual">
          <img src={sticker08} alt="" className="detail-page__sticker" />
        </div>
      </div>

      <div className="container day-context-banner">

        <div className="day-context-banner__content">
          <span className="day-context-banner__badge">Hackathon Day 1 of 2</span>
          <h3>Form teams &amp; start building in Qiskit</h3>
          <p>
            Day 2 kicks off the two-day hackathon sprint. Teams scope problem statements, consult technical mentors, and write core quantum algorithms.
          </p>
        </div>
        <Button to={getProfilePath('hackathon')} kind="primary">My Hackathon Team →</Button>
      </div>

      <div className="container day-schedule-container">
        <div className="day-schedule-header">
          <div>
            <p className="page-shell__eyebrow">Day 2 Schedule</p>
            <h2>Hackathon Timetable</h2>
          </div>
          <span className="day-schedule-badge">5 Sessions · Hacking Sprints &amp; Mentorship</span>
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
        <Button to={getProfilePath('day-1')} kind="secondary">← Day 1 Bootcamp</Button>
        <Button to={getProfilePath('day-3')} kind="primary">Next: Day 3 Hackathon →</Button>
      </div>
    </motion.section>
  )
}

export default Day2

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Button from '../../components/Button'
import { useEventProfile } from '../../context/EventProfileContext'
import { programDays } from '../../data/program'
import sticker09 from '../../assets/qiskit/Sticker 09.svg'

const Day3 = () => {
  const { getProfilePath } = useEventProfile()
  const day = programDays[2]
  const [expandedId, setExpandedId] = useState(day?.sessions[0]?.id || null)

  useEffect(() => {
    setExpandedId(day?.sessions[0]?.id || null)
  }, [day])

  return (
    <motion.section
      className="detail-page day-page day3-page"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="container detail-page__header">
        <div className="detail-page__intro">
          <p className="page-shell__eyebrow">DAY 3 · HACKATHON — SEPTEMBER 9, 2026</p>
          <h1>{day?.title || 'Build, test, and collaborate.'}</h1>
          <p>
            {day?.description ||
              'Intensive building day. Finalize project implementations, run circuits on quantum simulators, test code, collaborate with mentors, and prepare project showcase submissions.'}
          </p>
        </div>
        <div className="detail-page__visual">
          <img src={sticker09} alt="" className="detail-page__sticker" />
        </div>
      </div>

      <div className="container day-context-banner">

        <div className="day-context-banner__content">
          <span className="day-context-banner__badge">Hackathon Day 2 of 2</span>
          <h3>Final development sprint &amp; submission prep</h3>
          <p>
            Day 3 is the intensive building day. Teams execute circuits across quantum simulators, benchmark algorithm accuracy, and finalize showcase deliverables.
          </p>
        </div>
        <Button to={getProfilePath('hackathon/problem-statements')} kind="primary">Select Problem Statement →</Button>
      </div>

      <div className="container day-schedule-container">
        <div className="day-schedule-header">
          <div>
            <p className="page-shell__eyebrow">Day 3 Schedule</p>
            <h2>Hackathon Timetable</h2>
          </div>
          <span className="day-schedule-badge">5 Sessions · Build Sprint &amp; Final Prep</span>
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
        <Button to={getProfilePath('day-2')} kind="secondary">← Day 2 Hackathon</Button>
        <Button to={getProfilePath('day-4')} kind="primary">Next: Day 4 Workshop &amp; Webinar →</Button>
      </div>
    </motion.section>
  )
}

export default Day3

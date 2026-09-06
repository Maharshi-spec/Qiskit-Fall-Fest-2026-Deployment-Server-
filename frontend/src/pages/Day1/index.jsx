import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { programDays } from '../../data/program'
import sticker07 from '../../assets/qiskit/Sticker 07.svg'

const Day1 = () => {
  const day = programDays[0]
  const [expandedId, setExpandedId] = useState(day?.sessions[0]?.id || null)

  useEffect(() => {
    setExpandedId(day?.sessions[0]?.id || null)
  }, [day])

  return (
    <motion.section className="detail-page" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="container detail-page__header">
        <div className="detail-page__intro">
          <p className="page-shell__eyebrow">Day 1</p>
          <h1>Start with the fundamentals.</h1>
          <p>{day?.description || 'A guided introduction to quantum concepts and Qiskit fundamentals.'}</p>
        </div>
        <div className="detail-page__visual">
          <img src={sticker07} alt="" className="detail-page__sticker" />
        </div>
      </div>

      <div className="container detail-page__meta-bar">
        <Link to="/" className="page-inline-link">← Home</Link>
        <Link to="/day-2" className="page-inline-link">Next day →</Link>
      </div>

      <div className="container detail-page__session-shell">
        {day?.sessions.map((session) => (
          <article key={session.id} className={`program-session ${expandedId === session.id ? 'program-session--expanded' : ''}`}>
            <button type="button" className="program-session__toggle" onClick={() => setExpandedId((current) => (current === session.id ? null : session.id))} aria-expanded={expandedId === session.id}>
              <div className="program-session__row">
                <span className="program-session__time">{session.time}</span>
                <span className="program-session__type">{session.type}</span>
              </div>
              <div className="program-session__heading-row">
                <h4>{session.title}</h4>
                <span className="program-session__expand">{expandedId === session.id ? '−' : '+'}</span>
              </div>
            </button>

            {expandedId === session.id && (
              <div className="program-session__content">
                <p>{session.description}</p>
                <ul>
                  {session.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
                <div className="program-session__meta">
                  {session.speaker && <span>Speaker: {session.speaker}</span>}
                  {session.location && <span>Location: {session.location}</span>}
                  {session.duration && <span>Duration: {session.duration}</span>}
                </div>
              </div>
            )}
          </article>
        ))}
      </div>
    </motion.section>
  )
}

export default Day1

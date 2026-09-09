import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { programDays } from '../../data/program'
import sticker01 from '../../assets/qiskit/Sticker 01.svg'
import sticker03 from '../../assets/qiskit/Sticker 03.svg'
import sticker05 from '../../assets/qiskit/Sticker 05.svg'
import sticker07 from '../../assets/qiskit/Sticker 07.svg'

const showcaseProjects = [
  { number: '01', title: 'Quantum Maze Solver', description: 'An interactive quantum-inspired approach to solving maze exploration problems.', sticker: sticker03 },
  { number: '02', title: 'Qubit Visualizer', description: 'A visual playground for exploring quantum states and measurement probabilities.', sticker: sticker05 },
  { number: '03', title: 'Quantum Image Lab', description: 'An experimental project exploring image transformations using quantum concepts.', sticker: sticker07 },
  { number: '04', title: 'Circuit Playground', description: 'A beginner-friendly environment for experimenting with quantum gates and circuits.', sticker: sticker01 },
]

const communityFeatures = [
  { label: 'Learn', text: 'Carry your quantum knowledge forward.' },
  { label: 'Build', text: 'Turn experiments into real projects.' },
  { label: 'Connect', text: 'Keep the community growing beyond the festival.' },
]

const awards = ['Best Quantum Project', 'Most Creative Idea', 'Best Beginner Build', 'Community Champion']

const Day4Schedule = ({ sessions = [] }) => {
  const [expandedId, setExpandedId] = useState(sessions[0]?.id || null)

  return (
    <div className="day4-schedule">
      {sessions.map((session) => (
        <article key={session.id} className={`program-session ${expandedId === session.id ? 'program-session--expanded' : ''}`}>
          <button
            type="button"
            className="program-session__toggle"
            onClick={() => setExpandedId((current) => (current === session.id ? null : session.id))}
            aria-expanded={expandedId === session.id}
          >
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
              {session.points && session.points.length > 0 && (
                <ul>
                  {session.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              )}
              {(session.speaker || session.location || session.duration) && (
                <div className="program-session__meta">
                  {session.speaker && <span>Speaker: {session.speaker}</span>}
                  {session.location && <span>Location: {session.location}</span>}
                  {session.duration && <span>Duration: {session.duration}</span>}
                </div>
              )}
            </div>
          )}
        </article>
      ))}
    </div>
  )
}

const ShowcaseCard = ({ project }) => (
  <article className="day4-showcase-card">
    <div className="day4-showcase-card__topline">
      <span>{project.number}</span>
      <img src={project.sticker} alt="" aria-hidden="true" />
    </div>
    <h3>{project.title}</h3>
    <p>{project.description}</p>
    <button type="button" className="day4-card-action">Explore <span aria-hidden="true">→</span></button>
  </article>
)

const Day4 = () => {
  const day = programDays[3]

  return (
    <motion.main className="detail-page day4-page" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="container detail-page__header day4-hero">
        <div className="detail-page__intro">
          <p className="page-shell__eyebrow">{day?.label || 'DAY 4 · WORKSHOP & WEBINAR'} — {day?.date || 'September 10, 2026'}</p>
          <h1>{day?.title || 'Build. Showcase. Celebrate.'}</h1>
          <p>{day?.description || 'Hands-on workshops, webinars, expert demonstrations, team project presentations, community demos, and closing ceremony with winners announced.'}</p>
        </div>
        <div className="detail-page__visual day4-hero__visual">
          <img src={sticker01} alt="" className="detail-page__sticker" />
        </div>
      </div>

      <div className="container detail-page__meta-bar">
        <Link to="/day-3" className="page-inline-link">← Previous day (Day 3)</Link>
        <Link to="/certificates" className="page-inline-link">Certificates →</Link>
      </div>

      <section className="container day4-section">
        <div className="day4-section__heading">
          <p className="page-shell__eyebrow">The Program Schedule</p>
          <h2>Bring it all together.</h2>
          <p>{day?.description}</p>
        </div>
        <Day4Schedule sessions={day?.sessions || []} />
      </section>

      <section className="container day4-section day4-section--showcase">
        <div className="day4-section__heading">
          <p className="page-shell__eyebrow">Project Showcase</p>
          <h2>Explore what participants built.</h2>
        </div>
        <div className="day4-showcase-grid">
          {showcaseProjects.map((project) => <ShowcaseCard key={project.number} project={project} />)}
        </div>
      </section>

      <section className="day4-band">
        <div className="container day4-section day4-community">
          <div className="day4-section__heading">
            <p className="page-shell__eyebrow">Community</p>
            <h2>One Community. Many Ideas.</h2>
            <img src={sticker05} alt="" aria-hidden="true" className="day4-community__sticker" />
            <p>Participants, mentors, speakers, organizers, and builders come together to keep quantum curiosity moving forward.</p>
          </div>
          <div className="day4-feature-grid">
            {communityFeatures.map((feature) => (
              <article key={feature.label} className="day4-feature-card">
                <span>{feature.label}</span>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="container day4-section day4-awards">
        <div className="day4-section__heading">
          <p className="page-shell__eyebrow">Frontend Mock Categories</p>
          <h2>Recognition &amp; Awards</h2>
          <p>Celebrating the ideas and people that make the quantum community stronger.</p>
        </div>
        <div className="day4-awards-grid">
          {awards.map((award, index) => (
            <article key={award} className="day4-award-card">
              <img src={index % 2 === 0 ? sticker05 : sticker07} alt="" aria-hidden="true" />
              <span>0{index + 1}</span>
              <h3>{award}</h3>
            </article>
          ))}
        </div>
      </section>

      <section className="container day4-final-cta">
        <img src={sticker03} alt="" aria-hidden="true" />
        <div>
          <p className="page-shell__eyebrow">Keep the momentum</p>
          <h2>Keep Building Quantum</h2>
          <p>The festival may end, but the ideas keep going.</p>
        </div>
        <div className="day4-final-cta__actions">
          <Link to="/certificates" className="button button--primary">Explore Certificates</Link>
          <Link to="/day-1" className="button button--secondary">Back to Day 1</Link>
        </div>
      </section>
    </motion.main>
  )
}

export default Day4
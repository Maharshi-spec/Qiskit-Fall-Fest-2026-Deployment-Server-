import { useState } from 'react'
import { motion } from 'framer-motion'
import Button from '../../components/Button'
import { useEventProfile } from '../../context/EventProfileContext'
import { programDays, postQiskitProgramDays } from '../../data/program'
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
      {sessions.map((session) => {
        const isExpanded = expandedId === session.id
        return (
          <article key={session.id} className={`program-session ${isExpanded ? 'program-session--expanded' : ''}`}>
            <button
              type="button"
              className="program-session__toggle"
              onClick={() => setExpandedId(isExpanded ? null : session.id)}
              aria-expanded={isExpanded}
            >
              <div className="program-session__row">
                <span className="program-session__time">{session.time}</span>
                <span className="program-session__type">{session.type}</span>
              </div>
              <div className="program-session__heading-row">
                <h4>{session.title}</h4>
                <span className="program-session__expand" aria-hidden="true">{isExpanded ? '−' : '+'}</span>
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
                {(session.speaker || session.location || session.duration) && (
                  <div className="program-session__meta">
                    {session.speaker && <span><strong>Speaker:</strong> {session.speaker}</span>}
                    {session.location && <span><strong>Location:</strong> {session.location}</span>}
                    {session.duration && <span><strong>Duration:</strong> {session.duration}</span>}
                  </div>
                )}
              </div>
            )}
          </article>
        )
      })}
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
  </article>
)

const Day4 = () => {
  const { getProfilePath, isRegistrationOpen, activeProfile } = useEventProfile()
  const isPostQiskit = activeProfile === 'post-qiskit'
  const day = isPostQiskit ? postQiskitProgramDays[3] : programDays[3]

  return (
    <motion.section className="detail-page day-page day4-page" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="container detail-page__header day4-hero">
        <div className="detail-page__intro">
          <p className="page-shell__eyebrow">
            {isPostQiskit ? 'DAY 4 — 8 OCTOBER 2026' : 'DAY 4 · WORKSHOP & WEBINAR — SEPTEMBER 10, 2026'}
          </p>
          <h1>{day?.title || (isPostQiskit ? 'Fun Event, Quiz & Invited Expert Sessions' : 'Build. Showcase. Celebrate.')}</h1>
          <p>
            {day?.description ||
              (isPostQiskit
                ? 'Fun Event - I, Quiz - I, Dr. Shyamapada Mukherjee session, Kiran Kaur Raina session.'
                : 'Hands-on workshops, webinars, expert demonstrations, team project presentations, community demos, and closing ceremony with winners announced.')}
          </p>
        </div>
        <div className="detail-page__visual day4-hero__visual">
          <img src={sticker01} alt="" className="detail-page__sticker" />
        </div>
      </div>

      {!isPostQiskit && (
        <div className="container day-context-banner day-context-banner--purple">
          <div className="day-context-banner__content">
            <span className="day-context-banner__badge">Festival Finale</span>
            <h3>Workshops, expert webinars &amp; project presentations</h3>
            <p>Day 4 combines specialized masterclasses, an IBM Quantum webinar, live finalist demonstrations, community expo booths, and award recognition.</p>
          </div>
          <Button to={getProfilePath('certificates')} kind="primary">View Certificates →</Button>
        </div>
      )}

      <section className="container day-schedule-container">
        <div className="day-schedule-header">
          <div>
            <p className="page-shell__eyebrow">Day 4 Schedule</p>
            <h2>{isPostQiskit ? 'Official Timetable' : 'Workshop & Webinar Timetable'}</h2>
          </div>
          <span className="day-schedule-badge">
            {isPostQiskit ? `${day?.sessions?.length || 4} Sessions` : '6 Sessions · Showcase, Talks & Closing Ceremony'}
          </span>
        </div>
        <Day4Schedule sessions={day?.sessions || []} />
      </section>

      {!isPostQiskit && (
        <>
          <section className="container day4-section day4-section--showcase">
            <div className="day4-section__heading">
              <p className="page-shell__eyebrow">Project Showcase</p>
              <h2>Explore what participants built.</h2>
            </div>
            <div className="day4-showcase-grid">
              {showcaseProjects.map((project) => <ShowcaseCard key={project.number} project={project} />)}
            </div>
          </section>

          <section className="container day4-section day4-community">
            <div className="day4-section__heading">
              <p className="page-shell__eyebrow">Community</p>
              <h2>One Community. Many Ideas.</h2>
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
          </section>

          <section className="container day4-section day4-awards">
            <div className="day4-section__heading">
              <p className="page-shell__eyebrow">Recognition</p>
              <h2>Awards &amp; Recognition</h2>
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
        </>
      )}

      <div className="container detail-page__cta-row">
        <Button to={getProfilePath('day-3')} kind="secondary">
          {isPostQiskit ? '← Day 3' : '← Day 3 Hackathon'}
        </Button>
        <Button to={getProfilePath(isPostQiskit ? 'day-5' : 'certificates')} kind="primary">
          {isPostQiskit ? 'Next: Day 5 →' : 'Explore Certificates →'}
        </Button>
      </div>
    </motion.section>
  )
}

export default Day4
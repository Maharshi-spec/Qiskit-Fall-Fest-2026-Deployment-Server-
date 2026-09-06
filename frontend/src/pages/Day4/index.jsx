import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import sticker01 from '../../assets/qiskit/Sticker 01.svg'
import sticker03 from '../../assets/qiskit/Sticker 03.svg'
import sticker05 from '../../assets/qiskit/Sticker 05.svg'
import sticker07 from '../../assets/qiskit/Sticker 07.svg'

const day4Schedule = [
  {
    id: 'showcase',
    time: '09:30',
    title: 'Final Project Showcase',
    type: 'Showcase',
    description: 'Teams present their final quantum projects, experiments, and prototypes to the community.',
  },
  {
    id: 'challenge',
    time: '11:00',
    title: 'Quantum Challenge Finale',
    type: 'Challenge',
    description: 'A final hands-on challenge where participants put their quantum knowledge and problem-solving skills to the test.',
  },
  {
    id: 'demos',
    time: '13:30',
    title: 'Team Demo Sessions',
    type: 'Demo',
    description: 'Explore project demonstrations and hear teams explain the ideas, approaches, and results behind their work.',
  },
  {
    id: 'awards',
    time: '15:00',
    title: 'Awards & Recognition',
    type: 'Community',
    description: 'Celebrate standout projects, creative solutions, teamwork, and contributions to the event community.',
  },
  {
    id: 'closing',
    time: '16:00',
    title: 'Closing Celebration',
    type: 'Community',
    description: 'Wrap up the festival, connect with fellow participants, and reflect on the quantum journey.',
  },
]

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

const Day4Schedule = () => {
  const [expandedId, setExpandedId] = useState(day4Schedule[0].id)

  return (
    <div className="day4-schedule">
      {day4Schedule.map((session) => (
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

const Day4 = () => (
  <motion.main className="detail-page day4-page" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
    <div className="container detail-page__header day4-hero">
      <div className="detail-page__intro">
        <p className="page-shell__eyebrow">Day 04 — Innovation &amp; Showcase</p>
        <h1>Build. Showcase. Celebrate.</h1>
        <p>A final day of demos, challenges, community, and celebration as teams bring their quantum ideas to life.</p>
      </div>
      <div className="detail-page__visual day4-hero__visual">
        <img src={sticker01} alt="" className="detail-page__sticker" />
      </div>
    </div>

    <div className="container detail-page__meta-bar">
      <Link to="/day-3" className="page-inline-link">← Previous day</Link>
      <Link to="/certificates" className="page-inline-link">Certificates →</Link>
    </div>

    <section className="container day4-section">
      <div className="day4-section__heading">
        <p className="page-shell__eyebrow">The Final Program</p>
        <h2>Bring it all together.</h2>
        <p>Mock showcase programming for the festival finale, ready to be replaced with the final Day 4 schedule.</p>
      </div>
      <Day4Schedule />
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
        <Link to="/" className="button button--secondary">Back to Day 1</Link>
      </div>
    </section>
  </motion.main>
)

export default Day4
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Hero from '../../components/Hero'
import SectionHeader from '../../components/SectionHeader'
import EventCard from '../../components/EventCard'
import Button from '../../components/Button'
import SpeakerCard from '../../components/SpeakerCard'
import OrganizerCard from '../../components/OrganizerCard'
import HorizontalTeamCarousel from '../../components/HorizontalTeamCarousel'
import { event } from '../../data/event'
import { workshops } from '../../data/workshops'
import { speakers } from '../../data/speakers'
import { organizers, techTeam } from '../../data/organizers'
import { hackathon } from '../../data/hackathon'
import { programDays } from '../../data/program'
import { venue } from '../../data/venue'
import WorkshopCard from '../../components/WorkshopCard'
import BlochSphere from '../../components/BlochSphere'
import sticker01 from '../../assets/qiskit/Sticker 01.svg'
import sticker02 from '../../assets/qiskit/Sticker 02.svg'
import sticker03 from '../../assets/qiskit/Sticker 03.svg'
import sticker04 from '../../assets/qiskit/Sticker 04.svg'
import sticker05 from '../../assets/qiskit/Sticker 05.svg'
import sticker06 from '../../assets/qiskit/Sticker 06.svg'
import sticker07 from '../../assets/qiskit/Sticker 07.svg'
import sticker08 from '../../assets/qiskit/Sticker 08.svg'
import sticker09 from '../../assets/qiskit/Sticker 09.svg'
import stickerQuantum from '../../assets/qiskit/Sticker_Quantum-Blue.svg'
import stickerQiskit from '../../assets/qiskit/Sticker_Qiskit-Purple.svg'

const featureItems = [
  {
    id: 'learn',
    title: '01 — Learn',
    description: 'Quantum computing fundamentals and Qiskit concepts.',
  },
  {
    id: 'build',
    title: '02 — Build',
    description: 'Hands-on quantum programming and experimentation.',
  },
  {
    id: 'explore',
    title: '03 — Explore',
    description: 'Discover quantum algorithms, circuits, and applications.',
  },
  {
    id: 'connect',
    title: '04 — Connect',
    description: 'Meet students, mentors, speakers, and fellow enthusiasts.',
  },
]

const quantumConcepts = [
  {
    title: 'Qubits',
    text: 'A qubit is the basic unit of quantum information. Unlike a classical bit, it can exist in a quantum state described by probability amplitudes.',
  },
  {
    title: 'Superposition',
    text: 'A qubit can exist in a combination of basis states until it is measured. This allows quantum algorithms to manipulate multiple probability amplitudes.',
  },
  {
    title: 'Entanglement',
    text: 'Entanglement creates quantum correlations between systems that cannot be described independently. It is a key resource in many quantum algorithms and communication protocols.',
  },
  {
    title: 'Quantum Circuits',
    text: 'Quantum circuits combine qubits with quantum gates to transform quantum states. They provide the structure used to implement quantum algorithms.',
  },
]

const qiskitSteps = ['Learn', 'Write circuits', 'Run experiments', 'Understand results']

const quantumSteps = [
  {
    id: 'represent',
    title: '01 — Represent',
    text: 'Quantum information is represented using qubits, which provide a richer state space than classical bits.',
  },
  {
    id: 'operate',
    title: '02 — Operate',
    text: 'Quantum gates transform the state of a qubit or multiple qubits in carefully designed ways.',
  },
  {
    id: 'entangle',
    title: '03 — Entangle',
    text: 'Multiple qubits can become correlated so that their combined state has properties beyond independent classical states.',
  },
  {
    id: 'measure',
    title: '04 — Measure',
    text: 'Measurement converts the quantum state into classical information that can be interpreted and analyzed.',
  },
]

const hackathonFeatures = [
  {
    id: 'explore',
    number: '01',
    title: 'Explore',
    description: 'Discover quantum computing problems and possibilities through hands-on experimentation.',
  },
  {
    id: 'build',
    number: '02',
    title: 'Build',
    description: 'Create practical experiments using Qiskit and connect concepts to real workflows.',
  },
  {
    id: 'collaborate',
    number: '03',
    title: 'Collaborate',
    description: 'Work with other students and quantum enthusiasts to exchange ideas and learn together.',
  },
  {
    id: 'present',
    number: '04',
    title: 'Present',
    description: 'Share your ideas, experiments, and results with the broader event community.',
  },
]

const fadeInUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
}

gsap.registerPlugin(ScrollTrigger)

const StickerAccent = ({ src, alt = '', className = '', rotate = 0, delay = 0 }) => {
  const stickerRef = useRef(null)
  const shouldReduceMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    if (!stickerRef.current || shouldReduceMotion) return

    const wrap = stickerRef.current.parentElement

    const ctx = gsap.context(() => {
      gsap.to(wrap, {
        yPercent: -12,
        scale: 1.28,
        ease: 'none',
        scrollTrigger: {
          trigger: wrap,
          start: 'top 92%',
          end: 'bottom 18%',
          scrub: 1.7,
          invalidateOnRefresh: true,
        },
      })

      gsap.to(stickerRef.current, {
        y: -24,
        x: 10,
        scale: 1.12,
        duration: 2.8 + delay,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        overwrite: true,
        force3D: true,
      })
    }, stickerRef)

    return () => ctx.revert()
  }, [delay, shouldReduceMotion])

  return (
    <div className={`sticker-wrap ${className}`.trim()} style={{ '--sticker-rotation': `${rotate}deg` }}>
      <img ref={stickerRef} src={src} alt={alt} className="section-sticker" />
    </div>
  )
}

const Home = () => {
  const shouldReduceMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const [selectedQuantumStep, setSelectedQuantumStep] = useState(quantumSteps[0].id)
  const [selectedDay, setSelectedDay] = useState(programDays[0]?.id || 'day-1')
  const [expandedWorkshop, setExpandedWorkshop] = useState(workshops[0]?.id || null)
  const [expandedSessionId, setExpandedSessionId] = useState(programDays[0]?.sessions[0]?.id || null)

  const workshopCards = useMemo(() => {
    if (workshops.length) return workshops
    return []
  }, [])

  const speakerCards = useMemo(() => {
    if (speakers.length) return speakers
    return [
      {
        name: 'Speaker lineup coming soon',
        role: 'TBD',
        bio: 'The official speaker list will be shared as the program is finalized.',
      },
    ]
  }, [])

  const renderSpeakerCard = useCallback(
    (item) => (
      <SpeakerCard
        name={item.name}
        role={item.role}
        organization={item.organization}
        bio={item.bio}
        session={item.session}
        link={item.link}
        image={item.image}
        alt={item.alt}
      />
    ),
    [],
  )
  const activeProgramDay = useMemo(
    () => programDays.find((day) => day.id === selectedDay) || programDays[0],
    [selectedDay],
  )

  const activeQuantumStep = quantumSteps.find((step) => step.id === selectedQuantumStep) || quantumSteps[0]

  const sectionMotion = shouldReduceMotion
    ? { initial: false, whileInView: undefined, viewport: undefined }
    : { initial: 'hidden', whileInView: 'visible', viewport: { once: true, amount: 0.2 }, variants: fadeInUp, transition: { duration: 0.6, ease: 'easeOut' } }

  return (
    <>
      <Hero />

      <div className="home-page">
        <motion.section id="home-event" className="section section--event" {...sectionMotion}>
          <div className="container section__inner">
            <div className="section__content">
              <SectionHeader
                label="01 / The Event"
                title={event.tagline}
                description={event.description}
              />
              <div className="section__action-row">
                <Button to="/hackathon" kind="primary">Explore The Event →</Button>
              </div>
            </div>

            <div className="event-feature-panel">
              <div className="section__visual section__visual--stacked">
                <StickerAccent src={sticker01} alt="" className="sticker--event" rotate={-12} delay={0.15} />
              </div>
              <EventCard
                eyebrow="Location"
                title={event.location}
                description="A collaborative quantum learning environment designed for students, builders, and curious minds."
              />
              <EventCard
                eyebrow="Focus"
                title="Learning, experimentation, and community"
                description="The event brings together introductions to quantum concepts, hands-on practice, and shared discovery."
              />
            </div>
          </div>
        </motion.section>

        <motion.section className="section section--experience" {...sectionMotion}>
          <div className="container section__with-sticker">
            <div className="section__header-row">
              <SectionHeader
                label="The Experience"
                title="Learn. Build. Share."
                description="A practical journey through quantum ideas, experimental learning, and collaboration."
              />
              <StickerAccent src={sticker02} alt="" className="sticker--experience" rotate={8} delay={0.2} />
            </div>

            <div className="feature-grid feature-grid--four">
              {featureItems.map((item) => (
                <div key={item.id} className="feature-card">
                  <span className="feature-card__tag">{item.title}</span>
                  <p>{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section className="section section--education" {...sectionMotion}>
          <div className="container section__with-sticker">
            <div className="section__header-row">
              <SectionHeader
                label="Quantum Computing"
                title="Why Quantum Computing?"
                description="Quantum computing uses quantum states to represent and process information in ways that differ fundamentally from classical computation. Qubits can occupy superpositions, interact through entanglement, and be manipulated by quantum circuits."
              />
              <StickerAccent src={stickerQuantum} alt="" className="sticker--quantum" rotate={-10} delay={0.25} />
            </div>

            <div className="quantum-education-layout">
              <div className="quantum-visual-panel">
                <div className="quantum-lab-header">
                  <p className="quantum-lab__label">Quantum Lab</p>
                </div>
                <h3 className="bloch-sphere-panel__title">Bloch Sphere</h3>
                <p className="bloch-sphere-panel__subtitle">
                  Explore the state of a single qubit in real time.
                </p>
                <p className="bloch-sphere-panel__supporting">
                  The Bloch sphere represents every pure single-qubit state as a point on a unit sphere. Drag to rotate the view, use the presets to explore basis states, or evolve the state dynamically.
                </p>
                <BlochSphere reducedMotion={shouldReduceMotion} />
              </div>
            </div>

            <div className="quantum-concepts-section">
              <div className="quantum-concepts-grid">
                {quantumConcepts.map((item) => (
                  <div key={item.title} className="quantum-concept-card">
                    <h4>{item.title}</h4>
                    <p>{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section className="section section--qiskit" {...sectionMotion}>
          <div className="container section__split">
            <div className="section__split-copy">
              <SectionHeader
                label="Qiskit"
                title="Code the Quantum Future."
                description="Qiskit provides an accessible ecosystem for learning, experimenting, and understanding quantum computing through code and real workflows."
              />
            </div>

            <div className="section__visual section__visual--timeline">
              <StickerAccent src={stickerQiskit} alt="" className="sticker--qiskit" rotate={10} delay={0.3} />
            </div>

            <div className="timeline qiskit-timeline">
              {qiskitSteps.map((step, index) => (
                <div key={step} className="timeline__item">
                  <span>{index + 1}</span>
                  <p>{step}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section className="section section--how-it-works" {...sectionMotion}>
          <div className="container">
            <SectionHeader
              label="How Quantum Computing Works"
              title="A practical quantum journey."
              description="Each stage explores a crucial idea in how quantum information is represented, transformed, and interpreted."
            />

            <div className="journey-steps" role="list" aria-label="Quantum computing concepts">
              {quantumSteps.map((step) => (
                <button
                  key={step.id}
                  type="button"
                  className={`journey-step ${selectedQuantumStep === step.id ? 'journey-step--active' : ''}`}
                  onClick={() => setSelectedQuantumStep(step.id)}
                  aria-pressed={selectedQuantumStep === step.id}
                >
                  <span className="journey-step__number">{step.title.split(' — ')[0]}</span>
                  <span className="journey-step__title">{step.title.split(' — ')[1]}</span>
                  <small className="journey-step__description">
                    {selectedQuantumStep === step.id ? step.text : 'Explore the concept.'}
                  </small>
                </button>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section id="program" className="section section--program" {...sectionMotion}>
          <div className="container program-shell">
            <div className="section__header-row section__header-row--program">
              <SectionHeader
                label="The Program"
                title="Three days of quantum learning, building, and discovery."
                description="The event brings together quantum computing fundamentals, Qiskit learning, technical sessions, hands-on workshops, collaborative activities, hackathon work, and community connection."
              />
              <StickerAccent src={sticker03} alt="" className="sticker--program" rotate={-8} delay={0.18} />
            </div>

            <div className="program-accent-wrap" aria-hidden="true">
              <div className="program-accent-grid">
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>

            <div className="program-day-tabs" role="tablist" aria-label="Select event day">
              {programDays.map((day) => (
                <motion.button
                  key={day.id}
                  type="button"
                  role="tab"
                  aria-selected={selectedDay === day.id}
                  aria-controls={`panel-${day.id}`}
                  className={`program-day-tab ${selectedDay === day.id ? 'program-day-tab--active' : ''}`}
                  onClick={() => {
                    setSelectedDay(day.id)
                    setExpandedSessionId(day.sessions[0]?.id || null)
                  }}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.99 }}
                >
                  <span>{day.label}</span>
                  <strong>{day.title}</strong>
                </motion.button>
              ))}
            </div>

            <div id={`panel-${selectedDay}`} className="program-day-panel" role="tabpanel">
              <div className="program-day-panel__header">
                <div>
                  <p className="program-day-panel__eyebrow">{activeProgramDay.label}</p>
                  <h3>{activeProgramDay.title}</h3>
                </div>
                <StickerAccent src={stickerQiskit} alt="" className="sticker--program-detail" rotate={10} delay={0.22} />
              </div>

              <div className="program-sessions">
                {activeProgramDay.sessions.map((session) => {
                  const isExpanded = expandedSessionId === session.id

                  return (
                    <motion.article
                      key={session.id}
                      layout
                      className={`program-session ${isExpanded ? 'program-session--expanded' : ''}`}
                    >
                      <button
                        type="button"
                        className="program-session__toggle"
                        onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}
                        aria-expanded={isExpanded}
                        aria-controls={`content-${session.id}`}
                      >
                        <div className="program-session__row">
                          <span className="program-session__time">{session.time}</span>
                          <span className="program-session__type">{session.type}</span>
                        </div>
                        <div className="program-session__heading-row">
                          <h4>{session.title}</h4>
                          <span className="program-session__expand">{isExpanded ? '−' : '+'}</span>
                        </div>
                      </button>

                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            id={`content-${session.id}`}
                            initial={shouldReduceMotion ? false : { height: 0, opacity: 0 }}
                            animate={shouldReduceMotion ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
                            exit={shouldReduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                            transition={{ duration: 0.22, ease: 'easeOut' }}
                            className="program-session__content"
                          >
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
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.article>
                  )
                })}
              </div>
            </div>

            <div className="section__action-row section__action-row--program">
              <Button to={activeProgramDay.link} kind="secondary">View {activeProgramDay.label} →</Button>
            </div>
          </div>
        </motion.section>

        <motion.section className="section section--hackathon" {...sectionMotion}>
          <div className="container hackathon-shell">
            <div className="hackathon-intro">
              <div className="section__content">
                <p className="section-header__label">Hackathon</p>
                <h2>Turn quantum ideas into something real.</h2>
                <p>
                  {hackathon[0]?.description || 'Participants explore quantum computing through projects, experiment with Qiskit, apply concepts learned during the event, and collaborate through practical problem solving.'}
                </p>
                <div className="section__action-row">
                  <Button to="/hackathon" kind="primary">Explore the Hackathon →</Button>
                </div>
              </div>
            </div>

            <div className="hackathon-visual" aria-label="Quantum inspired hackathon visual">
              <StickerAccent src={sticker04} alt="" className="sticker--hackathon" rotate={7} delay={0.1} />
              <div className="hackathon-circuit" aria-hidden="true">
                <div className="hackathon-circuit__wire hackathon-circuit__wire--one" />
                <div className="hackathon-circuit__wire hackathon-circuit__wire--two" />
                <div className="hackathon-node hackathon-node--pink" />
                <div className="hackathon-node hackathon-node--purple" />
                <div className="hackathon-node hackathon-node--lavender" />
                <div className="hackathon-node hackathon-node--purple hackathon-node--last" />
              </div>
            </div>
          </div>

          <div className="container">
            <div className="feature-grid feature-grid--four hackathon-features">
              {hackathonFeatures.map((step) => (
                <div key={step.id} className="feature-card hackathon-feature-card">
                  <span className="feature-card__tag">{step.number}</span>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section className="section section--workshops" {...sectionMotion}>
          <div className="container section__with-sticker">
            <div className="section__header-row">
              <SectionHeader
                label="Workshops"
                title="Learn by building."
                description="Workshops give participants a practical introduction to quantum computing, Qiskit, circuits, algorithms, and experimentation."
              />
              <StickerAccent src={sticker05} alt="" className="sticker--workshops" rotate={-9} delay={0.12} />
            </div>

            {workshopCards.length > 0 ? (
              <div className="card-grid card-grid--three workshop-grid">
                {workshopCards.map((item) => (
                  <WorkshopCard
                    key={item.id}
                    title={item.title}
                    category={item.category}
                    difficulty={item.difficulty}
                    description={item.description}
                    duration={item.duration}
                    instructor={item.instructor}
                    location={item.location}
                    isExpanded={expandedWorkshop === item.id}
                    onToggle={() => setExpandedWorkshop((current) => (current === item.id ? null : item.id))}
                  />
                ))}
              </div>
            ) : (
              <div className="workshop-empty-state">
                <p>Workshop details will be added here as the event program is finalized.</p>
              </div>
            )}

            <div className="section__action-row">
              <Button to="/workshops" kind="secondary">View Workshops →</Button>
            </div>
          </div>
        </motion.section>

        <motion.section className="section section--speakers" {...sectionMotion}>
          <div className="container section__with-sticker">
            <div className="section__header-row">
              <SectionHeader
                label="Speakers"
                title="Meet the people shaping the quantum conversation."
                description="The event brings together people who can help participants learn about quantum computing, Qiskit, experimentation, and practical applications."
              />
              <StickerAccent src={sticker06} alt="" className="sticker--speakers" rotate={10} delay={0.14} />
            </div>

            <HorizontalTeamCarousel
              items={speakerCards}
              category="speakers"
              desktopGrid
              ariaLabel="Speakers"
              renderItem={renderSpeakerCard}
            />
          </div>
        </motion.section>

        <motion.section className="section section--organizers" {...sectionMotion}>
  <div className="container section__with-sticker">
    <div className="section__header-row">
      <SectionHeader
        label="Our Team"
        title="The people behind Qiskit Fall Fest."
        description="Meet the organizers and technology team working together to make Qiskit Fall Fest 2026 happen."
      />
      <StickerAccent
        src={sticker07}
        alt=""
        className="sticker--organizers"
        rotate={-12}
        delay={0.16}
      />
    </div>

    {/* Organizers — 9 members */}
    <HorizontalTeamCarousel
      title="Organizers"
      members={organizers}
      category="organizers"
    />

    {/* Technology Team — 6 members */}
    <HorizontalTeamCarousel
      title="Tech Team"
      members={techTeam}
      category="tech-team"
    />
  </div>
</motion.section>

        <motion.section className="section section--venue" {...sectionMotion}>
          <div className="container venue-shell">
            <div className="venue-panel">
              <div className="venue-panel__body">
                <div className="venue-panel__content">
                  <p className="section-header__label">Venue</p>
                  <h2>{venue.name}</h2>
                  <p className="venue-panel__city">{venue.city}</p>
                  <p>{venue.description}</p>
                  {venue.locationUrl ? (
                    <a href={venue.locationUrl} target="_blank" rel="noreferrer" className="venue-panel__link venue-panel__link--primary">
                      Open in Maps →
                    </a>
                  ) : (
                    <span className="venue-panel__link venue-panel__link--muted">Location details coming soon</span>
                  )}
                </div>

                {venue.locationUrl ? (
                  <a
                    href={venue.locationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="venue-map-preview"
                    aria-label="Open Centurion University in Google Maps"
                  >
                    <iframe
                      title="Centurion University Vizianagaram map"
                      src="https://www.google.com/maps?q=Centurion+University+Vizianagaram,+Rollavaka+Village,+Bondapalli,+Mandal,+Andhra+Pradesh+535003&z=14&output=embed"
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </a>
                ) : null}
              </div>
              <StickerAccent src={sticker08} alt="" className="sticker--venue" rotate={8} delay={0.12} />
            </div>
          </div>
        </motion.section>

        <motion.section className="section section--final-cta" {...sectionMotion}>
          <div className="container final-cta-wrap">
            <div className="final-cta-copy">
              <p className="section-header__label">Register</p>
              <h2>Ready to explore quantum?</h2>
              <p>Learn. Build. Experiment. Connect.</p>
            </div>
            <div className="final-cta-actions">
              <Button to="/register" kind="primary">Register for Qiskit Fall Fest →</Button>
              <Button to="/day-1" kind="secondary">Explore the Program →</Button>
            </div>
            <StickerAccent src={sticker09} alt="" className="sticker--final" rotate={-7} delay={0.2} />
          </div>
        </motion.section>
      </div>
    </>
  )
}

export default Home

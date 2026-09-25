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
import { useEventProfile } from '../../context/EventProfileContext'
import { workshops } from '../../data/workshops'
import { speakers, postQiskitSpeakers } from '../../data/speakers'
import { organizers, techTeam } from '../../data/organizers'
import { hackathon } from '../../data/hackathon'
import { programDays, postQiskitProgramDays } from '../../data/program'
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
    description: 'Build a working understanding of qubits, quantum gates, and circuits through guided bootcamp sessions and expert talks.',
  },
  {
    id: 'build',
    title: '02 — Build',
    description: 'Write quantum circuits, run experiments in Qiskit, and translate theory into working code across two hackathon days.',
  },
  {
    id: 'explore',
    title: '03 — Explore',
    description: 'Work with quantum algorithms, the Bloch sphere, and circuit simulations to develop intuition for how quantum computation behaves.',
  },
  {
    id: 'connect',
    title: '04 — Connect',
    description: 'Learn alongside students, mentors, and speakers. Exchange ideas, give feedback, and build connections within the quantum community.',
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
    text: 'Qubits are the fundamental unit of quantum information. Unlike classical bits, they can exist in superpositions of |0⟩ and |1⟩, described by probability amplitudes on the Bloch sphere.',
  },
  {
    id: 'operate',
    title: '02 — Operate',
    text: 'Quantum gates are unitary operations that transform qubit states. Gates such as the Hadamard, Pauli-X, and CNOT form the building blocks of quantum circuits.',
  },
  {
    id: 'entangle',
    title: '03 — Entangle',
    text: 'Entanglement links qubits so that measuring one instantaneously determines information about the other, regardless of distance. Bell states are the canonical example used throughout quantum computing.',
  },
  {
    id: 'measure',
    title: '04 — Measure',
    text: 'Measurement collapses a quantum state into a classical bit — 0 or 1 — with probabilities determined by the state\'s amplitudes. The measurement outcome is how quantum results become usable.',
  },
]


const hackathonFeatures = [
  {
    id: 'explore',
    number: '01',
    title: 'Define',
    description: 'Identify a quantum computing problem, scope a solvable challenge, and design an approach using Qiskit tools and techniques from the bootcamp.',
  },
  {
    id: 'build',
    number: '02',
    title: 'Build',
    description: 'Write quantum circuits, test algorithms on simulators, and iterate on your implementation across the dedicated hacking sprints.',
  },
  {
    id: 'collaborate',
    number: '03',
    title: 'Collaborate',
    description: 'Work within your team and get structured feedback from industry mentors to refine your technical approach and improve your results.',
  },
  {
    id: 'present',
    number: '04',
    title: 'Present',
    description: 'Demonstrate your project to the judging panel and the wider community on Day 4, explaining your approach, results, and what you learned.',
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
  const { getProfilePath, isRegistrationOpen, activeProfile } = useEventProfile()
  const isPostQiskit = activeProfile === 'post-qiskit'
  const currentProgramDays = isPostQiskit ? postQiskitProgramDays : programDays

  const shouldReduceMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const [selectedQuantumStep, setSelectedQuantumStep] = useState(quantumSteps[0].id)
  const [selectedDay, setSelectedDay] = useState(currentProgramDays[0]?.id || 'day-1')
  const [expandedWorkshop, setExpandedWorkshop] = useState(workshops[0]?.id || null)
  const [expandedSessionId, setExpandedSessionId] = useState(currentProgramDays[0]?.sessions[0]?.id || null)

  useEffect(() => {
    setSelectedDay(currentProgramDays[0]?.id || 'day-1')
    setExpandedSessionId(currentProgramDays[0]?.sessions[0]?.id || null)
  }, [isPostQiskit, currentProgramDays])

  const workshopCards = useMemo(() => {
    if (workshops.length) return workshops
    return []
  }, [])

  const speakerCards = useMemo(() => {
    if (isPostQiskit) {
      if (postQiskitSpeakers.length) return postQiskitSpeakers
    } else {
      if (speakers.length) return speakers
    }
    return [
      {
        name: 'Speaker lineup coming soon',
        role: 'TBD',
        bio: 'The official speaker list will be shared as the program is finalized.',
      },
    ]
  }, [isPostQiskit])

  const renderSpeakerCard = useCallback(
    (item) => (
      <SpeakerCard
        key={item.id || item.name}
        name={item.name}
        role={item.role}
        organization={item.organization || item.affiliation}
        bio={item.bio}
        session={item.session}
        link={item.link}
        image={item.image}
        alt={item.alt || item.name}
      />
    ),
    [],
  )
  const activeProgramDay = useMemo(
    () => currentProgramDays.find((day) => day.id === selectedDay) || currentProgramDays[0],
    [currentProgramDays, selectedDay],
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
                <Button to={getProfilePath('hackathon')} kind="primary">Explore The Event →</Button>
              </div>
            </div>

            <div className="event-feature-panel">
              <div className="section__visual section__visual--stacked">
                <StickerAccent src={sticker01} alt="" className="sticker--event" rotate={-12} delay={0.15} />
              </div>
              <EventCard
                eyebrow="Location"
                title={event.location}
                description="Hosted on the Vizianagaram campus of Centurion University, providing dedicated labs, lecture halls, and collaboration spaces across all four event days."
              />
              <EventCard
                eyebrow="Focus"
                title="Quantum computing through Qiskit"
                description="Participants move from bootcamp fundamentals through hackathon project work, expert talks, workshops, and a live showcase — all centered on Qiskit and quantum concepts."
              />

            </div>
          </div>
        </motion.section>

        <motion.section id="home-experience" className="section section--experience" {...sectionMotion}>
          <div className="container section__with-sticker">
            <div className="section__header-row">
              <SectionHeader
                label="The Experience"
                title="Learn. Build. Share."
                description="Qiskit Fall Fest is structured around four connected pillars — giving participants the knowledge, practical skills, creative space, and community to get the most from four days of quantum computing."
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

        <motion.section id="home-quantum-lab" className="section section--education" {...sectionMotion}>
          <div className="container section__with-sticker">
            <div className="section__header-row">
              <SectionHeader
                label="Quantum Computing"
                title="The foundations behind the event."
                description="Quantum computing uses the principles of quantum mechanics — superposition, entanglement, and interference — to process information in ways that classical computers cannot. Understanding these ideas is the starting point for everything at Qiskit Fall Fest 2026."
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
                  A geometric representation of a single-qubit pure state.
                </p>
                <p className="bloch-sphere-panel__supporting">
                  Every point on the surface of the Bloch sphere corresponds to a valid qubit state. The north pole is |0⟩, the south pole is |1⟩, and all other points represent superpositions. Drag to rotate the view, select a preset to jump to a basis state, or watch the state evolve dynamically.
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

        <motion.section id="home-qiskit" className="section section--qiskit" {...sectionMotion}>
          <div className="container section__split">
            <div className="section__split-copy">
              <SectionHeader
                label="Qiskit"
                title="Write quantum circuits. Run experiments."
                description="Qiskit is IBM's open-source SDK for quantum computing. It provides the tools to build circuits, run simulations, and experiment with quantum algorithms — the primary tool used across Qiskit Fall Fest 2026."
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

        <motion.section id="home-journey" className="section section--how-it-works" {...sectionMotion}>
          <div className="container">
            <SectionHeader
              label="How Quantum Computing Works"
              title="From qubits to meaningful results."
              description="Follow the fundamental stages of a quantum computation — from encoding information in qubits, through gate operations and entanglement, to measuring classical outcomes."
            />


            <div className="journey-steps" role="list" aria-label="Quantum computing concepts">
              {quantumSteps.map((step) => {
              const previews = {
                represent: 'How quantum information is encoded in qubits.',
                operate: 'How quantum gates transform qubit states.',
                entangle: 'How qubits become correlated through entanglement.',
                measure: 'How quantum states become classical results.',
              }
              return (
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
                    {selectedQuantumStep === step.id ? step.text : previews[step.id]}
                  </small>
                </button>
              )
            })}

            </div>
          </div>
        </motion.section>

        <motion.section id="home-program" className="section section--program" {...sectionMotion}>
          <div id="program" className="anchor-target" aria-hidden="true" />
          <div className="container program-shell">
            <div className="section__header-row section__header-row--program">
              <SectionHeader
                label="The Program"
                title="Four days. Four formats."
                description="Day 1 is a Bootcamp introducing quantum computing and Qiskit. Days 2 and 3 are the Hackathon — two full days of team project work and mentorship. Day 4 brings workshops, expert webinars, project presentations, and the closing ceremony."
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
              {currentProgramDays.map((day) => (
                <motion.button
                  key={day.id}
                  type="button"
                  role="tab"
                  aria-selected={selectedDay === day.id}
                  aria-controls={`panel-${day.id}`}
                  className={`program-day-tab ${selectedDay === day.id ? 'program-day-tab--active' : ''}`}
                  onClick={(event) => {
                    setSelectedDay(day.id)
                    setExpandedSessionId(day.sessions[0]?.id || null)
                    event.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
                  }}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.99 }}
                >
                  <span>{day.label}</span>
                  <strong>{day.cardTitle || day.title}</strong>
                </motion.button>
              ))}
            </div>

            <div id={`panel-${selectedDay}`} className="program-day-panel" role="tabpanel">
              <div className="program-day-panel__header">
                <div>
                  <p className="program-day-panel__eyebrow">{activeProgramDay.label} — {activeProgramDay.date}</p>
                  <h3>{activeProgramDay.title}</h3>
                  <p className="program-day-panel__desc">{activeProgramDay.description}</p>
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
                            {session.points && session.points.length > 0 && (
                              <ul>
                                {session.points.map((point) => (
                                  <li key={point}>{point}</li>
                                ))}
                              </ul>
                            )}
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
              <Button to={getProfilePath(activeProgramDay.link.replace(/^\//, ''))} kind="secondary">View {activeProgramDay.dayNumber || activeProgramDay.label} →</Button>
            </div>
          </div>
        </motion.section>

        <motion.section id="home-hackathon" className="section section--hackathon" {...sectionMotion}>
          <div className="container hackathon-shell">
            <div className="hackathon-intro">
              <div className="section__content">
                <p className="section-header__label">Hackathon</p>
                <h2>Turn quantum ideas into something real.</h2>
                <p>
                  {hackathon[0]?.description || 'The two-day hackathon runs on Days 2 and 3. Teams choose a quantum problem, write circuits in Qiskit, iterate with mentor support, and present finished projects at the Day 4 showcase.'}
                </p>

                <div className="section__action-row">
                  <Button to={getProfilePath('hackathon')} kind="primary">Explore the Hackathon →</Button>
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

        <motion.section id="home-workshops" className="section section--workshops" {...sectionMotion}>
          <div className="container section__with-sticker">
            <div className="section__header-row">
              <SectionHeader
                label="Workshops"
                title="Structured sessions. Practical outcomes."
                description="Three workshop tracks are offered across the event — from an introductory session on quantum concepts and Qiskit setup, through hands-on circuit building, to an intermediate session on quantum algorithms. Each is designed to build directly on the previous day's learning."
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
              <Button to={getProfilePath('workshops')} kind="secondary">View Workshops →</Button>
            </div>
          </div>
        </motion.section>

        <motion.section id="home-speakers" className="section section--speakers" {...sectionMotion}>
          <div className="container section__with-sticker">
            <div className="section__header-row">
              <SectionHeader
                label="Speakers"
                title="Researchers, engineers, and educators."
                description={
                  isPostQiskit
                    ? "Distinguished speakers, researchers, and quantum leaders presenting sessions and keynotes across the 6-day festival."
                    : "Qiskit Fall Fest 2026 features a Chief Guest from APSCHE, a keynote by a professor from the Indian Institute of Science, and a keynote from an IBM Quantum Algorithms Engineer — bringing perspectives from academia and industry."
                }
              />

              <StickerAccent src={sticker06} alt="" className="sticker--speakers" rotate={10} delay={0.14} />
            </div>

            <HorizontalTeamCarousel
              items={speakerCards}
              category="speakers"
              desktopGrid={!isPostQiskit}
              ariaLabel="Speakers"
              renderItem={renderSpeakerCard}
            />
          </div>
        </motion.section>

        <motion.section id="home-team" className="section section--organizers" {...sectionMotion}>
  <div className="container section__with-sticker">
    <div className="section__header-row">
      <SectionHeader
        label="Our Team"
        title="The people behind Qiskit Fall Fest."
        description="Qiskit Fall Fest 2026 is organized and run by a student team from Centurion University — a dedicated group of organizers managing the event logistics and a technology team responsible for the platform, registration system, and digital infrastructure."
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

        <motion.section id="home-venue" className="section section--venue" {...sectionMotion}>
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

        <motion.section id="home-register" className="section section--final-cta" {...sectionMotion}>
          <div className="container final-cta-wrap">
            <div className="final-cta-copy">
              <p className="section-header__label">{isRegistrationOpen ? 'Register' : 'Registration Status'}</p>
              <h2>{isRegistrationOpen ? 'Join Qiskit Fall Fest 2026.' : 'Registration is Closed'}</h2>
              <p>
                {isRegistrationOpen
                  ? 'Four days of quantum computing fundamentals, hands-on Qiskit programming, collaborative hackathon work, and expert talks — hosted at Centurion University, Vizianagaram.'
                  : 'Registration for Qiskit Fall Fest 2026 has closed. The full four-day program schedule, session details, and workshop tracks remain available to browse.'}
              </p>
            </div>

            <div className="final-cta-actions">
              {isRegistrationOpen ? (
                <>
                  <Button to={getProfilePath('register')} kind="primary">Register for Qiskit Fall Fest →</Button>
                  <Button to={getProfilePath('day-1')} kind="secondary">Explore the Program →</Button>
                </>
              ) : (
                <>
                  <Button to={getProfilePath('day-1')} kind="primary">Explore the Program →</Button>
                  <Button to={getProfilePath('workshops')} kind="secondary">View Workshops →</Button>
                </>
              )}
            </div>
            <StickerAccent src={sticker09} alt="" className="sticker--final" rotate={-7} delay={0.2} />
          </div>
        </motion.section>
      </div>
    </>
  )
}

export default Home

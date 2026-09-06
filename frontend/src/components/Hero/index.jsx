import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import { useAuth } from '../../context/AuthContext'
import heroArtwork from '../../assets/qiskit/hero-1-without-title.png.png'

const Hero = () => {
  const sectionRef = useRef(null)
  const contentRef = useRef(null)
  const artworkRef = useRef(null)
  const badgeRef = useRef(null)
  const storyRefs = useRef([])
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()

  const handleRegister = () => {
    navigate('/register')
  }

  const handleExploreEvent = () => {
    const eventSection = document.getElementById('home-event')
    if (eventSection) {
      eventSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    if (!sectionRef.current) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        sectionRef.current,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: 'power2.out',
        },
      )

      gsap.fromTo(
        '.hero__content > *',
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.08,
          ease: 'power2.out',
        },
      )

      gsap.fromTo(
        '.hero__actions .button',
        { opacity: 0, scale: 0.88 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.38,
          stagger: 0.08,
          ease: 'back.out(1.8)',
        },
      )

      gsap.fromTo(
        storyRefs.current,
        { opacity: 0, y: 42 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          stagger: 0.18,
          ease: 'power2.out',
        },
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section className="hero" ref={sectionRef}>
      <div className="hero__background" aria-hidden="true">
        <img src={heroArtwork} alt="" ref={artworkRef} />
      </div>

      <div className="container hero__inner">
        <div className="hero__content" ref={contentRef}>
          <span className="hero__badge" ref={badgeRef}>Qiskit Fall Fest 2026</span>
          <h1 className="hero__title">
            Qiskit Fall Fest <span>2026</span>
          </h1>
          <p className="hero__meta">
            <span>Centurion University of Technology and Management</span>
            <span>Vizianagaram</span>
          </p>
          <p className="hero__supporting-copy">
            Explore quantum computing, learn with Qiskit, build hands-on skills, and connect through workshops, collaboration, and innovation.
          </p>
          <div className="hero__actions" aria-label="Hero actions">
            {!isLoggedIn && (
              <button type="button" className="button button--primary" onClick={handleRegister}>Register</button>
            )}
            <button type="button" className="button button--secondary" onClick={handleExploreEvent}>Explore Event</button>
          </div>
        </div>
      </div>

      <div className="hero__story" aria-label="Quantum event overview">
        <div className="container hero__story-inner">
          <div className="hero__story-card" ref={(el) => { storyRefs.current[0] = el }}>
            <span>Explore</span>
            <strong>Quantum computing</strong>
          </div>
          <div className="hero__story-card" ref={(el) => { storyRefs.current[1] = el }}>
            <span>Learn</span>
            <strong>With Qiskit</strong>
          </div>
          <div className="hero__story-card" ref={(el) => { storyRefs.current[2] = el }}>
            <span>Build</span>
            <strong>Hands-on skills</strong>
          </div>
          <div className="hero__story-card" ref={(el) => { storyRefs.current[3] = el }}>
            <span>Connect</span>
            <strong>Innovate together</strong>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero

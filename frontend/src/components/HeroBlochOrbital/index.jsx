import { useEffect, useId, useRef, useState } from 'react'

/**
 * MiniatureBlochSphereSvg
 *
 * Renders the mathematically styled SVG miniature Bloch sphere
 * with unique gradient and filter IDs to prevent DOM collision.
 */
const MiniatureBlochSphereSvg = ({ bodyGradId, auraGradId, vectorAuraId }) => (
  <svg
    className="hero-bloch-orbital__svg"
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      {/* Radial gradient for sphere glass body */}
      <radialGradient id={bodyGradId} cx="36%" cy="32%" r="68%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.96" />
        <stop offset="45%" stopColor="#f5eefc" stopOpacity="0.88" />
        <stop offset="85%" stopColor="#eddffb" stopOpacity="0.92" />
        <stop offset="100%" stopColor="#dfcaf5" stopOpacity="0.95" />
      </radialGradient>

      {/* Pink/purple quantum aura */}
      <radialGradient id={auraGradId} cx="50%" cy="50%" r="50%">
        <stop offset="60%" stopColor="#ff4fa3" stopOpacity="0.32" />
        <stop offset="100%" stopColor="#ff4fa3" stopOpacity="0" />
      </radialGradient>

      {/* State vector endpoint glow filter */}
      <filter id={vectorAuraId} x="-40%" y="-40%" width="180%" height="180%">
        <feDropShadow dx="0" dy="0" stdDeviation="1.8" floodColor="#ff4fa3" floodOpacity="0.85" />
      </filter>
    </defs>

    {/* Subtle external aura glow */}
    <circle cx="50" cy="50" r="46" fill={`url(#${auraGradId})`} />

    {/* Sphere Body */}
    <circle
      cx="50"
      cy="50"
      r="38"
      fill={`url(#${bodyGradId})`}
      stroke="rgba(120, 89, 202, 0.45)"
      strokeWidth="1.4"
    />

    {/* Back Latitudes (subtle dashed arcs) */}
    <ellipse
      cx="50"
      cy="34"
      rx="33"
      ry="7.5"
      stroke="rgba(120, 89, 202, 0.22)"
      strokeWidth="0.8"
      strokeDasharray="2.2 2.2"
    />
    <ellipse
      cx="50"
      cy="66"
      rx="33"
      ry="7.5"
      stroke="rgba(120, 89, 202, 0.22)"
      strokeWidth="0.8"
      strokeDasharray="2.2 2.2"
    />

    {/* Back Meridians (subtle vertical wireframe) */}
    <ellipse
      cx="50"
      cy="50"
      rx="14"
      ry="38"
      stroke="rgba(120, 89, 202, 0.28)"
      strokeWidth="0.9"
    />
    <ellipse
      cx="50"
      cy="50"
      rx="27"
      ry="38"
      stroke="rgba(120, 89, 202, 0.20)"
      strokeWidth="0.8"
      strokeDasharray="2.5 2.5"
    />

    {/* Equator (prominent horizontal reference plane) */}
    <ellipse
      cx="50"
      cy="50"
      rx="38"
      ry="11.5"
      stroke="rgba(120, 89, 202, 0.65)"
      strokeWidth="1.2"
    />

    {/* Axes */}
    {/* Z-Axis (Vertical) */}
    <line
      x1="50"
      y1="9"
      x2="50"
      y2="91"
      stroke="rgba(77, 47, 116, 0.6)"
      strokeWidth="1.2"
    />
    {/* X-Axis (Equatorial Diagonal) */}
    <line
      x1="18"
      y1="56"
      x2="82"
      y2="44"
      stroke="rgba(120, 89, 202, 0.48)"
      strokeWidth="1.0"
    />
    {/* Y-Axis (Cross Diagonal) */}
    <line
      x1="22"
      y1="44"
      x2="78"
      y2="56"
      stroke="rgba(120, 89, 202, 0.35)"
      strokeWidth="0.9"
      strokeDasharray="2 2"
    />

    {/* North (|0⟩) and South (|1⟩) Pole Markers */}
    <circle cx="50" cy="12" r="2.2" fill="#7b5ad8" />
    <circle cx="50" cy="88" r="2.2" fill="#7b5ad8" />

    {/* Quantum State Vector |ψ⟩ */}
    <line
      x1="50"
      y1="50"
      x2="69"
      y2="27"
      stroke="#ff4fa3"
      strokeWidth="2.4"
      strokeLinecap="round"
    />

    {/* Vector endpoint glowing marker */}
    <circle
      cx="69"
      cy="27"
      r="4.8"
      fill="rgba(255, 79, 163, 0.38)"
    />
    <circle
      cx="69"
      cy="27"
      r="3.2"
      fill="#ff4fa3"
      stroke="#ffffff"
      strokeWidth="1.3"
      filter={`url(#${vectorAuraId})`}
    />
  </svg>
)

/**
 * HeroBlochOrbital Component
 *
 * Synchronizes TWO miniature Bloch spheres counter-rotating along the SAME
 * large elliptical orbit surrounding the hero heading ("Qiskit Fall Fest 2026").
 *
 * TARGET BEHAVIOR & MATHEMATICS:
 * 1. TWO EXACT MEETING POINTS PER ORBIT:
 *    - MEETING POINT 1 (elapsed = 0, k * duration):
 *      Upper/central area around upper part of "Fall": (50.0%, 10.0%)
 *    - MEETING POINT 2 (elapsed = duration / 2, (k + 0.5) * duration):
 *      Lower/central area around "2026": (50.0%, 78.0%)
 *    Both points are opposite points on the same ellipse.
 *
 * 2. COUNTER-ROTATING PARAMETERS (Shared Animation Clock):
 *    omega = (2 * Math.PI) / duration
 *    tA = meetingAngle + omega * elapsed (Clockwise: moves right and down)
 *    tB = meetingAngle - omega * elapsed (Counter-Clockwise: moves left and down)
 *    where meetingAngle = -Math.PI / 2 (Apex of ellipse above "Fall").
 *
 * 3. FRONT/BEHIND DEPTH:
 *    Orbital depth = cos(t):
 *    - Right half (cos(t) >= 0): z-index: 3 (in front of .hero__title at z-index: 2)
 *    - Left half  (cos(t) < 0):  z-index: 1 (behind .hero__title)
 *    - Collision points (cos(t) = 0): z-index: 3 (clean overlap)
 *
 * 4. INDEPENDENT SELF-ROTATION:
 *    Each sphere independently spins on its center axis via CSS keyframes.
 */
const HeroBlochOrbital = ({
  className = '',
  reducedMotion: propReducedMotion,
  meetingAngle: propMeetingAngle,
  duration = 16000,
}) => {
  const containerRefA = useRef(null)
  const moverRefA = useRef(null)
  const containerRefB = useRef(null)
  const moverRefB = useRef(null)

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const uniqueId = useId().replace(/[^a-zA-Z0-9_-]/g, '')

  // Meeting Point 1 is at the upper-central region above "Fall" (-PI / 2)
  const meetingAngle = propMeetingAngle !== undefined ? propMeetingAngle : -Math.PI / 2

  // Listen for prefers-reduced-motion preference changes
  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (e) => {
      setPrefersReducedMotion(e.matches)
    }

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange)
      return () => mediaQuery.removeListener(handleChange)
    }
  }, [])

  const shouldReduce = propReducedMotion !== undefined ? propReducedMotion : prefersReducedMotion

  useEffect(() => {
    // Ellipse center and rotation:
    // cx = 50% (centered on hero title), cy = 44% (centered between "Fall" and "2026")
    // rotation = 0 so Meeting Point 1 is directly above "Fall" and Meeting Point 2 is directly below "2026"
    const cx = 50.0
    const cy = 44.0
    const rotation = 0.0
    const cosR = Math.cos(rotation)
    const sinR = Math.sin(rotation)

    // Responsive ellipse semi-axes surrounding "Qiskit Fall Fest 2026":
    // Desktop: rx = 43.0%, ry = 34.0%
    //   -> Meeting Point 1: (50.0%, 10.0%) [Upper Fall]
    //   -> Meeting Point 2: (50.0%, 78.0%) [Lower 2026]
    //   -> Left/Right: (7.0%, 44.0%) / (93.0%, 44.0%)
    // Tablet:  rx = 39.0%, ry = 32.0%
    // Mobile:  rx = 35.0%, ry = 29.0%
    const getDimensions = () => {
      const w = typeof window !== 'undefined' ? window.innerWidth : 1200
      if (w < 720) return { rx: 35.0, ry: 29.0, cy: 43.0 }
      if (w < 1024) return { rx: 39.0, ry: 32.0, cy: 44.0 }
      return { rx: 43.0, ry: 34.0, cy: 44.0 }
    }

    let dims = getDimensions()

    const handleResize = () => {
      dims = getDimensions()
    }
    window.addEventListener('resize', handleResize)

    // Ellipse position function (parametric tilted ellipse)
    const getEllipsePos = (angle) => {
      const u = dims.rx * Math.cos(angle)
      const v = dims.ry * Math.sin(angle)
      return {
        x: cx + u * cosR - v * sinR,
        y: (dims.cy ?? cy) + u * sinR + v * cosR,
      }
    }

    if (shouldReduce) {
      // Place spheres statically at the two meeting points (Meeting Point 1 & Meeting Point 2)
      const pos1 = getEllipsePos(meetingAngle)
      const pos2 = getEllipsePos(meetingAngle + Math.PI)

      if (moverRefA.current) {
        moverRefA.current.style.transform = `translate3d(${pos1.x.toFixed(2)}%, ${pos1.y.toFixed(2)}%, 0) scale(1)`
        moverRefA.current.style.opacity = '0.95'
        moverRefA.current.style.zIndex = '1'
      }
      if (containerRefA.current) {
        containerRefA.current.style.zIndex = '1'
      }

      if (moverRefB.current) {
        moverRefB.current.style.transform = `translate3d(${pos2.x.toFixed(2)}%, ${pos2.y.toFixed(2)}%, 0) scale(1)`
        moverRefB.current.style.opacity = '0.95'
        moverRefB.current.style.zIndex = '1'
      }
      if (containerRefB.current) {
        containerRefB.current.style.zIndex = '1'
      }

      return () => {
        window.removeEventListener('resize', handleResize)
      }
    }

    let rafId = null
    let startTime = null
    const omega = (2 * Math.PI) / duration

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime

      // Counter-rotating angles from shared clock:
      // Sphere A: travels clockwise around the ellipse
      // Sphere B: travels counter-clockwise around the ellipse
      const tA = meetingAngle + omega * elapsed
      const tB = meetingAngle - omega * elapsed

      const posA = getEllipsePos(tA)
      const posB = getEllipsePos(tB)

      // Orbital depth: cos(t) determines front/back relative to the heading
      // - Right half (cos(t) >= 0): z-index: 3 (in front of .hero__title at z-index: 2)
      // - Left half  (cos(t) < 0):  z-index: 1 (behind .hero__title at z-index: 2)
      // At collision points (cos(t) = 0), both have z-index: 3 for clean visual overlap
      const depthA = Math.cos(tA)
      const isFrontA = depthA >= 0
      const scaleA = (0.98 + 0.08 * depthA).toFixed(3)
      const opacityA = isFrontA ? 1.0 : 0.88
      const layerZA = isFrontA ? '3' : '1'

      const depthB = Math.cos(tB)
      const isFrontB = depthB >= 0
      const scaleB = (0.98 + 0.08 * depthB).toFixed(3)
      const opacityB = isFrontB ? 1.0 : 0.88
      const layerZB = isFrontB ? '3' : '1'

      // Apply GPU-accelerated translate3d transforms
      if (moverRefA.current) {
        moverRefA.current.style.transform = `translate3d(${posA.x.toFixed(2)}%, ${posA.y.toFixed(2)}%, 0) scale(${scaleA})`
        moverRefA.current.style.opacity = opacityA
        moverRefA.current.style.zIndex = layerZA
      }
      if (containerRefA.current) {
        containerRefA.current.style.zIndex = layerZA
      }

      if (moverRefB.current) {
        moverRefB.current.style.transform = `translate3d(${posB.x.toFixed(2)}%, ${posB.y.toFixed(2)}%, 0) scale(${scaleB})`
        moverRefB.current.style.opacity = opacityB
        moverRefB.current.style.zIndex = layerZB
      }
      if (containerRefB.current) {
        containerRefB.current.style.zIndex = layerZB
      }

      rafId = requestAnimationFrame(animate)
    }

    rafId = requestAnimationFrame(animate)

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      window.removeEventListener('resize', handleResize)
    }
  }, [shouldReduce, meetingAngle, duration])

  return (
    <>
      {/* Sphere A - Clockwise Counter-Rotating Bloch Sphere */}
      <div
        ref={containerRefA}
        className={`hero-bloch-orbital ${shouldReduce ? 'hero-bloch-orbital--reduced-motion' : ''} ${className}`.trim()}
        aria-hidden="true"
      >
        <div ref={moverRefA} className="hero-bloch-orbital__mover">
          <div className="hero-bloch-orbital__sphere-wrapper">
            <div className="hero-bloch-orbital__sphere-spin">
              <MiniatureBlochSphereSvg
                bodyGradId={`miniBlochBody-A-${uniqueId}`}
                auraGradId={`miniBlochAura-A-${uniqueId}`}
                vectorAuraId={`miniVectorAura-A-${uniqueId}`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sphere B - Counter-Clockwise Counter-Rotating Bloch Sphere */}
      <div
        ref={containerRefB}
        className={`hero-bloch-orbital hero-bloch-orbital--opposite ${shouldReduce ? 'hero-bloch-orbital--reduced-motion' : ''} ${className}`.trim()}
        aria-hidden="true"
      >
        <div ref={moverRefB} className="hero-bloch-orbital__mover">
          <div className="hero-bloch-orbital__sphere-wrapper">
            <div className="hero-bloch-orbital__sphere-spin">
              <MiniatureBlochSphereSvg
                bodyGradId={`miniBlochBody-B-${uniqueId}`}
                auraGradId={`miniBlochAura-B-${uniqueId}`}
                vectorAuraId={`miniVectorAura-B-${uniqueId}`}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default HeroBlochOrbital

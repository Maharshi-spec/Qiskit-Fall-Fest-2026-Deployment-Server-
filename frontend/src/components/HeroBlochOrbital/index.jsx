import { useEffect, useRef, useState } from 'react'

/**
 * HeroBlochOrbital Component
 *
 * Renders a miniature, mathematically styled Bloch Sphere that continuously
 * orbits along a LARGE tilted elliptical path (the red reference trajectory)
 * surrounding the hero heading ("Qiskit Fall Fest 2026").
 *
 * Motion Architecture:
 * 1. Orbital movement: Smooth parametric tilted ellipse (rotation ~23° upward
 *    from left to right) calculated via requestAnimationFrame and applied via
 *    GPU-accelerated translate3d transforms.
 * 2. Front/Behind Layering: Dynamically alternates z-index between:
 *    - Front half: z-index: 3 (in front of .hero__title at z-index: 2)
 *    - Back half:  z-index: 1 (behind .hero__title)
 * 3. Sphere Self-Rotation: Independent continuous 360° spin on its own center axis
 *    driven by CSS keyframes on the inner wrapper.
 *
 * Fully respects prefers-reduced-motion.
 */
const HeroBlochOrbital = ({ className = '', reducedMotion: propReducedMotion }) => {
  const containerRef = useRef(null)
  const moverRef = useRef(null)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

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

  // Parametric tilted ellipse animation loop
  useEffect(() => {
    if (shouldReduce) {
      // Place sphere in a static, tasteful position behind the title
      if (moverRef.current) {
        moverRef.current.style.transform = 'translate3d(18.9%, 70.0%, 0) scale(1)'
        moverRef.current.style.opacity = '0.95'
        moverRef.current.style.zIndex = '1'
      }
      if (containerRef.current) {
        containerRef.current.style.zIndex = '1'
      }
      return
    }

    let rafId = null
    let startTime = null
    const DURATION = 16000 // 16s for a majestic, smooth, cinematic orbit

    // Responsive ellipse semi-axes:
    // Desktop: rx = 31.5%, ry = 28.5% (span: X: 18.9% - 81.1%, Y: 12.0% - 70.0%)
    // Tablet:  rx = 28.5%, ry = 25.0% (span: X: 22.0% - 78.0%, Y: 15.4% - 66.6%)
    // Mobile:  rx = 25.0%, ry = 21.0% (span: X: 25.6% - 74.4%, Y: 19.3% - 62.7%)
    const getDimensions = () => {
      const w = typeof window !== 'undefined' ? window.innerWidth : 1200
      if (w < 720) return { rx: 25.0, ry: 21.0 }
      if (w < 1024) return { rx: 28.5, ry: 25.0 }
      return { rx: 31.5, ry: 28.5 }
    }

    let dims = getDimensions()

    const handleResize = () => {
      dims = getDimensions()
    }
    window.addEventListener('resize', handleResize)

    // Center and tilt parameters:
    // cx = 50% (centered on hero title), cy = 41% (aligned with title center)
    // theta = -23 degrees (tilt upward from lower-left to upper-right)
    const cx = 50.0
    const cy = 41.0
    const theta = -23.0 * (Math.PI / 180)
    const cosT = Math.cos(theta)
    const sinT = Math.sin(theta)

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime
      const progress = (elapsed % DURATION) / DURATION // Normalized 0 -> 1

      // t starts at PI (lower-left), moves toward 0 (upper-right in front),
      // then -PI (top/back loop returning to lower-left)
      const t = Math.PI - 2 * Math.PI * progress
      const u = dims.rx * Math.cos(t)
      const v = dims.ry * Math.sin(t)

      // Rotated parametric coordinates
      const x = cx + u * cosT - v * sinT
      const y = cy + u * sinT + v * cosT

      // Depth: front half when sin(t) >= 0 (traveling up/right across the title)
      // Back half when sin(t) < 0 (returning down/left behind the title)
      const sinVal = Math.sin(t)
      const isFront = sinVal >= 0

      // Continuous 3D depth scaling and subtle opacity modulation
      const scale = (0.99 + 0.07 * sinVal).toFixed(3)
      const opacity = isFront ? 1.0 : 0.88
      const layerZ = isFront ? '3' : '1'

      if (moverRef.current) {
        moverRef.current.style.transform = `translate3d(${x.toFixed(2)}%, ${y.toFixed(2)}%, 0) scale(${scale})`
        moverRef.current.style.opacity = opacity
        moverRef.current.style.zIndex = layerZ
      }

      if (containerRef.current) {
        containerRef.current.style.zIndex = layerZ
      }

      rafId = requestAnimationFrame(animate)
    }

    rafId = requestAnimationFrame(animate)

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      window.removeEventListener('resize', handleResize)
    }
  }, [shouldReduce])

  return (
    <div
      ref={containerRef}
      className={`hero-bloch-orbital ${shouldReduce ? 'hero-bloch-orbital--reduced-motion' : ''} ${className}`.trim()}
      aria-hidden="true"
    >
      <div ref={moverRef} className="hero-bloch-orbital__mover">
        <div className="hero-bloch-orbital__sphere-wrapper">
          <div className="hero-bloch-orbital__sphere-spin">
            <svg
              className="hero-bloch-orbital__svg"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Radial gradient for sphere glass body */}
                <radialGradient id="miniBlochBody" cx="36%" cy="32%" r="68%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.96" />
                  <stop offset="45%" stopColor="#f5eefc" stopOpacity="0.88" />
                  <stop offset="85%" stopColor="#eddffb" stopOpacity="0.92" />
                  <stop offset="100%" stopColor="#dfcaf5" stopOpacity="0.95" />
                </radialGradient>

                {/* Pink/purple quantum aura */}
                <radialGradient id="miniBlochAura" cx="50%" cy="50%" r="50%">
                  <stop offset="60%" stopColor="#ff4fa3" stopOpacity="0.32" />
                  <stop offset="100%" stopColor="#ff4fa3" stopOpacity="0" />
                </radialGradient>

                {/* State vector endpoint glow filter */}
                <filter id="miniVectorAura" x="-40%" y="-40%" width="180%" height="180%">
                  <feDropShadow dx="0" dy="0" stdDeviation="1.8" floodColor="#ff4fa3" floodOpacity="0.85" />
                </filter>
              </defs>

              {/* Subtle external aura glow */}
              <circle cx="50" cy="50" r="46" fill="url(#miniBlochAura)" />

              {/* Sphere Body */}
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="url(#miniBlochBody)"
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
              {/* Vector arrow from origin (50, 50) to superposition state point */}
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
                filter="url(#miniVectorAura)"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HeroBlochOrbital

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { NavLink, useLocation } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import qiskitBadge from '../../assets/qiskit/badge-pink.png.png'

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Register', to: '/register' },
  { label: 'Hackathon', to: '/hackathon' },
  { label: 'Workshops', to: '/workshops' },
  { label: 'Attendance', to: '/attendance' },
  { label: 'Day 1', to: '/day-1', isDay: true },
  { label: 'Day 2', to: '/day-2', isDay: true },
  { label: 'Day 3', to: '/day-3', isDay: true },
  { label: 'Day 4', to: '/day-4', isDay: true },
  { label: 'Certificates', to: '/certificates' },
]

const dayNavItems = navItems.filter((item) => item.isDay)
const primaryNavItems = navItems.filter((item) => !item.isDay)

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const prefersReducedMotion = useReducedMotion()
  const location = useLocation()
  const logoRef = useRef(null)
  const animatedLogoRef = useRef(null)
  const { isLoggedIn, openLoginModal, logout } = useAuth()

  const authActions = (
    <div className="topbar__actions">
      <button
        type="button"
        className="topbar__action topbar__action--login"
        onClick={isLoggedIn ? logout : openLoginModal}
      >
        {isLoggedIn ? 'Logout' : 'Login'}
      </button>
      <NavLink to="/register" className="topbar__action topbar__action--register">
        Register
      </NavLink>
    </div>
  )

  const renderNav = (items, className) => (
    <motion.nav
      className={className}
      aria-label="Main navigation"
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      {items.map((item) => (
        <motion.div
          key={item.to}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <NavLink
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `nav__menu-link ${item.isDay ? 'nav__menu-link--day' : ''} ${isActive ? 'nav__menu-link--active' : ''}`}
            onClick={() => item.isDay || setIsOpen(false)}
          >{({ isActive }) => (
            <>
              {item.label}
              {item.isDay && isActive && (
                <motion.span
                  layoutId="active-day-indicator"
                  className="nav__day-indicator"
                  transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: 'easeOut' }}
                />
              )}
            </>
          )}</NavLink>
        </motion.div>
      ))}
    </motion.nav>
  )

  useEffect(() => {
    const logo = logoRef.current
    const animatedLogo = animatedLogoRef.current
    const target = document.getElementById('registration-anchor-heading')
    if (!logo || !animatedLogo || !target || prefersReducedMotion) {
      if (logo) logo.style.opacity = '1'
      if (animatedLogo) animatedLogo.style.opacity = '0'
      return undefined
    }

    let frame = 0
    let lastTime = 0
    let orbitDistance = 0
    let selfRotation = 0
    let isOrbiting = false
    let orbitPath = null
    const sphereImage = animatedLogo.querySelector('img')

    const buildOrbitPath = (radiusX, radiusY) => {
      const points = []
      const cumulativeLengths = [0]
      const pointCount = 360
      const orbitTilt = -Math.PI * 0.16
      for (let index = 0; index <= pointCount; index += 1) {
        const angle = -Math.PI * 0.38 + (index / pointCount) * Math.PI * 2
        const ellipseX = radiusX * Math.cos(angle)
        const ellipseY = radiusY * Math.sin(angle)
        const point = {
          x: ellipseX * Math.cos(orbitTilt) - ellipseY * Math.sin(orbitTilt),
          y: ellipseX * Math.sin(orbitTilt) + ellipseY * Math.cos(orbitTilt),
          z: Math.sin(angle),
        }
        points.push(point)
        if (index > 0) {
          const previous = points[index - 1]
          cumulativeLengths.push(cumulativeLengths[index - 1] + Math.hypot(point.x - previous.x, point.y - previous.y))
        }
      }
      return { points, cumulativeLengths, length: cumulativeLengths[pointCount], radiusX, radiusY }
    }

    const getPointAtDistance = (path, distance) => {
      const normalizedDistance = distance % path.length
      let low = 0
      let high = path.cumulativeLengths.length - 1
      while (low < high) {
        const middle = Math.floor((low + high) / 2)
        if (path.cumulativeLengths[middle] < normalizedDistance) low = middle + 1
        else high = middle
      }
      const nextIndex = Math.max(1, low)
      const previousIndex = nextIndex - 1
      const segmentStart = path.cumulativeLengths[previousIndex]
      const segmentLength = path.cumulativeLengths[nextIndex] - segmentStart || 1
      const progress = (normalizedDistance - segmentStart) / segmentLength
      const start = path.points[previousIndex]
      const end = path.points[nextIndex]
      return {
        x: start.x + (end.x - start.x) * progress,
        y: start.y + (end.y - start.y) * progress,
        z: start.z + (end.z - start.z) * progress,
      }
    }

    const updateLogoPosition = (time = performance.now()) => {
      frame = 0
      const logoRect = logo.getBoundingClientRect()
      const targetRect = target.getBoundingClientRect()
      const headingText = target.firstChild
      const getTextPoint = (characterIndex) => {
        if (!headingText || headingText.nodeType !== Node.TEXT_NODE) return { x: targetRect.left, y: targetRect.top }
        const range = document.createRange()
        range.setStart(headingText, characterIndex)
        range.setEnd(headingText, characterIndex + 1)
        const rect = range.getBoundingClientRect()
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
      }
      const secureStart = target.textContent.indexOf('Secure')
      const spotStart = target.textContent.indexOf('spot')
      const uPoint = getTextPoint(secureStart >= 0 ? secureStart + 4 : 0)
      const tPoint = getTextPoint(spotStart >= 0 ? spotStart : 0)
      const targetFocusY = window.innerHeight * 0.68
      const targetPassed = targetRect.bottom < 0
      const targetReached = targetRect.top <= targetFocusY && !targetPassed
      const startY = Math.max(0, targetRect.top + window.scrollY - window.innerHeight * 0.86)
      const endY = Math.max(startY + 1, targetRect.top + window.scrollY - window.innerHeight * 0.32)
      const progress = Math.min(1, Math.max(0, (window.scrollY - startY) / (endY - startY)))
      const startX = logoRect.left + logoRect.width / 2
      const startViewportY = logoRect.top + logoRect.height / 2
      const targetX = (uPoint.x + tPoint.x) / 2
      const targetViewportY = (uPoint.y + tPoint.y) / 2
      const travelProgress = Math.min(progress, 1)
      const radiusX = Math.max(42, Math.abs(tPoint.x - uPoint.x) * 0.68)
      const radiusY = Math.max(28, targetRect.height * 0.9)
      if (!orbitPath || Math.abs(orbitPath.radiusX - radiusX) > 0.5 || Math.abs(orbitPath.radiusY - radiusY) > 0.5) {
        orbitPath = buildOrbitPath(radiusX, radiusY)
      }
      if (targetReached) {
        if (!isOrbiting) {
          isOrbiting = true
          lastTime = time
          orbitDistance = 0
        }
        const deltaTime = Math.min(0.05, Math.max(0, (time - lastTime) / 1000))
        lastTime = time
        orbitDistance += deltaTime * 42
        selfRotation += deltaTime * 34
        const point = getPointAtDistance(orbitPath, orbitDistance)
        const depth = point.z * 10
        const scale = 0.95 + Math.max(0, point.z) * 0.035
        animatedLogo.style.transform = `translate3d(${targetX + point.x}px, ${targetViewportY + point.y}px, ${depth}px) translate(-50%, -50%) scale(${scale})`
        sphereImage.style.transform = `rotate3d(0.25, 1, 0.2, ${selfRotation}deg)`
        animatedLogo.style.opacity = '1'
        logo.style.opacity = '0.2'
        requestUpdate()
        return
      }

      isOrbiting = false
      lastTime = time
      if (targetPassed) {
        const returnProgress = Math.min(1, Math.max(0, -targetRect.bottom / (window.innerHeight * 0.5)))
        const returnX = targetX + (startX - targetX) * returnProgress
        const returnY = targetViewportY + (startViewportY - targetViewportY) * returnProgress
        animatedLogo.style.transform = `translate3d(${returnX}px, ${returnY}px, 0) translate(-50%, -50%) scale(${1 - returnProgress * 0.05})`
        animatedLogo.style.opacity = returnProgress < 1 ? '1' : '0'
        logo.style.opacity = returnProgress < 1 ? '0.2' : '1'
        return
      }

      const x = startX + (targetX - startX) * travelProgress
      const y = startViewportY + (targetViewportY - startViewportY) * travelProgress
      animatedLogo.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${1 - progress * 0.08})`
      animatedLogo.style.opacity = progress > 0.02 ? '1' : '0'
      logo.style.opacity = progress > 0.03 ? '0.2' : '1'
    }

    const requestUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(updateLogoPosition)
    }
    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestUpdate)
    requestUpdate()

    return () => {
      window.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', requestUpdate)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [location.pathname, prefersReducedMotion])

  return (
    <header className="topbar">
      <div className="topbar__inner">
        <div className="topbar__left">
          <button
            type="button"
            className="nav-toggle"
            aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isOpen}
            onClick={() => setIsOpen((current) => !current)}
          >
            <span />
            <span />
            <span />
          </button>

          <NavLink to="/" className="brand" aria-label="Qiskit Fall Fest home">
            <img ref={logoRef} src={qiskitBadge} alt="Qiskit Fall Fest 2026 badge" className="brand__logo" />
            <span className="brand__text">Qiskit Fall Fest 2026</span>
          </NavLink>
        </div>

        {renderNav(dayNavItems, 'nav nav--days')}

        <div className="topbar__right">
          {authActions}
        </div>
      </div>

      <span ref={animatedLogoRef} aria-hidden="true" className="scroll-orbit-logo">
        <img src={qiskitBadge} alt="" />
      </span>

      <AnimatePresence initial={false}>
        {isOpen && (
          <div className="nav-panel-wrap">
            {renderNav(primaryNavItems, 'nav nav--menu nav--open')}
          </div>
        )}
      </AnimatePresence>
    </header>
  )
}

export default Navbar

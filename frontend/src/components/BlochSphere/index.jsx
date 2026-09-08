import { useEffect, useRef, useState, useCallback } from 'react'

// ─── Mathematical Constants & Helpers ─────────────────────────────────────────
const TWO_PI = Math.PI * 2
const HALF_PI = Math.PI / 2

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

/**
 * 3D Orthographic Projection using Camera Yaw & Pitch
 *
 * Camera basis:
 * - Right: (-sin(yaw), cos(yaw), 0)
 * - Up:    (-sin(pitch)*cos(yaw), -sin(pitch)*sin(yaw), cos(pitch))
 * - Depth: ( cos(pitch)*cos(yaw),  cos(pitch)*sin(yaw), sin(pitch))
 *
 * Transformed depth > 0 is front hemisphere (facing viewer), < 0 is back hemisphere.
 */
const project3D = (x, y, z, yaw, pitch, cx, cy, R) => {
  const cosY = Math.cos(yaw)
  const sinY = Math.sin(yaw)
  const cosP = Math.cos(pitch)
  const sinP = Math.sin(pitch)

  const xCam = -x * sinY + y * cosY
  const yCam = -x * sinP * cosY - y * sinP * sinY + z * cosP
  const zCam =  x * cosP * cosY + y * cosP * sinY + z * sinP

  return {
    x: cx + xCam * R,
    y: cy - yCam * R,
    z: zCam,
  }
}

/**
 * Single source of truth: compute Bloch vector and probabilities from theta and phi
 */
const computeQuantumState = (theta, phi) => {
  // Bloch vector on unit sphere (R = 1)
  const x = Math.sin(theta) * Math.cos(phi)
  const y = Math.sin(theta) * Math.sin(phi)
  const z = Math.cos(theta)

  // Validation: x^2 + y^2 + z^2 = 1
  const magnitude = Math.sqrt(x * x + y * y + z * z)
  if (process.env.NODE_ENV !== 'production') {
    console.assert(Math.abs(magnitude - 1) < 1e-10, `Vector magnitude != 1: ${magnitude}`)
  }

  // Amplitudes: alpha = cos(theta / 2), beta = exp(i*phi) * sin(theta / 2)
  const alpha = Math.cos(theta / 2)
  const betaMag = Math.sin(theta / 2)

  // Probabilities in computational basis: P(|0>) = (1 + z)/2, P(|1>) = (1 - z)/2
  const p0 = alpha * alpha
  const p1 = betaMag * betaMag

  if (process.env.NODE_ENV !== 'production') {
    console.assert(Math.abs(p0 + p1 - 1) < 1e-10, `p0 + p1 != 1: ${p0 + p1}`)
  }

  return { x, y, z, alpha, betaMag, p0, p1 }
}

/**
 * Format mathematical state string: |ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)sin(θ/2)|1⟩
 */
const formatQuantumState = (theta, phi) => {
  const { alpha, betaMag } = computeQuantumState(theta, phi)
  const phiDeg = Math.round(((phi * 180) / Math.PI) % 360)
  const normPhiDeg = (phiDeg + 360) % 360

  if (Math.abs(betaMag) < 1e-4) return '|0⟩'
  if (Math.abs(alpha) < 1e-4) {
    if (normPhiDeg === 0) return '|1⟩'
    return `e^(i${normPhiDeg}°)|1⟩`
  }

  const alphaStr = alpha.toFixed(3)
  const betaStr = betaMag.toFixed(3)

  if (normPhiDeg === 0) {
    return `${alphaStr}|0⟩ + ${betaStr}|1⟩`
  }
  if (normPhiDeg === 180) {
    return `${alphaStr}|0⟩ - ${betaStr}|1⟩`
  }
  return `${alphaStr}|0⟩ + e^(i${normPhiDeg}°)${betaStr}|1⟩`
}

// ─── Basis State Presets ──────────────────────────────────────────────────────
const PRESETS = [
  { label: '|0⟩', theta: 0, phi: 0 },
  { label: '|1⟩', theta: Math.PI, phi: 0 },
  { label: '|+⟩', theta: HALF_PI, phi: 0 },
  { label: '|−⟩', theta: HALF_PI, phi: Math.PI },
  { label: '|+i⟩', theta: HALF_PI, phi: HALF_PI },
  { label: '|−i⟩', theta: HALF_PI, phi: (3 * Math.PI) / 2 },
  { label: 'Evolve', isEvolving: true },
]

// ─── BlochSphere Component ───────────────────────────────────────────────────
const BlochSphere = ({ reducedMotion = false }) => {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const lastStateUpdateRef = useRef(0)

  // Camera orientation (yaw & pitch) - independent of quantum state
  const cameraRef = useRef({
    yaw: 0.65, // ~37 degrees for classic perspective
    pitch: 0.40, // ~23 degrees elevated
    autoSpin: !reducedMotion,
  })

  // Pointer drag tracking
  const pointerRef = useRef({
    active: false,
    moved: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
  })

  // Quantum state (theta, phi) - independent of camera
  const quantumStateRef = useRef({
    theta: Math.PI / 3, // 60 degrees (clean superposition)
    phi: Math.PI / 4,   // 45 degrees
    isEvolving: !reducedMotion,
  })

  // UI state for reactive readouts (updated at controlled rate, not 60fps React re-renders)
  const [theta, setTheta] = useState(quantumStateRef.current.theta)
  const [phi, setPhi] = useState(quantumStateRef.current.phi)
  const [autoSpin, setAutoSpin] = useState(!reducedMotion)
  const [activePreset, setActivePreset] = useState(!reducedMotion ? 'Evolve' : '|+⟩')

  // Respond to reducedMotion prop
  useEffect(() => {
    const shouldSpin = !reducedMotion
    cameraRef.current.autoSpin = shouldSpin
    setAutoSpin(shouldSpin)

    if (reducedMotion) {
      quantumStateRef.current.isEvolving = false
      setActivePreset('|+⟩')
      quantumStateRef.current.theta = HALF_PI
      quantumStateRef.current.phi = 0
      setTheta(HALF_PI)
      setPhi(0)
    }
  }, [reducedMotion])

  // Canvas drawing and animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const context = canvas.getContext('2d')
    if (!context) return undefined

    let disposed = false

    // Pre-generate 3D wireframe point coordinates
    const SEGMENTS = 72
    const equator3D = []
    const meridianXZ3D = []
    const meridianYZ3D = []
    const latPlus3D = []
    const latMinus3D = []

    const h = 0.5
    const latRadius = Math.sqrt(1 - h * h) // sqrt(1 - h^2)

    for (let i = 0; i <= SEGMENTS; i++) {
      const t = (i / SEGMENTS) * TWO_PI
      const cosT = Math.cos(t)
      const sinT = Math.sin(t)

      equator3D.push({ x: cosT, y: sinT, z: 0 })
      meridianXZ3D.push({ x: cosT, y: 0, z: sinT })
      meridianYZ3D.push({ x: 0, y: cosT, z: sinT })
      latPlus3D.push({ x: latRadius * cosT, y: latRadius * sinT, z: h })
      latMinus3D.push({ x: latRadius * cosT, y: latRadius * sinT, z: -h })
    }

    // Helper: draw wireframe curve split by depth (back/front)
    const drawCurvePass = (pts, isFront, strokeStyle, lineWidth, dash = null) => {
      context.strokeStyle = strokeStyle
      context.lineWidth = lineWidth
      if (dash) context.setLineDash(dash)
      else context.setLineDash([])

      let inPath = false
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i]
        const p1 = pts[i + 1]
        const zAvg = (p0.z + p1.z) / 2
        const matches = isFront ? zAvg >= -0.01 : zAvg < -0.01

        if (matches) {
          if (!inPath) {
            context.beginPath()
            context.moveTo(p0.x, p0.y)
            inPath = true
          }
          context.lineTo(p1.x, p1.y)
        } else if (inPath) {
          context.stroke()
          inPath = false
        }
      }
      if (inPath) {
        context.stroke()
      }
      context.setLineDash([])
    }

    // Helper: draw 3D axis with depth-aware styling
    const drawAxisSegment = (pStart, pEnd, isFront) => {
      const zAvg = (pStart.z + pEnd.z) / 2
      const matches = isFront ? zAvg >= -0.02 : zAvg < -0.02
      if (!matches) return

      context.beginPath()
      context.moveTo(pStart.x, pStart.y)
      context.lineTo(pEnd.x, pEnd.y)

      if (isFront) {
        context.strokeStyle = 'rgba(100, 70, 180, 0.75)'
        context.lineWidth = 1.6
        context.setLineDash([])
      } else {
        context.strokeStyle = 'rgba(140, 110, 210, 0.28)'
        context.lineWidth = 1.1
        context.setLineDash([4, 4])
      }
      context.stroke()
      context.setLineDash([])
    }

    const render = () => {
      const rect = canvas.getBoundingClientRect()
      const width = rect.width || 320
      const height = rect.height || 360
      const dpr = window.devicePixelRatio || 1

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr
        canvas.height = height * dpr
      }

      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      context.clearRect(0, 0, width, height)

      const cx = width / 2
      const cy = height / 2
      const R = Math.min(width, height) * 0.375

      const yaw = cameraRef.current.yaw
      const pitch = cameraRef.current.pitch

      const curTheta = quantumStateRef.current.theta
      const curPhi = quantumStateRef.current.phi

      // Project wireframe coordinates
      const projEquator = equator3D.map(p => project3D(p.x, p.y, p.z, yaw, pitch, cx, cy, R))
      const projMeridianXZ = meridianXZ3D.map(p => project3D(p.x, p.y, p.z, yaw, pitch, cx, cy, R))
      const projMeridianYZ = meridianYZ3D.map(p => project3D(p.x, p.y, p.z, yaw, pitch, cx, cy, R))
      const projLatPlus = latPlus3D.map(p => project3D(p.x, p.y, p.z, yaw, pitch, cx, cy, R))
      const projLatMinus = latMinus3D.map(p => project3D(p.x, p.y, p.z, yaw, pitch, cx, cy, R))

      // Origin and Axis Points (extent 1.22 * R)
      const AXIS_EXTENT = 1.22
      const originProj = project3D(0, 0, 0, yaw, pitch, cx, cy, R)
      const xPos = project3D(AXIS_EXTENT, 0, 0, yaw, pitch, cx, cy, R)
      const xNeg = project3D(-AXIS_EXTENT, 0, 0, yaw, pitch, cx, cy, R)
      const yPos = project3D(0, AXIS_EXTENT, 0, yaw, pitch, cx, cy, R)
      const yNeg = project3D(0, -AXIS_EXTENT, 0, yaw, pitch, cx, cy, R)
      const zPos = project3D(0, 0, AXIS_EXTENT, yaw, pitch, cx, cy, R)
      const zNeg = project3D(0, 0, -AXIS_EXTENT, yaw, pitch, cx, cy, R)

      // ── 1. Subtle 3D Sphere Background Glow ────────────────────────────────
      const sphereGrad = context.createRadialGradient(
        cx - R * 0.28,
        cy - R * 0.28,
        R * 0.08,
        cx,
        cy,
        R,
      )
      sphereGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)')
      sphereGrad.addColorStop(0.65, 'rgba(252, 246, 255, 0.55)')
      sphereGrad.addColorStop(1, 'rgba(240, 230, 255, 0.25)')

      context.beginPath()
      context.arc(cx, cy, R, 0, TWO_PI)
      context.fillStyle = sphereGrad
      context.fill()

      // ── 2. BACK WIREFRAME (zCam < 0) ───────────────────────────────────────
      const backWireColor = 'rgba(140, 110, 210, 0.20)'
      const backDash = [4, 4]
      drawCurvePass(projEquator, false, backWireColor, 1.0, backDash)
      drawCurvePass(projMeridianXZ, false, backWireColor, 0.9, backDash)
      drawCurvePass(projMeridianYZ, false, backWireColor, 0.9, backDash)
      drawCurvePass(projLatPlus, false, backWireColor, 0.8, backDash)
      drawCurvePass(projLatMinus, false, backWireColor, 0.8, backDash)

      // Back axis rays
      drawAxisSegment(originProj, xNeg, false)
      drawAxisSegment(originProj, xPos, false)
      drawAxisSegment(originProj, yNeg, false)
      drawAxisSegment(originProj, yPos, false)
      drawAxisSegment(originProj, zNeg, false)
      drawAxisSegment(originProj, zPos, false)

      // ── 3. QUANTUM STATE MATHEMATICAL PROJECTION GUIDES ─────────────────────
      const { x: vx, y: vy, z: vz } = computeQuantumState(curTheta, curPhi)

      const stateVectorProj = project3D(vx, vy, vz, yaw, pitch, cx, cy, R)
      const xyProj = project3D(vx, vy, 0, yaw, pitch, cx, cy, R)

      // Dashed projection: (x, y, z) -> (x, y, 0)
      context.beginPath()
      context.setLineDash([4, 4])
      context.moveTo(stateVectorProj.x, stateVectorProj.y)
      context.lineTo(xyProj.x, xyProj.y)
      context.strokeStyle = 'rgba(234, 47, 138, 0.70)'
      context.lineWidth = 1.3
      context.stroke()

      // Guide in equatorial plane: (0, 0, 0) -> (x, y, 0)
      context.beginPath()
      context.moveTo(originProj.x, originProj.y)
      context.lineTo(xyProj.x, xyProj.y)
      context.strokeStyle = 'rgba(123, 90, 216, 0.55)'
      context.lineWidth = 1.1
      context.stroke()
      context.setLineDash([])

      // Point at (x, y, 0)
      context.beginPath()
      context.arc(xyProj.x, xyProj.y, 3.2, 0, TWO_PI)
      context.fillStyle = 'rgba(234, 47, 138, 0.85)'
      context.fill()

      // ── 4. POLAR ANGLE θ ARC ───────────────────────────────────────────────
      // Measured from +Z toward state vector in the plane spanned by +Z and (x, y, z)
      if (curTheta > 0.05) {
        const thetaRadius = 0.40
        const thetaPoints = []
        const thetaSteps = Math.max(8, Math.floor((curTheta / Math.PI) * 28))
        for (let i = 0; i <= thetaSteps; i++) {
          const u = (i / thetaSteps) * curTheta
          const puX = thetaRadius * Math.sin(u) * Math.cos(curPhi)
          const puY = thetaRadius * Math.sin(u) * Math.sin(curPhi)
          const puZ = thetaRadius * Math.cos(u)
          thetaPoints.push(project3D(puX, puY, puZ, yaw, pitch, cx, cy, R))
        }

        context.beginPath()
        context.moveTo(thetaPoints[0].x, thetaPoints[0].y)
        for (let i = 1; i < thetaPoints.length; i++) {
          context.lineTo(thetaPoints[i].x, thetaPoints[i].y)
        }
        context.strokeStyle = '#ea2f8a'
        context.lineWidth = 2.0
        context.stroke()

        // Label θ near midpoint
        const midU = curTheta * 0.5
        const midThetaProj = project3D(
          0.50 * Math.sin(midU) * Math.cos(curPhi),
          0.50 * Math.sin(midU) * Math.sin(curPhi),
          0.50 * Math.cos(midU),
          yaw, pitch, cx, cy, R
        )
        context.fillStyle = '#ea2f8a'
        context.font = 'italic 700 13px Inter, sans-serif'
        context.textAlign = 'center'
        context.textBaseline = 'middle'
        context.fillText('θ', midThetaProj.x, midThetaProj.y)
      }

      // ── 5. AZIMUTHAL ANGLE φ ARC ───────────────────────────────────────────
      // Measured in equatorial XY plane from +X toward +Y
      if (curPhi > 0.05 && Math.sin(curTheta) > 0.05) {
        const phiRadius = 0.32
        const phiPoints = []
        const phiSteps = Math.max(8, Math.floor((curPhi / TWO_PI) * 36))
        for (let i = 0; i <= phiSteps; i++) {
          const v = (i / phiSteps) * curPhi
          const pvX = phiRadius * Math.cos(v)
          const pvY = phiRadius * Math.sin(v)
          phiPoints.push(project3D(pvX, pvY, 0, yaw, pitch, cx, cy, R))
        }

        context.beginPath()
        context.moveTo(phiPoints[0].x, phiPoints[0].y)
        for (let i = 1; i < phiPoints.length; i++) {
          context.lineTo(phiPoints[i].x, phiPoints[i].y)
        }
        context.strokeStyle = '#7b5ad8'
        context.lineWidth = 2.0
        context.stroke()

        // Label φ near midpoint
        const midV = curPhi * 0.5
        const midPhiProj = project3D(
          0.42 * Math.cos(midV),
          0.42 * Math.sin(midV),
          0,
          yaw, pitch, cx, cy, R
        )
        context.fillStyle = '#7b5ad8'
        context.font = 'italic 700 13px Inter, sans-serif'
        context.textAlign = 'center'
        context.textBaseline = 'middle'
        context.fillText('φ', midPhiProj.x, midPhiProj.y)
      }

      // ── 6. FRONT WIREFRAME (zCam >= 0) ────────────────────────────────────
      // Equator in front: prominent solid line
      drawCurvePass(projEquator, true, 'rgba(120, 89, 202, 0.70)', 1.6)
      // Meridians in front
      drawCurvePass(projMeridianXZ, true, 'rgba(120, 89, 202, 0.45)', 1.2)
      drawCurvePass(projMeridianYZ, true, 'rgba(120, 89, 202, 0.45)', 1.2)
      // Latitudes in front
      drawCurvePass(projLatPlus, true, 'rgba(120, 89, 202, 0.35)', 1.0)
      drawCurvePass(projLatMinus, true, 'rgba(120, 89, 202, 0.35)', 1.0)

      // Front axis rays
      drawAxisSegment(originProj, xNeg, true)
      drawAxisSegment(originProj, xPos, true)
      drawAxisSegment(originProj, yNeg, true)
      drawAxisSegment(originProj, yPos, true)
      drawAxisSegment(originProj, zNeg, true)
      drawAxisSegment(originProj, zPos, true)

      // ── 7. SPHERE SILHOUETTE OUTLINE ──────────────────────────────────────
      context.beginPath()
      context.arc(cx, cy, R, 0, TWO_PI)
      context.strokeStyle = 'rgba(120, 89, 202, 0.38)'
      context.lineWidth = 1.5
      context.stroke()

      // ── 8. STATE VECTOR ───────────────────────────────────────────────────
      // Line from origin (0, 0, 0) to (x, y, z)
      context.beginPath()
      context.moveTo(originProj.x, originProj.y)
      context.lineTo(stateVectorProj.x, stateVectorProj.y)
      context.strokeStyle = '#ff4fa3'
      context.lineWidth = 3.0
      context.stroke()

      // Prominent vector endpoint marker
      // Outer aura
      context.beginPath()
      context.arc(stateVectorProj.x, stateVectorProj.y, 8, 0, TWO_PI)
      context.fillStyle = 'rgba(255, 79, 163, 0.32)'
      context.fill()

      // Inner dot with white rim
      context.beginPath()
      context.arc(stateVectorProj.x, stateVectorProj.y, 5, 0, TWO_PI)
      context.fillStyle = '#ff4fa3'
      context.fill()
      context.strokeStyle = '#ffffff'
      context.lineWidth = 2
      context.stroke()

      // ── 9. AXIS & BASIS STATE LABELS ──────────────────────────────────────
      const labels = [
        { pt: project3D(0, 0, 1.34, yaw, pitch, cx, cy, R), text: '|0⟩', sub: '+Z' },
        { pt: project3D(0, 0, -1.34, yaw, pitch, cx, cy, R), text: '|1⟩', sub: '-Z' },
        { pt: project3D(1.32, 0, 0, yaw, pitch, cx, cy, R), text: '|+⟩', sub: '+X' },
        { pt: project3D(-1.32, 0, 0, yaw, pitch, cx, cy, R), text: '|−⟩', sub: '-X' },
        { pt: project3D(0, 1.32, 0, yaw, pitch, cx, cy, R), text: '|+i⟩', sub: '+Y' },
        { pt: project3D(0, -1.32, 0, yaw, pitch, cx, cy, R), text: '|−i⟩', sub: '-Y' },
      ]

      context.textAlign = 'center'
      context.textBaseline = 'middle'

      labels.forEach(({ pt, text, sub }) => {
        const isFacing = pt.z >= -0.15
        const alpha = isFacing ? 1.0 : 0.40

        context.font = '700 13px Inter, sans-serif'
        context.fillStyle = `rgba(61, 27, 79, ${alpha})`
        context.fillText(text, pt.x, pt.y - 6)

        context.font = '600 10px Inter, sans-serif'
        context.fillStyle = `rgba(123, 90, 216, ${alpha * 0.85})`
        context.fillText(sub, pt.x, pt.y + 7)
      })
    }

    // Animation ticker
    const tick = (now) => {
      if (disposed) return

      // 1. Auto-spin: rotates the CAMERA VIEW only, NOT the quantum state
      if (cameraRef.current.autoSpin && !pointerRef.current.active) {
        cameraRef.current.yaw = (cameraRef.current.yaw + 0.007) % TWO_PI
      }

      // 2. Quantum state animation (phase evolution under Evolve mode)
      if (quantumStateRef.current.isEvolving) {
        quantumStateRef.current.phi = (quantumStateRef.current.phi + 0.015) % TWO_PI
        // Gently oscillate theta slightly for visual demonstration
        quantumStateRef.current.theta = Math.PI / 3 + 0.15 * Math.sin(now * 0.001)

        // Throttle UI React state updates to ~12fps to avoid 60fps re-rendering overhead
        if (now - lastStateUpdateRef.current > 80) {
          lastStateUpdateRef.current = now
          setTheta(quantumStateRef.current.theta)
          setPhi(quantumStateRef.current.phi)
        }
      }

      render()
      animationRef.current = window.requestAnimationFrame(tick)
    }

    animationRef.current = window.requestAnimationFrame(tick)

    return () => {
      disposed = true
      if (animationRef.current) {
        window.cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  // ─── Pointer Interactions (Rotate Camera View) ──────────────────────────────
  const handlePointerDown = (event) => {
    pointerRef.current.active = true
    pointerRef.current.moved = false
    pointerRef.current.pointerId = event.pointerId
    pointerRef.current.startX = event.clientX
    pointerRef.current.startY = event.clientY
    pointerRef.current.lastX = event.clientX
    pointerRef.current.lastY = event.clientY
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event) => {
    if (!pointerRef.current.active) return

    const totalDx = event.clientX - pointerRef.current.startX
    const totalDy = event.clientY - pointerRef.current.startY

    if (Math.abs(totalDx) > 3 || Math.abs(totalDy) > 3) {
      pointerRef.current.moved = true
      // Dragging pauses camera auto-spin temporarily
      cameraRef.current.autoSpin = false
      setAutoSpin(false)
    }

    const stepDx = event.clientX - pointerRef.current.lastX
    const stepDy = event.clientY - pointerRef.current.lastY

    // Update CAMERA yaw & pitch ONLY - does NOT alter theta or phi!
    cameraRef.current.yaw = (cameraRef.current.yaw + stepDx * 0.008) % TWO_PI
    cameraRef.current.pitch = clamp(
      cameraRef.current.pitch + stepDy * 0.008,
      -1.35, // ~-77 degrees
      1.35   // ~+77 degrees
    )

    pointerRef.current.lastX = event.clientX
    pointerRef.current.lastY = event.clientY
  }

  const handlePointerUp = (event) => {
    if (!pointerRef.current.active) return

    // Clicking without dragging toggles camera auto-spin
    if (!pointerRef.current.moved) {
      const nextSpin = !cameraRef.current.autoSpin
      cameraRef.current.autoSpin = nextSpin
      setAutoSpin(nextSpin)
    }

    if (pointerRef.current.pointerId !== null && event.currentTarget.hasPointerCapture(pointerRef.current.pointerId)) {
      event.currentTarget.releasePointerCapture(pointerRef.current.pointerId)
    }

    pointerRef.current.active = false
    pointerRef.current.moved = false
    pointerRef.current.pointerId = null
  }

  // ─── Preset Handler ─────────────────────────────────────────────────────────
  const handleSelectPreset = useCallback((preset) => {
    setActivePreset(preset.label)
    if (preset.isEvolving) {
      quantumStateRef.current.isEvolving = true
    } else {
      quantumStateRef.current.isEvolving = false
      quantumStateRef.current.theta = preset.theta
      quantumStateRef.current.phi = preset.phi
      setTheta(preset.theta)
      setPhi(preset.phi)
    }
  }, [])

  const toggleAutoSpin = useCallback(() => {
    const nextSpin = !cameraRef.current.autoSpin
    cameraRef.current.autoSpin = nextSpin
    setAutoSpin(nextSpin)
  }, [])

  // ─── Mathematical Readouts from Single Source of Truth ──────────────────────
  const { p0, p1 } = computeQuantumState(theta, phi)
  const thetaDegrees = Math.round((theta * 180) / Math.PI)
  const phiDegrees = Math.round(((phi * 180) / Math.PI) % 360)
  const normalizedPhiDegrees = (phiDegrees + 360) % 360
  const stateString = formatQuantumState(theta, phi)

  return (
    <div className="bloch-sphere">
      <div className="bloch-sphere__canvas-shell">
        <canvas
          ref={canvasRef}
          className="bloch-sphere__canvas"
          aria-label="Interactive 3D Bloch sphere visualization"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
      </div>

      <div className="bloch-sphere__readout" aria-live="polite">
        <div className="bloch-sphere__readout-top">
          <div className="bloch-sphere__stat bloch-sphere__stat--state">
            <span className="bloch-sphere__stat-label">Current State |ψ⟩</span>
            <strong
              className="bloch-sphere__state-formula"
              title={stateString}
            >
              {stateString}
            </strong>
          </div>

          <div className="bloch-sphere__stat bloch-sphere__stat--camera">
            <span className="bloch-sphere__stat-label">Camera Auto-spin</span>
            <button
              type="button"
              className="bloch-sphere__toggle"
              onClick={toggleAutoSpin}
              aria-label={`Toggle auto-spin ${autoSpin ? 'off' : 'on'}`}
            >
              {autoSpin ? 'On' : 'Off'}
            </button>
          </div>
        </div>

        <div className="bloch-sphere__readout-angles">
          <div className="bloch-sphere__stat bloch-sphere__stat--angle">
            <span className="bloch-sphere__stat-label">Polar Angle θ</span>
            <strong className="bloch-sphere__angle-val">{thetaDegrees}°</strong>
          </div>

          <div className="bloch-sphere__stat bloch-sphere__stat--angle">
            <span className="bloch-sphere__stat-label">Azimuthal Angle φ</span>
            <strong className="bloch-sphere__angle-val">{normalizedPhiDegrees}°</strong>
          </div>
        </div>

        {/* Basis State Presets */}
        <div className="bloch-sphere__presets" aria-label="Quantum State Presets">
          <span className="bloch-sphere__presets-label">Presets:</span>
          <div className="bloch-sphere__preset-list">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className={`bloch-sphere__preset-btn ${activePreset === preset.label ? 'bloch-sphere__preset-btn--active' : ''}`}
                onClick={() => handleSelectPreset(preset)}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Measurement Probabilities */}
        <div className="bloch-sphere__probabilities" aria-label="Measurement Probabilities">
          <div className="bloch-sphere__probability-row">
            <span className="bloch-sphere__prob-label">|0⟩</span>
            <div className="bloch-sphere__bar-track">
              <div
                className="bloch-sphere__bar bloch-sphere__bar--zero"
                style={{ width: `${(p0 * 100).toFixed(1)}%` }}
              />
            </div>
            <strong className="bloch-sphere__prob-val">{(p0 * 100).toFixed(0)}%</strong>
          </div>

          <div className="bloch-sphere__probability-row">
            <span className="bloch-sphere__prob-label">|1⟩</span>
            <div className="bloch-sphere__bar-track">
              <div
                className="bloch-sphere__bar bloch-sphere__bar--one"
                style={{ width: `${(p1 * 100).toFixed(1)}%` }}
              />
            </div>
            <strong className="bloch-sphere__prob-val">{(p1 * 100).toFixed(0)}%</strong>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BlochSphere

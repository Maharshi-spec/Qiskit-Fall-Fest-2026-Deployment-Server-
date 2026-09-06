import { useEffect, useRef, useState } from 'react'

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

const BlochSphere = ({ reducedMotion = false }) => {
  const canvasRef = useRef(null)
  const pointerRef = useRef({ active: false, moved: false, pointerId: null, startX: 0, startY: 0 })
  const animationRef = useRef(null)
  const stateRef = useRef({ theta: Math.PI / 2, phi: Math.PI / 2, autoSpin: !reducedMotion })

  const [theta, setTheta] = useState(stateRef.current.theta)
  const [phi, setPhi] = useState(stateRef.current.phi)
  const [autoSpin, setAutoSpin] = useState(!reducedMotion)

  useEffect(() => {
    stateRef.current.autoSpin = !reducedMotion
    setAutoSpin(!reducedMotion)
  }, [reducedMotion])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const context = canvas.getContext('2d')
    if (!context) return undefined

    const drawSphere = () => {
      const rect = canvas.getBoundingClientRect()
      const width = rect.width || 320
      const height = rect.height || 300
      const dpr = window.devicePixelRatio || 1

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr
        canvas.height = height * dpr
      }

      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      context.clearRect(0, 0, width, height)

      const cx = width / 2
      const cy = height / 2
      const radius = Math.min(width, height) * 0.4
      const currentTheta = stateRef.current.theta
      const currentPhi = stateRef.current.phi

      const projectPoint = (x, y, z) => {
        const yaw = currentPhi
        const pitch = currentTheta - Math.PI / 2

        const x1 = x * Math.cos(yaw) + z * Math.sin(yaw)
        const z1 = -x * Math.sin(yaw) + z * Math.cos(yaw)
        const y1 = y * Math.cos(pitch) - z1 * Math.sin(pitch)
        const z2 = y * Math.sin(pitch) + z1 * Math.cos(pitch)

        const perspective = 1.3 / (1.7 - z2 * 0.7)
        return {
          x: cx + x1 * radius * perspective,
          y: cy - y1 * radius * perspective,
          z: z2,
        }
      }

      const drawRing = (angle, scaleX, scaleY, strokeStyle, lineWidth = 1.2) => {
        context.beginPath()
        context.ellipse(
          cx,
          cy,
          radius * scaleX,
          radius * scaleY,
          angle,
          0,
          Math.PI * 2,
        )
        context.strokeStyle = strokeStyle
        context.lineWidth = lineWidth
        context.stroke()
      }

      const drawAxis = (start, end, strokeStyle) => {
        context.beginPath()
        context.moveTo(start.x, start.y)
        context.lineTo(end.x, end.y)
        context.strokeStyle = strokeStyle
        context.lineWidth = 1.8
        context.stroke()
      }

      const drawProjection = (point, strokeStyle) => {
        const projection = projectPoint(point.x, point.y, 0)
        context.beginPath()
        context.setLineDash([4, 5])
        context.moveTo(point.x, point.y)
        context.lineTo(projection.x, projection.y)
        context.strokeStyle = strokeStyle
        context.lineWidth = 1
        context.stroke()
        context.setLineDash([])
      }

      context.fillStyle = 'rgba(255, 255, 255, 0.35)'
      context.fillRect(0, 0, width, height)

      context.beginPath()
      context.arc(cx, cy, radius, 0, Math.PI * 2)
      context.strokeStyle = 'rgba(115, 89, 185, 0.45)'
      context.lineWidth = 1.5
      context.stroke()

      drawRing(0, 1, 0.76, 'rgba(120, 89, 202, 0.28)', 1.1)
      drawRing(Math.PI / 2, 1, 0.76, 'rgba(255, 79, 163, 0.25)', 1.1)
      drawRing(Math.PI / 4, 0.9, 0.72, 'rgba(120, 89, 202, 0.18)', 1)

      drawAxis(
        projectPoint(-1.1, 0, 0),
        projectPoint(1.1, 0, 0),
        'rgba(120, 89, 202, 0.8)',
      )
      drawAxis(
        projectPoint(0, -1.1, 0),
        projectPoint(0, 1.1, 0),
        'rgba(255, 79, 163, 0.7)',
      )
      drawAxis(
        projectPoint(0, 0, -1.1),
        projectPoint(0, 0, 1.1),
        'rgba(120, 89, 202, 0.55)',
      )

      context.fillStyle = '#3d2f59'
      context.font = '600 12px Inter, Arial, sans-serif'
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      const xAxisLabel = projectPoint(1.25, 0, 0)
      const yAxisLabel = projectPoint(0, 1.25, 0)
      const zAxisLabel = projectPoint(0, 0, 1.25)
      context.fillText('X', xAxisLabel.x, xAxisLabel.y)
      context.fillText('Y', yAxisLabel.x, yAxisLabel.y)
      context.fillText('Z', zAxisLabel.x, zAxisLabel.y)

      const statePoint = projectPoint(
        Math.sin(currentTheta) * Math.cos(currentPhi),
        Math.cos(currentTheta),
        Math.sin(currentTheta) * Math.sin(currentPhi),
      )

      const thetaArcRadius = radius * 0.42
      context.beginPath()
      context.arc(cx, cy, thetaArcRadius, -Math.PI / 2, -Math.PI / 2 + currentTheta)
      context.strokeStyle = 'rgba(255, 79, 163, 0.85)'
      context.lineWidth = 1.5
      context.stroke()

      const phiArcRadius = radius * 0.58
      context.beginPath()
      context.ellipse(cx, cy, phiArcRadius, phiArcRadius * 0.48, 0, 0, currentPhi)
      context.strokeStyle = 'rgba(120, 89, 202, 0.85)'
      context.lineWidth = 1.5
      context.stroke()

      drawProjection(statePoint, 'rgba(255, 79, 163, 0.45)')

      const vectorStart = { x: cx, y: cy }
      context.beginPath()
      context.moveTo(vectorStart.x, vectorStart.y)
      context.lineTo(statePoint.x, statePoint.y)
      context.strokeStyle = 'rgba(255, 79, 163, 0.9)'
      context.lineWidth = 2.6
      context.stroke()

      context.beginPath()
      context.arc(statePoint.x, statePoint.y, 7, 0, Math.PI * 2)
      context.fillStyle = '#ff4fa3'
      context.fill()
      context.strokeStyle = 'rgba(255, 255, 255, 0.9)'
      context.lineWidth = 2
      context.stroke()

      const labelStyle = {
        fill: '#3d2f59',
        font: '600 14px Inter, Arial, sans-serif',
      }

      context.fillStyle = labelStyle.fill
      context.font = labelStyle.font
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.fillText('|0⟩', cx - radius - 18, cy - radius - 18)
      context.fillText('|1⟩', cx + radius + 18, cy + radius + 18)
      context.fillText('|+⟩', cx + radius + 18, cy)
      context.fillText('|−⟩', cx - radius - 24, cy)

      context.beginPath()
      context.arc(cx, cy, radius, 0, Math.PI * 2)
      context.strokeStyle = 'rgba(120, 89, 202, 0.28)'
      context.lineWidth = 1.2
      context.stroke()
    }

    let disposed = false

    const tick = () => {
      if (disposed) return

      if (stateRef.current.autoSpin && !pointerRef.current.active) {
        stateRef.current.phi = (stateRef.current.phi + 0.012) % (Math.PI * 2)
        setPhi(stateRef.current.phi)
      }

      drawSphere()
      animationRef.current = window.requestAnimationFrame(tick)
    }

    tick()

    return () => {
      disposed = true
      if (animationRef.current) {
        window.cancelAnimationFrame(animationRef.current)
      }
      if (pointerRef.current.pointerId !== null && canvas.hasPointerCapture(pointerRef.current.pointerId)) {
        canvas.releasePointerCapture(pointerRef.current.pointerId)
      }
      context.setTransform(1, 0, 0, 1, 0, 0)
      context.clearRect(0, 0, canvas.width, canvas.height)
    }
  }, [])

  const handlePointerDown = (event) => {
    pointerRef.current.active = true
    pointerRef.current.moved = false
    pointerRef.current.pointerId = event.pointerId
    pointerRef.current.startX = event.clientX
    pointerRef.current.startY = event.clientY
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event) => {
    if (!pointerRef.current.active) return

    const deltaX = event.clientX - pointerRef.current.startX
    const deltaY = event.clientY - pointerRef.current.startY

    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
      pointerRef.current.moved = true
      stateRef.current.autoSpin = false
      setAutoSpin(false)
    }

    const nextPhi = (stateRef.current.phi + deltaX * 0.01) % (Math.PI * 2)
    const nextTheta = clamp(stateRef.current.theta + deltaY * 0.008, 0.18, Math.PI - 0.18)

    stateRef.current.theta = nextTheta
    stateRef.current.phi = nextPhi
    setTheta(nextTheta)
    setPhi(nextPhi)

    pointerRef.current.startX = event.clientX
    pointerRef.current.startY = event.clientY
  }

  const handlePointerUp = () => {
    if (pointerRef.current.active && !pointerRef.current.moved) {
      const nextAutoSpin = !stateRef.current.autoSpin
      stateRef.current.autoSpin = nextAutoSpin
      setAutoSpin(nextAutoSpin)
    }

    pointerRef.current.active = false
    pointerRef.current.moved = false
    pointerRef.current.pointerId = null
  }

  const thetaDegrees = ((theta * 180) / Math.PI).toFixed(0)
  const phiDegrees = ((phi * 180) / Math.PI).toFixed(0)
  const probabilityZero = Math.cos(theta / 2) ** 2
  const probabilityOne = 1 - probabilityZero

  return (
    <div className="bloch-sphere">
      <div className="bloch-sphere__canvas-shell">
        <canvas
          ref={canvasRef}
          className="bloch-sphere__canvas"
          aria-label="Interactive Bloch sphere visualization of a qubit state"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
      </div>

      <div className="bloch-sphere__readout" aria-live="polite">
        <div className="bloch-sphere__stat">
          <span>Current State |ψ⟩</span>
          <strong>Qubit</strong>
        </div>

        <div className="bloch-sphere__stat">
          <span>Auto-spin</span>
          <button type="button" className="bloch-sphere__toggle" onClick={() => {
            const nextAutoSpin = !stateRef.current.autoSpin
            stateRef.current.autoSpin = nextAutoSpin
            setAutoSpin(nextAutoSpin)
          }}>
            {autoSpin ? 'On' : 'Off'}
          </button>
        </div>

        <div className="bloch-sphere__stat">
          <span>Polar Angle θ</span>
          <strong>{thetaDegrees}°</strong>
        </div>

        <div className="bloch-sphere__stat">
          <span>Azimuthal Angle φ</span>
          <strong>{phiDegrees}°</strong>
        </div>

        <div className="bloch-sphere__probabilities" aria-label="Measurement Probabilities">
          <div className="bloch-sphere__probability-row">
            <span>|0⟩</span>
            <div className="bloch-sphere__bar-track">
              <div className="bloch-sphere__bar bloch-sphere__bar--zero" style={{ width: `${Math.max(8, probabilityZero * 100)}%` }} />
            </div>
            <strong>{(probabilityZero * 100).toFixed(0)}%</strong>
          </div>

          <div className="bloch-sphere__probability-row">
            <span>|1⟩</span>
            <div className="bloch-sphere__bar-track">
              <div className="bloch-sphere__bar bloch-sphere__bar--one" style={{ width: `${Math.max(8, probabilityOne * 100)}%` }} />
            </div>
            <strong>{(probabilityOne * 100).toFixed(0)}%</strong>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BlochSphere

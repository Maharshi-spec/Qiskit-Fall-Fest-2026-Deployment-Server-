const express = require('express')
const path = require('path')
const cors = require('cors')
const helmet = require('helmet')
const healthRoutes = require('./routes/health.routes')
const registrationRoutes = require('./routes/registration.routes')
const authRoutes = require('./routes/auth.routes')
const adminRoutes = require('./routes/admin.routes')
const certificateRoutes = require('./routes/certificate.routes')
const workshopRoutes = require('./routes/workshop.routes')
const hackathonRoutes = require('./routes/hackathon.routes')
const attendanceRoutes = require('./routes/attendance.routes')
const postEventRoutes = require('./routes/post-event.routes')
const { errorMiddleware } = require('./middleware/error.middleware')
const { validateRequest } = require('./middleware/validation.middleware')
const { rateLimit } = require('./middleware/rateLimit.middleware')

const { profileMiddleware } = require('./middleware/profile.middleware')
const { getAllProfilesSummary } = require('./config/eventProfiles')
const { pool } = require('./config/database')

const app = express()

app.use(helmet())
app.use(cors({ origin: true, credentials: true }))
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')))
app.use(rateLimit)
app.use(validateRequest)
app.use(profileMiddleware)

// ─── Public profiles endpoint ──────────────────────────────────────────────
// Enriches the Post-Qiskit profile summary with the real enabled/status values
// from the post_qiskit_config table. Pre-Qiskit is never touched.
app.get('/api/v1/profiles', async (req, res) => {
  try {
    const profiles = getAllProfilesSummary()

    // Attempt to enrich Post-Qiskit with DB config (non-fatal if DB unavailable)
    let postConfig = null
    try {
      const result = await pool.query(
        'SELECT enabled, start_date, end_date, timezone, description, coordinator_name, venue, location, start_time, end_time FROM post_qiskit_config ORDER BY id ASC LIMIT 1'
      )
      postConfig = result.rows[0] || null
    } catch (_dbErr) {
      // Silently degrade — profiles still returned with date-based status
    }

    const enriched = profiles.map((p) => {
      if (p.id !== 'post-qiskit' || !postConfig) return p

      // Override with DB-driven enabled state and dates
      const isEnabled = Boolean(postConfig.enabled)
      const startDate = postConfig.start_date ? String(postConfig.start_date) : p.startDate
      const endDate = postConfig.end_date ? String(postConfig.end_date) : p.endDate

      // Dynamic status: depends on BOTH enabled flag AND dates
      let status = 'DISABLED'
      if (isEnabled) {
        const { getTodayInTimezone } = require('./config/eventProfiles')
        const tz = postConfig.timezone || 'Asia/Kolkata'
        const today = getTodayInTimezone(tz)
        if (today < startDate) status = 'UPCOMING'
        else if (today > endDate) status = 'COMPLETED'
        else status = 'GOING'
      }

      return {
        ...p,
        enabled: isEnabled,
        status,
        startDate,
        endDate,
        start_date: startDate,
        end_date: endDate,
        description: postConfig.description || p.description,
        coordinator_name: postConfig.coordinator_name || null,
        venue: postConfig.venue || null,
        location: postConfig.location || null,
        start_time: postConfig.start_time || null,
        end_time: postConfig.end_time || null,
      }
    })

    return res.json({ success: true, data: enriched })
  } catch (error) {
    // Fallback: return static profiles without DB enrichment
    return res.json({ success: true, data: getAllProfilesSummary() })
  }
})

app.use('/api/v1', healthRoutes)
app.use('/api/v1', registrationRoutes)
app.use('/api/v1', authRoutes)
app.use('/api/v1', adminRoutes)
app.use('/api/v1', certificateRoutes)
app.use('/api/v1', workshopRoutes)
app.use('/api/v1/hackathon', hackathonRoutes)
const { createTeam } = require('./controllers/hackathon.controller')
const { requireAuth } = require('./middleware/validation.middleware')
app.post('/api/v1/teams', requireAuth, createTeam)
app.use('/api/v1', attendanceRoutes)
app.use('/api/v1', postEventRoutes)

app.use(errorMiddleware)

module.exports = app

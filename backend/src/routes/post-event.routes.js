const express = require('express')
const { requireAdmin } = require('../middleware/validation.middleware')
const { pool } = require('../config/database')
const { AppError } = require('../middleware/error.middleware')
const { getTodayInTimezone } = require('../config/eventProfiles')

const router = express.Router()

// ─── Helper: load config row ─────────────────────────────────────────────────
const loadConfig = async () => {
  const result = await pool.query(
    'SELECT * FROM post_qiskit_config ORDER BY id ASC LIMIT 1'
  )
  return result.rows[0] || null
}

// ─── Helper: calculate dynamic status from config ────────────────────────────
const calculatePostQiskitStatus = (config) => {
  if (!config || !config.enabled) return 'DISABLED'
  if (!config.start_date || !config.end_date) return 'UPCOMING'

  const timezone = config.timezone || 'Asia/Kolkata'
  const today = getTodayInTimezone(timezone)
  const startDate = String(config.start_date)
  const endDate = String(config.end_date)

  if (today < startDate) return 'UPCOMING'
  if (today > endDate) return 'COMPLETED'
  return 'GOING'
}

// ─── PUBLIC: GET /api/v1/post-event/status ───────────────────────────────────
// Returns only safe public information about the Post-Qiskit event.
// Does NOT expose coordinator contact, passwords, or internal IDs.
router.get('/post-event/status', async (req, res, next) => {
  try {
    const config = await loadConfig()

    if (!config) {
      return res.status(200).json({
        success: true,
        data: {
          enabled: false,
          status: 'DISABLED',
          start_date: '2026-10-05',
          end_date: '2026-10-10',
          timezone: 'Asia/Kolkata',
          description: null,
          coordinator_name: null,
          venue: null,
          location: null,
          start_time: null,
          end_time: null,
        },
      })
    }

    const status = calculatePostQiskitStatus(config)

    return res.status(200).json({
      success: true,
      data: {
        enabled: config.enabled,
        status,
        start_date: config.start_date,
        end_date: config.end_date,
        timezone: config.timezone,
        description: config.description,
        coordinator_name: config.coordinator_name,
        venue: config.venue,
        location: config.location,
        start_time: config.start_time,
        end_time: config.end_time,
      },
    })
  } catch (error) {
    return next(error)
  }
})

// ─── ORGANIZER: GET /api/v1/post-event/config ─────────────────────────────────
// Full config including coordinator_contact (admin only).
router.get('/post-event/config', requireAdmin, async (req, res, next) => {
  try {
    const config = await loadConfig()

    if (!config) {
      return res.status(200).json({
        success: true,
        data: {
          id: null,
          enabled: false,
          start_date: '2026-10-05',
          end_date: '2026-10-10',
          coordinator_name: null,
          coordinator_contact: null,
          venue: null,
          location: null,
          start_time: null,
          end_time: null,
          timezone: 'Asia/Kolkata',
          description: null,
          activities: null,
          updated_at: null,
        },
      })
    }

    const status = calculatePostQiskitStatus(config)

    return res.status(200).json({
      success: true,
      data: {
        id: config.id,
        enabled: config.enabled,
        status,
        start_date: config.start_date,
        end_date: config.end_date,
        coordinator_name: config.coordinator_name,
        coordinator_contact: config.coordinator_contact,
        venue: config.venue,
        location: config.location,
        start_time: config.start_time,
        end_time: config.end_time,
        timezone: config.timezone,
        description: config.description,
        activities: config.activities,
        updated_at: config.updated_at,
      },
    })
  } catch (error) {
    return next(error)
  }
})

// ─── ORGANIZER: PUT /api/v1/post-event/config ─────────────────────────────────
// Update configuration fields. Does NOT change the enabled flag.
// To enable/disable use the dedicated /enable and /disable endpoints.
router.put('/post-event/config', requireAdmin, async (req, res, next) => {
  try {
    const {
      start_date,
      end_date,
      coordinator_name,
      coordinator_contact,
      venue,
      location,
      start_time,
      end_time,
      timezone,
      description,
      activities,
    } = req.body

    // Validate dates if both supplied
    if (start_date && end_date && start_date > end_date) {
      throw new AppError(400, 'INVALID_DATES', 'start_date must be on or before end_date.')
    }
    if (start_date && !/^\d{4}-\d{2}-\d{2}$/.test(start_date)) {
      throw new AppError(400, 'INVALID_DATE_FORMAT', 'start_date must be in YYYY-MM-DD format.')
    }
    if (end_date && !/^\d{4}-\d{2}-\d{2}$/.test(end_date)) {
      throw new AppError(400, 'INVALID_DATE_FORMAT', 'end_date must be in YYYY-MM-DD format.')
    }

    const organizerId = req.user?.organizerId || req.user?.userId || null

    const result = await pool.query(
      `UPDATE post_qiskit_config
       SET
         start_date          = COALESCE($1, start_date),
         end_date            = COALESCE($2, end_date),
         coordinator_name    = $3,
         coordinator_contact = $4,
         venue               = $5,
         location            = $6,
         start_time          = COALESCE($7, start_time),
         end_time            = COALESCE($8, end_time),
         timezone            = COALESCE($9, timezone),
         description         = $10,
         activities          = $11,
         updated_at          = NOW(),
         updated_by          = $12
       WHERE id = (SELECT id FROM post_qiskit_config ORDER BY id ASC LIMIT 1)
       RETURNING *`,
      [
        start_date || null,
        end_date || null,
        coordinator_name !== undefined ? coordinator_name : null,
        coordinator_contact !== undefined ? coordinator_contact : null,
        venue !== undefined ? venue : null,
        location !== undefined ? location : null,
        start_time || null,
        end_time || null,
        timezone || null,
        description !== undefined ? description : null,
        activities !== undefined ? activities : null,
        organizerId,
      ]
    )

    if (result.rowCount === 0) {
      throw new AppError(500, 'CONFIG_NOT_FOUND', 'Post-Qiskit configuration row not found. Please restart the server to initialize.')
    }

    const updated = result.rows[0]
    const status = calculatePostQiskitStatus(updated)

    return res.status(200).json({
      success: true,
      message: 'Post-Qiskit configuration updated successfully.',
      data: { ...updated, status },
    })
  } catch (error) {
    return next(error)
  }
})

// ─── ORGANIZER: POST /api/v1/post-event/enable ───────────────────────────────
router.post('/post-event/enable', requireAdmin, async (req, res, next) => {
  try {
    const organizerId = req.user?.organizerId || req.user?.userId || null

    const result = await pool.query(
      `UPDATE post_qiskit_config
       SET enabled = TRUE, updated_at = NOW(), updated_by = $1
       WHERE id = (SELECT id FROM post_qiskit_config ORDER BY id ASC LIMIT 1)
       RETURNING *`,
      [organizerId]
    )

    if (result.rowCount === 0) {
      throw new AppError(500, 'CONFIG_NOT_FOUND', 'Post-Qiskit configuration row not found.')
    }

    const updated = result.rows[0]
    const status = calculatePostQiskitStatus(updated)

    return res.status(200).json({
      success: true,
      message: 'Post-Qiskit event is now ENABLED.',
      data: { enabled: updated.enabled, status },
    })
  } catch (error) {
    return next(error)
  }
})

// ─── ORGANIZER: POST /api/v1/post-event/disable ──────────────────────────────
router.post('/post-event/disable', requireAdmin, async (req, res, next) => {
  try {
    const organizerId = req.user?.organizerId || req.user?.userId || null

    const result = await pool.query(
      `UPDATE post_qiskit_config
       SET enabled = FALSE, updated_at = NOW(), updated_by = $1
       WHERE id = (SELECT id FROM post_qiskit_config ORDER BY id ASC LIMIT 1)
       RETURNING *`,
      [organizerId]
    )

    if (result.rowCount === 0) {
      throw new AppError(500, 'CONFIG_NOT_FOUND', 'Post-Qiskit configuration row not found.')
    }

    return res.status(200).json({
      success: true,
      message: 'Post-Qiskit event is now DISABLED.',
      data: { enabled: false, status: 'DISABLED' },
    })
  } catch (error) {
    return next(error)
  }
})

module.exports = router

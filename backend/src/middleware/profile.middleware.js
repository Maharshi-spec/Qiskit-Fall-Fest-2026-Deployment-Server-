const { AsyncLocalStorage } = require('node:async_hooks')
const { DEFAULT_PROFILE, ALLOWED_PROFILES, isValidProfile } = require('../config/eventProfiles')
const { AppError } = require('./error.middleware')

const profileStorage = new AsyncLocalStorage()

const getActiveEventProfile = () => {
  const store = profileStorage.getStore()
  return store?.profile || DEFAULT_PROFILE
}

const runWithProfile = (profile, callback) => {
  const targetProfile = isValidProfile(profile) ? profile.trim().toLowerCase() : DEFAULT_PROFILE
  return profileStorage.run({ profile: targetProfile }, callback)
}

// Routes that are always public regardless of profile state
const PUBLIC_PATHS = [
  '/api/v1/post-event/status',
  '/api/v1/profiles',
  '/api/v1/health',
]

const profileMiddleware = (req, res, next) => {
  const rawHeader = req.headers['x-event-profile'] || req.headers['x-profile']
  const rawQuery = req.query?.profile

  const profileInput = rawHeader || rawQuery

  let selectedProfile = DEFAULT_PROFILE

  if (profileInput !== undefined && profileInput !== null && String(profileInput).trim() !== '') {
    const candidate = String(profileInput).trim().toLowerCase()
    if (!isValidProfile(candidate)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_EVENT_PROFILE',
          message: `Invalid event profile '${candidate}'. Allowed profiles: ${ALLOWED_PROFILES.join(', ')}`,
        },
      })
    }
    selectedProfile = candidate
  }

  req.eventProfile = selectedProfile
  res.setHeader('X-Event-Profile', selectedProfile)

  // Guard: if the request is for the post-qiskit profile and Post-Qiskit is
  // currently disabled, reject non-public API requests with 403.
  // We do this asynchronously so it doesn't block the event loop.
  if (selectedProfile === 'post-qiskit') {
    const isPublicPath = PUBLIC_PATHS.some((p) => req.path === p || req.path.startsWith(p))
    if (!isPublicPath) {
      // Lazily require pool to avoid circular dependency at module load time
      const { pool } = require('../config/database')
      return profileStorage.run({ profile: selectedProfile }, async () => {
        try {
          const result = await pool.query(
            'SELECT enabled FROM post_qiskit_config ORDER BY id ASC LIMIT 1'
          )
          const enabled = result.rows[0]?.enabled ?? false
          if (!enabled) {
            return res.status(403).json({
              success: false,
              error: {
                code: 'POST_QISKIT_DISABLED',
                message: 'Post-Qiskit event is not yet enabled. Please wait for organizer confirmation.',
              },
            })
          }
          return next()
        } catch (_err) {
          // If DB check fails, allow the request through (fail-open for availability)
          return next()
        }
      })
    }
  }

  profileStorage.run({ profile: selectedProfile }, () => {
    next()
  })
}

module.exports = {
  profileMiddleware,
  getActiveEventProfile,
  runWithProfile,
}

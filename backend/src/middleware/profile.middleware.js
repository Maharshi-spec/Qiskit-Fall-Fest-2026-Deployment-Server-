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

  profileStorage.run({ profile: selectedProfile }, () => {
    next()
  })
}

module.exports = {
  profileMiddleware,
  getActiveEventProfile,
  runWithProfile,
}

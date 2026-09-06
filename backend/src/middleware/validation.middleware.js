const jwt = require('jsonwebtoken')
const { AppError } = require('./error.middleware')
const { reminderProcessorToken } = require('../config/env')

const validateRequest = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next()
  }

  if (req.path === '/registrations' && req.method === 'POST' && !req.headers['content-type']?.includes('multipart/form-data')) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_CONTENT_TYPE',
        message: 'Content-Type must be multipart/form-data.',
      },
    })
  }

  return next()
}

const parseToken = (req) => {
  const authHeader = req.headers.authorization || ''

  if (!authHeader.startsWith('Bearer ')) {
    return null
  }

  return authHeader.slice(7).trim()
}

const getCurrentUser = (req) => {
  const token = parseToken(req)

  if (!token) {
    return null
  }

  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'dev-secret')
  } catch (error) {
    return null
  }
}

const requireAuth = (req, res, next) => {
  const user = getCurrentUser(req)

  if (!user) {
    return next(new AppError(401, 'UNAUTHORIZED', 'Authentication required.'))
  }

  req.user = user
  return next()
}

const requireAdmin = (req, res, next) => {
  return requireAuth(req, res, (authErr) => {
    if (authErr) {
      return next(authErr)
    }

    if (req.user.role !== 'ADMIN' && req.user.role !== 'ORGANIZER') {
      return next(new AppError(403, 'FORBIDDEN', 'Organizer access required.'))
    }

    return next()
  })
}

const requireReminderProcessor = (req, res, next) => {
  const token = parseToken(req)
  if (!reminderProcessorToken || !token || token !== reminderProcessorToken) {
    return next(new AppError(401, 'UNAUTHORIZED', 'Reminder processor authentication required.'))
  }
  return next()
}

module.exports = {
  validateRequest,
  parseToken,
  getCurrentUser,
  requireAuth,
  requireAdmin,
  requireReminderProcessor,
}

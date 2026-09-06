const express = require('express')
const { AppError } = require('../middleware/error.middleware')
const { requireAuth } = require('../middleware/validation.middleware')
const registrationService = require('../services/registration.service')

const router = express.Router()

router.post('/auth/register', async (req, res, next) => {
  try {
    const result = await registrationService.registerAuthUser(req.body)
    return res.status(201).json(result)
  } catch (error) {
    return next(error)
  }
})

router.post('/auth/login', async (req, res, next) => {
  try {
    const result = await registrationService.loginUser(req.body)
    return res.status(200).json(result)
  } catch (error) {
    return next(error)
  }
})

router.post('/auth/refresh', requireAuth, async (req, res, next) => {
  try {
    const result = await registrationService.refreshAuthToken(req.user)
    return res.status(200).json(result)
  } catch (error) {
    return next(error)
  }
})

router.post('/auth/logout', requireAuth, async (req, res, next) => {
  try {
    const result = await registrationService.logoutUser(req.user)
    return res.status(200).json(result)
  } catch (error) {
    return next(error)
  }
})

router.get('/auth/me', requireAuth, async (req, res, next) => {
  try {
    const user = req.user
    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.userId,
          email: user.email,
          role: user.role,
        },
      },
    })
  } catch (error) {
    return next(error)
  }
})

module.exports = router

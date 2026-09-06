const registrationService = require('../services/registration.service')

const createRegistration = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'ID card is required.',
        },
      })
    }

    const result = await registrationService.registerUser(req.body, req.file)
    return res.status(201).json(result)
  } catch (error) {
    return next(error)
  }
}

const loginParticipant = async (req, res, next) => {
  try {
    const result = await registrationService.loginParticipant(req.body)
    return res.status(200).json(result)
  } catch (error) {
    return next(error)
  }
}

const getCurrentParticipant = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    const result = await registrationService.getCurrentParticipant(authHeader)
    return res.status(200).json(result)
  } catch (error) {
    return next(error)
  }
}

const loginOrganizer = async (req, res, next) => {
  try {
    const result = await registrationService.loginOrganizer(req.body)
    return res.status(200).json(result)
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  createRegistration,
  loginParticipant,
  getCurrentParticipant,
  loginOrganizer,
}

const hackathonService = require('../services/hackathon.service')

const getHackathonInfo = async (req, res, next) => {
  try {
    const result = await hackathonService.getHackathonInfo()
    return res.json(result)
  } catch (error) {
    return next(error)
  }
}

const getMyTeam = async (req, res, next) => {
  try {
    const result = await hackathonService.getMyTeam(req.user)
    return res.json({ success: true, data: result })
  } catch (error) {
    return next(error)
  }
}

const createTeam = async (req, res, next) => {
  try {
    const result = await hackathonService.createTeam(req.user, req.body || {})
    return res.status(201).json({ success: true, data: result })
  } catch (error) {
    return next(error)
  }
}

const verifyParticipant = async (req, res, next) => {
  try {
    const result = await hackathonService.verifyParticipant(req.user, req.query.email)
    return res.json({ success: true, data: result })
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  getHackathonInfo,
  getMyTeam,
  createTeam,
  verifyParticipant,
}

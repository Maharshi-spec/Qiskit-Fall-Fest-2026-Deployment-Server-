const certificateService = require('../services/certificate.service')


const generateCertificates = async (req, res, next) => {
  try {
    const result = await certificateService.generateCertificates(req.params.eventId, req.body || {})
    return res.status(201).json({ success: true, data: result })
  } catch (error) {
    return next(error)
  }
}

const generateLegacyCertificate = async (req, res, next) => {
  try {
    const { eventId, ...payload } = req.body || {}
    if (!eventId) return next(new (require('../middleware/error.middleware').AppError)(400, 'INVALID_REQUEST', 'eventId is required.'))
    const result = await certificateService.generateCertificates(eventId, {
      ...payload,
      registrationIds: payload.registrationIds || [payload.registrationId],
    })
    return res.status(201).json({ success: true, data: result })
  } catch (error) {
    return next(error)
  }
}

const getCertificates = async (req, res, next) => {
  try {
    const result = await certificateService.listCertificates()
    return res.json({ success: true, data: result })
  } catch (error) {
    return next(error)
  }
}

const getCertificateById = async (req, res, next) => {
  try {
    const result = await certificateService.getCertificateById(req.params.certificateId)

    if (!result) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CERTIFICATE_NOT_FOUND',
          message: 'Certificate was not found.',
        },
      })
    }

    return res.json({ success: true, data: result })
  } catch (error) {
    return next(error)
  }
}

const downloadCertificate = async (req, res, next) => {
  try {
    const result = await certificateService.downloadCertificate(req.params.certificateId)
    return res.json({ success: true, data: result })
  } catch (error) {
    return next(error)
  }
}

const verifyCertificate = async (req, res, next) => {
  try {
    const result = await certificateService.verifyCertificate(req.params.verificationCode)
    return res.json({ success: true, data: result })
  } catch (error) {
    return next(error)
  }
}

const getEligibleParticipants = async (req, res, next) => {
  try {
    const result = await certificateService.getEligibleParticipants(req.params.eventId, req.query.certificateType)
    return res.json({ success: true, data: result })
  } catch (error) {
    return next(error)
  }
}

const getEligibilityPreview = async (req, res, next) => {
  try {
    const result = await certificateService.getEligibilityPreview(req.params.eventId, req.query.certificateType)
    return res.json({ success: true, data: result })
  } catch (error) {
    return next(error)
  }
}

const getParticipantCertificates = async (req, res, next) => {
  try {
    const result = await certificateService.getParticipantCertificates(req.user)
    return res.json({ success: true, data: result })
  } catch (error) {
    return next(error)
  }
}

const getParticipantCertificate = async (req, res, next) => {
  try {
    const result = await certificateService.getOwnedCertificate(req.params.certificateId, req.user)
    return res.json({ success: true, data: result })
  } catch (error) {
    return next(error)
  }
}

const downloadParticipantCertificate = async (req, res, next) => {
  try {
    const result = await certificateService.downloadCertificate(req.params.certificateId, req.user)
    return res.json({ success: true, data: result })
  } catch (error) {
    return next(error)
  }
}

const listTeams = async (req, res, next) => {
  try {
    const result = await certificateService.listTeams(req.params.eventId)
    return res.json({ success: true, data: result })
  } catch (error) {
    return next(error)
  }
}

const getTeam = async (req, res, next) => {
  try {
    const result = await certificateService.getTeam(req.params.teamId)
    return res.json({ success: true, data: result })
  } catch (error) {
    return next(error)
  }
}

const listTeamMembers = async (req, res, next) => {
  try {
    const result = await certificateService.listTeamMembers(req.params.teamId)
    return res.json({ success: true, data: result })
  } catch (error) {
    return next(error)
  }
}

const assignHackathonAward = async (req, res, next) => {
  try {
    const result = await certificateService.assignHackathonAward(req.params.eventId, req.params.teamId, req.body?.placement, req.user.userId)
    return res.status(201).json({ success: true, data: result })
  } catch (error) {
    return next(error)
  }
}

const generateAwardCertificates = async (req, res, next) => {
  try {
    const result = await certificateService.generateAwardCertificates(req.params.eventId, req.params.teamId)
    return res.status(201).json({ success: true, data: result })
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  generateCertificates,
  generateLegacyCertificate,
  getCertificates,
  getCertificateById,
  downloadCertificate,
  verifyCertificate,
  getEligibleParticipants,
  getEligibilityPreview,
  getParticipantCertificates,
  getParticipantCertificate,
  downloadParticipantCertificate,
  listTeams,
  getTeam,
  listTeamMembers,
  assignHackathonAward,
  generateAwardCertificates,
}

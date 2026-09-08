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

const getHackathonStats = async (req, res, next) => {
  try {
    const eventId = req.query.eventId || req.query.event_id || 'day-3'
    const result = await hackathonService.getHackathonStats(eventId)
    return res.json({ success: true, data: result })
  } catch (error) {
    return next(error)
  }
}

const getMyTeamProblemSelection = async (req, res, next) => {
  try {
    const result = await hackathonService.getMyTeamProblemSelection(req.user)
    return res.json({ success: true, data: result })
  } catch (error) {
    return next(error)
  }
}

const getProblemStatements = async (req, res, next) => {
  try {
    const eventId = req.query.eventId || req.query.event_id || 'day-3'
    const isAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'ORGANIZER'
    const activeOnly = req.query.activeOnly !== undefined ? req.query.activeOnly === 'true' : !isAdmin
    const result = await hackathonService.getProblemStatements(eventId, { activeOnly })
    return res.json({ success: true, data: result })
  } catch (error) {
    return next(error)
  }
}

const getProblemStatementById = async (req, res, next) => {
  try {
    const eventId = req.query.eventId || req.query.event_id || null
    const result = await hackathonService.getProblemStatementById(req.params.id, eventId)
    return res.json({ success: true, data: result })
  } catch (error) {
    return next(error)
  }
}

const createProblemStatement = async (req, res, next) => {
  try {
    const result = await hackathonService.createProblemStatement(req.user, req.body || {}, req.files || [])
    return res.status(201).json({ success: true, data: result })
  } catch (error) {
    return next(error)
  }
}

const updateProblemStatement = async (req, res, next) => {
  try {
    const result = await hackathonService.updateProblemStatement(req.params.id, req.user, req.body || {}, req.files || [])
    return res.json({ success: true, data: result })
  } catch (error) {
    return next(error)
  }
}

const deleteProblemStatement = async (req, res, next) => {
  try {
    const result = await hackathonService.deleteProblemStatement(req.params.id)
    return res.json({ success: true, data: result })
  } catch (error) {
    return next(error)
  }
}

const deleteProblemStatementFile = async (req, res, next) => {
  try {
    const result = await hackathonService.deleteProblemStatementFile(
      req.params.id || req.params.problemStatementId,
      req.params.fileId,
      req.user
    )
    return res.json({ success: true, data: result })
  } catch (error) {
    return next(error)
  }
}

const viewProblemStatementFile = async (req, res, next) => {
  try {
    const { file, absolutePath } = await hackathonService.getFileForViewOrDownload(
      req.params.id || req.params.problemStatementId,
      req.params.fileId,
      req.user
    )
    res.setHeader('Content-Type', file.mimeType)
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.originalFilename)}"`)
    return res.sendFile(absolutePath)
  } catch (error) {
    return next(error)
  }
}

const downloadProblemStatementFile = async (req, res, next) => {
  try {
    const { file, absolutePath } = await hackathonService.getFileForViewOrDownload(
      req.params.id || req.params.problemStatementId,
      req.params.fileId,
      req.user
    )
    res.setHeader('Content-Type', file.mimeType)
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalFilename)}"`)
    return res.download(absolutePath, file.originalFilename)
  } catch (error) {
    return next(error)
  }
}

const getProblemSelections = async (req, res, next) => {
  try {
    const result = await hackathonService.getProblemSelections(req.params.id)
    return res.json({ success: true, data: result })
  } catch (error) {
    return next(error)
  }
}

const selectProblemStatement = async (req, res, next) => {
  try {
    const result = await hackathonService.selectProblemStatement(req.user, req.params.id)
    return res.status(201).json({ success: true, data: result })
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  getHackathonInfo,
  getMyTeam,
  getMyTeamProblemSelection,
  createTeam,
  verifyParticipant,
  getHackathonStats,
  getProblemStatements,
  getProblemStatementById,
  createProblemStatement,
  updateProblemStatement,
  deleteProblemStatement,
  deleteProblemStatementFile,
  viewProblemStatementFile,
  downloadProblemStatementFile,
  getProblemSelections,
  selectProblemStatement,
}


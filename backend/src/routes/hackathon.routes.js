const express = require('express')
const { requireAuth, requireAdmin } = require('../middleware/validation.middleware')
const { hackathonUpload } = require('../middleware/upload.middleware')
const {
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
} = require('../controllers/hackathon.controller')

const router = express.Router()

router.get('/', getHackathonInfo)
router.get('/team/me', requireAuth, getMyTeam)
router.get('/my-team/problem-selection', requireAuth, getMyTeamProblemSelection)
router.get('/team/me/problem-selection', requireAuth, getMyTeamProblemSelection)
router.post('/team', requireAuth, createTeam)
router.get('/verify-participant', requireAuth, verifyParticipant)

// Organizer / Hackathon Management routes
router.get('/stats', requireAdmin, getHackathonStats)
router.get('/problem-statements', getProblemStatements)
router.post('/problem-statements', requireAdmin, hackathonUpload.array('files'), createProblemStatement)
router.get('/problem-statements/:id', getProblemStatementById)
router.put('/problem-statements/:id', requireAdmin, hackathonUpload.array('files'), updateProblemStatement)
router.delete('/problem-statements/:id', requireAdmin, deleteProblemStatement)
router.delete('/problem-statements/:id/files/:fileId', requireAdmin, deleteProblemStatementFile)
router.get('/problem-statements/:id/files/:fileId/view', requireAuth, viewProblemStatementFile)
router.get('/problem-statements/:id/files/:fileId/download', requireAuth, downloadProblemStatementFile)
router.get('/problem-statements/:id/selections', requireAdmin, getProblemSelections)
router.post('/problem-statements/:id/select', requireAuth, selectProblemStatement)

module.exports = router


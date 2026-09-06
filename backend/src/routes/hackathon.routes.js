const express = require('express')
const { requireAuth } = require('../middleware/validation.middleware')
const { getHackathonInfo, getMyTeam, createTeam, verifyParticipant } = require('../controllers/hackathon.controller')

const router = express.Router()

router.get('/', getHackathonInfo)
router.get('/team/me', requireAuth, getMyTeam)
router.post('/team', requireAuth, createTeam)
router.get('/verify-participant', requireAuth, verifyParticipant)

module.exports = router

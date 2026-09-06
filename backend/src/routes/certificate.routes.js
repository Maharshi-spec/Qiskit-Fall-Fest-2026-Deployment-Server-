const express = require('express')
const { requireAuth, requireAdmin } = require('../middleware/validation.middleware')
const {
  generateCertificates,
  generateLegacyCertificate,
  getEligibleParticipants,
  getEligibilityPreview,
  getParticipantCertificates,
  getParticipantCertificate,
  downloadParticipantCertificate,
  getCertificates,
  getCertificateById,
  downloadCertificate,
  verifyCertificate,
  listTeams,
  getTeam,
  listTeamMembers,
  assignHackathonAward,
  generateAwardCertificates,
} = require('../controllers/certificate.controller')

const router = express.Router()

router.get('/', (req, res) => {
  res.json({ message: 'Certificate endpoint ready' })
})

router.get('/certificates/verify/:verificationCode', verifyCertificate)
router.post('/certificates/generate', requireAdmin, generateLegacyCertificate)

router.get('/participants/me/certificates', requireAuth, getParticipantCertificates)
router.get('/participants/me/certificates/:certificateId', requireAuth, getParticipantCertificate)
router.get('/participants/me/certificates/:certificateId/download', requireAuth, downloadParticipantCertificate)

router.get('/organizer/events/:eventId/certificates/eligible', requireAdmin, getEligibleParticipants)
router.get('/organizer/events/:eventId/certificates/eligibility-preview', requireAdmin, getEligibilityPreview)
router.post('/organizer/events/:eventId/certificates/generate', requireAdmin, generateCertificates)
router.get('/organizer/events/:eventId/teams', requireAdmin, listTeams)
router.get('/organizer/teams/:teamId', requireAdmin, getTeam)
router.get('/organizer/teams/:teamId/members', requireAdmin, listTeamMembers)
router.post('/organizer/events/:eventId/teams/:teamId/award', requireAdmin, assignHackathonAward)
router.post('/organizer/events/:eventId/teams/:teamId/certificates/generate', requireAdmin, generateAwardCertificates)

router.get('/certificates', requireAdmin, getCertificates)
router.get('/certificates/:certificateId', requireAdmin, getCertificateById)
router.get('/certificates/:certificateId/download', requireAdmin, downloadCertificate)

module.exports = router

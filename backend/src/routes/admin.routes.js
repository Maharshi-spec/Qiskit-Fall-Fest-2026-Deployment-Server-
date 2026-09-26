const express = require('express')
const { requireAdmin } = require('../middleware/validation.middleware')
const { requireReminderProcessor } = require('../middleware/validation.middleware')
const registrationService = require('../services/registration.service')
const reminderService = require('../services/reminder.service')
const hackathonService = require('../services/hackathon.service')

const router = express.Router()

router.get('/admin/registrations', requireAdmin, async (req, res, next) => {
  try {
    const result = await registrationService.getAdminRegistrations()
    return res.status(200).json(result)
  } catch (error) {
    return next(error)
  }
})

router.get('/admin/participants', requireAdmin, async (req, res, next) => {
  try {
    const result = await registrationService.getAdminParticipants(req.query)
    return res.status(200).json(result)
  } catch (error) {
    return next(error)
  }
})

router.get('/admin/participants/export', requireAdmin, async (req, res, next) => {
  try {
    const profile = req.headers['x-event-profile'] || req.headers['x-profile'] || req.query?.profile || req.eventProfile || 'pre-qiskit'
    const buffer = await registrationService.exportParticipantsToExcel(req.query, profile)
    const dateStr = new Date().toISOString().split('T')[0]
    const filename = `Qiskit-Fall-Fest-2026-Participants-${dateStr}.xlsx`
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    return res.status(200).send(Buffer.from(buffer))
  } catch (error) {
    return next(error)
  }
})

router.get('/admin/hackathon/teams', requireAdmin, async (req, res, next) => {
  try {
    const profile = req.headers['x-event-profile'] || req.headers['x-profile'] || req.query?.profile || req.eventProfile || 'post-qiskit'
    const result = await hackathonService.getOrganizerTeams(req.query, profile)
    return res.status(200).json({
      success: true,
      data: {
        teams: result.teams,
        stats: result.stats,
      },
      teams: result.teams,
      stats: result.stats,
    })
  } catch (error) {
    return next(error)
  }
})

router.get('/admin/hackathon/teams/export', requireAdmin, async (req, res, next) => {
  try {
    const profile = req.headers['x-event-profile'] || req.headers['x-profile'] || req.query?.profile || req.eventProfile || 'post-qiskit'
    const buffer = await hackathonService.exportHackathonTeamsToExcel(req.query, profile)
    const dateStr = new Date().toISOString().split('T')[0]
    const filename = `Qiskit-Fall-Fest-2026-Hackathon-Teams-${dateStr}.xlsx`
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    return res.status(200).send(Buffer.from(buffer))
  } catch (error) {
    return next(error)
  }
})

router.get('/admin/attendance', requireAdmin, async (req, res, next) => {
  try {
    const result = await registrationService.getAttendanceSummary()
    return res.status(200).json(result)
  } catch (error) {
    return next(error)
  }
})

router.patch('/admin/attendance/:registrationId', requireAdmin, async (req, res, next) => {
  try {
    const result = await registrationService.updateAttendanceStatus(req.params.registrationId, req.body)
    return res.status(200).json(result)
  } catch (error) {
    return next(error)
  }
})

router.post('/admin/email/send', requireAdmin, async (req, res, next) => {
  try {
    const result = await registrationService.sendOrganizerEmail(req.body)
    return res.status(200).json(result)
  } catch (error) {
    return next(error)
  }
})

router.post('/internal/reminders/process', requireReminderProcessor, async (req, res, next) => {
  try {
    const result = await reminderService.processDueReminders({ limit: req.body?.limit })
    return res.status(200).json({ success: true, data: result })
  } catch (error) {
    return next(error)
  }
})

router.get('/admin/email/logs', requireAdmin, async (req, res, next) => {
  try {
    const result = await registrationService.getAdminEmailLogs()
    return res.status(200).json(result)
  } catch (error) {
    return next(error)
  }
})

router.post('/organizer/registrations/bulk-import', requireAdmin, async (req, res, next) => {
  try {
    const { students, dryRun } = req.body || {}
    const result = await registrationService.bulkImportStudents(students, { dryRun })
    return res.status(200).json(result)
  } catch (error) {
    return next(error)
  }
})

// Alias route for admin prefix consistency
router.post('/admin/registrations/bulk-import', requireAdmin, async (req, res, next) => {
  try {
    const { students, dryRun } = req.body || {}
    const result = await registrationService.bulkImportStudents(students, { dryRun })
    return res.status(200).json(result)
  } catch (error) {
    return next(error)
  }
})

module.exports = router

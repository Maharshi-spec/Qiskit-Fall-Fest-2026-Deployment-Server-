const express = require('express')
const { requireAuth, requireAdmin } = require('../middleware/validation.middleware')
const {
  getEventsList,
  createEvent,
  startSession,
  stopSession,
  getLiveQrToken,
  getAttendanceData,
  markAttendance,
} = require('../controllers/attendance.controller')

const router = express.Router()

router.get('/events', getEventsList)
router.get('/organizer/events', requireAdmin, getEventsList)
router.post('/organizer/events', requireAdmin, createEvent)
router.post('/organizer/events/:eventId/attendance/start', requireAdmin, startSession)
router.post('/organizer/events/:eventId/attendance/stop', requireAdmin, stopSession)
router.get('/organizer/events/:eventId/attendance/token', requireAdmin, getLiveQrToken)
router.get('/organizer/events/:eventId/attendance/data', requireAdmin, getAttendanceData)

router.post('/attendance/mark', requireAuth, markAttendance)

module.exports = router

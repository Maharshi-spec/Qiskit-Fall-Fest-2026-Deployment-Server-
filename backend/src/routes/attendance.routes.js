const express = require('express')
const { requireAuth, requireAdmin } = require('../middleware/validation.middleware')
const {
  getEventsList,
  getActiveEventsList,
  getActiveHackathonsList,
  createEvent,
  updateEventStatus,
  updateEvent,
  deleteEvent,
  startSession,
  stopSession,
  getLiveQrToken,
  getAttendanceData,
  markAttendance,
} = require('../controllers/attendance.controller')

const router = express.Router()

// Public events endpoints
router.get('/events', getEventsList)
router.get('/events/active', getActiveEventsList)
router.get('/events/hackathons/active', getActiveHackathonsList)

// Organizer events management endpoints
router.get('/organizer/events', requireAdmin, getEventsList)
router.post('/organizer/events', requireAdmin, createEvent)
router.patch('/organizer/events/:eventId/status', requireAdmin, updateEventStatus)
router.put('/organizer/events/:eventId', requireAdmin, updateEvent)
router.delete('/organizer/events/:eventId', requireAdmin, deleteEvent)

// Direct REST aliases for event operations
router.post('/events', requireAdmin, createEvent)
router.patch('/events/:eventId/status', requireAdmin, updateEventStatus)
router.put('/events/:eventId', requireAdmin, updateEvent)
router.delete('/events/:eventId', requireAdmin, deleteEvent)

router.post('/organizer/events/:eventId/attendance/start', requireAdmin, startSession)
router.post('/organizer/events/:eventId/attendance/stop', requireAdmin, stopSession)
router.get('/organizer/events/:eventId/attendance/token', requireAdmin, getLiveQrToken)
router.get('/organizer/events/:eventId/attendance/data', requireAdmin, getAttendanceData)

router.post('/attendance/mark', requireAuth, markAttendance)

module.exports = router

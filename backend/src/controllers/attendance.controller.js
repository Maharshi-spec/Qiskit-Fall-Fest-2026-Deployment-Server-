const attendanceService = require('../services/attendance.service')

const getEventsList = async (req, res, next) => {
  try {
    const activeOnly = req.query.active === 'true' || req.query.status === 'ACTIVE'
    const eventType = req.query.eventType || req.query.event_type || req.query.type || null
    const events = await attendanceService.getEventsList({ activeOnly, eventType })
    return res.status(200).json({
      success: true,
      data: events,
    })
  } catch (error) {
    return next(error)
  }
}

const getActiveEventsList = async (req, res, next) => {
  try {
    const eventType = req.query.eventType || req.query.event_type || req.query.type || null
    const events = await attendanceService.getEventsList({ activeOnly: true, eventType })
    return res.status(200).json({
      success: true,
      data: events,
    })
  } catch (error) {
    return next(error)
  }
}

const getActiveHackathonsList = async (req, res, next) => {
  try {
    const events = await attendanceService.getEventsList({ activeOnly: true, eventType: 'HACKATHON' })
    return res.status(200).json({
      success: true,
      data: events,
    })
  } catch (error) {
    return next(error)
  }
}

const createEvent = async (req, res, next) => {
  try {
    const event = await attendanceService.createEvent(req.body)
    return res.status(201).json({
      success: true,
      data: event,
    })
  } catch (error) {
    return next(error)
  }
}

const updateEventStatus = async (req, res, next) => {
  try {
    const { eventId } = req.params
    const { status } = req.body || {}
    const event = await attendanceService.updateEventStatus(eventId, status)
    return res.status(200).json({
      success: true,
      data: event,
    })
  } catch (error) {
    return next(error)
  }
}

const updateEvent = async (req, res, next) => {
  try {
    const { eventId } = req.params
    const event = await attendanceService.updateEvent(eventId, req.body)
    return res.status(200).json({
      success: true,
      data: event,
    })
  } catch (error) {
    return next(error)
  }
}

const deleteEvent = async (req, res, next) => {
  try {
    const { eventId } = req.params
    const result = await attendanceService.deleteEvent(eventId)
    return res.status(200).json({
      success: true,
      data: result,
      message: 'Event and associated records deleted successfully.',
    })
  } catch (error) {
    return next(error)
  }
}

const startSession = async (req, res, next) => {
  try {
    const { eventId } = req.params
    const organizerId = req.user?.userId || req.user?.id
    const userEmail = req.user?.email
    const session = await attendanceService.startAttendanceSession(eventId, organizerId, userEmail)
    return res.status(200).json({
      success: true,
      data: session,
    })
  } catch (error) {
    return next(error)
  }
}

const stopSession = async (req, res, next) => {
  try {
    const { eventId } = req.params
    const organizerId = req.user?.userId || req.user?.id
    const userEmail = req.user?.email
    const result = await attendanceService.stopAttendanceSession(eventId, organizerId, userEmail)
    return res.status(200).json({
      success: true,
      data: result,
    })
  } catch (error) {
    return next(error)
  }
}

const getLiveQrToken = async (req, res, next) => {
  try {
    const { eventId } = req.params
    const tokenData = await attendanceService.generateLiveQrToken(eventId)
    return res.status(200).json({
      success: true,
      data: tokenData,
    })
  } catch (error) {
    return next(error)
  }
}

const getAttendanceData = async (req, res, next) => {
  try {
    const { eventId } = req.params
    const records = await attendanceService.getAttendanceRecords(eventId)
    return res.status(200).json({
      success: true,
      data: {
        eventId,
        count: records.length,
        records,
      },
    })
  } catch (error) {
    return next(error)
  }
}

const markAttendance = async (req, res, next) => {
  try {
    const attendanceToken = req.body?.attendance_token || req.body?.token
    const participantUser = req.user
    const result = await attendanceService.markAttendance(participantUser, attendanceToken)
    return res.status(200).json(result)
  } catch (error) {
    return next(error)
  }
}

module.exports = {
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
}
